import { describe, expect, it } from "vitest";
import { VERBS } from "@/data/verbs";
import { WORDS, displayHeadword } from "@/data/words";
import { buildForms, supportedQuestions } from "@/lib/conjugation";
import { buildRememberCards, readingDistractorAllowed } from "@/features/kanji-remember/cards";
import examples from "@/data/examples.json";

const cards = Object.fromEntries(
  buildRememberCards("jlpt", ["N5", "N4", "N3"]).map((c) => [c.char, c]),
);

function taught(char: string, kana: string) {
  return cards[char].taught.find((r) => r.kana === kana);
}

describe("teacher review: kanji quiz readings", () => {
  it("teaches the corrected primary and anchor", () => {
    expect(cards["伝"].reading).toBe("つたえる");
    expect(taught("伝", "でん")?.anchor).toBe("伝統");
    expect(cards["伝"].taught.map((r) => r.kana)).not.toContain("つだう");

    expect(taught("行", "ぎょう")).toMatchObject({ anchor: "行事", anchorReading: "ぎょうじ" });
    expect(cards["言"].reading).toBe("いう");
    expect(cards["守"].reading).toBe("まもる");
    expect(taught("守", "す")?.anchor).toBe("留守");

    expect(cards["好"].reading).toBe("すき");
    expect(taught("好", "すき")?.anchor).toBe("好き");
    expect(cards["速"].reading).toBe("はやい");
    expect(taught("速", "はやい")?.anchor).toBe("速い");
    expect(taught("速", "そく")).toMatchObject({ anchor: "速度", anchorReading: "そくど" });
  });

  it("never offers わたくし, いちにん, ににん, or いえ against うち", () => {
    expect(readingDistractorAllowed("わたし", "わたくし")).toBe(false);
    expect(readingDistractorAllowed("ひとり", "いちにん")).toBe(false);
    expect(readingDistractorAllowed("ふたり", "ににん")).toBe(false);
    expect(readingDistractorAllowed("いえ", "うち")).toBe(false);
    expect(readingDistractorAllowed("うち", "いえ")).toBe(false);
    expect(readingDistractorAllowed("いえ", "か")).toBe(true);
    expect(cards["私"].reading).toBe("わたし");
    expect(taught("私", "わたくし")?.note).toMatch(/formal/);
  });
});

describe("teacher review: noun＋する", () => {
  const noun = (id: string) => WORDS.find((w) => w.id === id)!;

  it("stores 勉強 and the corrected nouns, and does not conjugate them as verbs", () => {
    const study = noun("1512670");
    expect(study).toMatchObject({ dictionary: "勉強", reading: "べんきょう", wordType: "noun", suru: true });
    expect(displayHeadword(study)).toBe("勉強（する）");
    expect(buildForms(study).polite["non-past-affirmative"]).toBe("べんきょうです");
    expect(supportedQuestions(study.wordType, study)).not.toContain("potential");

    expect(noun("1156530")).toMatchObject({ dictionary: "意見", wordType: "noun", meaning: "opinion" });
    expect(noun("1228690")).toMatchObject({ dictionary: "急行", wordType: "noun", meaning: "express (train)" });
    expect(noun("1444980")).toMatchObject({ dictionary: "都合", wordType: "noun", meaning: "convenience; circumstances" });
    expect(noun("1599340")).toMatchObject({ dictionary: "泥棒", wordType: "noun", meaning: "thief" });

    for (const head of ["勉強する", "意見する", "急行する", "都合する", "泥棒する"]) {
      expect(VERBS.find((v) => v.dictionary === head), head).toBeUndefined();
    }
  });

  it("ships no template sentences", () => {
    const blob = JSON.stringify(examples);
    expect(blob).not.toContain("今日は会います");
    expect(blob).not.toContain("昨日会いました");
    expect(blob).not.toContain("卵を十買いました");
  });
});
