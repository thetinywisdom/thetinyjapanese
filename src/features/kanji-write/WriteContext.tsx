import { createContext, useContext, useMemo, useReducer, useEffect, useState, type ReactNode } from "react";
import type { JlptLevel } from "@/data/verbs";
import type { SchoolGrade } from "@/data/kanji-radicals";
import { defaultLevelsFor, type LevelScheme } from "@/lib/kanji-levels";
import { useLevelScheme } from "@/features/level-scheme/useLevelScheme";
import { buildKanjiCards, type KanjiCardSource } from "@/features/kanji/cards";
import { loadStrokes } from "@/data/kanji-strokes";
import {
  getClearedKanjiSet,
  recordAnswer,
  recordKanjiCharResult,
  recordSession,
} from "@/lib/progress";
import { loadFilters, saveFilters } from "@/lib/persisted-filters";

const FILTERS_STORAGE_KEY = "lovable.filters.write";

export interface WriteFilters {
  scheme: LevelScheme;
  levels: (JlptLevel | SchoolGrade)[];
  sessionLength: number;
  includeCleared: boolean;
}

export interface WriteRecord {
  card: KanjiCardSource;
  completed: boolean; // finished all strokes
  hintsUsed: number;
  mistakes: number;
}

interface State {
  filters: WriteFilters;
  queue: KanjiCardSource[];
  current: KanjiCardSource | null;
  history: WriteRecord[];
  status: "idle" | "writing" | "done" | "finished";
}

type Action =
  | { type: "SET_FILTERS"; filters: Partial<WriteFilters> }
  | { type: "START"; queue: KanjiCardSource[] }
  | { type: "FINISH_CARD"; record: WriteRecord }
  | { type: "ADVANCE" }
  | { type: "RESET" };

const DEFAULT_FILTERS: WriteFilters = {
  scheme: "jlpt",
  levels: ["N5"],
  sessionLength: 5,
  includeCleared: false,
};


const initialState: State = {
  filters: DEFAULT_FILTERS,
  queue: [],
  current: null,
  history: [],
  status: "idle",
};

function makeInitialState(): State {
  return { ...initialState, filters: loadFilters(FILTERS_STORAGE_KEY, DEFAULT_FILTERS) };
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "SET_FILTERS":
      return { ...s, filters: { ...s.filters, ...a.filters } };
    case "START": {
      const [first, ...rest] = a.queue;
      return { ...s, queue: rest, current: first ?? null, history: [], status: first ? "writing" : "idle" };
    }
    case "FINISH_CARD":
      return { ...s, history: [...s.history, a.record], status: "done" };
    case "ADVANCE": {
      const [first, ...rest] = s.queue;
      if (!first) return { ...s, current: null, status: "finished" };
      return { ...s, current: first, queue: rest, status: "writing" };
    }
    case "RESET":
      return { ...initialState, filters: s.filters };
  }
}

function shuffle<T>(arr: T[]): T[] {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

interface Ctx {
  state: State;
  ready: boolean;
  poolSize: number;
  clearedHiddenCount: number;
  setFilters: (f: Partial<WriteFilters>) => void;
  startSession: () => void;
  finishCard: (r: WriteRecord) => void;
  skipCurrent: () => void;
  advance: () => void;
  reset: () => void;
}

const WriteCtx = createContext<Ctx | null>(null);

export function WriteProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as State, makeInitialState);
  const [strokesData, setStrokesData] = useState<{ kanji: Record<string, unknown> } | null>(null);

  useEffect(() => {
    saveFilters(FILTERS_STORAGE_KEY, state.filters);
  }, [state.filters]);

  useEffect(() => {
    loadStrokes().then(setStrokesData).catch(() => setStrokesData({ kanji: {} }));
  }, []);

  const [globalScheme] = useLevelScheme();
  useEffect(() => {
    if (state.filters.scheme !== globalScheme) {
      dispatch({
        type: "SET_FILTERS",
        filters: { scheme: globalScheme, levels: defaultLevelsFor(globalScheme) },
      });
    }
  }, [globalScheme, state.filters.scheme]);

  const value = useMemo<Ctx>(() => {
    const all = buildKanjiCards(state.filters.scheme, state.filters.levels);
    const cleared = getClearedKanjiSet();
    // Verbs use full dictionary forms (e.g. "会う"); stroke data is indexed by
    // single kanji characters. Expand each verb card into per-character cards
    // and dedupe, keeping the first verb as the meaning/reading example.
    const seen = new Map<string, KanjiCardSource>();
    for (const c of all) {
      for (const ch of c.kanji) {
        const code = ch.charCodeAt(0);
        const isKanji =
          (code >= 0x4e00 && code <= 0x9fff) ||
          (code >= 0x3400 && code <= 0x4dbf);
        if (!isKanji || seen.has(ch)) continue;
        if (strokesData && !strokesData.kanji[ch]) continue;
        seen.set(ch, { ...c, id: `${c.id}:${ch}`, kanji: ch });
      }
    }
    const allChars = Array.from(seen.values());
    const clearedHiddenCount = allChars.filter((c) => cleared.has(c.kanji)).length;
    const pool = state.filters.includeCleared
      ? allChars
      : allChars.filter((c) => !cleared.has(c.kanji));
    const pickSession = () => shuffle(pool).slice(0, state.filters.sessionLength);
    return {
      state,
      ready: !!strokesData,
      poolSize: pool.length,
      clearedHiddenCount,
      setFilters: (f) => dispatch({ type: "SET_FILTERS", filters: f }),
      startSession: () => dispatch({ type: "START", queue: pickSession() }),
      finishCard: (r) => {
        dispatch({ type: "FINISH_CARD", record: r });
        const ok = r.completed && r.mistakes === 0;
        recordAnswer("kanji-write", r.card.kanji, r.card.kanji, ok, r.card.meaning);
        recordKanjiCharResult(r.card.kanji, ok);
      },
      skipCurrent: () => {
        if (!state.current || state.status !== "writing") return;
        const rec: WriteRecord = { card: state.current, completed: false, hintsUsed: 0, mistakes: 0 };
        dispatch({ type: "FINISH_CARD", record: rec });
        recordAnswer("kanji-write", state.current.kanji, state.current.kanji, false, state.current.meaning);
        recordKanjiCharResult(state.current.kanji, false);
      },
      advance: () => {
        if (state.queue.length === 0 && state.current) {
          const correct = state.history.filter((r) => r.completed).length;
          recordSession("kanji-write", correct, state.history.length);
        }
        dispatch({ type: "ADVANCE" });
      },
      reset: () => dispatch({ type: "RESET" }),
    };
  }, [state, strokesData]);

  return <WriteCtx.Provider value={value}>{children}</WriteCtx.Provider>;
}

export function useWrite() {
  const ctx = useContext(WriteCtx);
  if (!ctx) throw new Error("useWrite must be used inside <WriteProvider>");
  return ctx;
}
