import { describe, expect, it } from "vitest";
import { kankenChipLabel } from "@/content/learner-copy";
import { gradeShort } from "@/lib/kanji-levels";

describe("Kanken grade labels", () => {
  it("maps elementary grades 1–6 onto Kanken 10–5", () => {
    expect(gradeShort(1)).toBe("10");
    expect(gradeShort(6)).toBe("5");
    expect(kankenChipLabel(1)).toBe("Kanken 10");
  });

  it("does not label the remaining jōyō grade as a fake S level", () => {
    expect(gradeShort(8)).toBe("4–3");
    expect(kankenChipLabel(8)).toBe("Kanken 4–3");
  });
});
