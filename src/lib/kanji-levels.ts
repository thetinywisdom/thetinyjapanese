/**
 * Shared classification helpers for kanji.
 *
 * We support two schemes side-by-side:
 *
 *  - **JLPT** — the foreign-learner standard (N5 easy → N1 hardest). Sourced from
 *    a bundled community list (`scripts/jlpt-kanji/n{1..5}.txt`, 2211 kanji total)
 *    in scripts/build-kanji-radicals.ts. Kanji outside the list bucket into N1.
 *  - **School grade** — the Japanese school / Kanken classification (grade 1 = first
 *    year of elementary, grade 6 = sixth year, grade 8 = remaining jōyō, grade 9–10
 *    = jinmeiyō). Sourced from kanjidic2's `<grade>` field.
 *
 * Chip tooltips label each grade with the nearest Kanken level
 * (grade 1 → 10 … grade 6 → 5, grade 8 → 4–3). The wording lives in
 * src/content/learner-copy.ts so a teacher can revise it in one place.
 */
import type { JlptLevel } from "@/data/verbs";
import type { SchoolGrade } from "@/data/kanji-radicals";
import { getKanjiJlpt, getKanjiGrade } from "@/data/kanji-radicals";
import { kankenLevelShort } from "@/content/learner-copy";

export type LevelScheme = "jlpt" | "grade";

export const JLPT_LEVELS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

/** Grades we expose (jinmeiyō 9/10 omitted — almost never tested). */
export const SCHOOL_GRADES: SchoolGrade[] = [1, 2, 3, 4, 5, 6, 8];

/** School-year label. The Kanken nickname is `kankenChipLabel`. */
export function gradeLabel(g: SchoolGrade): string {
  return `Grade ${g}`;
}

export function gradeShort(g: SchoolGrade): string {
  return kankenLevelShort[g] ?? String(g);
}

export function gradeDescription(g: SchoolGrade): string {
  if (g >= 1 && g <= 6) return `Elementary year ${g}`;
  if (g === 8) return "Junior high / high school (jōyō)";
  return "Name-use (jinmeiyō)";
}

/** Does this kanji match the active scheme + selected levels? */
export function kanjiMatchesLevel(
  char: string,
  scheme: LevelScheme,
  levels: readonly (JlptLevel | SchoolGrade)[],
): boolean {
  if (scheme === "jlpt") {
    // Kanji outside the JLPT 2211 list (rare / non-jōyō) bucket into N1.
    const lv = getKanjiJlpt(char) ?? "N1";
    return (levels as JlptLevel[]).includes(lv);
  }
  const g = getKanjiGrade(char);
  return g ? (levels as SchoolGrade[]).includes(g) : false;
}

/** Default selection when the user first opens a scheme. */
export function defaultLevelsFor(scheme: LevelScheme): (JlptLevel | SchoolGrade)[] {
  return scheme === "jlpt" ? ["N5"] : [1];
}
