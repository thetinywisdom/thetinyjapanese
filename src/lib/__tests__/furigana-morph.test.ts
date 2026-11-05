/**
 * @vitest-environment node
 */
import { createRequire } from "node:module";
import path from "node:path";
import { describe, it, expect, beforeAll } from "vitest";
import { annotateWithTokenizer, joinedRuby, type MorphTokenizer } from "../furigana-analyze";
import golden from "./furigana-golden.json";

const require = createRequire(import.meta.url);
const kuromoji = require("kuromoji") as {
  builder: (opts: { dicPath: string }) => {
    build: (cb: (err: Error | null, tokenizer: MorphTokenizer) => void) => void;
  };
};

let tokenizer: MorphTokenizer;

beforeAll(async () => {
  tokenizer = await new Promise((resolve, reject) => {
    kuromoji
      .builder({ dicPath: path.resolve("node_modules/kuromoji/dict") })
      .build((err, built) => {
        if (err || !built) reject(err ?? new Error("kuromoji"));
        else resolve(built);
      });
  });
}, 30_000);

describe("diary furigana golden cases", () => {
  it("covers the readings the naive matcher got wrong", () => {
    expect(golden.length).toBeGreaterThanOrEqual(8);
  });

  for (const row of golden as { input: string; ruby: string; contains?: boolean }[]) {
    it(`${row.input} → ${row.ruby}`, () => {
      const got = joinedRuby(annotateWithTokenizer(row.input, tokenizer));
      if (row.contains) expect(got).toContain(row.ruby);
      else expect(got).toBe(row.ruby);
    });
  }
});
