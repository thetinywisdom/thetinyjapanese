import { describe, it, expect } from "vitest";
import { buildForms, checkAnswer, type VerbLike } from "../conjugation";

const v = (reading: string, verbClass: string): VerbLike => ({ reading, verbClass });

describe("ichidan", () => {
  const taberu = v("たべる", "ichidan");
  it("polite forms", () => {
    const f = buildForms(taberu).polite;
    expect(f["non-past-affirmative"]).toBe("たべます");
    expect(f["non-past-negative"]).toBe("たべません");
    expect(f["past-affirmative"]).toBe("たべました");
    expect(f["past-negative"]).toBe("たべませんでした");
  });
  it("casual forms", () => {
    const f = buildForms(taberu).casual;
    expect(f["non-past-affirmative"]).toBe("たべる");
    expect(f["non-past-negative"]).toBe("たべない");
    expect(f["past-affirmative"]).toBe("たべた");
    expect(f["past-negative"]).toBe("たべなかった");
  });
});

describe("godan -u (会う)", () => {
  const au = v("あう", "godan-u");
  it("polite", () => {
    expect(buildForms(au).polite["non-past-affirmative"]).toBe("あいます");
    expect(buildForms(au).polite["past-affirmative"]).toBe("あいました");
  });
  it("casual past = った", () => {
    expect(buildForms(au).casual["past-affirmative"]).toBe("あった");
  });
  it("casual negative uses わ (not あ)", () => {
    expect(buildForms(au).casual["non-past-negative"]).toBe("あわない");
    expect(buildForms(au).casual["past-negative"]).toBe("あわなかった");
  });
});

describe("godan -k (書く)", () => {
  const kaku = v("かく", "godan-k");
  it("past = いた", () => {
    expect(buildForms(kaku).casual["past-affirmative"]).toBe("かいた");
  });
  it("polite", () => {
    expect(buildForms(kaku).polite["non-past-affirmative"]).toBe("かきます");
  });
  it("negative", () => {
    expect(buildForms(kaku).casual["non-past-negative"]).toBe("かかない");
  });
});

describe("godan -g (泳ぐ)", () => {
  const oyogu = v("およぐ", "godan-g");
  it("past = いだ", () => {
    expect(buildForms(oyogu).casual["past-affirmative"]).toBe("およいだ");
  });
});

describe("godan -s (話す)", () => {
  const hanasu = v("はなす", "godan-s");
  it("past = した", () => {
    expect(buildForms(hanasu).casual["past-affirmative"]).toBe("はなした");
  });
  it("polite", () => {
    expect(buildForms(hanasu).polite["non-past-affirmative"]).toBe("はなします");
  });
});

describe("godan -t/-r/-u → った", () => {
  it("待つ", () => {
    expect(buildForms(v("まつ", "godan-t")).casual["past-affirmative"]).toBe("まった");
  });
  it("わかる (godan-r)", () => {
    expect(buildForms(v("わかる", "godan-r")).casual["past-affirmative"]).toBe("わかった");
    expect(buildForms(v("わかる", "godan-r")).casual["non-past-negative"]).toBe("わからない");
  });
});

describe("godan -n/-b/-m → んだ", () => {
  it("死ぬ", () => {
    expect(buildForms(v("しぬ", "godan-n")).casual["past-affirmative"]).toBe("しんだ");
  });
  it("遊ぶ", () => {
    expect(buildForms(v("あそぶ", "godan-b")).casual["past-affirmative"]).toBe("あそんだ");
  });
  it("飲む", () => {
    expect(buildForms(v("のむ", "godan-m")).casual["past-affirmative"]).toBe("のんだ");
  });
});

describe("行く exception", () => {
  const iku = v("いく", "godan-iku");
  it("past = 行った, not 行いた", () => {
    expect(buildForms(iku).casual["past-affirmative"]).toBe("いった");
  });
  it("polite still ikimasu", () => {
    expect(buildForms(iku).polite["non-past-affirmative"]).toBe("いきます");
  });
});

describe("する", () => {
  const suru = v("する", "irregular-suru");
  it("forms", () => {
    const f = buildForms(suru);
    expect(f.polite["non-past-affirmative"]).toBe("します");
    expect(f.polite["past-negative"]).toBe("しませんでした");
    expect(f.casual["non-past-negative"]).toBe("しない");
    expect(f.casual["past-affirmative"]).toBe("した");
    expect(f.casual["past-negative"]).toBe("しなかった");
  });
  it("compound 勉強する", () => {
    const benkyo = v("べんきょうする", "irregular-suru");
    const f = buildForms(benkyo);
    expect(f.polite["non-past-affirmative"]).toBe("べんきょうします");
    expect(f.casual["past-negative"]).toBe("べんきょうしなかった");
  });
});

describe("来る", () => {
  const kuru = v("くる", "irregular-kuru");
  it("forms", () => {
    const f = buildForms(kuru);
    expect(f.polite["non-past-affirmative"]).toBe("きます");
    expect(f.casual["non-past-negative"]).toBe("こない");
    expect(f.casual["past-affirmative"]).toBe("きた");
    expect(f.casual["past-negative"]).toBe("こなかった");
  });
});

describe("checkAnswer", () => {
  const taberu = v("たべる", "ichidan");
  it("accepts exact match", () => {
    expect(checkAnswer("たべない", taberu, "non-past-negative").correct).toBe(true);
  });
  it("normalises whitespace", () => {
    expect(checkAnswer("  たべない  ", taberu, "non-past-negative").correct).toBe(true);
  });
  it("accepts katakana input", () => {
    expect(checkAnswer("タベナイ", taberu, "non-past-negative").correct).toBe(true);
  });
  it("rejects wrong answer", () => {
    const r = checkAnswer("たべます", taberu, "non-past-negative");
    expect(r.correct).toBe(false);
    expect(r.expected).toBe("たべない");
  });
});

describe("checkAnswer accepts kanji forms", () => {
  it("godan-u 会った", () => {
    const au: VerbLike = { dictionary: "会う", reading: "あう", verbClass: "godan-u" };
    expect(checkAnswer("会った", au, "past-affirmative").correct).toBe(true);
    expect(checkAnswer("会わない", au, "non-past-negative").correct).toBe(true);
  });
  it("ichidan 食べない", () => {
    const taberu: VerbLike = { dictionary: "食べる", reading: "たべる", verbClass: "ichidan" };
    expect(checkAnswer("食べない", taberu, "non-past-negative").correct).toBe(true);
    expect(checkAnswer("食べた", taberu, "past-affirmative").correct).toBe(true);
  });
  it("irregular-suru compound 勉強した", () => {
    const benkyo: VerbLike = {
      dictionary: "勉強する",
      reading: "べんきょうする",
      verbClass: "irregular-suru",
    };
    expect(checkAnswer("勉強した", benkyo, "past-affirmative").correct).toBe(true);
    expect(checkAnswer("勉強しなかった", benkyo, "past-negative").correct).toBe(true);
  });
  it("irregular-kuru 来た", () => {
    const kuru: VerbLike = { dictionary: "来る", reading: "くる", verbClass: "irregular-kuru" };
    expect(checkAnswer("来た", kuru, "past-affirmative").correct).toBe(true);
    expect(checkAnswer("来ない", kuru, "non-past-negative").correct).toBe(true);
  });
  it("kana input still works when dictionary has kanji", () => {
    const au: VerbLike = { dictionary: "会う", reading: "あう", verbClass: "godan-u" };
    expect(checkAnswer("あった", au, "past-affirmative").correct).toBe(true);
  });
});

describe("te-form", () => {
  it("ichidan 食べて", () => {
    expect(buildForms(v("たべる", "ichidan")).casual["te-form"]).toBe("たべて");
  });
  it("godan-k 書いて", () => {
    expect(buildForms(v("かく", "godan-k")).casual["te-form"]).toBe("かいて");
  });
  it("godan-g 泳いで", () => {
    expect(buildForms(v("およぐ", "godan-g")).casual["te-form"]).toBe("およいで");
  });
  it("godan-s 話して", () => {
    expect(buildForms(v("はなす", "godan-s")).casual["te-form"]).toBe("はなして");
  });
  it("godan-m 飲んで", () => {
    expect(buildForms(v("のむ", "godan-m")).casual["te-form"]).toBe("のんで");
  });
  it("godan-u 買って", () => {
    expect(buildForms(v("かう", "godan-u")).casual["te-form"]).toBe("かって");
  });
  it("行って exception", () => {
    expect(buildForms(v("いく", "godan-iku")).casual["te-form"]).toBe("いって");
  });
  it("する → して", () => {
    expect(buildForms(v("する", "irregular-suru")).casual["te-form"]).toBe("して");
  });
  it("来る → きて", () => {
    expect(buildForms(v("くる", "irregular-kuru")).casual["te-form"]).toBe("きて");
  });
});

describe("potential", () => {
  it("ichidan 食べられる", () => {
    expect(buildForms(v("たべる", "ichidan")).casual["potential"]).toBe("たべられる");
  });
  it("godan 書ける", () => {
    expect(buildForms(v("かく", "godan-k")).casual["potential"]).toBe("かける");
  });
  it("godan 飲める", () => {
    expect(buildForms(v("のむ", "godan-m")).casual["potential"]).toBe("のめる");
  });
  it("する → できる", () => {
    expect(buildForms(v("する", "irregular-suru")).casual["potential"]).toBe("できる");
  });
  it("勉強する → 勉強できる", () => {
    expect(buildForms(v("べんきょうする", "irregular-suru")).casual["potential"]).toBe("べんきょうできる");
  });
  it("来る → こられる", () => {
    expect(buildForms(v("くる", "irregular-kuru")).casual["potential"]).toBe("こられる");
  });
});

describe("volitional", () => {
  it("ichidan 食べよう", () => {
    expect(buildForms(v("たべる", "ichidan")).casual["volitional"]).toBe("たべよう");
  });
  it("godan 書こう", () => {
    expect(buildForms(v("かく", "godan-k")).casual["volitional"]).toBe("かこう");
  });
  it("godan 飲もう", () => {
    expect(buildForms(v("のむ", "godan-m")).casual["volitional"]).toBe("のもう");
  });
  it("する → しよう", () => {
    expect(buildForms(v("する", "irregular-suru")).casual["volitional"]).toBe("しよう");
  });
  it("来る → こよう", () => {
    expect(buildForms(v("くる", "irregular-kuru")).casual["volitional"]).toBe("こよう");
  });
});

describe("imperative", () => {
  it("ichidan 食べろ", () => {
    expect(buildForms(v("たべる", "ichidan")).casual["imperative"]).toBe("たべろ");
  });
  it("godan 書け", () => {
    expect(buildForms(v("かく", "godan-k")).casual["imperative"]).toBe("かけ");
  });
  it("godan 待て", () => {
    expect(buildForms(v("まつ", "godan-t")).casual["imperative"]).toBe("まて");
  });
  it("する → しろ", () => {
    expect(buildForms(v("する", "irregular-suru")).casual["imperative"]).toBe("しろ");
  });
  it("来る → こい", () => {
    expect(buildForms(v("くる", "irregular-kuru")).casual["imperative"]).toBe("こい");
  });
});

describe("conditional たら", () => {
  it("ichidan 食べたら", () => {
    expect(buildForms(v("たべる", "ichidan")).casual["conditional-tara"]).toBe("たべたら");
  });
  it("godan 書いたら", () => {
    expect(buildForms(v("かく", "godan-k")).casual["conditional-tara"]).toBe("かいたら");
  });
  it("行ったら exception", () => {
    expect(buildForms(v("いく", "godan-iku")).casual["conditional-tara"]).toBe("いったら");
  });
  it("する → したら", () => {
    expect(buildForms(v("する", "irregular-suru")).casual["conditional-tara"]).toBe("したら");
  });
  it("来る → きたら", () => {
    expect(buildForms(v("くる", "irregular-kuru")).casual["conditional-tara"]).toBe("きたら");
  });
});

describe("provisional ば", () => {
  it("ichidan 食べれば", () => {
    expect(buildForms(v("たべる", "ichidan")).casual["provisional-eba"]).toBe("たべれば");
  });
  it("godan 書けば", () => {
    expect(buildForms(v("かく", "godan-k")).casual["provisional-eba"]).toBe("かけば");
  });
  it("godan 飲めば", () => {
    expect(buildForms(v("のむ", "godan-m")).casual["provisional-eba"]).toBe("のめば");
  });
  it("する → すれば", () => {
    expect(buildForms(v("する", "irregular-suru")).casual["provisional-eba"]).toBe("すれば");
  });
  it("来る → くれば", () => {
    expect(buildForms(v("くる", "irregular-kuru")).casual["provisional-eba"]).toBe("くれば");
  });
});

describe("kanji forms for new question types", () => {
  it("ichidan 食べて", () => {
    const taberu: VerbLike = { dictionary: "食べる", reading: "たべる", verbClass: "ichidan" };
    expect(checkAnswer("食べて", taberu, "te-form").correct).toBe(true);
  });
  it("godan-k 書ける", () => {
    const kaku: VerbLike = { dictionary: "書く", reading: "かく", verbClass: "godan-k" };
    expect(checkAnswer("書ける", kaku, "potential").correct).toBe(true);
  });
  it("kuru 来て / 来られる / 来い", () => {
    const kuru: VerbLike = { dictionary: "来る", reading: "くる", verbClass: "irregular-kuru" };
    expect(checkAnswer("来て", kuru, "te-form").correct).toBe(true);
    expect(checkAnswer("来られる", kuru, "potential").correct).toBe(true);
    expect(checkAnswer("来い", kuru, "imperative").correct).toBe(true);
    expect(checkAnswer("来れば", kuru, "provisional-eba").correct).toBe(true);
  });
});

describe("passive", () => {
  it("ichidan 食べられる", () => {
    expect(buildForms(v("たべる", "ichidan")).casual["passive"]).toBe("たべられる");
  });
  it("godan-k 書かれる", () => {
    expect(buildForms(v("かく", "godan-k")).casual["passive"]).toBe("かかれる");
  });
  it("godan-u 買う → 買われる (う → わ)", () => {
    expect(buildForms(v("かう", "godan-u")).casual["passive"]).toBe("かわれる");
  });
  it("godan-m 飲まれる", () => {
    expect(buildForms(v("のむ", "godan-m")).casual["passive"]).toBe("のまれる");
  });
  it("する → される", () => {
    expect(buildForms(v("する", "irregular-suru")).casual["passive"]).toBe("される");
  });
  it("勉強する → 勉強される", () => {
    expect(buildForms(v("べんきょうする", "irregular-suru")).casual["passive"]).toBe("べんきょうされる");
  });
  it("来る → こられる", () => {
    expect(buildForms(v("くる", "irregular-kuru")).casual["passive"]).toBe("こられる");
  });
});

describe("causative", () => {
  it("ichidan 食べさせる", () => {
    expect(buildForms(v("たべる", "ichidan")).casual["causative"]).toBe("たべさせる");
  });
  it("godan-k 書かせる", () => {
    expect(buildForms(v("かく", "godan-k")).casual["causative"]).toBe("かかせる");
  });
  it("godan-u 買わせる (う → わ)", () => {
    expect(buildForms(v("かう", "godan-u")).casual["causative"]).toBe("かわせる");
  });
  it("godan-m 飲ませる", () => {
    expect(buildForms(v("のむ", "godan-m")).casual["causative"]).toBe("のませる");
  });
  it("する → させる", () => {
    expect(buildForms(v("する", "irregular-suru")).casual["causative"]).toBe("させる");
  });
  it("勉強する → 勉強させる", () => {
    expect(buildForms(v("べんきょうする", "irregular-suru")).casual["causative"]).toBe("べんきょうさせる");
  });
  it("来る → こさせる", () => {
    expect(buildForms(v("くる", "irregular-kuru")).casual["causative"]).toBe("こさせる");
  });
});

describe("causative-passive", () => {
  it("ichidan 食べさせられる", () => {
    expect(buildForms(v("たべる", "ichidan")).casual["causative-passive"]).toBe("たべさせられる");
  });
  it("godan-k 書かせられる", () => {
    expect(buildForms(v("かく", "godan-k")).casual["causative-passive"]).toBe("かかせられる");
  });
  it("godan-u 買わせられる (う → わ)", () => {
    expect(buildForms(v("かう", "godan-u")).casual["causative-passive"]).toBe("かわせられる");
  });
  it("する → させられる", () => {
    expect(buildForms(v("する", "irregular-suru")).casual["causative-passive"]).toBe("させられる");
  });
  it("来る → こさせられる", () => {
    expect(buildForms(v("くる", "irregular-kuru")).casual["causative-passive"]).toBe("こさせられる");
  });
});

describe("kanji forms for voice", () => {
  it("godan-u 会われる", () => {
    const au: VerbLike = { dictionary: "会う", reading: "あう", verbClass: "godan-u" };
    expect(checkAnswer("会われる", au, "passive").correct).toBe(true);
    expect(checkAnswer("会わせる", au, "causative").correct).toBe(true);
    expect(checkAnswer("会わせられる", au, "causative-passive").correct).toBe(true);
  });
  it("kuru 来られる / 来させる / 来させられる", () => {
    const kuru: VerbLike = { dictionary: "来る", reading: "くる", verbClass: "irregular-kuru" };
    expect(checkAnswer("来られる", kuru, "passive").correct).toBe(true);
    expect(checkAnswer("来させる", kuru, "causative").correct).toBe(true);
    expect(checkAnswer("来させられる", kuru, "causative-passive").correct).toBe(true);
  });
});
