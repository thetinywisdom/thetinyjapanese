import { describe, expect, it } from "vitest";
import { normalizeBasePath, publicAsset, routerBasename } from "@/lib/site-base";

describe("site base path", () => {
  it("normalizes the GitHub Pages project base", () => {
    expect(normalizeBasePath("/thetinyjapanese")).toBe("/thetinyjapanese/");
    expect(normalizeBasePath("thetinyjapanese/")).toBe("/thetinyjapanese/");
    expect(normalizeBasePath("/")).toBe("/");
    expect(normalizeBasePath("", "/thetinyjapanese/")).toBe("/thetinyjapanese/");
  });

  it("builds a router basename without a trailing slash", () => {
    expect(routerBasename("/thetinyjapanese/")).toBe("/thetinyjapanese");
    expect(routerBasename("/")).toBeUndefined();
  });

  it("prefixes public files with the base", () => {
    expect(publicAsset("/thetinyjapanese/", "logo.svg")).toBe("/thetinyjapanese/logo.svg");
    expect(publicAsset("/", "/favicon.svg")).toBe("/favicon.svg");
  });
});
