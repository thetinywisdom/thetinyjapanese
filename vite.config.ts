import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import fs from "node:fs";
import path from "path";
import { normalizeBasePath } from "./src/lib/site-base";
import { emitStaticPages } from "./scripts/emit-pages";

/**
 * GitHub Pages has no SPA rewrite. Known routes get their own index.html so
 * the HTTP status is 200. Anything else (a diary entry id, a typo) is served
 * as 404.html, which is the same app shell, and the URL is left unchanged.
 */

/** Ship kuromoji's IPAdic from node_modules. The diary fetches it from our base path. */
function kuromojiDict(): Plugin {
  const src = path.resolve(__dirname, "node_modules/kuromoji/dict");
  let outDir = "";
  return {
    name: "kuromoji-dict",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      server.middlewares.use(serveKuromoji(src));
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveKuromoji(src));
    },
    closeBundle() {
      if (!fs.existsSync(src)) return;
      fs.cpSync(src, path.join(outDir, "kuromoji"), { recursive: true });
    },
  };
}

function serveKuromoji(src: string) {
  return (req: { url?: string }, res: { setHeader: (name: string, value: string) => void }, next: () => void) => {
    const url = (req.url ?? "").split("?")[0];
    const marker = "/kuromoji/";
    const idx = url.indexOf(marker);
    if (idx < 0) return next();
    const name = path.basename(url.slice(idx + marker.length));
    if (!name.endsWith(".dat.gz")) return next();
    const full = path.join(src, name);
    if (!full.startsWith(src) || !fs.existsSync(full)) return next();
    res.setHeader("Content-Type", "application/gzip");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    fs.createReadStream(full).pipe(res as unknown as NodeJS.WritableStream);
  };
}

function pagesSpaFallback(): Plugin {
  let outDir = "";
  let base = "/";
  return {
    name: "pages-spa-fallback",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
      base = config.base;
    },
    closeBundle() {
      emitStaticPages(outDir, base);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const fallback = mode === "production" ? "/thetinyjapanese/" : "/";
  // An already-set process env wins, so CI can override .env.production.
  const base = normalizeBasePath(process.env.VITE_BASE_PATH || env.VITE_BASE_PATH, fallback);

  return {
    base,
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), pagesSpaFallback(), kuromojiDict()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
