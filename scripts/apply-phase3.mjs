/**
 * Merge the curated Phase 3 files into src/data.
 *
 *   node scripts/apply-phase3.mjs
 *
 * Edit scripts/curated/n5-n3-words.json, n5-n3-kanji.json, or sentences.json,
 * then run this. It does not regenerate those files. N2–N1 words and their
 * example sentences are left as they are. `draft-phase3.mjs` overwrites the
 * curated files; do not run it after a teacher has edited them.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return JSON.parse(readFileSync(resolve(root, rel), "utf8"));
}
function hiraToKata(s) {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    out += c >= 0x3041 && c <= 0x3096 ? String.fromCharCode(c + 0x60) : ch;
  }
  return out;
}

const curatedWords = read("scripts/curated/n5-n3-words.json").words.map(({ flag, ...rest }) => rest);
const study = read("scripts/curated/n5-n3-kanji.json").kanji;
const sentences = read("scripts/curated/sentences.json");
const wordsFile = read("src/data/words.json");
const radicalsFile = read("src/data/kanji-radicals.json");
const examplesFile = read("src/data/examples.json");

const order = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
const higher = wordsFile.entries.filter((e) => e.jlptLevel === "N2" || e.jlptLevel === "N1");
const entries = [...curatedWords, ...higher].sort(
  (a, b) =>
    order[a.jlptLevel] - order[b.jlptLevel] ||
    a.wordType.localeCompare(b.wordType) ||
    a.reading.localeCompare(b.reading) ||
    a.dictionary.localeCompare(b.dictionary),
);
wordsFile.entries = entries;

for (const [ch, info] of Object.entries(study)) {
  const entry = radicalsFile.kanji[ch];
  if (!entry) continue;
  entry.meaning = info.meaning;
  entry.on = (info.readings ?? []).filter((r) => r.type === "on").map((r) => hiraToKata(r.kana));
  entry.kun = (info.readings ?? []).filter((r) => r.type === "kun").map((r) => r.kunDisplay || r.kana);
}

const studyOut = { version: 1, kanji: {} };
for (const [ch, info] of Object.entries(study)) {
  studyOut.kanji[ch] = {
    meaning: info.meaning,
    primary: info.primary,
    readings: (info.readings ?? []).map((r) => ({
      type: r.type,
      kana: r.kana,
      anchor: r.anchor || undefined,
      anchorReading: r.anchorReading || undefined,
      note: r.note || undefined,
    })),
  };
}

const curatedIds = new Set(curatedWords.map((w) => w.id));
const byVerbId = {};
for (const [key, list] of Object.entries(examplesFile.byVerbId)) {
  const id = key.split("|")[0];
  if (curatedIds.has(id)) continue;
  byVerbId[key] = list;
}
for (const row of Object.values(sentences.verbs)) {
  if (!row.sentences?.length) continue;
  byVerbId[`${row.id}|${row.reading}`] = row.sentences.map((s) => ({ ja: s.ja, en: s.en }));
}
const byKanji = { ...examplesFile.byKanji };
for (const ch of Object.keys(study)) {
  const list = sentences.kanji[ch];
  if (list?.length) byKanji[ch] = list.map((s) => ({ ja: s.ja, en: s.en }));
  else delete byKanji[ch];
}
examplesFile.byVerbId = byVerbId;
examplesFile.byKanji = byKanji;
examplesFile.version = 3;
examplesFile.key = "id|reading";

writeFileSync(resolve(root, "src/data/words.json"), JSON.stringify(wordsFile));
writeFileSync(resolve(root, "src/data/kanji-radicals.json"), JSON.stringify(radicalsFile));
writeFileSync(resolve(root, "src/data/kanji-study.json"), JSON.stringify(studyOut));
writeFileSync(resolve(root, "src/data/examples.json"), JSON.stringify(examplesFile));
console.log(`applied ${curatedWords.length} words, ${Object.keys(study).length} kanji, ${Object.keys(sentences.verbs).length} verb sentence groups`);
