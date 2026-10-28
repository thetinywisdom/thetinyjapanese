import { describe, it, expect } from "vitest";
import { WORDS } from "@/data/words";
import { buildForms, checkAnswer, type VerbLike } from "../conjugation";

function word(partial: VerbLike): VerbLike {
  return { wordType: "verb", ...partial };
}

const byId = (id: string) => WORDS.find((w) => w.id === id);

describe("native review: polite→plain and vs-s (X1, X7, X8)", () => {
  const takai = word({ reading: "たかい", dictionary: "高い", verbClass: "adj-i", wordType: "adj-i" });

  it("rejects polite i-adjective answers on a plain drill", () => {
    for (const answer of ["たかくないです", "高くありません", "たかくないです。"]) {
      expect(checkAnswer(answer.replace("。", ""), takai, "non-past-negative").correct, answer).toBe(false);
    }
    expect(checkAnswer("たかくなかったです", takai, "past-negative").correct).toBe(false);
    expect(checkAnswer("高くありませんでした", takai, "past-negative").correct).toBe(false);
    expect(checkAnswer("たかくはない", takai, "non-past-negative").note).toBe("also correct");
    expect(checkAnswer("高くはない", takai, "non-past-negative").note).toBe("also correct");
    expect(checkAnswer("たかくはなかった", takai, "past-negative").note).toBe("also correct");
  });

  it("rejects 愛せられる as a potential and accepts 罰せられる as a passive", () => {
    const aisuru = word({
      reading: "あいする", dictionary: "愛する", verbClass: "irregular-suru", pos: ["vs-s"],
    });
    expect(buildForms(aisuru).casual.potential).toBe("あいせる");
    expect(buildForms(aisuru).casual.passive).toBe("あいされる");
    expect(checkAnswer("あいせられる", aisuru, "potential").correct).toBe(false);
    expect(checkAnswer("愛せられる", aisuru, "potential").correct).toBe(false);
    expect(checkAnswer("愛せられる", aisuru, "passive").note).toBe("also correct");

    const bassuru = word({
      reading: "ばっする", dictionary: "罰する", verbClass: "irregular-suru", pos: ["vs-s"],
    });
    expect(buildForms(bassuru).casual.passive).toBe("ばっせられる");
    expect(checkAnswer("罰せられる", bassuru, "passive").correct).toBe(true);
    expect(checkAnswer("ばっされる", bassuru, "passive").note).toBe("also correct");
    expect(checkAnswer("罰せられる", bassuru, "potential").correct).toBe(true);

    const tassuru = word({
      reading: "たっする", dictionary: "達する", verbClass: "irregular-suru", pos: ["vs-s"],
    });
    expect(buildForms(tassuru).casual.passive).toBe("たっせられる");
    expect(checkAnswer("達せられる", tassuru, "passive").correct).toBe(true);
    expect(checkAnswer("たっされる", tassuru, "passive").note).toBe("also correct");

    const nessuru = word({
      reading: "ねっする", dictionary: "熱する", verbClass: "irregular-suru", pos: ["vs-s"],
    });
    expect(checkAnswer("熱せられる", nessuru, "passive").correct).toBe(true);
  });
});

describe("native review: nonexistent forms (X2–X6, G1–G18)", () => {
  it("does not drill a potential that is a different verb", () => {
    const pairs: [string, string][] = [
      ["1586270", "あける"], // 開く(あく) → 開ける
      ["1158880", "ちがえる"], // 違う → 違える
      ["1495740", "つける"], // 付く → 付ける
      ["1457200", "とどける"], // 届く → 届ける
      ["1310640", "やめる"], // 止む → 止める
      ["1606680", "わける"], // 沸く → 分ける
      ["1432710", "いためる"], // 痛む → 痛める
      ["1593410", "こめる"], // 込む → 込める
      ["2849867", "こめる"], // 混む → 込める
    ];
    for (const [id, other] of pairs) {
      const verb = byId(id);
      expect(verb, id).toBeTruthy();
      expect(buildForms(verb!).casual.potential, verb!.dictionary).toBeUndefined();
      expect(buildForms(verb!).casual.imperative, verb!.dictionary).toBeUndefined();
      expect(buildForms(verb!).casual.passive, verb!.dictionary).toBeUndefined();
      expect(buildForms(verb!).casual.causative, verb!.dictionary).toBeUndefined();
      expect(WORDS.some((w) => w.reading === other && w.id !== id), `${verb!.dictionary} → ${other}`).toBe(true);
    }
    const hiraku = byId("1202440")!;
    expect(hiraku.reading).toBe("ひらく");
    expect(buildForms(hiraku).casual.potential).toBe("ひらける");
  });

  it("skips the expanded non-volitional list and keeps なる", () => {
    const full = [
      "1586270", "1158880", "1378690", "1436560", "1307500", "1156800",
      "1296400", "1546640", "1376470", "1199900", "1208020", "1385920",
      "1445790", "1404740", "1602440", "1263120", "1556630", "1350610",
      "1179005", "1195970", "1604550", "1591420", "1223680",
      "1457200", "1314680", "1532910", "1606680",
      "1310640", "1495740", "1432710", "1586265", "1593410", "2849867",
      "1406150", "1226360", "1602380", "1604260", "1259140", "1591150",
      "1314600", "1157510", "1282770", "1215790", "1610160", "1405710",
      "1480080", "1533400", "1540950", "1546610", "1404090", "1437340", "1186740",
      "override-dekiru",
    ];
    for (const id of full) {
      const verb = byId(id);
      expect(verb, id).toBeTruthy();
      const f = buildForms(verb!).casual;
      expect(f.potential, verb!.dictionary).toBeUndefined();
      expect(f.imperative, verb!.dictionary).toBeUndefined();
      expect(f.volitional, verb!.dictionary).toBeUndefined();
      expect(f.passive, verb!.dictionary).toBeUndefined();
      expect(f.causative, verb!.dictionary).toBeUndefined();
      expect(f["te-form"], verb!.dictionary).toBeTruthy();
    }
    const naru = WORDS.find((w) => w.reading === "なる" && w.dictionary !== "鳴る")!;
    expect(buildForms(naru).casual.volitional).toBe("なろう");
    expect(buildForms(naru).casual.potential).toBe("なれる");
    const shikkari = byId("1594400")!;
    expect(buildForms(shikkari).casual.imperative).toBe("しっかりしろ");
  });

  it("keeps the causative allow-list and the partial skips", () => {
    for (const id of ["1606560", "1289590", "1282790", "1457560", "1483740"]) {
      const verb = byId(id)!;
      const f = buildForms(verb).casual;
      expect(f.causative, verb.dictionary).toBeTruthy();
      expect(f.passive, verb.dictionary).toBeUndefined();
      expect(f.potential, verb.dictionary).toBeUndefined();
      expect(f.imperative, verb.dictionary).toBeUndefined();
    }
    expect(buildForms(byId("1606560")!).casual.causative).toBe("わからせる");
    expect(buildForms(byId("1483740")!).casual.causative).toBe("つかれさせる");

    const saku = byId("1297210")!;
    expect(buildForms(saku).casual.causative).toBe("さかせる");
    expect(buildForms(saku).casual.potential).toBeUndefined();
    expect(buildForms(saku).casual.imperative).toBe("さけ");
    expect(buildForms(saku).casual.passive).toBeUndefined();
    expect(buildForms(saku).casual["causative-passive"]).toBeUndefined();

    const owaru = byId("1589600")!;
    expect(buildForms(owaru).casual.passive).toBeUndefined();
    expect(buildForms(owaru).casual.potential).toBe("おわれる");
    expect(buildForms(owaru).casual.causative).toBe("おわらせる");
    expect(buildForms(owaru).casual.imperative).toBe("おわれ");

    const kieru = byId("1350040")!;
    expect(buildForms(kieru).casual.imperative).toBe("きえろ");
    expect(buildForms(kieru).casual.potential).toBe("きえられる");
    expect(buildForms(kieru).casual.volitional).toBe("きえよう");
    expect(buildForms(kieru).casual.causative).toBeUndefined();
    expect(buildForms(kieru).casual.passive).toBeUndefined();
  });

  it("skips humble and honorific commands, and leaves 召し上がれ", () => {
    const keigo = ["1363090", "1362950", "1302070", "1421900", "1236680"];
    for (const id of keigo) {
      const verb = byId(id);
      expect(verb, id).toBeTruthy();
      const f = buildForms(verb!).casual;
      expect(f.imperative, verb!.dictionary).toBeUndefined();
      expect(f.potential, verb!.dictionary).toBeUndefined();
      expect(f.passive, verb!.dictionary).toBeUndefined();
      expect(f.causative, verb!.dictionary).toBeUndefined();
      expect(f.volitional, verb!.dictionary).toBeTruthy();
    }
    for (const id of ["1587290", "1305700", "1472270", "1291270"]) {
      const verb = byId(id)!;
      const f = buildForms(verb).casual;
      expect(f.potential, verb.dictionary).toBeTruthy();
      expect(f.imperative, verb.dictionary).toBeUndefined();
      expect(f.passive, verb.dictionary).toBeUndefined();
      expect(f.causative, verb.dictionary).toBeUndefined();
    }
    expect(buildForms(byId("1363090")!).casual.volitional).toBe("もうそう");
    const meshi = word({ reading: "めしあがる", dictionary: "召し上がる", verbClass: "godan-r" });
    expect(buildForms(meshi).casual.imperative).toBe("めしあがれ");
    expect(buildForms(meshi).casual.potential).toBe("めしあがれる");
    expect(buildForms(meshi).casual.passive).toBeUndefined();
    expect(buildForms(meshi).casual.causative).toBeUndefined();
  });

  it("skips くれる's missing forms and skips 暮れる", () => {
    const kureru = byId("1269130")!;
    const f = buildForms(kureru).casual;
    expect(f.imperative).toBe("くれ");
    expect(f.volitional).toBe("くれよう");
    expect(f.potential).toBeUndefined();
    expect(f.passive).toBeUndefined();
    expect(f.causative).toBeUndefined();
    const kureruEvening = byId("1514960")!;
    expect(kureruEvening.dictionary).toBe("暮れる");
    expect(buildForms(kureruEvening).casual.imperative).toBeUndefined();
    expect(buildForms(kureruEvening).casual.potential).toBeUndefined();
    expect(buildForms(kureruEvening).casual.causative).toBeUndefined();
    expect(buildForms(kureruEvening).casual["te-form"]).toBe("くれて");
  });
});
