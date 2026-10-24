/**
 * Extended data build: parses JMdict + JLPT vocab caches to produce
 * src/data/words.json containing verbs, i-adjectives, na-adjectives and
 * (JLPT-listed) nouns. Run: `bun run scripts/build-words.ts`.
 */
import sax from "sax";
import { createReadStream, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const XML_PATH = resolve(__dirname, "JMdict.xml");
const OUT_PATH = resolve(__dirname, "../src/data/words.json");

type JlptWord = { word: string; furigana: string; meaning: string; level: number };
const JLPT_LEVELS = [5, 4, 3, 2, 1] as const;
type JlptTag = "N5" | "N4" | "N3" | "N2" | "N1";

const jlptIndex = new Map<string, JlptTag>();
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
    const rawKana = w.furigana || w.word;
    const rawKanji = w.word && w.word !== rawKana ? w.word : "";
    const kana = rawKana.replace(/・/g, "");
    const kanji = rawKanji.replace(/・/g, "");
    addIndex(`${kanji}|${kana}`, tag);
    const bareKana = stripSuru(kana);
    const bareKanji = stripSuru(kanji);
    if (bareKana !== kana || bareKanji !== kanji) {
      addIndex(`${bareKanji}|${bareKana}`, tag);
    }
  }
}
console.log(`JLPT pair-index size: ${jlptIndex.size}`);

const VERB_POS = new Set([
  "v1", "v1-s",
  "v5u", "v5k", "v5g", "v5s", "v5t", "v5n", "v5b", "v5m", "v5r",
  "v5u-s", "v5k-s", "v5r-i", "v5aru",
  "vs-i", "vs-s", "vs",
  "vk",
]);

function classifyVerb(pos: string[]): [string, boolean] | null {
  if (pos.includes("v1") || pos.includes("v1-s")) return ["ichidan", false];
  if (pos.includes("vk")) return ["irregular-kuru", false];
  if (pos.includes("vs-i")) return ["irregular-suru", false];
  if (pos.includes("vs") || pos.includes("vs-s")) return ["irregular-suru", true];
  for (const p of pos) {
    if (p === "v5k-s") return ["godan-iku", false];
    const m = /^v5([ukgstnbmr])(?:-i|aru)?$/.exec(p);
    if (m) return [`godan-${m[1]}`, false];
  }
  return null;
}

export type WordType = "verb" | "adj-i" | "adj-na" | "noun";
type Entry = {
  id: string;
  dictionary: string;
  reading: string;
  meaning: string;
  pos: string[];
  wordType: WordType;
  /** verb class (only for verbs) */
  verbClass?: string;
  jlptLevel: JlptTag | null;
};

const out: Entry[] = [];
const seen = new Set<string>();

const parser = sax.createStream(true, { trim: true });
{
  const head = readFileSync(XML_PATH, "utf8").slice(0, 200_000);
  const re = /<!ENTITY\s+([A-Za-z0-9_-]+)\s+"([^"]*)">/g;
  let m: RegExpExecArray | null;
  const ents = (parser as any)._parser.ENTITIES as Record<string, string>;
  while ((m = re.exec(head))) ents[m[1]] = m[1];
}

let cur: any = null;
let textBuf = "";
let curGlossLang: string | undefined;

parser.on("opentag", (node) => {
  textBuf = "";
  if (node.name === "entry") {
    cur = { ent_seq: "", k: [] as string[], r: [] as string[], pos: new Set<string>(), gloss: [] as string[] };
  } else if (node.name === "gloss") {
    const attrs = node.attributes as Record<string, string>;
    curGlossLang = attrs["xml:lang"];
  }
});
parser.on("text", (t) => { textBuf += t; });
parser.on("cdata", (t) => { textBuf += t; });

parser.on("closetag", (name) => {
  if (!cur) return;
  const txt = textBuf.trim();
  switch (name) {
    case "ent_seq": cur.ent_seq = txt; break;
    case "keb": if (txt) cur.k.push(txt); break;
    case "reb": if (txt) cur.r.push(txt); break;
    case "pos": if (txt) cur.pos.add(txt); break;
    case "gloss": {
      const lang = curGlossLang ?? "eng";
      if (txt && lang === "eng" && cur.gloss.length < 3) cur.gloss.push(txt);
      curGlossLang = undefined;
      break;
    }
    case "entry": {
      const posArr = [...cur.pos] as string[];
      if (!cur.r.length) { cur = null; textBuf = ""; return; }

      // -- VERB --------------------------------------------------------
      if (posArr.some((p) => VERB_POS.has(p))) {
        const classified = classifyVerb(posArr);
        if (classified) {
          const [verbClass, needsSuruFlag] = classified;
          let reading: string = cur.r[0];
          const baseKanji: string | undefined = cur.k[0];
          let dictionary = baseKanji ?? reading;
          const alreadyHasSuru = (baseKanji ?? reading).endsWith("する") || reading.endsWith("する");
          const needsSuru = needsSuruFlag && !alreadyHasSuru;
          const lookupKanji = baseKanji && baseKanji !== reading ? baseKanji : "";
          const lvl =
            jlptIndex.get(`${lookupKanji}|${reading}`) ??
            (needsSuru ? jlptIndex.get(`${lookupKanji}する|${reading}する`) ?? null : null) ??
            null;
          if (needsSuru) { dictionary += "する"; reading += "する"; }
          const key = `verb|${dictionary}|${reading}`;
          if (lvl && !seen.has(key)) {
            seen.add(key);
            out.push({
              id: cur.ent_seq, dictionary, reading,
              meaning: cur.gloss.slice(0, 2).join("; "),
              pos: posArr, wordType: "verb", verbClass, jlptLevel: lvl,
            });
          }
        }
      }
      // -- I-ADJECTIVE -------------------------------------------------
      else if (posArr.includes("adj-i") || posArr.includes("adj-ix")) {
        const reading: string = cur.r[0];
        const dictionary = cur.k[0] ?? reading;
        const lookupKanji = cur.k[0] && cur.k[0] !== reading ? cur.k[0] : "";
        const lvl = jlptIndex.get(`${lookupKanji}|${reading}`) ?? null;
        const key = `adji|${dictionary}|${reading}`;
        // ii/yoi irregular handled by "adj-ix"
        const isYoi = posArr.includes("adj-ix") || reading === "いい" || reading === "よい";
        if (lvl && reading.endsWith("い") && !seen.has(key)) {
          seen.add(key);
          out.push({
            id: cur.ent_seq, dictionary, reading,
            meaning: cur.gloss.slice(0, 2).join("; "),
            pos: posArr, wordType: "adj-i",
            verbClass: isYoi ? "adj-i-yoi" : "adj-i",
            jlptLevel: lvl,
          });
        }
      }
      // -- NA-ADJECTIVE ------------------------------------------------
      else if (posArr.includes("adj-na")) {
        const reading: string = cur.r[0];
        const dictionary = cur.k[0] ?? reading;
        const lookupKanji = cur.k[0] && cur.k[0] !== reading ? cur.k[0] : "";
        const lvl = jlptIndex.get(`${lookupKanji}|${reading}`) ?? null;
        const key = `adjna|${dictionary}|${reading}`;
        if (lvl && !seen.has(key)) {
          seen.add(key);
          out.push({
            id: cur.ent_seq, dictionary, reading,
            meaning: cur.gloss.slice(0, 2).join("; "),
            pos: posArr, wordType: "adj-na", verbClass: "adj-na",
            jlptLevel: lvl,
          });
        }
      }
      // -- NOUN --------------------------------------------------------
      else if (posArr.some((p) => p === "n" || p === "n-adv" || p === "n-t")) {
        const reading: string = cur.r[0];
        const dictionary = cur.k[0] ?? reading;
        const lookupKanji = cur.k[0] && cur.k[0] !== reading ? cur.k[0] : "";
        const lvl = jlptIndex.get(`${lookupKanji}|${reading}`) ?? null;
        const key = `noun|${dictionary}|${reading}`;
        if (lvl && !seen.has(key)) {
          seen.add(key);
          out.push({
            id: cur.ent_seq, dictionary, reading,
            meaning: cur.gloss.slice(0, 2).join("; "),
            pos: posArr, wordType: "noun", verbClass: "noun",
            jlptLevel: lvl,
          });
        }
      }
      cur = null;
    }
  }
  textBuf = "";
});

parser.on("error", (e) => { console.error(e); process.exit(1); });

parser.on("end", () => {
  const order = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 } as const;
  out.sort((a, b) =>
    (order[a.jlptLevel!] - order[b.jlptLevel!]) ||
    a.wordType.localeCompare(b.wordType) ||
    a.reading.localeCompare(b.reading),
  );

  const stats: Record<string, number> = {};
  for (const e of out) {
    const k = `${e.jlptLevel}-${e.wordType}`;
    stats[k] = (stats[k] ?? 0) + 1;
  }
  console.log(`Total words: ${out.length}`);
  console.log("Breakdown:", stats);

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(
    OUT_PATH,
    JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), entries: out }),
  );
  console.log(`Wrote ${OUT_PATH}`);
});

createReadStream(XML_PATH).pipe(parser);
