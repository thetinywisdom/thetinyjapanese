/**
 * Public site base path.
 *
 * The value to change is `VITE_BASE_PATH` in `.env.production`
 * (`/thetinyjapanese/` on the GitHub Pages project site, `/` when a custom
 * domain serves the app from the domain root). Vite copies that into
 * `import.meta.env.BASE_URL` for the client.
 */

/** Ensure a leading and trailing slash so URL joins stay stable. */
export function normalizeBasePath(raw: string | undefined, fallback = "/"): string {
  let base = (raw ?? "").trim();
  if (!base) base = fallback;
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base += "/";
  return base;
}

/** React Router basename: leading slash, no trailing slash. Undefined at domain root. */
export function routerBasename(baseUrl: string): string | undefined {
  const stripped = baseUrl.replace(/\/$/, "");
  return stripped === "" ? undefined : stripped;
}

/** URL for a file shipped from `public/`. */
export function publicAsset(baseUrl: string, file: string): string {
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return base + file.replace(/^\//, "");
}
