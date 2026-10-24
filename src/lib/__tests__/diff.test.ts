import { describe, it, expect } from "vitest";
import { splitCommonPrefix } from "../diff";

describe("splitCommonPrefix", () => {
  it("splits at conjugation tail (kanji stem)", () => {
    expect(splitCommonPrefix("食べました", "食べた")).toEqual({
      common: "食べ",
      aTail: "ました",
      bTail: "た",
    });
  });

  it("splits godan ikimasu/ikanai", () => {
    expect(splitCommonPrefix("行きません", "行かない")).toEqual({
      common: "行",
      aTail: "きません",
      bTail: "かない",
    });
  });

  it("splits suru forms", () => {
    expect(splitCommonPrefix("しました", "した")).toEqual({
      common: "し",
      aTail: "ました",
      bTail: "た",
    });
  });

  it("treats katakana and hiragana as equal", () => {
    const r = splitCommonPrefix("タベました", "たべた");
    expect(r.common).toBe("タベ");
    expect(r.aTail).toBe("ました");
    expect(r.bTail).toBe("た");
  });

  it("no shared prefix → entire tails", () => {
    const r = splitCommonPrefix("くる", "きた");
    expect(r.common).toBe("");
    expect(r.aTail).toBe("くる");
    expect(r.bTail).toBe("きた");
  });
});
