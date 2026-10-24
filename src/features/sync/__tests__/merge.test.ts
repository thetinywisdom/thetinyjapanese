import { describe, it, expect } from "vitest";
import { mergeDiary, mergeState } from "../merge";
import { emptyState } from "../snapshot";
import type { StateSnapshot } from "../types";
import type { DiaryEntry } from "@/features/diary/storage";

function stat(id: string, seen: number, correct: number, lastSeen = 1) {
  return { id, label: id, seen, correct, lastSeen };
}

function withVerb(map: Record<string, ReturnType<typeof stat>>, updatedAt = 1): StateSnapshot {
  return { ...emptyState(), updatedAt, progress: { ...emptyState().progress, verb: map } };
}

describe("mergeState", () => {
  it("returns empty when both sides are empty", () => {
    const out = mergeState(emptyState(), emptyState());
    expect(out.progress.verb).toEqual({});
    expect(out.sessions).toEqual([]);
  });

  it("keeps local-only and remote-only items", () => {
    const out = mergeState(withVerb({ a: stat("a", 1, 1) }), withVerb({ b: stat("b", 2, 1) }));
    expect(Object.keys(out.progress.verb).sort()).toEqual(["a", "b"]);
  });

  it("takes the highest counts on conflict", () => {
    const out = mergeState(
      withVerb({ a: stat("a", 5, 3, 10) }),
      withVerb({ a: stat("a", 2, 4, 20) }),
    );
    expect(out.progress.verb.a).toMatchObject({ seen: 5, correct: 4, lastSeen: 20 });
  });

  it("unions cleared kanji and maxes per-kanji streaks", () => {
    const local = { ...emptyState(), clearedKanji: ["水"], kanjiStreaks: { 火: 2 } };
    const remote = { ...emptyState(), clearedKanji: ["火"], kanjiStreaks: { 火: 4 } };
    const out = mergeState(local, remote);
    expect(out.clearedKanji).toEqual(["水", "火"].sort());
    expect(out.kanjiStreaks["火"]).toBe(4);
  });

  it("de-duplicates sessions", () => {
    const s = { kind: "verb" as const, date: 5, correct: 1, total: 2 };
    const out = mergeState({ ...emptyState(), sessions: [s] }, { ...emptyState(), sessions: [s] });
    expect(out.sessions).toHaveLength(1);
  });

  it("prefers the newer side for preferences", () => {
    const local = { ...emptyState(), updatedAt: 100, prefs: { x: "local" } };
    const remote = { ...emptyState(), updatedAt: 50, prefs: { x: "remote", y: "r" } };
    const out = mergeState(local, remote);
    expect(out.prefs).toEqual({ x: "local", y: "r" });
  });
});

describe("mergeDiary", () => {
  const entry = (id: string, updatedAt: number, text: string): DiaryEntry => ({
    id,
    dateISO: "2026-09-05",
    drawing: "",
    text,
    direction: "vertical",
    updatedAt,
  });

  it("keeps entries from both sides", () => {
    const out = mergeDiary([entry("a", 1, "a")], [entry("b", 1, "b")]);
    expect(out.map((e) => e.id).sort()).toEqual(["a", "b"]);
  });

  it("keeps the most recently edited version on conflict", () => {
    const out = mergeDiary([entry("a", 10, "old")], [entry("a", 20, "new")]);
    expect(out).toHaveLength(1);
    expect(out[0].text).toBe("new");
  });
});
