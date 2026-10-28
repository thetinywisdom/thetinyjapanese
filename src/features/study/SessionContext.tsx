import { createContext, useContext, useEffect, useReducer, useMemo, type ReactNode } from "react";
import { WORDS, type WordEntry, type JlptLevel, type WordType } from "@/data/words";
import {
  ALL_QUESTION_TYPES,
  supportedQuestions,
  promptReading,
  toCasual,
  checkAnswer,
  questionLabel,
  type QuestionType,
} from "@/lib/conjugation";
import { getCriticalItems, recordAnswer, recordSession } from "@/lib/progress";
import { getKanjiGrade, type SchoolGrade } from "@/data/kanji-radicals";
import { defaultLevelsFor, type LevelScheme } from "@/lib/kanji-levels";
import { useLevelScheme } from "@/features/level-scheme/useLevelScheme";
import { loadFilters, saveFilters } from "@/lib/persisted-filters";

const FILTERS_STORAGE_KEY = "lovable.filters.verb";

/**
 * Hardest school grade among a word's kanji — drives the "Grade" filter.
 * Kanji with no grade (rare / non-jōyō) count as the hardest bucket (8) so they
 * never leak into an easy-grade session.
 */
function hardestWordGrade(word: string): SchoolGrade | null {
  let worst: number | null = null;
  let sawKanji = false;
  for (const ch of word) {
    const c = ch.charCodeAt(0);
    if (c < 0x4e00 || c > 0x9fff) continue;
    sawKanji = true;
    const g = getKanjiGrade(ch) ?? 8;
    if (worst === null || g > worst) worst = g;
  }
  return sawKanji ? (worst as SchoolGrade) : null;
}

/**
 * JLPT sessions use the vocabulary tag. A harder kanji inside an N5 word
 * (飲 in 飲む is N5, but 新 in 新しい is not) must not hide the word.
 * School-grade sessions still follow the hardest kanji, because grades
 * describe the character curriculum rather than the word list.
 */
export function wordLevelKey(
  v: WordEntry,
  scheme: LevelScheme,
): JlptLevel | SchoolGrade | null {
  if (scheme === "jlpt") return v.jlptLevel;
  return hardestWordGrade(v.dictionary) ?? 1;
}

/** Back-compat alias. */
export const verbLevelKey = wordLevelKey;

export type VerbClassFilter =
  | "ichidan"
  | "godan"
  | "irregular-suru"
  | "irregular-kuru";

export interface Filters {
  scheme: LevelScheme;
  levels: (JlptLevel | SchoolGrade)[];
  wordTypes: WordType[];
  classes: VerbClassFilter[];
  questions: QuestionType[];
  sessionLength: number;
  showFurigana: boolean;
  showMeaning: boolean;
}

export interface QuestionRecord {
  verb: WordEntry;
  question: QuestionType;
  prompt: string;
  expected: string;
  userAnswer: string;
  correct: boolean;
  /** Set when a non-primary variant was accepted (ら抜き, ではない, …). */
  note?: string;
}

type Pick = { verb: WordEntry; question: QuestionType; prompt: string; expected: string };

interface State {
  filters: Filters;
  history: QuestionRecord[];
  current: Pick | null;
  status: "idle" | "answering" | "feedback" | "finished";
  criticalPool: Pick[] | null;
  sessionLength: number;
}

type Action =
  | { type: "SET_FILTERS"; filters: Partial<Filters> }
  | { type: "START_SESSION"; first: State["current"]; pool: Pick[] | null; length: number }
  | { type: "SUBMIT"; answer: string; correct: boolean; record: QuestionRecord }
  | { type: "NEXT"; next: State["current"] }
  | { type: "FINISH" }
  | { type: "RESET" };

const DEFAULT_FILTERS: Filters = {
  scheme: "jlpt",
  levels: ["N5"],
  wordTypes: ["verb", "adj-i", "adj-na", "noun"],
  classes: ["ichidan", "godan", "irregular-suru", "irregular-kuru"],
  questions: [...ALL_QUESTION_TYPES],
  sessionLength: 10,
  showFurigana: false,
  showMeaning: false,
};

function normalizeFilters(f: Filters): Filters {
  // Older persisted filters may lack wordTypes.
  const wordTypes = (f.wordTypes && f.wordTypes.length ? f.wordTypes : DEFAULT_FILTERS.wordTypes) as WordType[];
  return { ...DEFAULT_FILTERS, ...f, wordTypes };
}

function makeInitialState(): State {
  const filters = normalizeFilters(loadFilters(FILTERS_STORAGE_KEY, DEFAULT_FILTERS));
  return {
    filters,
    history: [],
    current: null,
    status: "idle",
    criticalPool: null,
    sessionLength: filters.sessionLength,
  };
}

const initialState: State = {
  filters: DEFAULT_FILTERS,
  history: [],
  current: null,
  status: "idle",
  criticalPool: null,
  sessionLength: DEFAULT_FILTERS.sessionLength,
};

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "SET_FILTERS":
      return { ...s, filters: { ...s.filters, ...a.filters } };
    case "START_SESSION":
      return {
        ...s,
        history: [],
        current: a.first,
        status: a.first ? "answering" : "idle",
        criticalPool: a.pool,
        sessionLength: a.length,
      };
    case "SUBMIT":
      return { ...s, history: [...s.history, a.record], status: "feedback" };
    case "NEXT":
      return a.next
        ? { ...s, current: a.next, status: "answering" }
        : { ...s, current: null, status: "finished" };
    case "FINISH":
      return { ...s, status: "finished" };
    case "RESET":
      return { ...initialState, filters: s.filters };
  }
}

function classGroup(c: string) {
  return c.startsWith("godan-") ? "godan" : c;
}

export function eligibleWords(filters: Filters): WordEntry[] {
  const lv = new Set<JlptLevel | SchoolGrade>(filters.levels);
  const cls = new Set(filters.classes);
  const wt = new Set(filters.wordTypes);
  return WORDS.filter((v) => {
    if (!wt.has(v.wordType)) return false;
    if (v.wordType === "verb") {
      if (!cls.has(classGroup(v.verbClass) as VerbClassFilter)) return false;
    }
    const key = wordLevelKey(v, filters.scheme);
    return key !== null && lv.has(key);
  });
}

/** Back-compat alias — original name used across the codebase. */
export const eligibleVerbs = eligibleWords;

function pickQuestionForWord(word: WordEntry, filters: Filters): Pick | null {
  const applicable = supportedQuestions(word.wordType, word).filter((q) => filters.questions.includes(q));
  if (!applicable.length) return null;
  const q = applicable[Math.floor(Math.random() * applicable.length)];
  try {
    return {
      verb: word,
      question: q,
      prompt: promptReading(word, q),
      expected: toCasual(word, q),
    };
  } catch {
    return null;
  }
}

export function pickQuestion(filters: Filters, recentlyUsedIds: Set<string> = new Set()) {
  const pool = eligibleWords(filters);
  if (!pool.length || !filters.questions.length) return null;
  for (let i = 0; i < 12; i++) {
    const w = pool[Math.floor(Math.random() * pool.length)];
    if (recentlyUsedIds.has(w.id) && pool.length > recentlyUsedIds.size) continue;
    const p = pickQuestionForWord(w, filters);
    if (p) return p;
  }
  // fallback
  for (const w of pool) {
    const p = pickQuestionForWord(w, filters);
    if (p) return p;
  }
  return null;
}

/**
 * Build a pool of critical Picks from saved progress (verb mode — legacy id shape).
 * Restricted to the active level filter so review sessions never surface words
 * outside the levels the learner selected.
 */
export function buildCriticalVerbPool(filters?: Filters): Pick[] {
  const wordsById = new Map(WORDS.map((v) => [v.id, v]));
  const allowed = filters ? new Set<JlptLevel | SchoolGrade>(filters.levels) : null;
  const out: Pick[] = [];
  for (const stat of getCriticalItems("verb")) {
    const [wordId, question] = stat.id.split("::") as [string, QuestionType];
    const w = wordsById.get(wordId);
    if (!w) continue;
    if (allowed) {
      const key = wordLevelKey(w, filters!.scheme);
      if (key === null || !allowed.has(key)) continue;
    }
    if (!supportedQuestions(w.wordType, w).includes(question)) continue;
    try {
      out.push({
        verb: w,
        question,
        prompt: promptReading(w, question),
        expected: toCasual(w, question),
      });
    } catch {
      /* skip */
    }
  }
  return out;
}

function pickFromPool(pool: Pick[], recentlyUsedIds: Set<string>): Pick | null {
  if (!pool.length) return null;
  const fresh = pool.filter((p) => !recentlyUsedIds.has(p.verb.id));
  const source = fresh.length ? fresh : pool;
  return source[Math.floor(Math.random() * source.length)];
}

interface Ctx {
  state: State;
  setFilters: (f: Partial<Filters>) => void;
  startSession: () => void;
  startCriticalSession: () => void;
  criticalCount: number;
  submitAnswer: (answer: string) => QuestionRecord | null;
  skipQuestion: () => void;
  nextQuestion: () => void;
  reset: () => void;
  mistakes: QuestionRecord[];
  score: { correct: number; total: number };
}

const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
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
    const recentIds = new Set(state.history.slice(-5).map((r) => r.verb.id));
    const criticalPool = buildCriticalVerbPool(state.filters);
    return {
      state,
      criticalCount: criticalPool.length,
      setFilters: (f) => dispatch({ type: "SET_FILTERS", filters: f }),
      startSession: () => {
        const first = pickQuestion(state.filters);
        dispatch({
          type: "START_SESSION",
          first,
          pool: null,
          length: state.filters.sessionLength,
        });
      },
      startCriticalSession: () => {
        if (!criticalPool.length) return;
        const length = Math.min(state.filters.sessionLength, criticalPool.length);
        const first = pickFromPool(criticalPool, new Set());
        dispatch({ type: "START_SESSION", first, pool: criticalPool, length });
      },
      submitAnswer: (answer) => {
        if (!state.current || state.status !== "answering") return null;
        const res = checkAnswer(answer, state.current.verb, state.current.question);
        const record: QuestionRecord = {
          verb: state.current.verb,
          question: state.current.question,
          prompt: state.current.prompt,
          expected: state.current.expected,
          userAnswer: answer,
          correct: res.correct,
          note: res.note,
        };
        dispatch({ type: "SUBMIT", answer, correct: res.correct, record });
        recordAnswer(
          "verb",
          `${record.verb.id}::${record.question}`,
          `${record.verb.dictionary} · ${questionLabel(record.question)}`,
          record.correct,
          record.verb.meaning.split(";")[0].trim(),
        );
        return record;
      },
      skipQuestion: () => {
        if (!state.current || state.status !== "answering") return;
        const record: QuestionRecord = {
          verb: state.current.verb,
          question: state.current.question,
          prompt: state.current.prompt,
          expected: state.current.expected,
          userAnswer: "",
          correct: false,
        };
        dispatch({ type: "SUBMIT", answer: "", correct: false, record });
        recordAnswer(
          "verb",
          `${record.verb.id}::${record.question}`,
          `${record.verb.dictionary} · ${questionLabel(record.question)}`,
          false,
          record.verb.meaning.split(";")[0].trim(),
        );
      },
      nextQuestion: () => {
        const answered = state.history.length;
        if (answered >= state.sessionLength) {
          recordSession(
            "verb",
            state.history.filter((r) => r.correct).length,
            state.history.length,
          );
          dispatch({ type: "NEXT", next: null });
          return;
        }
        const next = state.criticalPool
          ? pickFromPool(state.criticalPool, recentIds)
          : pickQuestion(state.filters, recentIds);
        dispatch({ type: "NEXT", next });
      },
      reset: () => dispatch({ type: "RESET" }),
      mistakes: state.history.filter((r) => !r.correct),
      score: {
        correct: state.history.filter((r) => r.correct).length,
        total: state.history.length,
      },
    };
  }, [state]);

  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
