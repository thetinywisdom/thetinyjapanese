/**
 * One-time build: parse JMdict XML + cross-ref JLPT vocab lists →
 * src/data/verbs.json (compact, ships with the app).
 *
 * Run:  bun run scripts/build-verbs.ts
 */
import sax from "sax";
import { createReadStream, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const XML_PATH = resolve(__dirname, "JMdict.xml");
const OUT_PATH = resolve(__dirname, "../src/data/verbs.json");

type JlptWord = { word: string; furigana: string; meaning: string; level: number };
const JLPT_LEVELS = [5, 4, 3, 2, 1] as const;
type JlptTag = "N5" | "N4" | "N3" | "N2" | "N1";

// Build lookup keyed by "kanji|kana" pair (or "|kana" for kana-only entries).
// Pair-keying eliminates spurious cross-word kana collisions.
const jlptIndex = new Map<string, JlptTag>();

/** Strip middots and a trailing する/-suru from a string. Used to normalize the
 *  jlpt-vocab cache, which sometimes stores suru-verbs as "勉強" / "べんきょう・する". */
function stripSuru(s: string): string {
  const noDot = s.replace(/・/g, "");
  return noDot.endsWith("する") ? noDot.slice(0, -2) : noDot;
}

function addIndex(key: string, tag: JlptTag) {
  if (!jlptIndex.has(key)) jlptIndex.set(key, tag);
}

for (const lvl of JLPT_LEVELS) {
  const arr: JlptWord[] = JSON.parse(
    readFileSync(resolve(__dirname, `cache/jlpt-n${lvl}.json`), "utf8"),
  );
  const tag = `N${lvl}` as JlptTag;
  for (const w of arr) {
    const rawKana = w.furigana || w.word; // kana-only entries put the kana in `word`
    const rawKanji = w.word && w.word !== rawKana ? w.word : "";
    const kana = rawKana.replace(/・/g, "");
    const kanji = rawKanji.replace(/・/g, "");
    // Index the literal pair…
    addIndex(`${kanji}|${kana}`, tag);
    // …and, for suru-noun entries, also index the bare-noun form so JMdict
    // entries whose reading is the noun (without する) still match.
    const bareKana = stripSuru(kana);
    const bareKanji = stripSuru(kanji);
    if (bareKana !== kana || bareKanji !== kanji) {
      addIndex(`${bareKanji}|${bareKana}`, tag);
    }
  }
}
console.log(`JLPT pair-index size: ${jlptIndex.size}`);

// Hand-curated overrides for upstream misclassifications.
// Key: "dictionary|reading"; Value: JLPT level or null to drop the entry.
const overrides: Record<string, JlptTag | null> = JSON.parse(
  readFileSync(resolve(__dirname, "jlpt-overrides.json"), "utf8"),
);
delete (overrides as any)._comment;
let overridesApplied = 0;

const VERB_POS = new Set([
  "v1", "v1-s",
  "v5u", "v5k", "v5g", "v5s", "v5t", "v5n", "v5b", "v5m", "v5r",
  "v5u-s", "v5k-s", "v5r-i", "v5aru",
  "vs-i", "vs-s", "vs",
  "vk",
]);

/**
 * Returns [verbClass, needsSuruSuffix].
 * `vs` / `vs-s` mark a NOUN that is verbed via する → we must append する.
 * `vs-i` marks true irregular する compounds whose keb already ends in する (察する).
 */
function classify(pos: string[]): [string, boolean] | null {
  if (pos.includes("v1") || pos.includes("v1-s")) return ["ichidan", false];
  if (pos.includes("vk")) return ["irregular-kuru", false];
  if (pos.includes("vs-i")) return ["irregular-suru", false];
  if (pos.includes("vs") || pos.includes("vs-s")) return ["irregular-suru", true];
  for (const p of pos) {
    if (p === "v5k-s") return ["godan-iku", false]; // 行く
    const m = /^v5([ukgstnbmr])(?:-i|aru)?$/.exec(p);
    if (m) return [`godan-${m[1]}`, false];
  }
  return null;
}

type Entry = {
  id: string;
  dictionary: string;     // primary writing (kanji if present, else kana)
  reading: string;        // kana
  meaning: string;
  pos: string[];
  verbClass: string;
  jlptLevel: JlptTag | null;
};

const out: Entry[] = [];
const seen = new Set<string>();

const parser = sax.createStream(true, { trim: true });

// Register all custom DTD entities so sax substitutes them as their entity name
// (e.g. &v1; → "v1"). JMdict uses entities for pos/misc/etc.
{
  const head = readFileSync(XML_PATH, "utf8").slice(0, 200_000);
  const re = /<!ENTITY\s+([A-Za-z0-9_-]+)\s+"([^"]*)">/g;
  let m: RegExpExecArray | null;
  // sax exposes ENTITIES on the underlying parser
  const ents = (parser as any)._parser.ENTITIES as Record<string, string>;
  while ((m = re.exec(head))) {
    ents[m[1]] = m[1]; // preserve the entity NAME so <pos>v1</pos>
  }
}

let cur: any = null;
let path: string[] = [];
let textBuf = "";
let curGlossLang: string | undefined; // xml:lang on current <gloss>

parser.on("opentag", (node) => {
  const name = node.name;
  path.push(name);
  textBuf = "";
  if (name === "entry") {
    cur = { ent_seq: "", k: [] as string[], r: [] as string[], pos: new Set<string>(), gloss: [] as string[] };
  } else if (name === "gloss") {
    const attrs = node.attributes as Record<string, string>;
    curGlossLang = attrs["xml:lang"];
  }
});

parser.on("text", (t) => { textBuf += t; });
parser.on("cdata", (t) => { textBuf += t; });

parser.on("closetag", (name) => {
  if (cur) {
    const txt = textBuf.trim();
    switch (name) {
      case "ent_seq": cur.ent_seq = txt; break;
      case "keb": if (txt) cur.k.push(txt); break;
      case "reb": if (txt) cur.r.push(txt); break;
      case "pos": if (txt) cur.pos.add(txt); break;
      case "gloss": {
        // JMdict default lang is "eng" (omitted attr) — accept only English
        const lang = curGlossLang ?? "eng";
        if (txt && lang === "eng" && cur.gloss.length < 3) cur.gloss.push(txt);
        curGlossLang = undefined;
        break;
      }
      case "entry": {
        const posArr = [...cur.pos];
        const isVerb = posArr.some((p) => VERB_POS.has(p));
        if (isVerb && cur.r.length) {
          const classified = classify(posArr);
          if (classified) {
            const [verbClass, needsSuruFlag] = classified;
            let reading: string = cur.r[0];
            const baseKanji: string | undefined = cur.k[0];
            let dictionary = baseKanji ?? reading;

            // Don't double-append する if the entry already carries it
            // (vs-s entries like 愛する/あいする, 関する/かんする ship with する baked in).
            const alreadyHasSuru =
              (baseKanji ?? reading).endsWith("する") || reading.endsWith("する");
            const needsSuru = needsSuruFlag && !alreadyHasSuru;

            // Match against JLPT BEFORE appending する (jlpt list stores the noun form
            // for vs entries). Try the literal pair first, then the bare-noun pair.
            const lookupKanji = baseKanji && baseKanji !== reading ? baseKanji : "";
            const lvl =
              jlptIndex.get(`${lookupKanji}|${reading}`) ??
              (needsSuru
                ? jlptIndex.get(`${lookupKanji}する|${reading}する`) ?? null
                : null) ??
              null;

            if (needsSuru) {
              dictionary = `${dictionary}する`;
              reading = `${reading}する`;
            }

            const dedupeKey = `${dictionary}|${reading}`;
            let finalLvl: JlptTag | null = lvl;
            if (Object.prototype.hasOwnProperty.call(overrides, dedupeKey)) {
              finalLvl = overrides[dedupeKey];
              overridesApplied++;
            }
            if (finalLvl && !seen.has(dedupeKey)) {
              seen.add(dedupeKey);
              out.push({
                id: cur.ent_seq,
                dictionary,
                reading,
                meaning: cur.gloss.slice(0, 2).join("; "),
                pos: posArr,
                verbClass,
                jlptLevel: finalLvl,
              });
            }
          }
        }
        cur = null;
      }
    }
  }
  textBuf = "";
  path.pop();
});

parser.on("error", (e) => { console.error(e); process.exit(1); });

parser.on("end", () => {
  // Sort: N5 → N1 then by reading
  const order = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 } as const;
  out.sort((a, b) => (order[a.jlptLevel!] - order[b.jlptLevel!]) || a.reading.localeCompare(b.reading));

  // Disambiguate homographs: when two entries share `dictionary` but differ in
  // reading (e.g. 来る/くる N5 vs 来る/きたる N1), keep the lower-level entry as
  // the canonical form and append the kana to higher-level duplicates so the
  // UI shows e.g. "来る (きたる)" and the user isn't surprised.
  const byDict = new Map<string, Entry[]>();
  for (const e of out) {
    const arr = byDict.get(e.dictionary) ?? [];
    arr.push(e);
    byDict.set(e.dictionary, arr);
  }
  for (const [, group] of byDict) {
    if (group.length < 2) continue;
    // sort by level (lowest = most common), keep first as canonical
    group.sort((a, b) => order[a.jlptLevel!] - order[b.jlptLevel!]);
    for (let i = 1; i < group.length; i++) {
      group[i].dictionary = `${group[i].dictionary}(${group[i].reading})`;
    }
  }

  const stats: Record<string, number> = {};
  for (const e of out) {
    stats[`${e.jlptLevel}-${e.verbClass.startsWith("godan") ? "godan" : e.verbClass}`] =
      (stats[`${e.jlptLevel}-${e.verbClass.startsWith("godan") ? "godan" : e.verbClass}`] ?? 0) + 1;
  }
  console.log(`Total verbs: ${out.length}`);
  console.log(`Overrides applied: ${overridesApplied}`);
  console.log("Breakdown:", stats);

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(
    OUT_PATH,
    JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), entries: out }),
  );
  console.log(`Wrote ${OUT_PATH}`);
});

createReadStream(XML_PATH).pipe(parser);
