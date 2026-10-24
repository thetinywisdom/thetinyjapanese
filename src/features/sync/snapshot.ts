import { readProgressSnapshot, writeProgressSnapshot } from "@/lib/progress";
import { loadEntries, replaceAllEntries, type DiaryEntry } from "@/features/diary/storage";
import type { FullSnapshot, StateSnapshot } from "./types";

/** localStorage keys that are simple preference strings we carry along. */
export const PREF_KEYS = [
  "lovable.filters.verb",
  "lovable.filters.kanji",
  "lovable.filters.write",
  "lovable.filters.remember",
  "lovable.diary.kanaMode",
  "level-scheme:v1",
];

function readPrefs(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of PREF_KEYS) {
    try {
      const v = localStorage.getItem(key);
      if (v != null) out[key] = v;
    } catch {
      /* ignore */
    }
  }
  return out;
}

function writePrefs(prefs: Record<string, string> = {}) {
  for (const key of PREF_KEYS) {
    const v = prefs[key];
    if (v == null) continue;
    try {
      localStorage.setItem(key, v);
    } catch {
      /* ignore */
    }
  }
}

export function readLocalSnapshot(): FullSnapshot {
  const p = readProgressSnapshot();
  const state: StateSnapshot = {
    version: 1,
    updatedAt: Date.now(),
    progress: p.progress,
    sessions: p.sessions,
    streak: p.streak,
    clearedKanji: p.clearedKanji,
    kanjiStreaks: p.kanjiStreaks,
    prefs: readPrefs(),
  };
  return { state, diary: loadEntries() };
}

export function writeLocalSnapshot(snap: FullSnapshot) {
  writeProgressSnapshot({
    progress: snap.state.progress,
    sessions: snap.state.sessions,
    streak: snap.state.streak,
    clearedKanji: snap.state.clearedKanji,
    kanjiStreaks: snap.state.kanjiStreaks,
  });
  writePrefs(snap.state.prefs);
  replaceAllEntries(snap.diary);
}

export function emptyState(): StateSnapshot {
  return {
    version: 1,
    updatedAt: 0,
    progress: { verb: {}, kanji: {}, "kanji-remember": {}, "kanji-write": {} },
    sessions: [],
    streak: { current: 0, best: 0, lastDay: "" },
    clearedKanji: [],
    kanjiStreaks: {},
    prefs: {},
  };
}

export type { DiaryEntry };
