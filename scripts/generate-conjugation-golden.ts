/**
 * Regenerate the N5 verb/adjective golden file from the conjugation engine.
 * Regenerate after a skip-list or N5-level change. The native review removed
 * the nonexistent forms; a further pass of newly added N5 rows is still wise.
 *
 *   npx vite-node scripts/generate-conjugation-golden.ts
 */
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { WORDS } from "../src/data/words";
import { buildForms, supportedQuestions } from "../src/lib/conjugation";

const outPath = resolve(dirname(fileURLToPath(import.meta.url)), "../src/lib/__tests__/conjugation-golden.json");

const rows = WORDS.filter((w) => w.jlptLevel === "N5" && w.wordType !== "noun").sort(
  (a, b) => a.reading.localeCompare(b.reading, "ja") || a.dictionary.localeCompare(b.dictionary, "ja"),
);

const out = rows.map((w) => {
  const forms = buildForms(w).casual;
  const casual: Record<string, string> = {};
  for (const q of supportedQuestions(w.wordType, w)) {
    const form = forms[q];
    if (form) casual[q] = form;
  }
  return {
    id: w.id,
    dictionary: w.dictionary,
    reading: w.reading,
    wordType: w.wordType,
    verbClass: w.verbClass,
    casual,
  };
});

writeFileSync(outPath, JSON.stringify(out));
console.log(`wrote ${out.length} entries → ${outPath}`);
