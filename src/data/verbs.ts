import verbsData from "@/data/verbs.json";

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1";

export interface VerbEntry {
  id: string;
  dictionary: string;
  reading: string;
  meaning: string;
  pos: string[];
  verbClass: string;
  jlptLevel: JlptLevel | null;
}

interface VerbsFile {
  version: number;
  generatedAt: string;
  entries: VerbEntry[];
}

export const VERBS: VerbEntry[] = (verbsData as VerbsFile).entries;
export const VERBS_GENERATED_AT: string = (verbsData as VerbsFile).generatedAt;

export function verbStats() {
  const byLevel: Record<string, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
  const byClass: Record<string, number> = { ichidan: 0, godan: 0, "irregular-suru": 0, "irregular-kuru": 0 };
  for (const v of VERBS) {
    if (v.jlptLevel) byLevel[v.jlptLevel]++;
    const k = v.verbClass.startsWith("godan-") ? "godan" : v.verbClass;
    byClass[k] = (byClass[k] ?? 0) + 1;
  }
  return { total: VERBS.length, byLevel, byClass };
}
