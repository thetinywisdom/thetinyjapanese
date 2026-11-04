import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const css = (name: string) => readFileSync(path.join(process.cwd(), "src", name), "utf8");

describe("self-hosted fonts", () => {
  it("does not rely on a Google Fonts import in the main stylesheet", () => {
    expect(css("index.css")).not.toContain("fonts.googleapis.com");
  });

  it("declares DM Sans, DM Serif Display, and Noto Sans JP from local files", () => {
    const fonts = css("fonts.css");
    expect(fonts).toContain('font-family: "DM Sans"');
    expect(fonts).toContain('font-family: "DM Serif Display"');
    expect(fonts).toContain('font-family: "Noto Sans JP"');
    expect(fonts).toContain("noto-sans-jp-japanese-400-normal.woff2");
    expect(fonts).not.toContain("fonts.googleapis.com");
  });
});
