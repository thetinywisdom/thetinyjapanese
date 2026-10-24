import data from "@/data/kanji-radicals.json";
import { VERBS, type JlptLevel } from "@/data/verbs";
import { katakanaToHiragana } from "@/lib/kana";
import { getKanjiGrade, type SchoolGrade } from "@/data/kanji-radicals";
import type { LevelScheme } from "@/lib/kanji-levels";

interface RadicalsFile {
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

const FILE = data as unknown as RadicalsFile;

export interface RememberCard {
  char: string;
  meaning: string;
  reading: string;
  jlptLevel: JlptLevel;
  grade?: SchoolGrade;
}

function cleanReading(r: string): string {
  return katakanaToHiragana(r.replace(/\./g, "").replace(/-/g, ""));
}

function shortMeaning(m: string): string {
  return m.split(",")[0].trim();
}

function pickReading(entry: { on?: string[]; kun?: string[] }, level: JlptLevel): string | null {
  const kun = (entry.kun ?? []).map(cleanReading).filter(Boolean);
  const on = (entry.on ?? []).map(cleanReading).filter(Boolean);
  const preferKun = level === "N5" || level === "N4";
  const primary = preferKun ? kun : on;
  const fallback = preferKun ? on : kun;
  return primary[0] ?? fallback[0] ?? null;
}

/** Kanji used by any verb in our corpus — we only show what's "useful" to the app. */
const USED_KANJI: Set<string> = (() => {
  const s = new Set<string>();
  for (const v of VERBS) {
    for (const ch of v.dictionary) {
      const c = ch.charCodeAt(0);
      if (c >= 0x4e00 && c <= 0x9fff) s.add(ch);
    }
  }
  return s;
})();

const ALL_CARDS: RememberCard[] = (() => {
  const out: RememberCard[] = [];
  for (const char of USED_KANJI) {
    const entry = FILE.kanji[char];
    if (!entry || !entry.meaning || !entry.jlpt) continue;
    const reading = pickReading(entry, entry.jlpt);
    if (!reading) continue;
    out.push({
      char,
      meaning: shortMeaning(entry.meaning),
      reading,
      jlptLevel: entry.jlpt,
      grade: getKanjiGrade(char),
    });
  }
  return out;
})();

export function buildRememberCards(
  scheme: LevelScheme,
  levels: readonly (JlptLevel | SchoolGrade)[],
): RememberCard[] {
  const set = new Set<JlptLevel | SchoolGrade>(levels);
  return ALL_CARDS.filter((c) =>
    scheme === "jlpt" ? set.has(c.jlptLevel) : c.grade !== undefined && set.has(c.grade),
  );
}

export function getAllRememberCards(): RememberCard[] {
  return ALL_CARDS;
}
