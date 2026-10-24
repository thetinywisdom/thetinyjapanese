/** Tiny diff helper for highlighting conjugation changes. */
import { katakanaToHiragana } from "./kana";

export interface PrefixSplit {
  common: string; // taken from `a` (preserves a's casing/script)
  aTail: string;
  bTail: string;
}

/**
 * Split two strings at their first divergent character.
 * Comparison is kana-insensitive (katakana ↔ hiragana treated equal).
 * `common` is sliced from `a` so the original script is preserved on display.
 */
export function splitCommonPrefix(a: string, b: string): PrefixSplit {
  const an = katakanaToHiragana(a);
  const bn = katakanaToHiragana(b);
  let i = 0;
  const max = Math.min(an.length, bn.length);
  while (i < max && an[i] === bn[i]) i++;
  return { common: a.slice(0, i), aTail: a.slice(i), bTail: b.slice(i) };
}
