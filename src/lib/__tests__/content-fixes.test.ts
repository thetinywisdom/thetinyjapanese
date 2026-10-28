import { describe, it, expect } from "vitest";
import { needsSenseCue, WORDS } from "@/data/words";
import { BANNED_JA, REPLACEMENTS } from "../../../scripts/example-overrides.mjs";
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
    expect(byDict("意見する")?.meaning).toBe("to admonish; to give (someone) a talking-to");
    expect(byDict("試験する")?.meaning).toBe("to test; to examine (something)");
    expect(byDict("優勝する")?.meaning).toBe("to win the championship");
    expect(byDict("学習する")?.meaning).toBe("to study; to learn");
    expect(byDict("集中する")?.meaning).toBe("to concentrate");
    expect(byDict("退屈する")?.meaning).toBe("to feel bored; to get bored (with)");
    expect(byDict("ゆっくりする")?.meaning).toBe("to take one's time; to relax");
    expect(byDict("ほっとする")?.meaning).toBe("to feel relieved");
    expect(byDict("差す")?.meaning).toBe("to put up (an umbrella); to shine (of light)");
    expect(byDict("渡す")?.meaning).toBe("to hand over; to give");
    expect(byDict("大丈夫")?.meaning).toBe("all right; OK; fine");
    for (const w of WORDS.filter((e) => e.verbClass === "irregular-suru")) {
      expect(w.meaning, `${w.dictionary} ${w.meaning}`).toMatch(/^(to |\(する\) )/);
      expect(w.meaning, w.dictionary).not.toMatch(/^to (overall|learning|concentration|slowly|tedious|with )/);
    }
  });

  it("tags the reviewed core N5 words and moves the misfits", () => {
    expect(byDict("見る")?.jlptLevel).toBe("N5");
    expect(byDict("なる", "なる")).toMatchObject({ jlptLevel: "N5", dictionary: "なる" });
    expect(byDict("もらう", "もらう")?.jlptLevel).toBe("N5");
    expect(byDict("やる", "やる")?.jlptLevel).toBe("N5");
    expect(byDict("つける", "つける")?.jlptLevel).toBe("N5");
    expect(WORDS.filter((w) => w.dictionary === "つける" && w.reading === "つける")).toHaveLength(2);
    expect(byDict("かける", "かける")?.jlptLevel).toBe("N5");
    expect(byDict("かかる", "かかる")?.jlptLevel).toBe("N5");
    expect(byDict("履く")?.jlptLevel).toBe("N5");
    expect(byDict("被る")?.jlptLevel).toBe("N5");
    expect(byDict("浴びる")?.jlptLevel).toBe("N5");
    expect(byDict("張る")?.jlptLevel).toBe("N5");
    expect(byDict("丸い")?.jlptLevel).toBe("N5");
    expect(byDict("まずい", "まずい")?.jlptLevel).toBe("N5");
    expect(byDict("登る", "のぼる")).toMatchObject({ jlptLevel: "N5", verbClass: "godan-r" });
    expect(byDict("上る", "のぼる")?.jlptLevel).toBe("N4");
    expect(byDict("きれい", "きれい")).toMatchObject({ wordType: "adj-na", jlptLevel: "N5" });
    expect(byDict("マッチする")?.jlptLevel).toBe("N3");
    expect(byDict("びっくりする")?.jlptLevel).toBe("N4");
    expect(byDict("しっかりする")?.jlptLevel).toBe("N3");
    expect(byDict("受け付ける")?.jlptLevel).toBe("N3");
    expect(byDict("お茶する")?.jlptLevel).toBe("N4");
    expect(byDict("作文する")?.jlptLevel).toBe("N5");
    expect(byDict("授業する")?.jlptLevel).toBe("N5");
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

  it("keeps two allowed sentences on every reviewed card", () => {
    for (const [key, list] of Object.entries(REPLACEMENTS)) {
      expect(list.length, key).toBeGreaterThanOrEqual(2);
      for (const sentence of list) {
        expect(BANNED_JA.has(sentence.ja), `${key} ${sentence.ja}`).toBe(false);
      }
    }
    const cases: [string, string, string][] = [
      ["解く", "とく", "この問題はもう解いた。"],
      ["退く", "どく", "そこをどいてください。"],
      ["違える", "ちがえる", "寝ている間に首の筋を違えた。"],
      ["打つ", "うつ", "ボールを打つ。"],
      ["飛ぶ", "とぶ", "飛行機が空を飛んでいる。"],
      ["返す", "かえす", "本を図書館に返した。"],
    ];
    for (const [dictionary, reading, line] of cases) {
      const entry = byDict(dictionary, reading)!;
      const sentences = getVerbExamples(entry.id, entry.reading);
      expect(sentences.length, dictionary).toBeGreaterThanOrEqual(2);
      expect(sentences.map((s) => s.ja)).toContain(line);
      expect(sentences.every((s) => !BANNED_JA.has(s.ja))).toBe(true);
    }
    const hodoku = byDict("解く", "ほどく")!;
    expect(getVerbExamples(hodoku.id, hodoku.reading).map((s) => s.ja).join(" ")).toContain("ほど");
    expect(needsSenseCue("つける", "つける")).toBe(true);
    expect(needsSenseCue("かける", "かける")).toBe(false);
  });
});
