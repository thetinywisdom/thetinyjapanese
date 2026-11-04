import { useEffect, useRef, useState } from "react";
import { useSessionTimer } from "@/hooks/use-session-timer";
import { useKanji } from "@/features/kanji/KanjiContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { romajiToHiragana } from "@/lib/romaji";
import { katakanaToHiragana, normalize } from "@/lib/kana";
import { RadicalBreakdown } from "@/components/kanji/RadicalBreakdown";
import { ExampleSentences } from "@/components/ExampleSentences";
import { getVerbExamples } from "@/data/examples";
import { getItemStat } from "@/lib/progress";

export function KanjiCard() {
  const { state, submitAnswer, advance, skipCurrent, setFilters } = useKanji();
  const showMeaningHint = state.filters.showMeaning;
  const [answer, setAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const timerActive = state.status === "prompt" || state.status === "feedback";
  const elapsedLabel = useSessionTimer(timerActive);

  useEffect(() => {
    if (state.status === "prompt") {
      setAnswer("");
      inputRef.current?.focus();
    }
  }, [state.current?.id, state.status]);

  // Enter advances on feedback
  useEffect(() => {
    if (state.status !== "feedback") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.status, advance]);

  if (!state.current) return null;
  const c = state.current;
  const last = state.history[state.history.length - 1];
  const showFeedback = state.status === "feedback" && !!last;

  const total = state.history.length + state.queue.length + (state.current ? 1 : 0);
  const progress = state.history.length + (state.status === "prompt" ? 1 : 0);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.status === "prompt" && answer.trim()) {
      submitAnswer(answer);
    } else if (state.status === "feedback") {
      advance();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Question {progress} of {total}</span>
        <span className="tabular-nums font-medium" aria-label="Session timer">
          ⏱ {elapsedLabel}
        </span>
      </div>

      <div className="rounded-lg border bg-card shadow-card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setFilters({ showMeaning: !state.filters.showMeaning })}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
              state.filters.showMeaning
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
            }`}
          >
            English
          </button>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-muted">
            {typeof c.schemeLevel === "number" ? `Grade ${c.schemeLevel}` : c.schemeLevel}
          </span>
        </div>
        <p className="font-serif text-5xl md:text-6xl text-center my-6 break-keep leading-[1.4]" lang="ja">
          {c.kanji}
        </p>
        {showMeaningHint && !showFeedback && (
          <p className="text-center text-sm text-muted-foreground -mt-4 mb-4">
            {c.meaning}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            ref={inputRef}
            value={showFeedback ? last!.userAnswer : answer}
            onChange={(e) => {
              const { converted, pending } = romajiToHiragana(e.target.value);
              setAnswer(converted + pending);
            }}
            disabled={showFeedback}
            placeholder="type the reading…"
            className="text-center text-xl h-14 font-serif"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            lang="ja"
          />
          {!showFeedback ? (
            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1 h-12 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
                disabled={!answer.trim()}
              >
                Check answer
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={skipCurrent}
                className="h-12 px-4 text-muted-foreground hover:bg-transparent hover:text-[hsl(var(--accent))]"
                aria-label="Skip question"
              >
                Skip
              </Button>
            </div>
          ) : (
            <Button type="submit" className="w-full h-12" autoFocus>
              {state.queue.length === 0 ? "See results" : "Next question"}
            </Button>
          )}
        </form>
      </div>

      {showFeedback && (
        <div
          className={`rounded-lg border-2 p-5 space-y-3 ${
            last!.correct
              ? "border-[hsl(var(--feedback-correct-border))] bg-[hsl(var(--feedback-correct-bg))]"
              : "border-[hsl(var(--feedback-incorrect-border))] bg-[hsl(var(--feedback-incorrect-bg))]"
          }`}
        >
          <span
            className={`inline-block text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
              last!.correct
                ? "bg-[hsl(var(--feedback-badge-correct-bg))] text-[hsl(var(--feedback-badge-correct-text))]"
                : "bg-[hsl(var(--feedback-badge-incorrect-bg))] text-[hsl(var(--feedback-badge-incorrect-text))]"
            }`}
          >
            {last!.correct ? "Correct" : "Incorrect"}
          </span>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Kanji</p>
              <p className="font-serif text-2xl" lang="ja">{c.kanji}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Reading</p>
              <p className="font-serif text-2xl" lang="ja">{c.reading}</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meaning</p>
            <p className="text-sm">{c.meaning}</p>
          </div>

          <RadicalBreakdown word={c.kanji} />

          <ExampleSentences examples={getVerbExamples(c.verb.id, c.reading)} />

          {(() => {
            const stat = getItemStat("kanji", c.kanji);
            if (!stat || stat.seen <= 1) return null;
            const acc = Math.round((stat.correct / stat.seen) * 100);
            return (
              <p className="text-xs text-muted-foreground pt-1">
                You've seen this {stat.seen}× ({acc}% correct)
              </p>
            );
          })()}
        </div>
      )}
    </div>
  );
}
