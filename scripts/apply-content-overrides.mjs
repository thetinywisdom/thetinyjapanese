/**
 * Reapply scripts/content-overrides.mjs to the checked-in words.json.
 * Run: node scripts/apply-content-overrides.mjs
 *
 * build-words.ts and build-verbs.ts call the same function, so a future
 * JMdict rebuild keeps these fixes. JMdict itself is not in the repo.
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { applyContentOverrides } from "./content-overrides.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PATH = resolve(__dirname, "../src/data/words.json");

const file = JSON.parse(readFileSync(PATH, "utf8"));
const before = file.entries.length;
file.entries = applyContentOverrides(file.entries);
file.contentOverrideVersion = 2;
writeFileSync(PATH, JSON.stringify(file));

const byLevel = {};
for (const e of file.entries) byLevel[e.jlptLevel] = (byLevel[e.jlptLevel] ?? 0) + 1;
console.log(`words ${before} → ${file.entries.length}`);
console.log(byLevel);
