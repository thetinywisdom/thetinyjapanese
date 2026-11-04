/**
 * One-time build: parse kradfile + kradfile2 + kanjidic2 → src/data/kanji-radicals.json.
 *
 * Filters to only the kanji that appear in src/data/words.json (verbs.json is
 * optional and unused by the app), so the shipped
 * file stays small. Joins a curated radical-name map for English glosses,
 * plus on'yomi / kun'yomi / English meanings from kanjidic2.
 *
 * Run:  npx tsx scripts/build-kanji-radicals.ts
 *
 * Source: kradfile/kradfile2 + kanjidic2 © Michael Raine, James Breen and EDRDG,
 *         http://www.edrdg.org/edrdg/licence.html
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VERBS_PATH = resolve(__dirname, "../src/data/verbs.json");
const WORDS_PATH = resolve(__dirname, "../src/data/words.json");
const OUT_PATH = resolve(__dirname, "../src/data/kanji-radicals.json");
const NAMES_PATH = resolve(__dirname, "radical-names.json");
const KANJIDIC_PATH = resolve(__dirname, "kanjidic2.xml");
const KANJIDIC_FALLBACK = "/tmp/kanjidic2.xml";

interface WordListFile {
  entries: { dictionary: string }[];
}

function parseKrad(path: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(" : ");
    if (idx < 0) continue;
    const k = line.slice(0, idx).trim();
    if (!k) continue;
    const rads = line
      .slice(idx + 3)
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (rads.length) out.set(k, rads);
  }
  return out;
}

interface KanjiDicEntry {
  on: string[];
  kun: string[];
  meanings: string[];
  grade?: number;
}

/** Lightweight regex-based kanjidic2 parser — extracts only fields we need. */
function parseKanjidic(path: string): Map<string, KanjiDicEntry> {
  const xml = readFileSync(path, "utf8");
  const out = new Map<string, KanjiDicEntry>();
  const charRe = /<character>([\s\S]*?)<\/character>/g;
  let m: RegExpExecArray | null;
  while ((m = charRe.exec(xml))) {
    const block = m[1];
    const litMatch = block.match(/<literal>(.+?)<\/literal>/);
    if (!litMatch) continue;
    const ch = litMatch[1];

    // readings
    const on: string[] = [];
    const kun: string[] = [];
    const readingRe = /<reading r_type="(ja_on|ja_kun)">([^<]+)<\/reading>/g;
    let r: RegExpExecArray | null;
    while ((r = readingRe.exec(block))) {
      if (r[1] === "ja_on") on.push(r[2]);
      else kun.push(r[2]);
    }

    // English meanings only (no m_lang attr)
    const meanings: string[] = [];
    const meaningRe = /<meaning>([^<]+)<\/meaning>/g;
    let mm: RegExpExecArray | null;
    while ((mm = meaningRe.exec(block))) {
      meanings.push(mm[1]);
    }

    const gradeMatch = block.match(/<grade>(\d+)<\/grade>/);
    const grade = gradeMatch ? parseInt(gradeMatch[1], 10) : undefined;

    out.set(ch, { on, kun, meanings, grade });
  }
  return out;
}

type JlptLabel = "N5" | "N4" | "N3" | "N2" | "N1";

/**
 * Load authoritative per-kanji JLPT levels from the bundled community list
 * under `scripts/jlpt-kanji/n{1..5}.txt` (one kanji per line), then apply
 * hand-curated overrides from `scripts/jlpt-kanji-overrides.json`.
 *
 * Source list: davidluzgouveia/kanji-data `jlpt_new` field — the de-facto
 * post-2010 community classification. Counts: N5 79, N4 166, N3 367, N2 367,
 * N1 1232. See `scripts/jlpt-kanji/README.md` for regeneration.
 */
function loadJlptLevels(listDir: string, overridesPath: string): Map<string, JlptLabel> {
  const out = new Map<string, JlptLabel>();
  const levels: JlptLabel[] = ["N5", "N4", "N3", "N2", "N1"];
  for (const lv of levels) {
    const n = lv.slice(1);
    const file = resolve(listDir, `n${n}.txt`);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const ch = line.trim();
      if (!ch) continue;
      // Defensive: only single CJK ideographs, last-wins (shouldn't happen).
      if (ch.length === 1) out.set(ch, lv);
    }
  }
  if (existsSync(overridesPath)) {
    const raw = JSON.parse(readFileSync(overridesPath, "utf8")) as Record<string, JlptLabel | null>;
    for (const [k, v] of Object.entries(raw)) {
      if (k.startsWith("_")) continue;
      if (v === null) out.delete(k);
      else out.set(k, v);
    }
  }
  return out;
}


const krad = new Map<string, string[]>();
for (const [k, v] of parseKrad(resolve(__dirname, "kradfile.utf8"))) krad.set(k, v);
for (const [k, v] of parseKrad(resolve(__dirname, "kradfile2.utf8"))) {
  if (!krad.has(k)) krad.set(k, v);
}

const kanjidicPath = existsSync(KANJIDIC_PATH) ? KANJIDIC_PATH : KANJIDIC_FALLBACK;
if (!existsSync(kanjidicPath)) {
  throw new Error(
    `kanjidic2.xml not found at ${KANJIDIC_PATH} or ${KANJIDIC_FALLBACK}. ` +
      `Download from http://www.edrdg.org/kanjidic/kanjidic2.xml.gz and gunzip.`,
  );
}
const dict = parseKanjidic(kanjidicPath);
console.log(`parsed ${dict.size} kanjidic2 entries`);

const jlptLevels = loadJlptLevels(
  resolve(__dirname, "jlpt-kanji"),
  resolve(__dirname, "jlpt-kanji-overrides.json"),
);
console.log(`loaded JLPT levels for ${jlptLevels.size} kanji from bundled list`);

const words = JSON.parse(readFileSync(WORDS_PATH, "utf8")) as WordListFile;
const verbs = existsSync(VERBS_PATH)
  ? (JSON.parse(readFileSync(VERBS_PATH, "utf8")) as WordListFile)
  : { entries: [] };
const used = new Set<string>();
for (const e of [...verbs.entries, ...words.entries]) {
  for (const ch of e.dictionary) {
    const c = ch.charCodeAt(0);
    if (c >= 0x4e00 && c <= 0x9fff) used.add(ch);
  }
}
console.log(`collected ${used.size} unique kanji from verbs + words`);

const names = JSON.parse(readFileSync(NAMES_PATH, "utf8")) as Record<string, string>;

interface KanjiOut {
  radicals: string[];
  on?: string[];
  kun?: string[];
  meaning?: string;
  /** N5–N1, derived from lowest-level vocab containing this kanji. */
  jlpt?: "N5" | "N4" | "N3" | "N2" | "N1";
  /**
   * Japanese school grade from kanjidic2 `<grade>`:
   *   1–6 = elementary grades 1–6 (kyōiku kanji)
   *   8   = remaining jōyō (junior high / high school)
   *   9–10 = jinmeiyō (name use)
   */
  grade?: number;
}

const kanji: Record<string, KanjiOut> = {};
const usedRadicals = new Set<string>();
let missingRads = 0;
let missingDict = 0;
let missingJlpt = 0;
for (const k of used) {
  const rads = krad.get(k);
  const d = dict.get(k);
  if (!rads && !d) {
    missingRads++;
    continue;
  }
  if (!rads) missingRads++;
  if (!d) missingDict++;

  // cap meanings to first 3 to keep file small
  const meaning = d?.meanings.slice(0, 3).join(", ");
  const jlpt = jlptLevels.get(k);
  if (!jlpt) missingJlpt++;

  kanji[k] = {
    radicals: rads ?? [],
    ...(d?.on.length ? { on: d.on } : {}),
    ...(d?.kun.length ? { kun: d.kun } : {}),
    ...(meaning ? { meaning } : {}),
    ...(jlpt ? { jlpt } : {}),
    ...(d?.grade ? { grade: d.grade } : {}),
  };
  if (rads) for (const r of rads) usedRadicals.add(r);
}

const radicalNames: Record<string, string> = {};
const unnamed: string[] = [];
for (const r of usedRadicals) {
  if (names[r]) radicalNames[r] = names[r];
  else unnamed.push(r);
}

const payload = {
  version: 3,
  generatedAt: new Date().toISOString(),
  kanji,
  radicalNames,
};


writeFileSync(OUT_PATH, JSON.stringify(payload));
const sizeKB = (JSON.stringify(payload).length / 1024).toFixed(1);
console.log(
  `wrote ${Object.keys(kanji).length} kanji, ${Object.keys(radicalNames).length}/${usedRadicals.size} named radicals → ${OUT_PATH} (${sizeKB} KB)`,
);
if (missingRads) console.warn(`missing radical data for ${missingRads} kanji`);
if (missingDict) console.warn(`missing kanjidic data for ${missingDict} kanji`);
if (missingJlpt) console.warn(`no JLPT level for ${missingJlpt} kanji (no vocab in cache)`);
if (unnamed.length) console.warn(`unnamed radicals (${unnamed.length}):`, unnamed.join(" "));

