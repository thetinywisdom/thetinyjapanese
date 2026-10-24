import { describe, it, expect } from "vitest";
import { getKanjiJlpt } from "@/data/kanji-radicals";

/**
 * Anchor checks for the bundled JLPT kanji list. If any of these flip we've
 * broken the classification — regenerate `scripts/jlpt-kanji/n*.txt` from
 * upstream or fix the override file.
 */
describe("kanji JLPT levels", () => {
  const anchors: Array<[string, "N5" | "N4" | "N3" | "N2" | "N1"]> = [
    ["日", "N5"],
    ["人", "N5"],
    ["私", "N4"],
    ["議", "N3"],
    ["違", "N3"],
    ["撮", "N1"],
  ];

  for (const [ch, expected] of anchors) {
    it(`${ch} → ${expected}`, () => {
      expect(getKanjiJlpt(ch)).toBe(expected);
    });
  }
});
