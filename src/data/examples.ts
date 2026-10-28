import data from "@/data/examples.json";

interface ExamplesFile {
  version: number;
  generatedAt: string;
  byVerbId: Record<string, Example[]>;
  byKanji: Record<string, Example[]>;
}

export interface Example {
  ja: string;
  en: string;
}

const FILE = data as ExamplesFile;

/**
 * Examples are keyed by `${id}|${reading}` so homographs (開く あく / ひらく)
 * do not share a sentence. Falls back to a bare id for older files.
 */
export function getVerbExamples(verbId: string, reading?: string): Example[] {
  if (reading) {
    const keyed = FILE.byVerbId[`${verbId}|${reading}`];
    if (keyed) return keyed;
  }
  return FILE.byVerbId[verbId] ?? [];
}

export function getKanjiExamples(kanji: string): Example[] {
  return FILE.byKanji[kanji] ?? [];
}
