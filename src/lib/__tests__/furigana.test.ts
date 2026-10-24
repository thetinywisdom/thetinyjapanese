import { describe, it, expect } from "vitest";
import { pairFurigana } from "../furigana";

describe("pairFurigana", () => {
  it("pairs ichidan verb with okurigana", () => {
    expect(pairFurigana("食べる", "たべる")).toEqual([
      { base: "食", ruby: "た" },
      { base: "べる" },
    ]);
  });

  it("pairs suru-compound", () => {
    expect(pairFurigana("勉強する", "べんきょうする")).toEqual([
      { base: "勉強", ruby: "べんきょう" },
      { base: "する" },
    ]);
  });

  it("pairs 来た", () => {
    expect(pairFurigana("来た", "きた")).toEqual([
      { base: "来", ruby: "き" },
      { base: "た" },
    ]);
  });

  it("pairs godan past", () => {
    expect(pairFurigana("会った", "あった")).toEqual([
      { base: "会", ruby: "あ" },
      { base: "った" },
    ]);
  });

  it("pairs trailing-only kanji", () => {
    expect(pairFurigana("行く", "いく")).toEqual([
      { base: "行", ruby: "い" },
      { base: "く" },
    ]);
  });
});
