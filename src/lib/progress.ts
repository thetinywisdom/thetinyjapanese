// Local-only progress tracking via localStorage. No backend, no login.
// Per-device, survives reloads. Keys are versioned so we can migrate later.

const VERBS_KEY = "tk.progress.v1.verbs";
const KANJI_KEY = "tk.progress.v1.kanji";
const KANJI_REMEMBER_KEY = "tk.progress.v1.kanji-remember";
const KANJI_WRITE_KEY = "tk.progress.v1.kanji-write";
const SESSIONS_KEY = "tk.progress.v1.sessions";
const STREAK_KEY = "tk.progress.v1.streak";
const CLEARED_KANJI_KEY = "tk.progress.v1.cleared-kanji";
const KANJI_STREAK_KEY = "tk.progress.v1.kanji-streak";

/** Correct-in-a-row needed to "clear" a kanji and hide it from quizzes. */
export const KANJI_CLEAR_THRESHOLD = 5;

const MAX_SESSIONS = 20;

export type ItemKind = "verb" | "kanji" | "kanji-remember" | "kanji-write";

function keyFor(kind: ItemKind): string {
  if (kind === "verb") return VERBS_KEY;
  if (kind === "kanji") return KANJI_KEY;
  if (kind === "kanji-write") return KANJI_WRITE_KEY;
  return KANJI_REMEMBER_KEY;
}

export interface ItemStat {
  id: string;          // verb id + question, or kanji char
  label: string;       // human-readable (e.g. "食べる · te-form" or "水")
  sub?: string;        // optional subtitle (meaning/reading)
  seen: number;
  correct: number;
  lastSeen: number;    // epoch ms
}

export interface SessionRecord {
  kind: ItemKind;
  date: number;        // epoch ms
  correct: number;
  total: number;
}

export interface StreakInfo {
  current: number;
  best: number;
  lastDay: string;     // YYYY-MM-DD
}

interface Subscriber { (): void }
const subscribers = new Set<Subscriber>();

// Cached snapshots so useSyncExternalStore gets stable references between notifications.
let verbStatsCache: ItemStat[] | null = null;
let kanjiStatsCache: ItemStat[] | null = null;
let kanjiRememberStatsCache: ItemStat[] | null = null;
let kanjiWriteStatsCache: ItemStat[] | null = null;
let sessionsCache: SessionRecord[] | null = null;
let streakCache: StreakInfo | null = null;
let overallCache: OverallStats | null = null;
let clearedKanjiCache: Set<string> | null = null;
let clearedKanjiArrayCache: string[] | null = null;
let kanjiStreakCache: Record<string, number> | null = null;

function invalidateCaches() {
  verbStatsCache = null;
  kanjiStatsCache = null;
  kanjiRememberStatsCache = null;
  kanjiWriteStatsCache = null;
  sessionsCache = null;
  streakCache = null;
  overallCache = null;
  clearedKanjiCache = null;
  clearedKanjiArrayCache = null;
  kanjiStreakCache = null;
}

function notify() {
  invalidateCaches();
  subscribers.forEach((fn) => fn());
}

export function subscribe(fn: Subscriber) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function readMap(key: string): Record<string, ItemStat> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ItemStat>;
  } catch {
    return {};
  }
}

function writeMap(key: string, data: Record<string, ItemStat>) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* quota / private mode — silently ignore */
  }
}

function readSessions(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

function writeSessions(sessions: SessionRecord[]) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    /* ignore */
  }
}

function todayStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function readStreak(): StreakInfo {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { current: 0, best: 0, lastDay: "" };
    return JSON.parse(raw) as StreakInfo;
  } catch {
    return { current: 0, best: 0, lastDay: "" };
  }
}

function writeStreak(s: StreakInfo) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

function bumpStreak() {
  const today = todayStr();
  const s = readStreak();
  if (s.lastDay === today) return;
  // is yesterday?
  const yesterday = todayStr(new Date(Date.now() - 86_400_000));
  const next: StreakInfo = {
    current: s.lastDay === yesterday ? s.current + 1 : 1,
    best: 0,
    lastDay: today,
  };
  next.best = Math.max(s.best, next.current);
  writeStreak(next);
}

// ── public API ──────────────────────────────────────────────────────────────

export function recordAnswer(
  kind: ItemKind,
  id: string,
  label: string,
  correct: boolean,
  sub?: string,
) {
  const key = keyFor(kind);
  const map = readMap(key);
  const prev = map[id] ?? { id, label, sub, seen: 0, correct: 0, lastSeen: 0 };
  map[id] = {
    id,
    label,
    sub: sub ?? prev.sub,
    seen: prev.seen + 1,
    correct: prev.correct + (correct ? 1 : 0),
    lastSeen: Date.now(),
  };
  writeMap(key, map);
  bumpStreak();
  notify();
}

export function recordSession(kind: ItemKind, correct: number, total: number) {
  if (total === 0) return;
  const sessions = readSessions();
  sessions.unshift({ kind, date: Date.now(), correct, total });
  writeSessions(sessions.slice(0, MAX_SESSIONS));
  notify();
}

export function getItemStats(kind: ItemKind): ItemStat[] {
  if (kind === "verb") {
    if (!verbStatsCache) verbStatsCache = Object.values(readMap(VERBS_KEY));
    return verbStatsCache;
  }
  if (kind === "kanji") {
    if (!kanjiStatsCache) kanjiStatsCache = Object.values(readMap(KANJI_KEY));
    return kanjiStatsCache;
  }
  if (kind === "kanji-write") {
    if (!kanjiWriteStatsCache) {
      kanjiWriteStatsCache = Object.values(readMap(KANJI_WRITE_KEY));
    }
    return kanjiWriteStatsCache;
  }
  if (!kanjiRememberStatsCache) {
    kanjiRememberStatsCache = Object.values(readMap(KANJI_REMEMBER_KEY));
  }
  return kanjiRememberStatsCache;
}

export function getItemStat(kind: ItemKind, id: string): ItemStat | null {
  return readMap(keyFor(kind))[id] ?? null;
}

/**
 * Items the learner is struggling with: seen ≥ 2 times AND accuracy < 60%.
 * Sorted by lowest accuracy first, then by most recently seen.
 */
export function getCriticalItems(kind: ItemKind): ItemStat[] {
  return getItemStats(kind)
    .filter((it) => it.seen >= 2 && it.correct / it.seen < 0.6)
    .sort((a, b) => {
      const accA = a.correct / a.seen;
      const accB = b.correct / b.seen;
      if (accA !== accB) return accA - accB;
      return b.lastSeen - a.lastSeen;
    });
}

export function getSessions(): SessionRecord[] {
  if (!sessionsCache) sessionsCache = readSessions();
  return sessionsCache;
}

export function getStreak(): StreakInfo {
  if (!streakCache) streakCache = readStreak();
  return streakCache;
}

export interface OverallStats {
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number; // 0-100
  sessionsCompleted: number;
  uniqueItems: number;
}

export function getOverallStats(): OverallStats {
  if (overallCache) return overallCache;
  const verbs = getItemStats("verb");
  const kanji = getItemStats("kanji");
  const kanjiRemember = getItemStats("kanji-remember");
  const kanjiWrite = getItemStats("kanji-write");
  let answered = 0;
  let correct = 0;
  for (const it of [...verbs, ...kanji, ...kanjiRemember, ...kanjiWrite]) {
    answered += it.seen;
    correct += it.correct;
  }
  overallCache = {
    totalAnswered: answered,
    totalCorrect: correct,
    accuracy: answered ? Math.round((correct / answered) * 100) : 0,
    sessionsCompleted: getSessions().length,
    uniqueItems: verbs.length + kanji.length + kanjiRemember.length + kanjiWrite.length,
  };
  return overallCache;
}

export function resetProgress() {
  try {
    localStorage.removeItem(VERBS_KEY);
    localStorage.removeItem(KANJI_KEY);
    localStorage.removeItem(KANJI_REMEMBER_KEY);
    localStorage.removeItem(KANJI_WRITE_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(STREAK_KEY);
    localStorage.removeItem(CLEARED_KANJI_KEY);
    localStorage.removeItem(KANJI_STREAK_KEY);
  } catch {
    /* ignore */
  }
  notify();
}

// ── cleared-kanji tracking ──────────────────────────────────────────────────
// A kanji is "cleared" after KANJI_CLEAR_THRESHOLD correct answers in a row in
// any kanji mode (Read / Write / Remember). Cleared kanji are excluded from
// quiz pools by default; the user can opt back in via a filter toggle.

function isKanjiChar(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return (
    (code >= 0x4e00 && code <= 0x9fff) ||
    (code >= 0x3400 && code <= 0x4dbf)
  );
}

function readClearedKanji(): Set<string> {
  if (clearedKanjiCache) return clearedKanjiCache;
  try {
    const raw = localStorage.getItem(CLEARED_KANJI_KEY);
    clearedKanjiCache = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    clearedKanjiCache = new Set<string>();
  }
  return clearedKanjiCache;
}

function writeClearedKanji(set: Set<string>) {
  try {
    localStorage.setItem(CLEARED_KANJI_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
  clearedKanjiCache = set;
  clearedKanjiArrayCache = null;
}

function readKanjiStreaks(): Record<string, number> {
  if (kanjiStreakCache) return kanjiStreakCache;
  try {
    const raw = localStorage.getItem(KANJI_STREAK_KEY);
    kanjiStreakCache = raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    kanjiStreakCache = {};
  }
  return kanjiStreakCache;
}

function writeKanjiStreaks(s: Record<string, number>) {
  try {
    localStorage.setItem(KANJI_STREAK_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
  kanjiStreakCache = s;
}

export function getClearedKanji(): string[] {
  if (!clearedKanjiArrayCache) {
    clearedKanjiArrayCache = [...readClearedKanji()].sort();
  }
  return clearedKanjiArrayCache;
}

export function getClearedKanjiSet(): Set<string> {
  return readClearedKanji();
}

export function isKanjiCleared(char: string): boolean {
  return readClearedKanji().has(char);
}

export function getKanjiStreak(char: string): number {
  return readKanjiStreaks()[char] ?? 0;
}

export function getAllKanjiStreaks(): Record<string, number> {
  return readKanjiStreaks();
}

/**
 * Record a correct/incorrect answer for a single kanji character.
 * Updates the streak and auto-clears the kanji when the threshold is reached.
 * Safe to call for any string — non-kanji characters are ignored.
 */
export function recordKanjiCharResult(char: string, correct: boolean) {
  if (!isKanjiChar(char)) return;
  const streaks = { ...readKanjiStreaks() };
  const cleared = new Set(readClearedKanji());
  let changed = false;
  if (correct) {
    const next = (streaks[char] ?? 0) + 1;
    streaks[char] = next;
    if (next >= KANJI_CLEAR_THRESHOLD && !cleared.has(char)) {
      cleared.add(char);
      changed = true;
    }
  } else {
    if ((streaks[char] ?? 0) !== 0) {
      streaks[char] = 0;
      changed = true;
    }
  }
  writeKanjiStreaks(streaks);
  if (changed) writeClearedKanji(cleared);
  notify();
}

/** Record results for every kanji character contained in `word`. */
export function recordWordKanjiResults(word: string, correct: boolean) {
  const seen = new Set<string>();
  for (const ch of word) {
    if (!isKanjiChar(ch) || seen.has(ch)) continue;
    seen.add(ch);
    recordKanjiCharResult(ch, correct);
  }
}

/** Remove the cleared flag and reset the streak for a kanji. */
export function unclearKanji(char: string) {
  const cleared = new Set(readClearedKanji());
  const streaks = { ...readKanjiStreaks() };
  cleared.delete(char);
  streaks[char] = 0;
  writeClearedKanji(cleared);
  writeKanjiStreaks(streaks);
  notify();
}


// ── cloud-sync helpers ──────────────────────────────────────────────────────
// Raw read/write of the whole local progress state, used by the sync layer.

export interface ProgressSnapshot {
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
}

export function readProgressSnapshot(): ProgressSnapshot {
  return {
    progress: {
      verb: readMap(VERBS_KEY),
      kanji: readMap(KANJI_KEY),
      "kanji-remember": readMap(KANJI_REMEMBER_KEY),
      "kanji-write": readMap(KANJI_WRITE_KEY),
    },
    sessions: readSessions(),
    streak: readStreak(),
    clearedKanji: [...readClearedKanji()],
    kanjiStreaks: { ...readKanjiStreaks() },
  };
}

export function writeProgressSnapshot(snap: ProgressSnapshot) {
  writeMap(VERBS_KEY, snap.progress.verb ?? {});
  writeMap(KANJI_KEY, snap.progress.kanji ?? {});
  writeMap(KANJI_REMEMBER_KEY, snap.progress["kanji-remember"] ?? {});
  writeMap(KANJI_WRITE_KEY, snap.progress["kanji-write"] ?? {});
  writeSessions(snap.sessions ?? []);
  writeStreak(snap.streak ?? { current: 0, best: 0, lastDay: "" });
  writeClearedKanji(new Set(snap.clearedKanji ?? []));
  writeKanjiStreaks(snap.kanjiStreaks ?? {});
  notify();
}
