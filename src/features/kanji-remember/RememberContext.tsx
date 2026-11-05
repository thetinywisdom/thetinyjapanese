import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { JlptLevel } from "@/data/verbs";
import type { SchoolGrade } from "@/data/kanji-radicals";
import { defaultLevelsFor, type LevelScheme } from "@/lib/kanji-levels";
import { useLevelScheme } from "@/features/level-scheme/useLevelScheme";

import {
  buildRememberCards,
  getAllRememberCards,
  readingDistractorAllowed,
  type RememberCard,
} from "./cards";
import {
  getClearedKanjiSet,
  getCriticalItems,
  recordAnswer,
  recordKanjiCharResult,
  recordSession,
} from "@/lib/progress";
import { loadFilters, saveFilters } from "@/lib/persisted-filters";

const FILTERS_STORAGE_KEY = "lovable.filters.remember";

export type RememberQuestionType = "meaning" | "reading" | "kanji";

export const REMEMBER_QUESTION_LABELS: Record<RememberQuestionType, string> = {
  meaning: "Meaning",
  reading: "Reading",
  kanji: "Kanji",
};

export const REMEMBER_QUESTION_TOOLTIPS: Record<RememberQuestionType, string> = {
  meaning: "You see a kanji. Pick its English meaning.",
  reading: "You see a kanji. Pick how it's read in kana.",
  kanji: "You see an English meaning. Pick the matching kanji.",
};

export interface RememberFilters {
  scheme: LevelScheme;
  levels: (JlptLevel | SchoolGrade)[];
  sessionLength: number;
  questions: RememberQuestionType[];
  includeCleared: boolean;
}


export interface RememberQuestion {
  card: RememberCard;
  type: RememberQuestionType;
  choices: string[];     // 4 strings (meaning / reading / kanji depending on type)
  correctIndex: number;
}

export interface RememberRecord {
  question: RememberQuestion;
  pickedIndex: number;   // -1 if skipped
  correct: boolean;
}

interface State {
  filters: RememberFilters;
  queue: RememberQuestion[];
  current: RememberQuestion | null;
  history: RememberRecord[];
  status: "idle" | "prompt" | "feedback" | "finished";
}

type Action =
  | { type: "SET_FILTERS"; filters: Partial<RememberFilters> }
  | { type: "START"; queue: RememberQuestion[] }
  | { type: "SUBMIT"; record: RememberRecord }
  | { type: "ADVANCE" }
  | { type: "RESET" };

const ALL_QUESTION_TYPES: RememberQuestionType[] = ["meaning", "reading", "kanji"];

const DEFAULT_FILTERS: RememberFilters = {
  scheme: "jlpt",
  levels: ["N5"],
  sessionLength: 10,
  questions: [...ALL_QUESTION_TYPES],
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
  return arr
    .map((v) => [Math.random(), v] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
}

function fieldFor(card: RememberCard, type: RememberQuestionType): string {
  if (type === "meaning") return card.meaning;
  if (type === "reading") return card.reading;
  return card.char;
}

function pickDistractors(
  answer: RememberCard,
  type: RememberQuestionType,
  pool: RememberCard[],
  fullPool: RememberCard[],
): string[] {
  const target = fieldFor(answer, type);
  const seen = new Set<string>([target]);
  const picks: string[] = [];
  const candidates = shuffle(pool.length >= 4 ? pool : fullPool);
  for (const c of candidates) {
    if (c.char === answer.char) continue;
    const f = fieldFor(c, type);
    if (!f || seen.has(f)) continue;
    if (type === "reading" && !readingDistractorAllowed(target, f)) continue;
    seen.add(f);
    picks.push(f);
    if (picks.length === 3) break;
  }
  // Fallback to full pool if levelled pool was too small to yield 3 distinct.
  if (picks.length < 3) {
    for (const c of shuffle(fullPool)) {
      if (c.char === answer.char) continue;
      const f = fieldFor(c, type);
      if (!f || seen.has(f)) continue;
      if (type === "reading" && !readingDistractorAllowed(target, f)) continue;
      seen.add(f);
      picks.push(f);
      if (picks.length === 3) break;
    }
  }
  return picks;
}

function makeQuestion(
  card: RememberCard,
  filters: RememberFilters,
  pool: RememberCard[],
  fullPool: RememberCard[],
): RememberQuestion {
  const qTypes = filters.questions.length ? filters.questions : ALL_QUESTION_TYPES;
  const type = qTypes[Math.floor(Math.random() * qTypes.length)];
  const correct = fieldFor(card, type);
  const distractors = pickDistractors(card, type, pool, fullPool);
  const choices = shuffle([correct, ...distractors]);
  return {
    card,
    type,
    choices,
    correctIndex: choices.indexOf(correct),
  };
}

function buildQueue(
  cards: RememberCard[],
  filters: RememberFilters,
  fullPool: RememberCard[],
  length: number,
): RememberQuestion[] {
  const shuffled = shuffle(cards).slice(0, length);
  return shuffled.map((c) => makeQuestion(c, filters, cards, fullPool));
}

interface Ctx {
  state: State;
  poolSize: number;
  clearedHiddenCount: number;
  criticalCount: number;
  setFilters: (f: Partial<RememberFilters>) => void;
  startSession: () => void;
  startCriticalSession: () => void;
  submitAnswer: (index: number) => void;
  skipCurrent: () => void;
  advance: () => void;
  reset: () => void;
}

const RememberCtx = createContext<Ctx | null>(null);

export function RememberProvider({ children }: { children: ReactNode }) {
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
    const fullPool = getAllRememberCards();
    const cleared = getClearedKanjiSet();
    const levelPool = buildRememberCards(state.filters.scheme, state.filters.levels);
    const clearedHiddenCount = levelPool.filter((c) => cleared.has(c.char)).length;
    const pool = state.filters.includeCleared
      ? levelPool
      : levelPool.filter((c) => !cleared.has(c.char));
    const criticalIds = new Set(getCriticalItems("kanji-remember").map((s) => s.id));
    const criticalCards = criticalIds.size
      ? levelPool.filter(
          (c) =>
            criticalIds.has(c.char) &&
            (state.filters.includeCleared || !cleared.has(c.char)),
        )
      : [];

    return {
      state,
      poolSize: pool.length,
      clearedHiddenCount,
      criticalCount: criticalCards.length,
      setFilters: (f) => dispatch({ type: "SET_FILTERS", filters: f }),
      startSession: () => {
        const queue = buildQueue(pool, state.filters, fullPool, state.filters.sessionLength);
        dispatch({ type: "START", queue });
      },
      startCriticalSession: () => {
        if (!criticalCards.length) return;
        const queue = buildQueue(
          criticalCards,
          state.filters,
          fullPool,
          Math.min(state.filters.sessionLength, criticalCards.length),
        );
        dispatch({ type: "START", queue });
      },
      submitAnswer: (index) => {
        if (!state.current || state.status !== "prompt") return;
        const correct = index === state.current.correctIndex;
        const record: RememberRecord = {
          question: state.current,
          pickedIndex: index,
          correct,
        };
        dispatch({ type: "SUBMIT", record });
        recordAnswer(
          "kanji-remember",
          state.current.card.char,
          state.current.card.char,
          correct,
          state.current.card.meaning,
        );
        recordKanjiCharResult(state.current.card.char, correct);
      },
      skipCurrent: () => {
        if (!state.current || state.status !== "prompt") return;
        const record: RememberRecord = {
          question: state.current,
          pickedIndex: -1,
          correct: false,
        };
        dispatch({ type: "SUBMIT", record });
        recordAnswer(
          "kanji-remember",
          state.current.card.char,
          state.current.card.char,
          false,
          state.current.card.meaning,
        );
        recordKanjiCharResult(state.current.card.char, false);
      },
      advance: () => {
        if (state.queue.length === 0 && state.current) {
          const correct = state.history.filter((r) => r.correct).length;
          recordSession("kanji-remember", correct, state.history.length);
        }
        dispatch({ type: "ADVANCE" });
      },
      reset: () => dispatch({ type: "RESET" }),
    };
  }, [state]);

  return <RememberCtx.Provider value={value}>{children}</RememberCtx.Provider>;
}

export function useRemember() {
  const ctx = useContext(RememberCtx);
  if (!ctx) throw new Error("useRemember must be used inside <RememberProvider>");
  return ctx;
}
