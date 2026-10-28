import wordsData from "@/data/words.json";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";
export type WordType = "verb" | "adj-i" | "adj-na" | "noun";

export interface WordEntry {
  id: string;
  dictionary: string;
  reading: string;
  meaning: string;
  pos: string[];
  wordType: WordType;
  /** For verbs: godan-*, ichidan, irregular-*; for adjectives: adj-i / adj-i-yoi / adj-na; for nouns: "noun". */
  verbClass: string;
  jlptLevel: JlptLevel | null;
  /**
   * Kanji spelling kept after `dictionary` is switched to the kana natives
   * write (ある, する, くれる). Used by the furigana index only.
   */
  kanjiForm?: string;
}

interface WordsFile {
  version: number;
  generatedAt: string;
  entries: WordEntry[];
}

export const WORDS: WordEntry[] = (wordsData as WordsFile).entries;
export const WORDS_GENERATED_AT: string = (wordsData as WordsFile).generatedAt;

/** Dictionary spellings that belong to more than one reading (辛い = からい / つらい). */
const AMBIGUOUS_DICTIONARIES = new Set<string>();
{
  const readings = new Map<string, string>();
  for (const w of WORDS) {
    const prev = readings.get(w.dictionary);
    if (prev === undefined) readings.set(w.dictionary, w.reading);
    else if (prev !== w.reading) AMBIGUOUS_DICTIONARIES.add(w.dictionary);
  }
}

export function sharesDictionary(dictionary: string): boolean {
  return AMBIGUOUS_DICTIONARIES.has(dictionary);
}

export const WORD_TYPE_LABEL: Record<WordType, string> = {
  verb: "Verb",
  "adj-i": "い-adjective",
  "adj-na": "な-adjective",
  noun: "Noun",
};

export function wordStats() {
  const byLevel: Record<string, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
  const byType: Record<WordType, number> = { verb: 0, "adj-i": 0, "adj-na": 0, noun: 0 };
  for (const w of WORDS) {
    if (w.jlptLevel) byLevel[w.jlptLevel]++;
    byType[w.wordType]++;
  }
  return { total: WORDS.length, byLevel, byType };
}
