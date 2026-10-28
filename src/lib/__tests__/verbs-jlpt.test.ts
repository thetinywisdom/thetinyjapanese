import { describe, it, expect } from "vitest";
import { VERBS } from "@/data/verbs";

/**
 * Verb rows are the verb slice of words.json (one source of truth).
 * Levels must match the vocabulary list, not a second file.
 */
describe("verb JLPT tagging", () => {
  const byDict = (d: string) => VERBS.find((v) => v.dictionary === d);

  it("tags canonical verbs at their expected level", () => {
    expect(byDict("食べる")?.jlptLevel).toBe("N5");
    expect(byDict("行く")?.jlptLevel).toBe("N5");
    expect(byDict("飲む")?.jlptLevel).toBe("N5");
    expect(byDict("来る")?.jlptLevel).toBe("N5");
    expect(byDict("勉強する")?.jlptLevel).toBe("N5");
    expect(byDict("結婚する")?.jlptLevel).toBe("N5");
    expect(byDict("故障する")?.jlptLevel).toBe("N4");
    expect(byDict("愛する")?.jlptLevel).toBe("N3");
    expect(byDict("見る")?.jlptLevel).toBe("N5");
  });

  it("never produces double-suru entries", () => {
    const dbl = VERBS.filter((v) => v.dictionary.endsWith("するする"));
    expect(dbl).toEqual([]);
  });

  it("keeps the everyday reading and drops the rare homograph", () => {
    const kuru = byDict("来る");
    expect(kuru?.reading).toBe("くる");
    expect(kuru?.jlptLevel).toBe("N5");
    // 来る(きたる) is a prenominal, not a verb to drill (review item 28).
    expect(VERBS.find((v) => v.reading === "きたる")).toBeUndefined();
  });

  it("only emits entries with a JLPT level", () => {
    expect(VERBS.every((v) => v.jlptLevel !== null)).toBe(true);
  });
});
