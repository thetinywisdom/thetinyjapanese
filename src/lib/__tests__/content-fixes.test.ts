import { describe, it, expect } from "vitest";
import { WORDS } from "@/data/words";
import { VERBS } from "@/data/verbs";
import { getKanjiExamples, getVerbExamples } from "@/data/examples";
import examples from "@/data/examples.json";

const byDict = (dictionary: string, reading?: string) =>
  WORDS.find((w) => w.dictionary === dictionary && (reading === undefined || w.reading === reading));

describe("checked-in word overrides", () => {
  it("uses one verb list, taken from words.json", () => {
    const verbIds = new Set(WORDS.filter((w) => w.wordType === "verb").map((w) => w.id));
    expect(VERBS.map((v) => v.id)).toEqual([...verbIds]);
    expect(byDict("勉強する")?.jlptLevel).toBe("N5");
    expect(byDict("故障する")?.jlptLevel).toBe("N4");
    expect(VERBS.find((v) => v.dictionary === "勉強する")?.jlptLevel).toBe("N5");
    expect(VERBS.find((v) => v.dictionary === "故障する")?.jlptLevel).toBe("N4");
  });

  it("fixes the reviewed headwords", () => {
    expect(byDict("ある", "ある")).toMatchObject({ jlptLevel: "N5", wordType: "verb" });
    expect(byDict("する", "する")?.jlptLevel).toBe("N5");
    expect(byDict("くれる", "くれる")?.jlptLevel).toBe("N5");
    expect(byDict("できる", "できる")).toMatchObject({ jlptLevel: "N5", verbClass: "ichidan" });
    expect(byDict("出切る")).toBeUndefined();
    expect(byDict("がる")).toBeUndefined();
    expect(byDict("どうぞする")).toBeUndefined();
    expect(byDict("帽子する")).toBeUndefined();
    expect(byDict("受付する")).toBeUndefined();
    expect(byDict("将来する")).toBeUndefined();
    expect(WORDS.find((w) => w.reading === "きたる")).toBeUndefined();
    expect(byDict("易い")).toBeUndefined();
    expect(byDict("暇", "ひま")).toMatchObject({ wordType: "adj-na", jlptLevel: "N5" });
    expect(byDict("終わる")?.jlptLevel).toBe("N5");
    expect(byDict("曲がる")?.jlptLevel).toBe("N5");
    expect(byDict("上がる")?.jlptLevel).toBe("N5");
    expect(byDict("明るい")?.jlptLevel).toBe("N5");
    expect(byDict("美味しい")?.meaning.startsWith("delicious") || byDict("美味しい")?.meaning.startsWith("to ")).toBeTruthy();
    expect(byDict("美味しい")?.jlptLevel).toBe("N5");
    expect(byDict("うるさい", "うるさい")?.dictionary).toBe("うるさい");
    expect(byDict("広々とする", "ひろびろとする")?.reading).toBe("ひろびろとする");
    expect(byDict("留守にする", "るすにする")?.dictionary).toBe("留守にする");
    expect(byDict("勉強する")?.meaning).toBe("to study");
    expect(byDict("結婚する")?.meaning.startsWith("to ")).toBe(true);
    for (const w of WORDS.filter((e) => e.verbClass === "irregular-suru" && (e.jlptLevel === "N5" || e.jlptLevel === "N4"))) {
      expect(w.meaning.startsWith("to "), `${w.dictionary} ${w.meaning}`).toBe(true);
    }
  });

  it("keys examples by id and reading and drops banned sentences", () => {
    const blob = JSON.stringify(examples);
    expect(blob.includes("気違い")).toBe(false);
    expect(blob.includes("色盲")).toBe(false);
    expect(blob.includes("持ち物をまとめなさい")).toBe(false);
    const aku = byDict("開く", "あく")!;
    const hiraku = byDict("開く", "ひらく")!;
    const akuEx = getVerbExamples(aku.id, aku.reading).map((s) => s.ja).join(" ");
    const hirakuEx = getVerbExamples(hiraku.id, hiraku.reading).map((s) => s.ja).join(" ");
    expect(akuEx).toContain("ドア");
    expect(hirakuEx).not.toContain("ドアが開いた");
    expect(getVerbExamples(aku.id, aku.reading)).not.toEqual(getVerbExamples(hiraku.id, hiraku.reading));
    const kuguru = WORDS.find((w) => w.reading === "くぐる")!;
    const kuguruJa = getVerbExamples(kuguru.id, kuguru.reading).map((s) => s.ja).join(" ");
    expect(kuguruJa).toContain("くぐ");
    expect(kuguruJa).not.toContain("もぐ");
    expect(getKanjiExamples("色").some((s) => s.ja.includes("色盲"))).toBe(false);
    expect(getKanjiExamples("色").length).toBeGreaterThan(0);
  });
});
