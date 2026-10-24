import type { ItemStat, SessionRecord, StreakInfo } from "@/lib/progress";
import type { DiaryEntry } from "@/features/diary/storage";

/** Everything the app keeps for a learner, in one serialisable object. */
export interface StateSnapshot {
  version: 1;
  /** epoch ms — used to break ties on simple preference values. */
  updatedAt: number;
  progress: {
    verb: Record<string, ItemStat>;
    kanji: Record<string, ItemStat>;
    "kanji-remember": Record<string, ItemStat>;
    "kanji-write": Record<string, ItemStat>;
  };
  sessions: SessionRecord[];
  streak: StreakInfo;
  clearedKanji: string[];
  kanjiStreaks: Record<string, number>;
  /** Raw localStorage strings for filters / level scheme / kana mode. */
  prefs: Record<string, string>;
}

export type ProgressKind = keyof StateSnapshot["progress"];

export interface FullSnapshot {
  state: StateSnapshot;
  diary: DiaryEntry[];
}
