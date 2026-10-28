import { WORDS, type JlptLevel, type WordEntry } from "@/data/words";

export type { JlptLevel };

/**
 * Verb rows are the `wordType: "verb"` slice of `words.json`.
 * Practice and progress share one id, one JLPT tag, and one gloss.
 * `verbs.json` is not read at runtime (see scripts/content-overrides.mjs).
 */
export interface VerbEntry extends WordEntry {
  wordType: "verb";
}

export const VERBS: VerbEntry[] = WORDS.filter((w): w is VerbEntry => w.wordType === "verb");

export function verbStats() {
  const byLevel: Record<string, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
  const byClass: Record<string, number> = { ichidan: 0, godan: 0, "irregular-suru": 0, "irregular-kuru": 0 };
  for (const v of VERBS) {
    if (v.jlptLevel) byLevel[v.jlptLevel]++;
    const k = v.verbClass.startsWith("godan-") ? "godan" : v.verbClass;
    byClass[k] = (byClass[k] ?? 0) + 1;
  }
  return { total: VERBS.length, byLevel, byClass };
}
