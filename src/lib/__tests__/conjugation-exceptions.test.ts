import { describe, it, expect } from "vitest";
import {
  buildForms,
  checkAnswer,
  isNonVolitional,
  questionLabel,
  supportedQuestions,
  type VerbLike,
} from "../conjugation";

function word(partial: VerbLike): VerbLike {
  return { wordType: "verb", ...partial };
}

describe("conjugation exceptions", () => {
  it("does not strip な from nouns or na-adjectives", () => {
    const sakana = word({ reading: "さかな", dictionary: "魚", verbClass: "noun", wordType: "noun" });
    expect(buildForms(sakana).casual["non-past-affirmative"]).toBe("さかなだ");
    expect(buildForms(sakana).polite["non-past-affirmative"]).toBe("さかなです");
    const hana = word({ reading: "はな", dictionary: "花", verbClass: "noun", wordType: "noun" });
    expect(buildForms(hana).casual["non-past-negative"]).toBe("はなじゃない");
    const otona = word({ reading: "おとな", dictionary: "大人", verbClass: "adj-na", wordType: "adj-na" });
    expect(buildForms(otona).polite["non-past-affirmative"]).toBe("おとなです");
    expect(buildForms(otona).casual["provisional-eba"]).toBe("おとななら");
  });

  it("conjugates ある as ない / なかった and skips impossible forms", () => {
    const aru = word({ reading: "ある", dictionary: "ある", verbClass: "godan-r", pos: ["v5r-i"] });
    const f = buildForms(aru).casual;
    expect(f["non-past-negative"]).toBe("ない");
    expect(f["past-negative"]).toBe("なかった");
    expect(f["past-affirmative"]).toBe("あった");
    expect(f["te-form"]).toBe("あって");
    expect(f.potential).toBeUndefined();
    expect(f.imperative).toBeUndefined();
    expect(f.volitional).toBeUndefined();
    expect(f["causative-passive"]).toBeUndefined();
    expect(supportedQuestions("verb", aru)).not.toContain("potential");
  });

  it("uses くれ for くれる and くれろ for 暮れる", () => {
    const kureru = word({ reading: "くれる", dictionary: "くれる", verbClass: "ichidan", pos: ["v1-s"] });
    expect(buildForms(kureru).casual.imperative).toBe("くれ");
    const kureruKanji = word({ reading: "くれる", dictionary: "呉れる", verbClass: "ichidan", pos: ["v1-s"] });
    expect(buildForms(kureruKanji).casual.imperative).toBe("くれ");
    const kureruEvening = word({ reading: "くれる", dictionary: "暮れる", verbClass: "ichidan", pos: ["v1"] });
    expect(buildForms(kureruEvening).casual.imperative).toBe("くれろ");
  });

  it("conjugates vs-s potential and imperative", () => {
    const aisuru = word({
      reading: "あいする", dictionary: "愛する", verbClass: "irregular-suru", pos: ["vs-s"],
    });
    expect(buildForms(aisuru).casual.potential).toBe("あいせる");
    expect(buildForms(aisuru).casual.imperative).toBe("あいせよ");
    expect(checkAnswer("あいすることができる", aisuru, "potential").correct).toBe(true);
    expect(checkAnswer("愛することができる", aisuru, "potential").correct).toBe(true);
    expect(checkAnswer("あいせられる", aisuru, "potential").note).toBe("also correct");
    expect(checkAnswer("あいしろ", aisuru, "imperative").note).toBe("also correct");

    const tassuru = word({
      reading: "たっする", dictionary: "達する", verbClass: "irregular-suru", pos: ["vs-s"],
    });
    expect(buildForms(tassuru).casual.potential).toBe("たっせられる");
    expect(buildForms(tassuru).casual.imperative).toBe("たっせよ");
    expect(checkAnswer("達せられる", tassuru, "potential").correct).toBe(true);
    expect(checkAnswer("たっすることができる", tassuru, "potential").correct).toBe(true);

    const benkyo = word({
      reading: "べんきょうする", dictionary: "勉強する", verbClass: "irregular-suru", pos: ["vs"],
    });
    expect(buildForms(benkyo).casual.potential).toBe("べんきょうできる");
    expect(buildForms(benkyo).casual.imperative).toBe("べんきょうしろ");
  });

  it("skips impossible forms for non-volitional and keigo verbs", () => {
    const cases: VerbLike[] = [
      word({ reading: "わかる", dictionary: "分かる", verbClass: "godan-r" }),
      word({ reading: "みえる", dictionary: "見える", verbClass: "ichidan" }),
      word({ reading: "きこえる", dictionary: "聞こえる", verbClass: "ichidan" }),
      word({ reading: "いる", dictionary: "要る", verbClass: "godan-r" }),
      word({ reading: "できる", dictionary: "できる", verbClass: "ichidan" }),
      word({ reading: "にる", dictionary: "似る", verbClass: "ichidan" }),
      word({ reading: "ことなる", dictionary: "異なる", verbClass: "godan-r" }),
      word({ reading: "はれる", dictionary: "晴れる", verbClass: "ichidan" }),
      word({ reading: "くもる", dictionary: "曇る", verbClass: "godan-r" }),
      word({ reading: "ふる", dictionary: "降る", verbClass: "godan-r" }),
      word({ reading: "こまる", dictionary: "困る", verbClass: "godan-r" }),
    ];
    for (const verb of cases) {
      expect(isNonVolitional(verb)).toBe(true);
      const f = buildForms(verb).casual;
      expect(f.potential, verb.dictionary).toBeUndefined();
      expect(f.imperative, verb.dictionary).toBeUndefined();
      expect(f.volitional, verb.dictionary).toBeUndefined();
      expect(f["causative-passive"], verb.dictionary).toBeUndefined();
      expect(f["non-past-affirmative"], verb.dictionary).toBe(verb.reading);
    }
    const iru = word({ reading: "いる", dictionary: "いる", verbClass: "ichidan" });
    expect(isNonVolitional(iru)).toBe(false);
    expect(buildForms(iru).casual.imperative).toBe("いろ");

    const zonjiru = word({ reading: "ぞんじる", dictionary: "存じる", verbClass: "ichidan" });
    expect(buildForms(zonjiru).casual.imperative).toBeUndefined();
    expect(buildForms(zonjiru).casual.potential).toBeUndefined();
    expect(buildForms(zonjiru).casual["te-form"]).toBe("ぞんじて");
    const oideninaru = word({
      reading: "おいでになる", dictionary: "お出でになる", verbClass: "godan-r",
    });
    expect(buildForms(oideninaru).casual.imperative).toBeUndefined();
    expect(buildForms(oideninaru).casual["non-past-negative"]).toBe("おいでにならない");
  });

  it("accepts alternative answers and notes the colloquial ones", () => {
    const nomu = word({ reading: "のむ", dictionary: "飲む", verbClass: "godan-m" });
    const short = checkAnswer("飲まされる", nomu, "causative-passive");
    expect(short.correct).toBe(true);
    expect(short.note).toBe("also correct");
    expect(checkAnswer("のまされる", nomu, "causative-passive").correct).toBe(true);
    expect(buildForms(nomu).casual["causative-passive"]).toBe("のませられる");

    const hanasu = word({ reading: "はなす", dictionary: "話す", verbClass: "godan-s" });
    expect(checkAnswer("はなされる", hanasu, "causative-passive").correct).toBe(false);
    expect(checkAnswer("話さされる", hanasu, "causative-passive").correct).toBe(false);
    expect(checkAnswer("話させられる", hanasu, "causative-passive").correct).toBe(true);

    const sakana = word({ reading: "さかな", dictionary: "魚", verbClass: "noun", wordType: "noun" });
    expect(checkAnswer("さかなではない", sakana, "non-past-negative").note).toBe("also correct");
    expect(checkAnswer("さかなであれば", sakana, "provisional-eba").note).toBe("also correct");

    const takai = word({ reading: "たかい", dictionary: "高い", verbClass: "adj-i", wordType: "adj-i" });
    expect(checkAnswer("たかくないです", takai, "non-past-negative").note).toBe("also correct");
    expect(checkAnswer("高くありません", takai, "non-past-negative").note).toBe("also correct");
    expect(checkAnswer("たかくない", takai, "non-past-negative").note).toBeUndefined();

    const taberu = word({ reading: "たべる", dictionary: "食べる", verbClass: "ichidan" });
    const ranuki = checkAnswer("食べれる", taberu, "potential");
    expect(ranuki.correct).toBe(true);
    expect(ranuki.note).toBe("colloquial; written: 食べられる");
    expect(checkAnswer("たべられる", taberu, "potential").note).toBeUndefined();
  });

  it("labels polite prompts and the copula conditional", () => {
    expect(questionLabel("non-past-affirmative")).toBe("Non-past affirmative · Polite → plain");
    expect(questionLabel("provisional-eba", "verb")).toBe("Provisional ば");
    expect(questionLabel("provisional-eba", "noun")).toBe("Conditional (ば/なら)");
    expect(questionLabel("provisional-eba", "adj-na")).toBe("Conditional (ば/なら)");
    expect(questionLabel("te-form")).toBe("Te-form");
  });
});
