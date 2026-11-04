import { describe, expect, it } from "vitest";
import { getKanjiExamples, getVerbExamples } from "@/data/examples";
import { WORDS } from "@/data/words";
import study from "@/data/kanji-study.json";
import { buildRememberCards } from "@/features/kanji-remember/cards";

const N = new Set(["N5", "N4", "N3"]);

describe("phase 3 curated content", () => {
  it("keeps a reviewable N5–N3 list and leaves N2–N1 in place", () => {
    const curated = WORDS.filter((w) => N.has(w.jlptLevel));
    expect(curated.length).toBeGreaterThanOrEqual(1100);
    expect(curated.length).toBeLessThanOrEqual(1400);
    expect(WORDS.filter((w) => w.jlptLevel === "N2").length).toBe(1472);
    expect(WORDS.filter((w) => w.jlptLevel === "N1").length).toBe(2830);
    expect(WORDS.find((w) => w.id === "2842390")).toMatchObject({
      dictionary: "私",
      reading: "わたし",
    });
    expect(WORDS.find((w) => w.id === "1577980")).toMatchObject({
      dictionary: "いる",
      reading: "いる",
      kanjiForm: "居る",
    });
  });

  it("gives every N5–N3 verb a verb gloss and a sentence", () => {
    const bad: string[] = [];
    for (const w of WORDS) {
      if (w.wordType !== "verb" || !N.has(w.jlptLevel)) continue;
      if (!w.meaning.startsWith("to ")) bad.push(`${w.dictionary} ${w.meaning}`);
      const sentences = getVerbExamples(w.id, w.reading);
      if (sentences.length < 1) bad.push(`${w.dictionary} has no sentence`);
      const blob = sentences.map((s) => s.ja).join("");
      const head = [...w.dictionary].find((ch) => ch.charCodeAt(0) >= 0x4e00) ?? w.dictionary[0];
      if (head && !blob.includes(head) && !blob.includes(w.reading.slice(0, 2))) {
        bad.push(`${w.dictionary} sentence misses the word: ${blob}`);
      }
    }
    expect(bad.slice(0, 12)).toEqual([]);
  });

  it("teaches 万, 食, and 校 with learner readings", () => {
    const cards = Object.fromEntries(
      buildRememberCards("jlpt", ["N5", "N4", "N3"]).map((c) => [c.char, c]),
    );
    expect(cards["万"]).toMatchObject({ reading: "まん", meaning: "ten thousand" });
    expect(cards["万"].taught.map((t) => t.kana)).not.toContain("よろず");
    expect(cards["食"]).toMatchObject({ reading: "たべる" });
    expect(cards["食"].meaning).toMatch(/eat/);
    expect(cards["食"].taught.map((t) => t.kana)).not.toContain("くう");
    expect(cards["校"]).toMatchObject({ reading: "こう", meaning: "school" });

    const man = getKanjiExamples("万").map((s) => s.ja).join(" ");
    expect(man).toContain("万");
    expect(man).not.toContain("よろず");
    const food = getKanjiExamples("食").map((s) => s.ja).join(" ");
    expect(food).toContain("食");
    expect(food).not.toContain("食う");
    expect(getKanjiExamples("校").some((s) => s.ja.includes("校"))).toBe(true);
  });

  it("gives every studied N5–N3 kanji a sentence that contains it", () => {
    const missing: string[] = [];
    for (const [ch, info] of Object.entries(study.kanji)) {
      if (!info.primary) missing.push(`${ch} has no primary reading`);
      const sentences = getKanjiExamples(ch);
      if (sentences.length < 1) missing.push(`${ch} has no sentence`);
      else if (!sentences.some((s) => s.ja.includes(ch))) missing.push(`${ch} sentence lacks the character`);
    }
    expect(missing.slice(0, 12)).toEqual([]);
    expect(Object.keys(study.kanji).length).toBeGreaterThanOrEqual(600);
  });
});
