/**
 * Build src/data/kanji-strokes.json from KanjiVG SVG files.
 *
 * For each kanji that appears in src/data/kanji-radicals.json, extract the
 * ordered list of stroke `d` attributes from scripts/cache/kanjivg/kanji/.
 *
 * Run:  npx tsx scripts/build-kanji-strokes.ts
 *
 * Source: KanjiVG © Ulrich Apel, CC-BY-SA 3.0, https://kanjivg.tagaini.net/
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RADICALS_PATH = resolve(__dirname, "../src/data/kanji-radicals.json");
const KVG_DIR = resolve(__dirname, "cache/kanjivg/kanji");
const OUT_PATH = resolve(__dirname, "../src/data/kanji-strokes.json");

interface RadicalsFile {
  kanji: Record<string, unknown>;
}

const radicals = JSON.parse(readFileSync(RADICALS_PATH, "utf8")) as RadicalsFile;
const kanjiList = Object.keys(radicals.kanji);

const out: Record<string, { strokes: string[] }> = {};
let missing = 0;

for (const ch of kanjiList) {
  const cp = ch.codePointAt(0)!;
  const hex = cp.toString(16).padStart(5, "0");
  const file = resolve(KVG_DIR, `${hex}.svg`);
  if (!existsSync(file)) {
    missing++;
    continue;
  }
  const svg = readFileSync(file, "utf8");
  // Only paths inside the StrokePaths group (skip stroke-number text), in document order.
  const strokes: string[] = [];
  const re = /<path[^>]*\bid="kvg:[0-9a-f]+-s(\d+)"[^>]*\bd="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  const pairs: [number, string][] = [];
  while ((m = re.exec(svg))) {
    pairs.push([parseInt(m[1], 10), m[2]]);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  for (const [, d] of pairs) strokes.push(d);
  if (strokes.length === 0) {
    missing++;
    continue;
  }
  out[ch] = { strokes };
}

const payload = {
  version: 1,
  generatedAt: new Date().toISOString(),
  viewBox: 109,
  kanji: out,
};
writeFileSync(OUT_PATH, JSON.stringify(payload));
const sizeKB = (JSON.stringify(payload).length / 1024).toFixed(1);
console.log(
  `wrote stroke data for ${Object.keys(out).length}/${kanjiList.length} kanji → ${OUT_PATH} (${sizeKB} KB)`,
);
if (missing) console.warn(`missing/empty: ${missing}`);
