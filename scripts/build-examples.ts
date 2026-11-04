/**
 * Build src/data/examples.json from the Tanaka Corpus (examples.utf).
 *
 * Source: Tatoeba/Tanaka Corpus, distributed by EDRDG under CC-BY.
 *         http://www.edrdg.org/wiki/index.php/Tanaka_Corpus
 *
 * Format (pairs of lines):
 *   A: <japanese>\t<english>#ID=...
 *   B: word1 word2(reading)[sense] word3{surface} ...
 *
 * The B-line lists every headword in the sentence. For each headword token we
 * extract just the leading dictionary form (everything before "(", "[", "{" or "~").
 *
 * We index sentences by headword and reading, then for each verb in words.json
 * we look up `${dictionary}|${reading}`. scripts/example-overrides.mjs drops
 * banned lines (including 気違い) and replaces the sentences in review items
 * 33–51. The checked-in file is keyed by `${id}|${reading}`.
 *
 * Run: npx tsx scripts/build-examples.ts
 * Or, without the corpus: node scripts/patch-examples.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  KANJI_REPLACEMENTS,
  replacementFor,
  sanitizeSentenceList,
  sentenceAllowed,
} from "./example-overrides.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORPUS_PATH = resolve(__dirname, "cache/examples.utf");
const WORDS_PATH = resolve(__dirname, "../src/data/words.json");
const KANJI_PATH = resolve(__dirname, "../src/data/kanji-radicals.json");
const OUT_PATH = resolve(__dirname, "../src/data/examples.json");

const MAX_PER_VERB = 2;
const MAX_PER_KANJI = 2;
const MAX_JA_LEN = 30; // characters; keeps cards short
const MIN_JA_LEN = 4;

interface Sentence {
  ja: string;
  en: string;
  /** length used for sorting (shorter = preferred) */
  len: number;
}

if (!existsSync(CORPUS_PATH)) {
  throw new Error(
    `Missing ${CORPUS_PATH}. Download from http://ftp.edrdg.org/pub/Nihongo/examples.utf.gz, gunzip, and place it there.`,
  );
}

const text = readFileSync(CORPUS_PATH, "utf8");
const lines = text.split("\n");

interface Pair {
  ja: string;
  en: string;
  headwords: Set<string>;
}

const pairs: Pair[] = [];

function extractHeadword(token: string): { head: string; reading?: string } {
  let reading: string | undefined;
  let s = token;
  const p = s.indexOf("(");
  if (p >= 0) {
    const end = s.indexOf(")", p);
    if (end > p) {
      reading = s.slice(p + 1, end);
      s = s.slice(0, p) + s.slice(end + 1);
    }
  }
  let headEnd = s.length;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "[" || c === "{" || c === "~") {
      headEnd = i;
      break;
    }
  }
  return { head: s.slice(0, headEnd), reading };
}

for (let i = 0; i < lines.length - 1; i++) {
  const a = lines[i];
  const b = lines[i + 1];
  if (!a.startsWith("A: ") || !b.startsWith("B: ")) continue;
  const aBody = a.slice(3);
  const tab = aBody.indexOf("\t");
  if (tab < 0) continue;
  const ja = aBody.slice(0, tab).trim();
  const enRaw = aBody.slice(tab + 1);
  const hash = enRaw.indexOf("#");
  const en = (hash >= 0 ? enRaw.slice(0, hash) : enRaw).trim();
  if (!ja || !en) continue;

  const headwords = new Set<string>();
  for (const tok of b.slice(3).split(/\s+/)) {
    if (!tok) continue;
    const { head, reading } = extractHeadword(tok);
    if (!head) continue;
    headwords.add(head);
    if (reading) headwords.add(`${head}|${reading}`);
  }
  pairs.push({ ja, en, headwords });
}

console.log(`parsed ${pairs.length} sentence pairs`);

// Index: headword → indices into pairs
const byHeadword = new Map<string, number[]>();
// Index: kanji char → indices into pairs (only sentences where the kanji appears in JA)
const byKanjiChar = new Map<string, number[]>();

function isKanji(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return c >= 0x4e00 && c <= 0x9fff;
}

for (let i = 0; i < pairs.length; i++) {
  const p = pairs[i];
  for (const hw of p.headwords) {
    let arr = byHeadword.get(hw);
    if (!arr) {
      arr = [];
      byHeadword.set(hw, arr);
    }
    arr.push(i);
  }
  // kanji index: every unique kanji in JA
  const seen = new Set<string>();
  for (const ch of p.ja) {
    if (isKanji(ch) && !seen.has(ch)) {
      seen.add(ch);
      let arr = byKanjiChar.get(ch);
      if (!arr) {
        arr = [];
        byKanjiChar.set(ch, arr);
      }
      arr.push(i);
    }
  }
}

interface OutSentence {
  ja: string;
  en: string;
}

function pickSentences(indices: number[] | undefined, max: number): OutSentence[] {
  if (!indices || indices.length === 0) return [];
  const candidates: Sentence[] = [];
  for (const idx of indices) {
    const p = pairs[idx];
    const len = [...p.ja].length;
    if (len < MIN_JA_LEN || len > MAX_JA_LEN) continue;
    candidates.push({ ja: p.ja, en: p.en, len });
  }
  // shorter first; deterministic by ja as tiebreak
  candidates.sort((a, b) => a.len - b.len || (a.ja < b.ja ? -1 : 1));
  const picked: OutSentence[] = [];
  const seenJa = new Set<string>();
  for (const c of candidates) {
    if (seenJa.has(c.ja)) continue;
    if (!sentenceAllowed(c)) continue;
    seenJa.add(c.ja);
    picked.push({ ja: c.ja, en: c.en });
    if (picked.length >= max) break;
  }
  return picked;
}

// --- Verbs (words.json is the source of truth) ---
const wordsFile = JSON.parse(readFileSync(WORDS_PATH, "utf8")) as {
  entries: { id: string; dictionary: string; reading: string; wordType?: string; verbClass?: string }[];
};
const verbEntries = wordsFile.entries.filter((e) =>
  e.wordType ? e.wordType === "verb" : e.verbClass && !e.verbClass.startsWith("adj") && e.verbClass !== "noun",
);
const byVerbId: Record<string, OutSentence[]> = {};
let verbsWithExamples = 0;
for (const v of verbEntries) {
  const forced = replacementFor(v.dictionary, v.reading);
  let picks = forced
    ? forced
    : pickSentences(byHeadword.get(`${v.dictionary}|${v.reading}`), MAX_PER_VERB);
  if (!forced && picks.length === 0) {
    picks = pickSentences(byHeadword.get(v.dictionary), MAX_PER_VERB);
  }
  if (!forced && picks.length === 0 && v.reading !== v.dictionary) {
    picks = pickSentences(byHeadword.get(v.reading), MAX_PER_VERB);
  }
  picks = sanitizeSentenceList(picks);
  if (picks.length > 0) {
    byVerbId[`${v.id}|${v.reading}`] = picks;
    verbsWithExamples++;
  }
}
console.log(`verbs with examples: ${verbsWithExamples}/${verbEntries.length}`);

// --- Kanji ---
const kanjiFile = JSON.parse(readFileSync(KANJI_PATH, "utf8")) as {
  kanji: Record<string, unknown>;
};
const byKanji: Record<string, OutSentence[]> = {};
let kanjiWithExamples = 0;
for (const k of Object.keys(kanjiFile.kanji)) {
  const picks = sanitizeSentenceList(KANJI_REPLACEMENTS[k] ?? pickSentences(byKanjiChar.get(k), MAX_PER_KANJI));
  if (picks.length > 0) {
    byKanji[k] = picks;
    kanjiWithExamples++;
  }
}
console.log(`kanji with examples: ${kanjiWithExamples}/${Object.keys(kanjiFile.kanji).length}`);

const payload = {
  version: 2,
  generatedAt: new Date().toISOString(),
  key: "id|reading",
  byVerbId,
  byKanji,
};

writeFileSync(OUT_PATH, JSON.stringify(payload));
const sizeKB = (JSON.stringify(payload).length / 1024).toFixed(1);
console.log(`wrote → ${OUT_PATH} (${sizeKB} KB)`);
