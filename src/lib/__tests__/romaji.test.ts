import { describe, it, expect } from "vitest";
import { romajiToHiragana } from "../romaji";

function conv(s: string): string {
  const { converted, pending } = romajiToHiragana(s);
  return converted + pending;
}

describe("romajiToHiragana", () => {
  it("basic vowels and kana", () => {
    expect(conv("aiueo")).toBe("あいうえお");
    expect(conv("kakikukeko")).toBe("かきくけこ");
  });

  it("digraphs", () => {
    expect(conv("kyoto")).toBe("きょと");
    expect(conv("sha")).toBe("しゃ");
  });

  it("hepburn variants", () => {
    expect(conv("shi")).toBe("し");
    expect(conv("chi")).toBe("ち");
    expect(conv("tsu")).toBe("つ");
    expect(conv("fu")).toBe("ふ");
    expect(conv("ji")).toBe("じ");
  });

  it("sokuon (small tsu)", () => {
    expect(conv("kitte")).toBe("きって");
    expect(conv("matta")).toBe("まった");
  });

  it("n handling", () => {
    expect(conv("honda")).toBe("ほんだ");
    expect(conv("nihon")).toBe("にほn"); // trailing n stays pending until next char
    expect(conv("nihonn")).toBe("にほん");
    expect(conv("nn")).toBe("ん");
    expect(conv("kanji")).toBe("かんじ");
    expect(conv("nya")).toBe("にゃ");
  });

  it("verb forms", () => {
    expect(conv("tabeta")).toBe("たべた");
    expect(conv("itta")).toBe("いった");
    expect(conv("benkyoushita")).toBe("べんきょうした");
    expect(conv("konakatta")).toBe("こなかった");
  });

  it("leaves pending romaji at the tail", () => {
    expect(romajiToHiragana("tab")).toEqual({ converted: "た", pending: "b" });
    expect(romajiToHiragana("ky")).toEqual({ converted: "", pending: "ky" });
  });
});
