import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { normalizeBasePath } from "./src/lib/site-base";
import { emitStaticPages } from "./scripts/emit-pages";

/**
 * GitHub Pages has no SPA rewrite. Known routes get their own index.html so
 * the HTTP status is 200. Anything else (a diary entry id, a typo) is served
 * as 404.html, which is the same app shell, and the URL is left unchanged.
 */
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
    plugins: [react(), pagesSpaFallback()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
