import { describe, it, expect } from "vitest";
import { matchStroke } from "@/lib/stroke-match";
import { sample } from "@/lib/svg-path-sample";

describe("matchStroke", () => {
  const horizontal = "M11,54 L97,54";

  it("accepts a stroke that matches", () => {
    const points = sample(horizontal, 40);
    const res = matchStroke({ points }, horizontal);
    expect(res.ok).toBe(true);
  });

  it("rejects reversed direction", () => {
    const points = sample(horizontal, 40).reverse();
    const res = matchStroke({ points }, horizontal);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("direction");
  });

  it("rejects far-away position", () => {
    const points = sample("M11,5 L97,5", 40);
    const res = matchStroke({ points }, horizontal);
    expect(res.ok).toBe(false);
  });

  it("rejects too-short strokes", () => {
    const res = matchStroke({ points: [{ x: 50, y: 50 }, { x: 51, y: 50 }] }, horizontal);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("tooShort");
  });
});
