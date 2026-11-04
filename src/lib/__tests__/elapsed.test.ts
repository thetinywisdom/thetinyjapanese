import { describe, expect, it } from "vitest";
import { formatElapsed } from "@/lib/elapsed";

describe("formatElapsed", () => {
  it("clamps a negative gap to 0:00 instead of -1:-1", () => {
    expect(formatElapsed(-5)).toBe("0:00");
    expect(formatElapsed(-1500)).toBe("0:00");
  });

  it("formats whole seconds", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(1000)).toBe("0:01");
    expect(formatElapsed(61_000)).toBe("1:01");
  });
});
