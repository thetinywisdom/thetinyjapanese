import { describe, it, expect } from "vitest";
import { VERBS } from "@/data/verbs";

/**
 * Sanity checks on the generated verbs.json.
 * These guard against regressions in scripts/build-verbs.ts (suru-noun lookup,
 * double-suru suffixing, homograph collisions, JLPT cache normalization).
 */
describe("verbs.json JLPT tagging", () => {
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
    expect(byDict("見る")?.jlptLevel).toBe("N3"); // matches upstream cache
  });

  it("never produces double-suru entries", () => {
    const dbl = VERBS.filter((v) => v.dictionary.endsWith("するする"));
    expect(dbl).toEqual([]);
  });

  it("disambiguates homographs by appending the reading", () => {
    // 来る has two readings: くる (N5) and きたる (N1). Canonical = N5.
    const kuru = byDict("来る");
    expect(kuru?.reading).toBe("くる");
    const kitaru = byDict("来る(きたる)");
    expect(kitaru?.jlptLevel).toBe("N1");
  });

  it("only emits entries with a JLPT level", () => {
    expect(VERBS.every((v) => v.jlptLevel !== null)).toBe(true);
  });
});
