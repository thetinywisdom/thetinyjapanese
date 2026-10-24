import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { JlptLevel } from "@/data/verbs";
import type { SchoolGrade } from "@/data/kanji-radicals";
import { buildKanjiCards, type KanjiCardSource } from "./cards";
import { katakanaToHiragana, normalize } from "@/lib/kana";
import { defaultLevelsFor, type LevelScheme } from "@/lib/kanji-levels";
import { useLevelScheme } from "@/features/level-scheme/useLevelScheme";
import {
  getClearedKanjiSet,
  getCriticalItems,
  recordAnswer,
  recordSession,
  recordWordKanjiResults,
} from "@/lib/progress";
import { loadFilters, saveFilters } from "@/lib/persisted-filters";

const FILTERS_STORAGE_KEY = "lovable.filters.kanji";

export interface KanjiFilters {
  scheme: LevelScheme;
  levels: (JlptLevel | SchoolGrade)[];
  sessionLength: number;
  showMeaning: boolean;
  includeCleared: boolean;
}

export interface ReviewRecord {
  card: KanjiCardSource;
  userAnswer: string;
  correct: boolean;
}

interface State {
  filters: KanjiFilters;
  queue: KanjiCardSource[];
  current: KanjiCardSource | null;
  history: ReviewRecord[];
  status: "idle" | "prompt" | "feedback" | "finished";
}

type Action =
  | { type: "SET_FILTERS"; filters: Partial<KanjiFilters> }
  | { type: "START"; queue: KanjiCardSource[] }
  | { type: "SUBMIT"; record: ReviewRecord }
  | { type: "ADVANCE" }
  | { type: "RESET" };

const DEFAULT_FILTERS: KanjiFilters = {
  scheme: "jlpt",
  levels: ["N5"],
  sessionLength: 10,
  showMeaning: false,
  includeCleared: false,
};


/** True when every kanji character in `word` is cleared. */
function wordFullyCleared(word: string, cleared: Set<string>): boolean {
  let hasKanji = false;
  for (const ch of word) {
    const code = ch.charCodeAt(0);
    const isK =
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf);
    if (!isK) continue;
    hasKanji = true;
    if (!cleared.has(ch)) return false;
  }
  return hasKanji;
}

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
      return {
        ...s,
        queue: rest,
        current: first ?? null,
        history: [],
        status: first ? "prompt" : "idle",
      };
    }
    case "SUBMIT":
      return { ...s, history: [...s.history, a.record], status: "feedback" };
    case "ADVANCE": {
      const [first, ...rest] = s.queue;
      if (!first) return { ...s, current: null, status: "finished" };
      return { ...s, current: first, queue: rest, status: "prompt" };
    }
    case "RESET":
      return { ...initialState, filters: s.filters };
  }
}

function shuffle<T>(arr: T[]): T[] {
  return arr.map((v) => [Math.random(), v] as const).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

function pickSession(
  filters: KanjiFilters,
  cleared: Set<string>,
): KanjiCardSource[] {
  const base = buildKanjiCards(filters.scheme, filters.levels);
  const filtered = filters.includeCleared
    ? base
    : base.filter((c) => !wordFullyCleared(c.kanji, cleared));
  return shuffle(filtered).slice(0, filters.sessionLength);
}


interface Ctx {
  state: State;
  setFilters: (f: Partial<KanjiFilters>) => void;
  startSession: () => void;
  startCriticalSession: () => void;
  criticalCount: number;
  submitAnswer: (answer: string) => void;
  skipCurrent: () => void;
  advance: () => void;
  reset: () => void;
  poolSize: number;
  clearedHiddenCount: number;
}

const KanjiCtx = createContext<Ctx | null>(null);

export function KanjiProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined as unknown as State, makeInitialState);
  useEffect(() => {
    saveFilters(FILTERS_STORAGE_KEY, state.filters);
  }, [state.filters]);
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
    const cleared = getClearedKanjiSet();
    const levelCards = buildKanjiCards(state.filters.scheme, state.filters.levels);

    const clearedHiddenCount = levelCards.filter((c) =>
      wordFullyCleared(c.kanji, cleared),
    ).length;
    const poolSize = state.filters.includeCleared
      ? levelCards.length
      : levelCards.length - clearedHiddenCount;
    const criticalIds = new Set(getCriticalItems("kanji").map((s) => s.id));
    const criticalCards = criticalIds.size
      ? levelCards.filter(
          (c) =>
            criticalIds.has(c.kanji) &&
            (state.filters.includeCleared || !wordFullyCleared(c.kanji, cleared)),
        )
      : [];
    return {
      state,
      poolSize,
      clearedHiddenCount,
      criticalCount: criticalCards.length,
      setFilters: (f) => dispatch({ type: "SET_FILTERS", filters: f }),
      startSession: () => dispatch({ type: "START", queue: pickSession(state.filters, cleared) }),
      startCriticalSession: () => {
        if (!criticalCards.length) return;
        const queue = criticalCards
          .map((v) => [Math.random(), v] as const)
          .sort((a, b) => a[0] - b[0])
          .map(([, v]) => v)
          .slice(0, state.filters.sessionLength);
        dispatch({ type: "START", queue });
      },
      submitAnswer: (answer) => {
        if (!state.current || state.status !== "prompt") return;
        const expected = katakanaToHiragana(normalize(state.current.reading));
        const got = katakanaToHiragana(normalize(answer));
        const correct = got === expected;
        dispatch({
          type: "SUBMIT",
          record: { card: state.current, userAnswer: answer, correct },
        });
        recordAnswer(
          "kanji",
          state.current.kanji,
          state.current.kanji,
          correct,
          state.current.meaning,
        );
        recordWordKanjiResults(state.current.kanji, correct);
      },
      skipCurrent: () => {
        if (!state.current || state.status !== "prompt") return;
        dispatch({
          type: "SUBMIT",
          record: { card: state.current, userAnswer: "", correct: false },
        });
        recordAnswer(
          "kanji",
          state.current.kanji,
          state.current.kanji,
          false,
          state.current.meaning,
        );
        recordWordKanjiResults(state.current.kanji, false);
      },
      advance: () => {
        // If queue is empty and we are advancing past the last item, record the session.
        if (state.queue.length === 0 && state.current) {
          const correct = state.history.filter((r) => r.correct).length;
          recordSession("kanji", correct, state.history.length);
        }
        dispatch({ type: "ADVANCE" });
      },
      reset: () => dispatch({ type: "RESET" }),
    };
  }, [state]);

  return <KanjiCtx.Provider value={value}>{children}</KanjiCtx.Provider>;
}

export function useKanji() {
  const ctx = useContext(KanjiCtx);
  if (!ctx) throw new Error("useKanji must be used inside <KanjiProvider>");
  return ctx;
}
