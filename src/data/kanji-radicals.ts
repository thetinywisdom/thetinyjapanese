import data from "@/data/kanji-radicals.json";
import type { JlptLevel } from "@/data/verbs";

/**
 * Japanese school grade from kanjidic2.
 *   1–6 = elementary school grades 1–6 (kyōiku kanji)
 *   8   = remaining jōyō (junior high / high school)
 *   9–10 = jinmeiyō (name-use)
 *
 * The Kanji Kentei (漢検) maps these grades to its own 10→1 scale:
 *   Kanken 10 = grade 1, 9 = grade 2, 8 = grade 3,
 *   7 = grade 4, 6 = grade 5, 5 = grade 6,
 *   4 = secondary common (subset of jōyō), 3 = secondary harder (jōyō),
 *   2 = full jōyō / jinmeiyō, pre-1 / 1 = beyond.
 * We expose the raw kanjidic grade and let the UI label it.
 */
export type SchoolGrade = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 9 | 10;

interface RadicalsFile {
  version: number;
  generatedAt: string;
  kanji: Record<
    string,
    {
      radicals: string[];
      on?: string[];
      kun?: string[];
      meaning?: string;
      jlpt?: JlptLevel;
      grade?: number;
    }
  >;
  radicalNames: Record<string, string>;
}

const FILE = data as RadicalsFile;

export interface Radical {
  char: string;
  name?: string;
}

export interface KanjiBreakdown {
  char: string;
  radicals: Radical[];
  meaning?: string;
  on?: string[];
  kun?: string[];
}

function isKanji(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return c >= 0x4e00 && c <= 0x9fff;
}

export function getRadicals(kanji: string): Radical[] {
  const entry = FILE.kanji[kanji];
  if (!entry) return [];
  return entry.radicals.map((r) => ({
    char: r,
    name: FILE.radicalNames[r],
  }));
}

export function getKanjiMeaning(kanji: string): string | undefined {
  return FILE.kanji[kanji]?.meaning;
}

export function getKanjiJlpt(kanji: string): JlptLevel | undefined {
  return FILE.kanji[kanji]?.jlpt;
}

export function getKanjiGrade(kanji: string): SchoolGrade | undefined {
  const g = FILE.kanji[kanji]?.grade;
  return g as SchoolGrade | undefined;
}

export function getAllKnownKanji(): string[] {
  return Object.keys(FILE.kanji);
}

/** Decompose a word into its kanji characters with each one's radicals + meaning + readings. */
export function decomposeWord(word: string): KanjiBreakdown[] {
  const out: KanjiBreakdown[] = [];
  const seen = new Set<string>();
  for (const ch of word) {
    if (!isKanji(ch) || seen.has(ch)) continue;
    seen.add(ch);
    const entry = FILE.kanji[ch];
    if (!entry) continue;
    const radicals = entry.radicals.map((r) => ({
      char: r,
      name: FILE.radicalNames[r],
    }));
    if (!radicals.length && !entry.meaning && !entry.on?.length && !entry.kun?.length) continue;
    out.push({
      char: ch,
      radicals,
      meaning: entry.meaning,
      on: entry.on,
      kun: entry.kun,
    });
  }
  return out;
}
