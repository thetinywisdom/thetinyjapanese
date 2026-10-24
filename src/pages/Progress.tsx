import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

import { Button } from "@/components/ui/button";
import { VERBS, type JlptLevel } from "@/data/verbs";
import { getKanjiGrade, type SchoolGrade } from "@/data/kanji-radicals";
import { JLPT_LEVELS, SCHOOL_GRADES } from "@/lib/kanji-levels";
import { useLevelScheme } from "@/features/level-scheme/useLevelScheme";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useOverallStats,
  useItemStats,
  useSessions,
  useStreak,
  useClearedKanji,
  useKanjiStreaks,
} from "@/hooks/use-progress";
import {
  getCriticalItems,
  resetProgress,
  unclearKanji,
  KANJI_CLEAR_THRESHOLD,
  type ItemStat,
} from "@/lib/progress";
import { getAllRememberCards, type RememberCard } from "@/features/kanji-remember/cards";
import { getRadicals, getKanjiMeaning } from "@/data/kanji-radicals";
import data from "@/data/kanji-radicals.json";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const KANJI_FILE = data as unknown as {
  kanji: Record<string, { on?: string[]; kun?: string[]; meaning?: string }>;
};

type Tab = "verb" | "kanji";
type LevelKey = JlptLevel | SchoolGrade;
type LevelFilter = "all" | "critical" | LevelKey;

const VERB_JLPT: Record<string, JlptLevel | null> = {};
const VERB_GRADE: Record<string, SchoolGrade | null> = {};
for (const v of VERBS) {
  VERB_JLPT[v.id] = v.jlptLevel;
  let worst: number | null = null;
  for (const ch of v.dictionary) {
    const g = getKanjiGrade(ch);
    if (g === undefined || g === null) continue;
    if (worst === null || g > worst) worst = g;
  }
  VERB_GRADE[v.id] = (worst as SchoolGrade | null) ?? null;
}

function verbLevelOf(statId: string, scheme: "jlpt" | "grade"): LevelKey | null {
  const verbId = statId.split("::")[0];
  return scheme === "jlpt" ? VERB_JLPT[verbId] ?? null : VERB_GRADE[verbId] ?? null;
}

function accuracy(s: ItemStat) {
  return s.seen ? Math.round((s.correct / s.seen) * 100) : 0;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const Progress = () => {
  const overall = useOverallStats();
  const sessions = useSessions();
  const streak = useStreak();
  const verbStats = useItemStats("verb");
  const kanjiStats = useItemStats("kanji");
  const rememberStats = useItemStats("kanji-remember");
  const writeStats = useItemStats("kanji-write");
  const clearedKanji = useClearedKanji();
  const kanjiStreaks = useKanjiStreaks();
  const [tab, setTab] = useState<Tab>("verb");
  const [scheme] = useLevelScheme();
  const LEVELS: LevelKey[] = scheme === "jlpt" ? [...JLPT_LEVELS] : [...SCHOOL_GRADES];
  const [level, setLevel] = useState<LevelFilter>("all");
  // Reset the level chip when the scheme changes — N5 isn't valid in grade mode.
  useEffect(() => {
    setLevel("all");
  }, [scheme]);
  const [selectedKanji, setSelectedKanji] = useState<RememberCard | null>(null);

  const levelLabel = (l: LevelKey): string =>
    scheme === "jlpt" ? String(l) : `G${l}`;
  const kanjiLevelKey = (c: RememberCard): LevelKey | null =>
    scheme === "jlpt" ? c.jlptLevel : c.grade ?? null;

  // Per-kanji breakdown: Read + Write + Remember separately, plus combined totals.
  const kanjiStatMap = useMemo(() => {
    type Entry = {
      readSeen: number; readCorrect: number;
      writeSeen: number; writeCorrect: number;
      rememberSeen: number; rememberCorrect: number;
    };
    const map = new Map<string, Entry>();
    const ensure = (id: string): Entry => {
      let cur = map.get(id);
      if (!cur) {
        cur = {
          readSeen: 0, readCorrect: 0,
          writeSeen: 0, writeCorrect: 0,
          rememberSeen: 0, rememberCorrect: 0,
        };
        map.set(id, cur);
      }
      return cur;
    };
    for (const s of kanjiStats) {
      for (const ch of s.id) {
        if (/[\u4e00-\u9faf]/.test(ch)) {
          const e = ensure(ch);
          e.readSeen += s.seen;
          e.readCorrect += s.correct;
        }
      }
    }
    for (const s of writeStats) {
      const e = ensure(s.id);
      e.writeSeen += s.seen;
      e.writeCorrect += s.correct;
    }
    for (const s of rememberStats) {
      const e = ensure(s.id);
      e.rememberSeen += s.seen;
      e.rememberCorrect += s.correct;
    }
    return map;
  }, [kanjiStats, writeStats, rememberStats]);

  const kanjiSeenMap = useMemo(() => {
    const map = new Map<string, { seen: number; correct: number }>();
    for (const [ch, e] of kanjiStatMap) {
      map.set(ch, {
        seen: e.readSeen + e.writeSeen + e.rememberSeen,
        correct: e.readCorrect + e.writeCorrect + e.rememberCorrect,
      });
    }
    return map;
  }, [kanjiStatMap]);

  // Verbs tab: existing filtered/sorted list.
  const verbFiltered = useMemo(() => {
    if (level === "all") return verbStats;
    if (level === "critical") {
      const ids = new Set(getCriticalItems("verb").map((s) => s.id));
      return verbStats.filter((s) => ids.has(s.id));
    }
    return verbStats.filter((s) => verbLevelOf(s.id, scheme) === level);
  }, [verbStats, level, scheme]);

  const verbSorted = useMemo(
    () => [...verbFiltered].sort((a, b) => b.seen - a.seen),
    [verbFiltered],
  );

  // Kanji tab: all kanji from the catalog, grouped by JLPT level.
  const allKanjiCards = useMemo(() => getAllRememberCards(), []);
  const kanjiTotal = allKanjiCards.length;
  const progressedKanjiCount = useMemo(
    () => [...kanjiSeenMap.values()].filter((s) => s.seen > 0).length,
    [kanjiSeenMap],
  );


  const criticalKanjiSet = useMemo(() => {
    const set = new Set<string>();
    for (const [ch, { seen, correct }] of kanjiSeenMap) {
      if (seen >= 2 && correct / seen < 0.6) set.add(ch);
    }
    return set;
  }, [kanjiSeenMap]);

  const kanjiGroups = useMemo(() => {
    let cards = allKanjiCards;
    if (level === "critical") {
      cards = cards.filter((c) => criticalKanjiSet.has(c.char));
    } else if (level !== "all") {
      cards = cards.filter((c) => kanjiLevelKey(c) === level);
    }
    const progressedFirst = (a: RememberCard, b: RememberCard) => {
      const aCleared = clearedKanji.includes(a.char) ? 1 : 0;
      const bCleared = clearedKanji.includes(b.char) ? 1 : 0;
      if (aCleared !== bCleared) return bCleared - aCleared;
      const aStreak = kanjiStreaks[a.char] ?? 0;
      const bStreak = kanjiStreaks[b.char] ?? 0;
      if (aStreak !== bStreak) return bStreak - aStreak;
      const aSeen = kanjiSeenMap.get(a.char)?.seen ?? 0;
      const bSeen = kanjiSeenMap.get(b.char)?.seen ?? 0;
      if (aSeen !== bSeen) return bSeen - aSeen;
      return a.char.localeCompare(b.char);
    };
    if (level === "critical") {
      return [{ level: "Critical", cards: [...cards].sort(progressedFirst) }];
    }
    const byLevel = new Map<LevelKey, RememberCard[]>();
    for (const lv of LEVELS) byLevel.set(lv, []);
    for (const c of cards) {
      const k = kanjiLevelKey(c);
      if (k !== null && byLevel.has(k)) byLevel.get(k)!.push(c);
    }
    for (const arr of byLevel.values()) arr.sort(progressedFirst);
    return LEVELS.map((lv) => ({
      level: levelLabel(lv),
      cards: byLevel.get(lv) ?? [],
    })).filter((g) => g.cards.length > 0);
  }, [allKanjiCards, level, criticalKanjiSet, kanjiSeenMap, kanjiStreaks, clearedKanji, scheme]);

  const empty = overall.totalAnswered === 0;


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-16">
        <div className="text-center py-6">
          <h1 className="font-serif text-3xl md:text-4xl mb-2">Your progress</h1>
          <p className="text-sm text-muted-foreground">
            Saved on this device. You won't see this in your other devices.
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard label="Accuracy" value={`${overall.accuracy}%`} />
          <SummaryCard label="Answered" value={overall.totalAnswered.toString()} />
          <SummaryCard label="Sessions" value={overall.sessionsCompleted.toString()} />
          <SummaryCard
            label="Day streak"
            value={streak.current.toString()}
            sub={streak.best > streak.current ? `best ${streak.best}` : undefined}
          />
        </div>

        {/* Per-item tabs */}
        <section className="space-y-3">
          <div className="flex border-b overflow-x-auto">
            {(["verb", "kanji"] as Tab[]).map((t) => {
              const label = t === "verb" ? "Verbs" : "Kanji";
              const count =
                t === "verb"
                  ? verbStats.filter((s) => s.seen > 0).length
                  : progressedKanjiCount;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors whitespace-nowrap",
                    tab === t
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 flex-wrap">
            {(["all", ...LEVELS, "critical"] as LevelFilter[]).map((l) => {
              const isCritical = l === "critical";
              return (
                <button
                  key={String(l)}
                  onClick={() => setLevel(l)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    level === l
                      ? isCritical
                        ? "bg-[hsl(var(--accent))] text-background border-[hsl(var(--accent))]"
                        : "bg-foreground text-background border-foreground"
                      : isCritical
                        ? "bg-transparent text-[hsl(var(--accent))] border-[hsl(var(--accent))]/40 hover:border-[hsl(var(--accent))]"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/40",
                  )}
                >
                  {l === "all"
                    ? "All levels"
                    : l === "critical"
                      ? "Critical"
                      : levelLabel(l as LevelKey)}
                </button>
              );
            })}
          </div>

          {level === "critical" && (
            <p className="text-xs text-muted-foreground">
              Seen 2+ times with under 60% accuracy.
              {((tab === "verb" && verbSorted.length > 0) ||
                (tab === "kanji" && criticalKanjiSet.size > 0)) && (
                <>
                  {" "}
                  <Link
                    to={`${tab === "verb" ? "/verbs" : "/kanji"}?critical=1`}
                    className="text-[hsl(var(--accent))] underline hover:opacity-80"
                  >
                    Practice critical {tab === "verb" ? "verbs" : "kanji"}
                  </Link>
                </>
              )}
            </p>
          )}

          {tab === "kanji" ? (
            kanjiGroups.length === 0 ? (
              <div className="rounded-lg border bg-card p-6">
                <p className="text-center text-sm text-muted-foreground">
                  {level === "critical"
                    ? "No critical kanji — nice work."
                    : "No kanji match this filter."}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {kanjiGroups.map((group) => {
                  const clearedInGroup = group.cards.filter((c) =>
                    clearedKanji.includes(c.char),
                  ).length;
                  return (
                    <div key={group.level} className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <h3 className="font-serif text-lg">{group.level}</h3>
                        <span className="text-xs text-muted-foreground">
                          {clearedInGroup} / {group.cards.length} cleared
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {group.cards.map((c) => (
                          <KanjiGridCard
                            key={c.char}
                            card={c}
                            streak={kanjiStreaks[c.char] ?? 0}
                            cleared={clearedKanji.includes(c.char)}
                            seen={kanjiSeenMap.get(c.char)?.seen ?? 0}
                            onClick={() => setSelectedKanji(c)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : verbSorted.length === 0 ? (
            <div className="rounded-lg border bg-card p-6">
              <p className="text-center text-sm text-muted-foreground">
                {empty
                  ? "You haven't answered any questions yet."
                  : level === "critical"
                    ? "No critical verbs — nice work."
                    : `No verb progress${level === "all" ? "" : ` for ${level}`} yet.`}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card divide-y max-h-96 overflow-y-auto">
              {verbSorted.map((s) => (
                <ItemRow key={s.id} stat={s} />
              ))}
            </div>
          )}
        </section>



        {/* Cleared kanji */}
        {clearedKanji.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-serif text-lg">Cleared kanji</h2>
              <span className="text-xs text-muted-foreground">
                {clearedKanji.length} hidden from quizzes
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Mastered after 5 correct answers in a row. Tap the × to put one back in rotation.
            </p>
            <div className="rounded-lg border bg-card p-3 flex flex-wrap gap-2">
              {clearedKanji.map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => unclearKanji(ch)}
                  className="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-background hover:border-[hsl(var(--accent))]/60 transition-colors"
                  title={`Un-clear ${ch}`}
                >
                  <span className="font-serif text-lg leading-none" lang="ja">
                    {ch}
                  </span>
                  <span className="text-xs text-muted-foreground group-hover:text-[hsl(var(--accent))]">
                    ×
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}


        {/* Recent sessions */}
        {sessions.length > 0 && (
          <section className="space-y-2">
            <h2 className="font-serif text-lg">Recent sessions</h2>
            <div className="rounded-lg border bg-card divide-y">
              {sessions.map((s, i) => {
                const pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {formatDate(s.date)} · {s.kind}
                    </span>
                    <span className="font-mono">
                      {s.correct}/{s.total} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {!empty && (
          <div className="pt-2 text-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-xs text-muted-foreground underline">
                  Reset progress
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently clears every stat, session, and streak
                    stored on this device. There's no undo.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => resetProgress()}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </main>
      <KanjiDetailDialog
        card={selectedKanji}
        open={!!selectedKanji}
        onClose={() => setSelectedKanji(null)}
        read={(() => {
          const e = selectedKanji ? kanjiStatMap.get(selectedKanji.char) : null;
          return { seen: e?.readSeen ?? 0, correct: e?.readCorrect ?? 0 };
        })()}
        write={(() => {
          const e = selectedKanji ? kanjiStatMap.get(selectedKanji.char) : null;
          return { seen: e?.writeSeen ?? 0, correct: e?.writeCorrect ?? 0 };
        })()}
        remember={(() => {
          const e = selectedKanji ? kanjiStatMap.get(selectedKanji.char) : null;
          return { seen: e?.rememberSeen ?? 0, correct: e?.rememberCorrect ?? 0 };
        })()}
        streak={selectedKanji ? kanjiStreaks[selectedKanji.char] ?? 0 : 0}
        cleared={selectedKanji ? clearedKanji.includes(selectedKanji.char) : false}
      />
      <SiteFooter />
    </div>
  );
};

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-serif text-2xl mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function ItemRow({ stat }: { stat: ItemStat }) {
  const acc = accuracy(stat);
  const accColor =
    acc >= 80
      ? "text-emerald-700"
      : acc >= 60
        ? "text-foreground"
        : "text-[hsl(var(--accent))]";
  return (
    <div className="flex items-center justify-between px-3 py-2 gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-serif text-sm truncate" lang="ja">
          {stat.label}
        </p>
        {stat.sub && (
          <p className="text-xs text-muted-foreground truncate">{stat.sub}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className={cn("text-sm font-mono font-medium", accColor)}>{acc}%</p>
        <p className="text-[10px] text-muted-foreground">{stat.seen}× seen</p>
      </div>
    </div>
  );
}

function KanjiGridCard({
  card,
  streak,
  cleared,
  seen,
  onClick,
}: {
  card: RememberCard;
  streak: number;
  cleared: boolean;
  seen: number;
  onClick: () => void;
}) {
  const filled = cleared ? KANJI_CLEAR_THRESHOLD : Math.min(streak, KANJI_CLEAR_THRESHOLD);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-lg border p-3 flex flex-col gap-2 text-center transition-colors",
        cleared
          ? "border-emerald-500/50 bg-emerald-500/10 hover:border-emerald-500"
          : "border-border bg-card hover:border-foreground/40",
      )}
    >
      {cleared && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 text-emerald-600 dark:text-emerald-400"
          title="Cleared"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 8.5 6.5 12 13 4.5" />
          </svg>
        </span>
      )}
      <div className="space-y-0.5">
        <p className="text-2xl leading-none" lang="ja">{card.char}</p>
        <p className="text-xs text-muted-foreground leading-tight truncate">
          {card.meaning}
        </p>
        {seen > 0 && (
          <p className="text-[10px] text-muted-foreground">{seen}× seen</p>
        )}
      </div>
      <div className="flex gap-0.5 mt-auto">
        {Array.from({ length: KANJI_CLEAR_THRESHOLD }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full",
              i < filled
                ? cleared
                  ? "bg-emerald-500"
                  : "bg-[hsl(var(--accent))]"
                : "bg-border",
            )}
          />
        ))}
      </div>
    </button>
  );
}

function KanjiDetailDialog({
  card,
  open,
  onClose,
  read,
  write,
  remember,
  streak,
  cleared,
}: {
  card: RememberCard | null;
  open: boolean;
  onClose: () => void;
  read: { seen: number; correct: number };
  write: { seen: number; correct: number };
  remember: { seen: number; correct: number };
  streak: number;
  cleared: boolean;
}) {
  if (!card) return null;
  const entry = KANJI_FILE.kanji[card.char];
  const fullMeaning = getKanjiMeaning(card.char) ?? card.meaning;
  const radicals = getRadicals(card.char);
  const totalSeen = read.seen + write.seen + remember.seen;
  const totalCorrect = read.correct + write.correct + remember.correct;
  const pct = (s: { seen: number; correct: number }) =>
    s.seen ? Math.round((s.correct / s.seen) * 100) : 0;
  const filled = cleared ? KANJI_CLEAR_THRESHOLD : Math.min(streak, KANJI_CLEAR_THRESHOLD);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn("max-w-md", cleared && "border-emerald-500/50")}>
        <DialogHeader>
          <DialogTitle className="flex items-baseline gap-3">
            <span className="font-serif text-4xl" lang="ja">{card.char}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {card.jlptLevel}
            </span>
            {cleared && (
              <span className="ml-auto text-emerald-600 dark:text-emerald-400" title="Cleared">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 8.5 6.5 12 13 4.5" />
                </svg>
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-left">{fullMeaning}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {(entry?.on?.length || entry?.kun?.length) ? (
            <div className="grid grid-cols-2 gap-3">
              {entry?.kun?.length ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Kun</p>
                  <p lang="ja" className="leading-snug">{entry.kun.join("、")}</p>
                </div>
              ) : null}
              {entry?.on?.length ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">On</p>
                  <p lang="ja" className="leading-snug">{entry.on.join("、")}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {radicals.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Radicals</p>
              <div className="flex flex-wrap gap-1.5">
                {radicals.map((r) => (
                  <span key={r.char} className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs">
                    <span lang="ja" className="text-base leading-none">{r.char}</span>
                    {r.name && <span className="text-muted-foreground">{r.name}</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Streak</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 flex-1">
                {Array.from({ length: KANJI_CLEAR_THRESHOLD }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      i < filled
                        ? cleared
                          ? "bg-emerald-500"
                          : "bg-[hsl(var(--accent))]"
                        : "bg-border",
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {filled}/{KANJI_CLEAR_THRESHOLD}
              </span>
            </div>
            {cleared && (
              <p className="text-xs text-emerald-600">
                Cleared — hidden from quizzes.{" "}
                <button
                  className="underline"
                  onClick={() => { unclearKanji(card.char); onClose(); }}
                >
                  Put back in rotation
                </button>
              </p>
            )}
          </div>

          <div className={cn("rounded-lg border divide-y", cleared && "border-emerald-500/30")}>
            <StatRow label="Read mode" stat={read} pct={pct(read)} />
            <StatRow label="Write mode" stat={write} pct={pct(write)} />
            <StatRow label="Remember mode" stat={remember} pct={pct(remember)} />
            <StatRow
              label="Total"
              stat={{ seen: totalSeen, correct: totalCorrect }}
              pct={totalSeen ? Math.round((totalCorrect / totalSeen) * 100) : 0}
              bold
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatRow({
  label,
  stat,
  pct,
  bold,
}: {
  label: string;
  stat: { seen: number; correct: number };
  pct: number;
  bold?: boolean;
}) {
  const accColor =
    stat.seen === 0
      ? "text-muted-foreground"
      : pct >= 80
        ? "text-emerald-700"
        : pct >= 60
          ? "text-foreground"
          : "text-[hsl(var(--accent))]";
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className={cn("text-xs", bold && "font-medium")}>{label}</span>
      <div className="text-right">
        <span className={cn("text-sm font-mono", accColor, bold && "font-semibold")}>
          {stat.seen ? `${pct}%` : "—"}
        </span>
        <span className="text-[10px] text-muted-foreground ml-2">
          {stat.correct}/{stat.seen}
        </span>
      </div>
    </div>
  );
}


export default Progress;

