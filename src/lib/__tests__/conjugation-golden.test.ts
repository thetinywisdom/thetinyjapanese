import { describe, it, expect } from "vitest";
import { WORDS } from "@/data/words";
import { buildForms, supportedQuestions, type QuestionType } from "../conjugation";
import golden from "./conjugation-golden.json";

/**
 * Frozen plain forms for every drilled conjugation of the N5 verbs and
 * adjectives. The expected strings were produced from the engine and still
 * need a native-speaker pass; do not regenerate this file to make a failure
 * go away without checking the Japanese.
 */
describe("N5 conjugation golden file", () => {
  it("covers about 200 core N5 verbs and adjectives", () => {
    expect(golden.length).toBeGreaterThanOrEqual(180);
    expect(golden.length).toBeLessThanOrEqual(220);
    const types = new Set(golden.map((row) => row.wordType));
    expect(types.has("verb")).toBe(true);
    expect(types.has("adj-i")).toBe(true);
    expect(types.has("adj-na")).toBe(true);
  });

  it("matches the engine for every drilled form", () => {
    const mismatches: string[] = [];
    for (const row of golden) {
      const word = WORDS.find((w) => w.id === row.id);
      if (!word) {
        mismatches.push(`missing word ${row.id} ${row.dictionary}`);
        continue;
      }
      const forms = buildForms(word).casual;
      const supported = supportedQuestions(word.wordType, word);
      for (const q of supported) {
        const got = forms[q as QuestionType];
        const expected = (row.casual as Record<string, string>)[q];
        if (got !== expected) mismatches.push(`${row.dictionary} ${q}: ${got} !== ${expected}`);
      }
      for (const q of Object.keys(row.casual)) {
        if (!supported.includes(q as QuestionType)) {
          mismatches.push(`${row.dictionary} ${q} should not be drilled`);
        }
      }
    }
    expect(mismatches.slice(0, 12)).toEqual([]);
  });
});
