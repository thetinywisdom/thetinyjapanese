import { describe, it, expect } from "vitest";
import { sample, flatten, resample } from "@/lib/svg-path-sample";

describe("svg-path-sample", () => {
  it("samples a straight line", () => {
    const pts = sample("M0,0 L10,0", 11);
    expect(pts.length).toBe(11);
    expect(pts[0].x).toBeCloseTo(0);
    expect(pts[10].x).toBeCloseTo(10);
    expect(pts[5].x).toBeCloseTo(5);
    expect(pts[5].y).toBeCloseTo(0);
  });

  it("handles cubic bezier", () => {
    const pts = flatten("M0,0 C10,0 10,10 0,10", 16);
    expect(pts.length).toBeGreaterThan(10);
    // endpoint
    const last = pts[pts.length - 1];
    expect(last.x).toBeCloseTo(0, 1);
    expect(last.y).toBeCloseTo(10, 1);
  });

  it("resample produces N points", () => {
    const r = resample([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 3 }], 8);
    expect(r.length).toBe(8);
  });
});
