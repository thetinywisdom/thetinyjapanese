import { normalizeBasePath } from "./site-base";

/** Host for canonical and social URLs. Change this if the site moves off GitHub Pages. */
export const SITE_ORIGIN = "https://thetinywisdom.github.io";

export const SITE_NAME = "The Tiny Japanese Practice Tool";

const HOME_DESCRIPTION =
  "Master kanji readings and verb conjugations. JLPT N5–N1, no signup, no fluff. 一緒に日本語、上手になろう！";

export interface RouteMeta {
  /** Router path. "/" is the home page. Dynamic paths are not listed here. */
  path: string;
  title: string;
  description: string;
}

/**
 * Routes that exist as real pages. Each one gets its own `index.html` at
 * build time so GitHub Pages returns 200. `/diary/:id` stays on the 404.html
 * SPA fallback because the id is chosen by the browser.
 */
export const STATIC_ROUTES: RouteMeta[] = [
  { path: "/", title: SITE_NAME, description: HOME_DESCRIPTION },
  {
    path: "/conjugations",
    title: `Conjugations · ${SITE_NAME}`,
    description: "Practice verb, adjective, and noun conjugations from JLPT N5 to N1.",
  },
  {
    path: "/verbs",
    title: `Conjugations · ${SITE_NAME}`,
    description: "Practice verb, adjective, and noun conjugations from JLPT N5 to N1.",
  },
  {
    path: "/results",
    title: `Session results · ${SITE_NAME}`,
    description: "Score and breakdown for the conjugation session you just finished on this device.",
  },
  {
    path: "/learn",
    title: `Learn conjugations · ${SITE_NAME}`,
    description: "Verb groups, adjective types, and the conjugation rules behind the practice.",
  },
  {
    path: "/kanji",
    title: `Kanji recognition · ${SITE_NAME}`,
    description: "See a kanji and type its reading, with radical breakdowns. JLPT N5–N1.",
  },
  {
    path: "/kanji/learn",
    title: `Learn kanji · ${SITE_NAME}`,
    description: "How kanji, readings, and school grade relate to JLPT levels.",
  },
  {
    path: "/kanji/write",
    title: `Kanji writing · ${SITE_NAME}`,
    description: "Draw kanji stroke by stroke with live feedback.",
  },
  {
    path: "/kanji/remember",
    title: `Kanji remember · ${SITE_NAME}`,
    description: "Multiple-choice quiz on kanji meaning, reading, and the character itself.",
  },
  {
    path: "/about",
    title: `About · ${SITE_NAME}`,
    description: "What this practice tool covers, and what stays on this device.",
  },
  {
    path: "/progress",
    title: `Progress · ${SITE_NAME}`,
    description: "Practice history stored on this device. Nothing is uploaded.",
  },
  {
    path: "/diary",
    title: `Diary · ${SITE_NAME}`,
    description: "Picture diary for writing Japanese sentences, with furigana when you want it.",
  },
];

export const DIARY_ENTRY_META: RouteMeta = {
  path: "/diary/:id",
  title: `Diary entry · ${SITE_NAME}`,
  description: "One picture-diary page, saved in this browser.",
};

export const NOT_FOUND_META: RouteMeta = {
  path: "*",
  title: `Page not found · ${SITE_NAME}`,
  description: "That address isn’t part of the practice tool.",
};

/** Absolute URL for a site path, using the production base (`/thetinyjapanese/` by default). */
export function absoluteUrl(basePath: string, routePath: string): string {
  const base = normalizeBasePath(basePath, "/thetinyjapanese/");
  const origin = SITE_ORIGIN.replace(/\/$/, "");
  if (routePath === "/" || routePath === "") return `${origin}${base}`;
  const suffix = routePath.startsWith("/") ? routePath : `/${routePath}`;
  return `${origin}${base.slice(0, -1)}${suffix}`;
}

export function metaForPath(pathname: string): RouteMeta {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : "/";
  return (
    STATIC_ROUTES.find((route) => route.path === path) ??
    (path.startsWith("/diary/") ? DIARY_ENTRY_META : NOT_FOUND_META)
  );
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function upsertMeta(html: string, attr: "name" | "property", key: string, content: string): string {
  const tag = `<meta ${attr}="${key}" content="${escapeAttr(content)}">`;
  const re = new RegExp(`<meta ${attr}="${key}" content="[^"]*"\\s*/?>`);
  if (re.test(html)) return html.replace(re, tag);
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

/** Rewrite title, description, canonical, and social tags in a built index.html shell. */
export function applyRouteHead(
  html: string,
  opts: { title: string; description: string; canonical: string; image: string },
): string {
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(opts.title)}</title>`);
  out = upsertMeta(out, "name", "description", opts.description);
  out = upsertMeta(out, "property", "og:title", opts.title);
  out = upsertMeta(out, "property", "og:description", opts.description);
  out = upsertMeta(out, "property", "og:url", opts.canonical);
  out = upsertMeta(out, "property", "og:image", opts.image);
  out = upsertMeta(out, "name", "twitter:title", opts.title);
  out = upsertMeta(out, "name", "twitter:description", opts.description);
  out = upsertMeta(out, "name", "twitter:image", opts.image);
  const canonical = `<link rel="canonical" href="${escapeAttr(opts.canonical)}">`;
  if (/<link rel="canonical" href="[^"]*"\s*\/?>/.test(out)) {
    out = out.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, canonical);
  } else {
    out = out.replace("</head>", `    ${canonical}\n  </head>`);
  }
  return out;
}
