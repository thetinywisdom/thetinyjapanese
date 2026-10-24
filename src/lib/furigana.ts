/**
 * Pair a kanji-containing string with its kana reading, producing segments
 * suitable for HTML <ruby> rendering.
 *
 * Designed for single-word verb forms where there is at most one contiguous
 * kanji block (optionally surrounded by kana). Examples:
 *   pair("食べる", "たべる")     → [{base:"食",ruby:"た"},{base:"べる"}]
 *   pair("勉強する", "べんきょうする") → [{base:"勉強",ruby:"べんきょう"},{base:"する"}]
 *   pair("来た", "きた")         → [{base:"来",ruby:"き"},{base:"た"}]
 *   pair("会った", "あった")     → [{base:"会",ruby:"あ"},{base:"った"}]
 */

export interface Segment {
  base: string;     // text to display
  ruby?: string;    // furigana above (omitted for plain kana)
}

function isKana(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return (c >= 0x3040 && c <= 0x309f) || (c >= 0x30a0 && c <= 0x30ff) || c === 0x30fc;
}
function isKanji(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return c >= 0x4e00 && c <= 0x9fff;
}

export function pairFurigana(kanji: string, kana: string): Segment[] {
  // Split kanji form into runs of [kanji-block | kana-run]
  type Run = { type: "kanji" | "kana"; text: string };
  const runs: Run[] = [];
  let i = 0;
  while (i < kanji.length) {
    const kanjiChar = isKanji(kanji[i]);
    let j = i + 1;
    while (j < kanji.length && isKanji(kanji[j]) === kanjiChar) j++;
    runs.push({ type: kanjiChar ? "kanji" : "kana", text: kanji.slice(i, j) });
    i = j;
  }

  // Strip leading kana run from both sides (they must match).
  let kanaIdx = 0;
  const segs: Segment[] = [];
  for (let r = 0; r < runs.length; r++) {
    const run = runs[r];
    if (run.type === "kana") {
      // consume matching prefix from kana
      kanaIdx += run.text.length;
      segs.push({ base: run.text });
      continue;
    }
    // kanji run: figure out how many kana characters it consumes.
    // It eats everything up to the start of the next kana run (or end).
    const nextKana = runs[r + 1];
    let endIdx: number;
    if (!nextKana) {
      endIdx = kana.length;
    } else {
      // find next occurrence of the next kana run's text after current pos
      const found = kana.indexOf(nextKana.text, kanaIdx + 1);
      endIdx = found === -1 ? kana.length : found;
    }
    const ruby = kana.slice(kanaIdx, endIdx);
    segs.push({ base: run.text, ruby });
    kanaIdx = endIdx;
  }
  return segs;
}
