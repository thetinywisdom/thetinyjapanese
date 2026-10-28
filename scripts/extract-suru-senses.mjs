/**
 * Build scripts/suru-senses.json from a local JMdict_e.xml.
 *
 * JMdict is not in this repo. Pass the unpacked file:
 *   node scripts/extract-suru-senses.mjs /tmp/JMdict_e.xml
 *
 * For every irregular-suru id in words.json, keep up to two English glosses
 * that start with "to " on a sense tagged vs, vs-s, or vs-i. If that sense
 * has only a noun or adverb gloss, store "(する) gloss" instead of prefixing
 * "to ". content-overrides.mjs applies SURU_GLOSSES on top of this file.
 */
import { createReadStream, readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const jmdict = process.argv[2];
if (!jmdict) {
  console.error("usage: node scripts/extract-suru-senses.mjs /path/to/JMdict_e.xml");
  process.exit(1);
}

const words = JSON.parse(readFileSync(resolve(__dirname, "../src/data/words.json"), "utf8"));
const ids = new Set(
  words.entries.filter((e) => e.verbClass === "irregular-suru").map((e) => e.id),
);

const VS = new Set(["vs", "vs-s", "vs-i"]);

function decode(text) {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function format(senses) {
  const vsSenses = senses.filter((s) => s.pos.some((p) => VS.has(p)));
  const verbGlosses = [];
  for (const sense of vsSenses) {
    for (const gloss of sense.glosses) {
      if (gloss.startsWith("to ") && !verbGlosses.includes(gloss)) verbGlosses.push(gloss);
    }
  }
  if (verbGlosses.length) return verbGlosses.slice(0, 2).join("; ");
  const noun = (vsSenses[0]?.glosses ?? []).filter(Boolean).slice(0, 2);
  if (!noun.length) return null;
  return `(する) ${noun.join("; ")}`;
}

const rl = createInterface({ input: createReadStream(jmdict), crlfDelay: Infinity });
let id = null;
let want = false;
let inSense = false;
let pos = [];
let glosses = [];
let senses = [];
/** @type {Record<string, string>} */
const out = {};

for await (const line of rl) {
  const t = line.trim();
  if (t === "<entry>") {
    id = null;
    want = false;
    senses = [];
    inSense = false;
    continue;
  }
  if (t.startsWith("<ent_seq>") && t.endsWith("</ent_seq>")) {
    id = t.slice("<ent_seq>".length, -"</ent_seq>".length);
    want = ids.has(id);
    continue;
  }
  if (!want) continue;
  if (t === "<sense>") {
    inSense = true;
    pos = [];
    glosses = [];
    continue;
  }
  if (t === "</sense>") {
    senses.push({ pos, glosses });
    inSense = false;
    continue;
  }
  if (t === "</entry>") {
    const gloss = format(senses);
    if (gloss) out[id] = gloss;
    want = false;
    continue;
  }
  if (!inSense) continue;
  if (t.startsWith("<pos>&") && t.endsWith(";</pos>")) {
    pos.push(t.slice("<pos>&".length, -";</pos>".length));
    continue;
  }
  const gloss = t.match(/^<gloss(?:\s[^>]*)?>(.*)<\/gloss>$/);
  if (gloss) glosses.push(decode(gloss[1]));
}

const missing = [...ids].filter((seq) => !out[seq]);
writeFileSync(resolve(__dirname, "suru-senses.json"), JSON.stringify(out));
const verbish = Object.values(out).filter((g) => g.startsWith("to ")).length;
const labelled = Object.values(out).filter((g) => g.startsWith("(する) ")).length;
console.log(`senses ${Object.keys(out).length}/${ids.size} (to ${verbish}, (する) ${labelled}, missing ${missing.length})`);
if (missing.length) console.log(missing.slice(0, 20).join(" "));
