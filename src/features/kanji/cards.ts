import { VERBS, type VerbEntry, type JlptLevel } from "@/data/verbs";
import { getKanjiGrade, type SchoolGrade } from "@/data/kanji-radicals";
import type { LevelScheme } from "@/lib/kanji-levels";

/** A verb whose dictionary form contains kanji is a kanji-recognition card. */
function hasKanji(s: string): boolean {
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 0x4e00 && c <= 0x9fff) return true;
  }
  return false;
}

/**
 * Highest grade number = hardest school year.
 * Kanji with no grade (non-jōyō / rare) are treated as the hardest bucket (8)
 * so a word like 「一寸」 never leaks into a grade-1 session.
 */
export function hardestGrade(word: string): SchoolGrade | null {
  let worst: number | null = null;
  let sawKanji = false;
  for (const ch of word) {
    const c = ch.charCodeAt(0);
    if (c < 0x4e00 || c > 0x9fff) continue;
    sawKanji = true;
    const g = getKanjiGrade(ch) ?? 8;
    if (worst === null || g > worst) worst = g;
  }
  return sawKanji ? (worst as SchoolGrade) : null;
}

export interface KanjiCardSource {
  id: string;
  kanji: string;
  reading: string;
  meaning: string;
  jlptLevel: JlptLevel;
  /** Effective level under the scheme used to build this card (display only). */
  schemeLevel: JlptLevel | SchoolGrade;
  verb: VerbEntry;
}

export function buildKanjiCards(
  scheme: LevelScheme,
  levels: readonly (JlptLevel | SchoolGrade)[],
): KanjiCardSource[] {
  const set = new Set<JlptLevel | SchoolGrade>(levels);
  const out: KanjiCardSource[] = [];
  for (const v of VERBS) {
    if (!hasKanji(v.dictionary)) continue;
    // JLPT: the vocabulary tag, so ぶら下げる (N1) is not badged N5 just
    // because 下 is an N5 kanji. Grades still follow the hardest character.
    const effective = scheme === "jlpt" ? v.jlptLevel : hardestGrade(v.dictionary);
    if (!effective || !set.has(effective)) continue;
    out.push({
      id: v.id,
      kanji: v.dictionary,
      reading: v.reading,
      meaning: v.meaning,
      jlptLevel: v.jlptLevel ?? "N1",
      schemeLevel: effective,
      verb: v,
    });
  }
  return out;
}
