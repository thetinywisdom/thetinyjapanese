/**
 * Global "which level system are we using?" store.
 *
 * One source of truth for the JLPT-vs-school-grade toggle, persisted to
 * localStorage and shared across every practice mode + the progress page.
 * Each feature context subscribes via `useLevelScheme()` and resets its own
 * `levels` selection to the scheme's defaults whenever the user switches.
 */
import { useEffect, useState } from "react";
import type { LevelScheme } from "@/lib/kanji-levels";

const KEY = "level-scheme:v1";

type Listener = (s: LevelScheme) => void;
const listeners = new Set<Listener>();

function readInitial(): LevelScheme {
  if (typeof localStorage === "undefined") return "jlpt";
  try {
    const v = localStorage.getItem(KEY);
    return v === "grade" ? "grade" : "jlpt";
  } catch {
    return "jlpt";
  }
}

let current: LevelScheme = readInitial();

export function getLevelScheme(): LevelScheme {
  return current;
}

export function setLevelScheme(next: LevelScheme): void {
  if (next === current) return;
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn(next));
}

export function useLevelScheme(): [LevelScheme, (s: LevelScheme) => void] {
  const [scheme, setScheme] = useState<LevelScheme>(current);
  useEffect(() => {
    const fn: Listener = (s) => setScheme(s);
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      const next = e.newValue === "grade" ? "grade" : "jlpt";
      if (next !== current) {
        current = next;
        listeners.forEach((l) => l(next));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return [scheme, setLevelScheme];
}
