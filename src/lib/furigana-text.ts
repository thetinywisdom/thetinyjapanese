/**
 * Add furigana to free-form Japanese text.
 *
 * Strategy (no network, no AI):
 *  1. Longest-match against the bundled word/verb dictionaries.
 *  2. Fall back to matching the leading kanji block of a dictionary entry
 *     (so inflected forms like 食べます still get た over 食).
 *  3. Fall back to per-kanji kun/on readings from kanjidic data.
 */

import { WORDS } from "@/data/words";
import { VERBS } from "@/data/verbs";
import radicalsData from "@/data/kanji-radicals.json";
import { katakanaToHiragana } from "@/lib/kana";
import { pairFurigana, type Segment } from "@/lib/furigana";

export type RubyToken = Segment;

interface RadicalsFile {
  kanji: Record<string, { on?: string[]; kun?: string[] }>;
}
const KANJI_INFO = (radicalsData as unknown as RadicalsFile).kanji;

function isKanji(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return c >= 0x4e00 && c <= 0x9fff;
}
function hasKanji(s: string): boolean {
  for (const ch of s) if (isKanji(ch)) return true;
  return false;
}

const MAX_WORD_LEN = 10;

/** Very common words the bundled dictionaries miss or read unusually. */
const OVERRIDES: Record<string, string> = {
  私: "わたし",
  日本: "にほん",
  日本語: "にほんご",
  日本人: "にほんじん",
  寿司: "すし",
  今日: "きょう",
  明日: "あした",
  昨日: "きのう",
  一日: "いちにち",
  大丈夫: "だいじょうぶ",
  友達: "ともだち",
  時間: "じかん",
  天気: "てんき",
  先生: "せんせい",
  学校: "がっこう",
  自分: "じぶん",
};

let wordMap: Map<string, string> | null = null;
let stemMap: Map<string, string> | null = null;


function buildIndex() {
  if (wordMap && stemMap) return { wordMap, stemMap };
  const words = new Map<string, string>();
  const stems = new Map<string, string>();
  const all = [...WORDS, ...VERBS];
  const indexForm = (form: string, reading: string) => {
    if (!form || !reading || !hasKanji(form)) return;
    if (form.length > MAX_WORD_LEN) return;
    if (!words.has(form)) words.set(form, reading);

    // leading kanji block + kana tail → stem reading (for inflected forms)
    let i = 0;
    while (i < form.length && isKanji(form[i])) i++;
    if (i === 0 || i === form.length) return;
    const tail = form.slice(i);
    if (hasKanji(tail)) return;
    if (!reading.endsWith(tail)) return;
    const stem = form.slice(0, i);
    const stemReading = reading.slice(0, reading.length - tail.length);
    if (stemReading && !stems.has(stem)) stems.set(stem, stemReading);
  };
  for (const w of all) {
    indexForm(w.dictionary, w.reading);
    if (w.kanjiForm) indexForm(w.kanjiForm, w.reading);
  }
  for (const [form, reading] of Object.entries(OVERRIDES)) words.set(form, reading);
  wordMap = words;

  stemMap = stems;
  return { wordMap: words, stemMap: stems };
}

/** Best single-kanji reading: prefer kun (without okurigana marks), else on. */
function singleKanjiReading(ch: string): string | undefined {
  const info = KANJI_INFO[ch];
  if (!info) return undefined;
  const kun = info.kun?.find((k) => !k.startsWith("-"));
  if (kun) return kun.split(".")[0].replace(/-/g, "");
  const on = info.on?.[0];
  return on ? katakanaToHiragana(on) : undefined;
}

function push(out: RubyToken[], seg: RubyToken) {
  const last = out[out.length - 1];
  if (last && !last.ruby && !seg.ruby) last.base += seg.base;
  else out.push(seg);
}

export function annotateFurigana(text: string): RubyToken[] {
  if (!text) return [];
  const { wordMap: words, stemMap: stems } = buildIndex();
  const out: RubyToken[] = [];
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (!isKanji(ch)) {
      push(out, { base: ch });
      i++;
      continue;
    }

    // 1. longest dictionary match starting here
    let matched = false;
    for (let len = Math.min(MAX_WORD_LEN, text.length - i); len >= 1; len--) {
      const slice = text.slice(i, i + len);
      const reading = words.get(slice);
      if (!reading) continue;
      for (const seg of pairFurigana(slice, reading)) push(out, seg);
      i += len;
      matched = true;
      break;
    }
    if (matched) continue;

    // 2. leading kanji block of an inflected word
    let k = i;
    while (k < text.length && isKanji(text[k])) k++;
    const block = text.slice(i, k);
    for (let len = block.length; len >= 1; len--) {
      const slice = block.slice(0, len);
      const reading = stems.get(slice);
      if (!reading) continue;
      push(out, { base: slice, ruby: reading });
      i += len;
      matched = true;
      break;
    }
    if (matched) continue;

    // 3. per-kanji fallback
    const reading = singleKanjiReading(ch);
    push(out, reading ? { base: ch, ruby: reading } : { base: ch });
    i++;
  }

  return out;
}
