import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { normalizeBasePath } from "./src/lib/site-base";

/**
 * GitHub Pages has no SPA rewrite. A missing path is served as 404.html with
 * the browser URL left unchanged, so the built app shell is copied there.
 * Asset URLs are absolute from `base`, so they still resolve on a deep link.
 */
function pagesSpaFallback(): Plugin {
  let outDir = "";
  return {
    name: "pages-spa-fallback",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      fs.copyFileSync(indexPath, path.join(outDir, "404.html"));
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
