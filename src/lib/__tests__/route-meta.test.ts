import { describe, expect, it } from "vitest";
import {
  STATIC_ROUTES,
  absoluteUrl,
  applyRouteHead,
  metaForPath,
} from "@/lib/route-meta";

const SHELL = `<!doctype html>
<html><head>
<title>Old</title>
<meta name="description" content="old">
<meta property="og:title" content="old">
<meta property="og:description" content="old">
<meta property="og:image" content="https://example.test/old.webp">
<meta name="twitter:title" content="old">
<meta name="twitter:description" content="old">
<meta name="twitter:image" content="https://example.test/old.webp">
</head><body></body></html>`;

describe("route metadata", () => {
  it("builds canonical URLs under the GitHub Pages base", () => {
    expect(absoluteUrl("/thetinyjapanese/", "/")).toBe(
      "https://thetinywisdom.github.io/thetinyjapanese/",
    );
    expect(absoluteUrl("/thetinyjapanese/", "/kanji")).toBe(
      "https://thetinywisdom.github.io/thetinyjapanese/kanji",
    );
    expect(absoluteUrl("/thetinyjapanese/", "/kanji/learn")).toBe(
      "https://thetinywisdom.github.io/thetinyjapanese/kanji/learn",
    );
    expect(absoluteUrl("/thetinyjapanese/", "/og.png")).toBe(
      "https://thetinywisdom.github.io/thetinyjapanese/og.png",
    );
  });

  it("lists the static pages and leaves diary entries dynamic", () => {
    expect(STATIC_ROUTES.map((route) => route.path)).toContain("/kanji");
    expect(STATIC_ROUTES.some((route) => route.path.includes(":"))).toBe(false);
    expect(metaForPath("/kanji/").title).toContain("Kanji recognition");
    expect(metaForPath("/diary/abc").title).toContain("Diary entry");
    expect(metaForPath("/nope").title).toContain("Page not found");
  });

  it("rewrites the shell head for one route", () => {
    const html = applyRouteHead(SHELL, {
      title: "Kanji recognition · The Tiny Japanese Practice Tool",
      description: "See a kanji.",
      canonical: "https://thetinywisdom.github.io/thetinyjapanese/kanji",
      image: "https://thetinywisdom.github.io/thetinyjapanese/og.png",
    });
    expect(html).toContain("<title>Kanji recognition · The Tiny Japanese Practice Tool</title>");
    expect(html).toContain('rel="canonical" href="https://thetinywisdom.github.io/thetinyjapanese/kanji"');
    expect(html).toContain('property="og:image" content="https://thetinywisdom.github.io/thetinyjapanese/og.png"');
    expect(html).not.toContain("example.test");
  });
});
