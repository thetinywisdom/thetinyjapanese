import { describe, expect, it } from "vitest";
import { kankenChipLabel, kankenGradeHelp, kankenSectionTitle } from "@/content/learner-copy";
import { gradeShort } from "@/lib/kanji-levels";

describe("Kanken grade labels", () => {
  it("maps elementary grades 1–6 onto 漢検10級–5級", () => {
    expect(gradeShort(1)).toBe("10");
    expect(gradeShort(6)).toBe("5");
    expect(kankenChipLabel(1)).toBe("漢検10級");
    expect(kankenChipLabel(2)).toBe("漢検9級");
    expect(kankenChipLabel(3)).toBe("漢検8級");
    expect(kankenChipLabel(4)).toBe("漢検7級");
    expect(kankenChipLabel(5)).toBe("漢検6級");
    expect(kankenChipLabel(6)).toBe("漢検5級");
  });

  it("labels the remaining jōyō grade as 漢検4級〜2級", () => {
    expect(gradeShort(8)).toBe("4級〜2級");
    expect(kankenChipLabel(8)).toBe("漢検4級〜2級");
  });

  it("uses the teacher's heading and the sentence under the chips", () => {
    expect(kankenSectionTitle).toBe("JLPT vs School Grade");
    expect(kankenGradeHelp).toBe("G1–G6 are elementary years 1–6 (roughly 漢検10級〜5級).");
  });
});
