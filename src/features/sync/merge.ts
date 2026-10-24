import type { ItemStat, SessionRecord, StreakInfo } from "@/lib/progress";
import type { DiaryEntry } from "@/features/diary/storage";
import type { StateSnapshot } from "./types";

function mergeStatMaps(
  a: Record<string, ItemStat> = {},
  b: Record<string, ItemStat> = {},
): Record<string, ItemStat> {
  const out: Record<string, ItemStat> = { ...a };
  for (const [id, remote] of Object.entries(b)) {
    const local = out[id];
    if (!local) {
      out[id] = remote;
      continue;
    }
    out[id] = {
      id,
      label: (local.lastSeen >= remote.lastSeen ? local.label : remote.label) || local.label,
      sub: local.lastSeen >= remote.lastSeen ? (local.sub ?? remote.sub) : (remote.sub ?? local.sub),
      seen: Math.max(local.seen, remote.seen),
      correct: Math.max(local.correct, remote.correct),
      lastSeen: Math.max(local.lastSeen, remote.lastSeen),
    };
  }
  return out;
}

function mergeSessions(a: SessionRecord[] = [], b: SessionRecord[] = []): SessionRecord[] {
  const seen = new Set<string>();
  const out: SessionRecord[] = [];
  for (const s of [...a, ...b].sort((x, y) => y.date - x.date)) {
    const key = `${s.kind}|${s.date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out.slice(0, 20);
}

function mergeStreak(a: StreakInfo, b: StreakInfo): StreakInfo {
  const empty: StreakInfo = { current: 0, best: 0, lastDay: "" };
  const x = a ?? empty;
  const y = b ?? empty;
  const newer = (x.lastDay ?? "") >= (y.lastDay ?? "") ? x : y;
  return {
    current: newer.current,
    best: Math.max(x.best ?? 0, y.best ?? 0),
    lastDay: newer.lastDay ?? "",
  };
}

function mergeNumberMaps(
  a: Record<string, number> = {},
  b: Record<string, number> = {},
): Record<string, number> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = Math.max(out[k] ?? 0, v);
  return out;
}

/** Merge two full app states. Neither side is authoritative — best of both wins. */
export function mergeState(local: StateSnapshot, remote: StateSnapshot): StateSnapshot {
  const localNewer = (local?.updatedAt ?? 0) >= (remote?.updatedAt ?? 0);
  return {
    version: 1,
    updatedAt: Math.max(local?.updatedAt ?? 0, remote?.updatedAt ?? 0),
    progress: {
      verb: mergeStatMaps(local?.progress?.verb, remote?.progress?.verb),
      kanji: mergeStatMaps(local?.progress?.kanji, remote?.progress?.kanji),
      "kanji-remember": mergeStatMaps(
        local?.progress?.["kanji-remember"],
        remote?.progress?.["kanji-remember"],
      ),
      "kanji-write": mergeStatMaps(
        local?.progress?.["kanji-write"],
        remote?.progress?.["kanji-write"],
      ),
    },
    sessions: mergeSessions(local?.sessions, remote?.sessions),
    streak: mergeStreak(local?.streak, remote?.streak),
    clearedKanji: [...new Set([...(local?.clearedKanji ?? []), ...(remote?.clearedKanji ?? [])])].sort(),
    kanjiStreaks: mergeNumberMaps(local?.kanjiStreaks, remote?.kanjiStreaks),
    prefs: localNewer
      ? { ...(remote?.prefs ?? {}), ...(local?.prefs ?? {}) }
      : { ...(local?.prefs ?? {}), ...(remote?.prefs ?? {}) },
  };
}

/** Keep every entry from both sides; the most recently edited version wins. */
export function mergeDiary(local: DiaryEntry[] = [], remote: DiaryEntry[] = []): DiaryEntry[] {
  const byId = new Map<string, DiaryEntry>();
  for (const e of [...remote, ...local]) {
    const prev = byId.get(e.id);
    if (!prev || (e.updatedAt ?? 0) > (prev.updatedAt ?? 0)) byId.set(e.id, e);
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}
