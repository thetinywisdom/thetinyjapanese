import { describe, it, expect } from "vitest";
import { buildKanjiCards } from "@/features/kanji/cards";
import { buildRememberCards } from "@/features/kanji-remember/cards";
import { eligibleWords, wordLevelKey, type Filters } from "@/features/study/SessionContext";
import { JLPT_LEVELS, SCHOOL_GRADES } from "@/lib/kanji-levels";
import { getKanjiJlpt, getKanjiGrade } from "@/data/kanji-radicals";
import { ALL_QUESTION_TYPES } from "@/lib/conjugation";
import type { JlptLevel } from "@/data/words";
import type { SchoolGrade } from "@/data/kanji-radicals";

const JLPT_RANK = new Map(JLPT_LEVELS.map((l, i) => [l, i]));

function kanjiOf(word: string): string[] {
  return [...word].filter((ch) => {
    const c = ch.charCodeAt(0);
    return c >= 0x4e00 && c <= 0x9fff;
  });
}

/** every non-empty subset of a list (levels are multi-select) */
function subsets<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let mask = 1; mask < 1 << items.length; mask++) {
    out.push(items.filter((_, i) => mask & (1 << i)));
  }
  return out;
}

describe("kanji practice level filters", () => {
  it("never surfaces a kanji harder than the selected JLPT levels", () => {
    const bad: string[] = [];
    for (const levels of subsets(JLPT_LEVELS)) {
      const maxRank = Math.max(...levels.map((l) => JLPT_RANK.get(l)!));
      for (const card of buildKanjiCards("jlpt", levels)) {
        if (!levels.includes(card.schemeLevel as JlptLevel)) {
          bad.push(`${card.kanji} bucket ${card.schemeLevel} in ${levels.join("+")}`);
        }
        for (const ch of kanjiOf(card.kanji)) {
          const lv = getKanjiJlpt(ch) ?? "N1";
          if (JLPT_RANK.get(lv)! > maxRank) {
            bad.push(`${card.kanji} (${lv} kanji ${ch}) in ${levels.join("+")}`);
          }
        }
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it("never surfaces a kanji above the selected school grades", () => {
    const bad: string[] = [];
    for (const levels of subsets(SCHOOL_GRADES)) {
      const maxGrade = Math.max(...levels);
      for (const card of buildKanjiCards("grade", levels)) {
        if (!levels.includes(card.schemeLevel as SchoolGrade)) {
          bad.push(`${card.kanji} bucket ${card.schemeLevel} in ${levels.join("+")}`);
        }
        for (const ch of kanjiOf(card.kanji)) {
          const g = getKanjiGrade(ch) ?? 8;
          if (g > maxGrade) bad.push(`${card.kanji} (grade ${g} kanji ${ch}) in ${levels.join("+")}`);
        }
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it("remember cards match the selected levels exactly", () => {
    const bad: string[] = [];
    for (const levels of subsets(JLPT_LEVELS)) {
      for (const c of buildRememberCards("jlpt", levels)) {
        if (!levels.includes(c.jlptLevel)) bad.push(`${c.char} ${c.jlptLevel}`);
      }
    }
    for (const levels of subsets(SCHOOL_GRADES)) {
      for (const c of buildRememberCards("grade", levels)) {
        if (c.grade === undefined || !levels.includes(c.grade)) bad.push(`${c.char} ${c.grade}`);
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});

const BASE: Filters = {
  scheme: "jlpt",
  levels: ["N5"],
  wordTypes: ["verb", "noun", "adj-i", "adj-na"],
  classes: ["ichidan", "godan", "irregular-suru", "irregular-kuru"],
  questions: [...ALL_QUESTION_TYPES],
  sessionLength: 20,
  showFurigana: true,
  showMeaning: true,
};

describe("conjugation practice level filters", () => {
  it("keeps every word within the selected JLPT levels (vocab tag and kanji)", () => {
    const bad: string[] = [];
    for (const levels of subsets(JLPT_LEVELS)) {
      const maxRank = Math.max(...levels.map((l) => JLPT_RANK.get(l)!));
      for (const w of eligibleWords({ ...BASE, scheme: "jlpt", levels })) {
        if (!levels.includes(wordLevelKey(w, "jlpt") as JlptLevel)) {
          bad.push(`${w.dictionary} bucket in ${levels.join("+")}`);
        }
        if (w.jlptLevel && JLPT_RANK.get(w.jlptLevel)! > maxRank) {
          bad.push(`${w.dictionary} vocab ${w.jlptLevel} in ${levels.join("+")}`);
        }
        for (const ch of kanjiOf(w.dictionary)) {
          const lv = getKanjiJlpt(ch) ?? "N1";
          if (JLPT_RANK.get(lv)! > maxRank) {
            bad.push(`${w.dictionary} (${lv} kanji ${ch}) in ${levels.join("+")}`);
          }
        }
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it("keeps every word within the selected school grades", () => {
    const bad: string[] = [];
    for (const levels of subsets(SCHOOL_GRADES)) {
      const maxGrade = Math.max(...levels);
      for (const w of eligibleWords({ ...BASE, scheme: "grade", levels })) {
        for (const ch of kanjiOf(w.dictionary)) {
          const g = getKanjiGrade(ch) ?? 8;
          if (g > maxGrade) bad.push(`${w.dictionary} grade ${g} in ${levels.join("+")}`);
        }
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it("respects word-type and verb-class filters", () => {
    for (const wt of BASE.wordTypes) {
      const out = eligibleWords({ ...BASE, levels: [...JLPT_LEVELS], wordTypes: [wt] });
      expect(out.every((w) => w.wordType === wt)).toBe(true);
    }
    const ichidan = eligibleWords({
      ...BASE,
      levels: [...JLPT_LEVELS],
      wordTypes: ["verb"],
      classes: ["ichidan"],
    });
    expect(ichidan.length).toBeGreaterThan(0);
    expect(ichidan.every((w) => w.verbClass === "ichidan")).toBe(true);
  });

  it("has a usable pool for each single level in both schemes", () => {
    for (const l of JLPT_LEVELS) {
      expect(eligibleWords({ ...BASE, scheme: "jlpt", levels: [l] }).length).toBeGreaterThan(0);
    }
    for (const g of SCHOOL_GRADES) {
      expect(eligibleWords({ ...BASE, scheme: "grade", levels: [g] }).length).toBeGreaterThan(0);
    }
  });
});
