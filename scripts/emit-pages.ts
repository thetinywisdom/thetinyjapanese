import fs from "node:fs";
import path from "node:path";
import {
  NOT_FOUND_META,
  SITE_ORIGIN,
  STATIC_ROUTES,
  absoluteUrl,
  applyRouteHead,
} from "../src/lib/route-meta";

/**
 * GitHub Pages serves `dir/index.html` for `/dir/` (and redirects `/dir` there).
 * Copy the SPA shell once per known route, with that page's title and canonical
 * URL, and keep `404.html` for ids such as `/diary/:id`.
 */
export function emitStaticPages(outDir: string, basePath: string): void {
  const indexPath = path.join(outDir, "index.html");
  if (!fs.existsSync(indexPath)) return;
  const shell = fs.readFileSync(indexPath, "utf8");
  const image = absoluteUrl(basePath, "/og.png");

  for (const route of STATIC_ROUTES) {
    const page = applyRouteHead(shell, {
      title: route.title,
      description: route.description,
      canonical: absoluteUrl(basePath, route.path),
      image,
    });
    if (route.path === "/") {
      fs.writeFileSync(indexPath, page);
      continue;
    }
    const dir = path.join(outDir, route.path.replace(/^\//, ""));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), page);
  }

  fs.writeFileSync(
    path.join(outDir, "404.html"),
    applyRouteHead(shell, {
      title: NOT_FOUND_META.title,
      description: NOT_FOUND_META.description,
      canonical: absoluteUrl(basePath, "/"),
      image,
    }),
  );

  const urls = STATIC_ROUTES.map(
    (route) => `  <url><loc>${absoluteUrl(basePath, route.path)}</loc></url>`,
  ).join("\n");
  fs.writeFileSync(
    path.join(outDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  fs.writeFileSync(
    path.join(outDir, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl(basePath, "/sitemap.xml")}\n`,
  );
}
