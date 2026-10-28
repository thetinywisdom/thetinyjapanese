/**
 * Rekey examples.json by `${id}|${reading}` and apply scripts/example-overrides.mjs.
 *
 * Homograph verbs (same dictionary spelling, two readings) are re-picked from
 * scripts/cache/examples.utf so a sentence tagged ひらく is not shown on あく.
 * Every other card keeps its current sentences, minus banned lines.
 *
 * Run after apply-content-overrides.mjs:
 *   node scripts/patch-examples.mjs
 *
 * build-examples.ts calls the same override helpers, so a full Tatoeba rebuild
 * keeps items 33–51 and the 気違い ban.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  KANJI_REPLACEMENTS,
  replacementFor,
  sanitizeSentenceList,
  sentenceAllowed,
} from "./example-overrides.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORDS = resolve(__dirname, "../src/data/words.json");
const EXAMPLES = resolve(__dirname, "../src/data/examples.json");
const CORPUS = resolve(__dirname, "cache/examples.utf");

const words = JSON.parse(readFileSync(WORDS, "utf8")).entries;
const verbs = words.filter((w) => w.wordType === "verb");
const examples = JSON.parse(readFileSync(EXAMPLES, "utf8"));

function bareDictionary(dictionary) {
  const i = dictionary.indexOf("(");
  return i >= 0 ? dictionary.slice(0, i) : dictionary;
}

const groups = new Map();
for (const verb of verbs) {
  const key = bareDictionary(verb.dictionary);
  const arr = groups.get(key) ?? [];
  arr.push(verb);
  groups.set(key, arr);
}
const homographDicts = new Set(
  [...groups.entries()].filter(([, arr]) => new Set(arr.map((v) => v.reading)).size > 1).map(([d]) => d),
);

function parseToken(tok) {
  let reading;
  let s = tok;
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

/** @type {Map<string, {ja: string, en: string, len: number}[]>} */
const byPair = new Map();
const lines = readFileSync(CORPUS, "utf8").split("\n");
for (let i = 0; i < lines.length - 1; i++) {
  const a = lines[i];
  const b = lines[i + 1];
  if (!a.startsWith("A: ") || !b.startsWith("B: ")) continue;
  const body = a.slice(3);
  const tab = body.indexOf("\t");
  if (tab < 0) continue;
  const ja = body.slice(0, tab).trim();
  const enRaw = body.slice(tab + 1);
  const hash = enRaw.indexOf("#");
  const en = (hash >= 0 ? enRaw.slice(0, hash) : enRaw).trim();
  const len = [...ja].length;
  if (!ja || !en || len < 4 || len > 30) continue;
  const sentence = { ja, en, len };
  if (!sentenceAllowed(sentence)) continue;
  const seen = new Set();
  for (const tok of b.slice(3).split(/\s+/)) {
    if (!tok) continue;
    const { head, reading } = parseToken(tok);
    if (!head || !reading) continue;
    const key = `${head}|${reading}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const arr = byPair.get(key) ?? [];
    arr.push(sentence);
    byPair.set(key, arr);
  }
}

function pick(dictionary, reading) {
  const dict = bareDictionary(dictionary);
  const pool = [...(byPair.get(`${dict}|${reading}`) ?? []), ...(dict === reading ? [] : byPair.get(`${reading}|${reading}`) ?? [])];
  pool.sort((a, b) => a.len - b.len || (a.ja < b.ja ? -1 : 1));
  const picked = [];
  const seen = new Set();
  for (const s of pool) {
    if (seen.has(s.ja)) continue;
    seen.add(s.ja);
    picked.push({ ja: s.ja, en: s.en });
    if (picked.length >= 2) break;
  }
  return picked;
}

const byVerbId = {};
let homographRetargeted = 0;
let replaced = 0;
for (const verb of verbs) {
  const dict = bareDictionary(verb.dictionary);
  const forced = replacementFor(dict, verb.reading) ?? replacementFor(verb.dictionary, verb.reading);
  let sentences;
  if (forced) {
    sentences = forced;
    replaced++;
  } else if (homographDicts.has(dict)) {
    sentences = pick(dict, verb.reading);
    homographRetargeted++;
  } else {
    sentences = sanitizeSentenceList(examples.byVerbId[verb.id] ?? examples.byVerbId[`${verb.id}|${verb.reading}`] ?? []);
  }
  sentences = sanitizeSentenceList(sentences);
  if (sentences.length) byVerbId[`${verb.id}|${verb.reading}`] = sentences;
}

const byKanji = {};
for (const [kanji, list] of Object.entries(examples.byKanji ?? {})) {
  const replacement = KANJI_REPLACEMENTS[kanji];
  const next = replacement ?? sanitizeSentenceList(list);
  if (next.length) byKanji[kanji] = next;
}

const payload = {
  version: 2,
  generatedAt: new Date().toISOString(),
  key: "id|reading",
  byVerbId,
  byKanji,
};
writeFileSync(EXAMPLES, JSON.stringify(payload));
const blob = JSON.stringify(payload);
console.log(`verbs with examples ${Object.keys(byVerbId).length}/${verbs.length}`);
console.log(`homograph retargeted ${homographRetargeted}, replacements ${replaced}`);
console.log("気違い", blob.includes("気違い"), "色盲", blob.includes("色盲"));
