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

export function getVerbExamples(verbId: string): Example[] {
  return FILE.byVerbId[verbId] ?? [];
}

export function getKanjiExamples(kanji: string): Example[] {
  return FILE.byKanji[kanji] ?? [];
}
