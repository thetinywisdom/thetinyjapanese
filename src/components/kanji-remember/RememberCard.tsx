import { useEffect, useRef, useState } from "react";
import {
  useRemember,
  REMEMBER_QUESTION_LABELS,
  REMEMBER_QUESTION_TOOLTIPS,
} from "@/features/kanji-remember/RememberContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RadicalBreakdown } from "@/components/kanji/RadicalBreakdown";
import { getItemStat } from "@/lib/progress";
import { cn } from "@/lib/utils";

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RememberCard() {
  const { state, submitAnswer, skipCurrent, advance } = useRemember();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const advanceBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if ((state.status === "prompt" || state.status === "feedback") && startTime === null) {
      setStartTime(Date.now());
    }
    if (state.status === "idle" || state.status === "finished") {
      setStartTime(null);
    }
  }, [state.status, startTime]);

  useEffect(() => {
    if (state.status !== "prompt" && state.status !== "feedback") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.status]);

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
  const q = state.current;
  const last = state.history[state.history.length - 1];
  const showFeedback = state.status === "feedback" && !!last;

  const total = state.history.length + state.queue.length + (state.current ? 1 : 0);
  const progress = state.history.length + (state.status === "prompt" ? 1 : 0);
  const elapsed = startTime ? now - startTime : 0;

  const promptText =
    q.type === "kanji" ? q.card.meaning : q.card.char;
  const isPromptKanji = q.type !== "kanji";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Question {progress} of {total}
        </span>
        <span className="tabular-nums font-medium" aria-label="Session timer">
          ⏱ {formatElapsed(elapsed)}
        </span>
      </div>

      <div className="rounded-lg border bg-card shadow-card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
            {state.filters.scheme === "grade"
              ? q.card.grade
                ? `Grade ${q.card.grade}`
                : "Grade —"
              : q.card.jlptLevel}
          </span>
          <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
            <TooltipTrigger asChild>
              <span
                className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted cursor-help select-none"
                onClick={() => setTooltipOpen((v) => !v)}
              >
                {REMEMBER_QUESTION_LABELS[q.type]}
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current opacity-50 text-[9px] leading-none">
                  ?
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="max-w-[220px] text-xs leading-relaxed">
                {REMEMBER_QUESTION_TOOLTIPS[q.type]}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {isPromptKanji ? (
          <p className="font-serif text-6xl md:text-7xl text-center my-6 break-keep leading-[1.2]" lang="ja">
            {promptText}
          </p>
        ) : (
          <p className="font-serif text-2xl md:text-3xl text-center my-8 px-2">
            {promptText}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {q.choices.map((choice, i) => {
            const isCorrect = i === q.correctIndex;
            const isPicked = showFeedback && last!.pickedIndex === i;
            const reveal = showFeedback;
            const isKanjiChoice = q.type === "kanji";
            return (
              <button
                key={i}
                type="button"
                disabled={showFeedback}
                onClick={() => submitAnswer(i)}
                className={cn(
                  "rounded-lg border-2 px-3 py-4 text-center transition-colors",
                  "font-serif",
                  isKanjiChoice ? "text-3xl md:text-4xl" : "text-base md:text-lg",
                  !reveal && "border-border bg-card hover:border-foreground/40 active:bg-muted",
                  reveal && isCorrect && "border-[hsl(var(--feedback-correct-border))] bg-[hsl(var(--feedback-correct-bg))] text-[hsl(var(--feedback-correct-text))]",
                  reveal && !isCorrect && isPicked && "border-[hsl(var(--feedback-incorrect-border))] bg-[hsl(var(--feedback-incorrect-bg))] text-[hsl(var(--feedback-incorrect-text))]",
                  reveal && !isCorrect && !isPicked && "border-border opacity-60",
                )}
                lang={isKanjiChoice || q.type === "reading" ? "ja" : undefined}
              >
                {choice}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          {!showFeedback ? (
            <Button
              type="button"
              variant="ghost"
              onClick={skipCurrent}
              className="w-full h-10 text-muted-foreground hover:bg-transparent hover:text-[hsl(var(--accent))]"
            >
              Skip
            </Button>
          ) : (
            <Button
              ref={advanceBtnRef}
              type="button"
              onClick={advance}
              autoFocus
              className="w-full h-12 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
            >
              {state.queue.length === 0 ? "See results" : "Next question"}
            </Button>
          )}
        </div>
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
            {last!.correct ? "Correct" : last!.pickedIndex < 0 ? "Skipped" : "Incorrect"}
          </span>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Kanji</p>
              <p className="font-serif text-3xl" lang="ja">{q.card.char}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Reading</p>
              <p className="font-serif text-2xl" lang="ja">{q.card.reading}</p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meaning</p>
            <p className="text-sm">{q.card.meaning}</p>
          </div>

          <RadicalBreakdown word={q.card.char} />

          {(() => {
            const stat = getItemStat("kanji-remember", q.card.char);
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
