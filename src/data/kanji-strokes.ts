// Lazy-loaded stroke data (~1 MB JSON, excluded from the main bundle).
import type { JlptLevel } from "@/data/verbs";

export interface KanjiStrokes {
  strokes: string[]; // SVG path `d` strings, in stroke order, on a 109×109 canvas
}

interface StrokesFile {
  version: number;
  viewBox: number;
  kanji: Record<string, KanjiStrokes>;
}

let cache: StrokesFile | null = null;
let pending: Promise<StrokesFile> | null = null;

export const STROKE_VIEWBOX = 109;

export async function loadStrokes(): Promise<StrokesFile> {
  if (cache) return cache;
  if (!pending) {
    pending = import("@/data/kanji-strokes.json").then((m) => {
      cache = m.default as StrokesFile;
      return cache;
    });
  }
  return pending;
}

export async function getStrokes(char: string): Promise<KanjiStrokes | null> {
  const file = await loadStrokes();
  return file.kanji[char] ?? null;
}

export function hasStrokesSync(char: string): boolean {
  return !!cache?.kanji[char];
}

export type { JlptLevel };
