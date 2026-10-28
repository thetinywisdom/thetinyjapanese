import { useEffect, useRef, useState } from "react";
import { useSession } from "@/features/study/SessionContext";
import { questionLabel, verbClassLabel, promptKanji, QUESTION_TOOLTIPS } from "@/lib/conjugation";
import { needsSenseCue, sharesDictionary } from "@/data/words";
import { getVerbExamples } from "@/data/examples";
import { ExampleSentences } from "@/components/ExampleSentences";
import { RuleExplanation } from "@/components/study/RuleExplanation";
import { pairFurigana } from "@/lib/furigana";
import { romajiToHiragana } from "@/lib/romaji";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getItemStat } from "@/lib/progress";
import { splitCommonPrefix } from "@/lib/diff";

function DiffText({
  base,
  other,
  tone = "warning",
  className = "",
}: {
  base: string;
  other: string;
  tone?: "warning" | "positive";
  className?: string;
}) {
  const { common, aTail } = splitCommonPrefix(base, other);
  const toneClass =
    tone === "positive"
      ? "text-[hsl(var(--feedback-correct-text))] bg-[hsl(var(--feedback-correct-bg))]"
      : "text-[hsl(var(--feedback-incorrect-text))] bg-[hsl(var(--feedback-incorrect-bg))]";
  return (
    <span className={className} lang="ja">
      <span>{common}</span>
      {aTail && (
        <span className={`${toneClass} rounded px-0.5 font-bold`}>{aTail}</span>
      )}
    </span>
  );
}

function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PracticeCard() {
  const { state, submitAnswer, nextQuestion, skipQuestion, setFilters } = useSession();
  const [answer, setAnswer] = useState("");
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  // Start the timer when the session begins (first question, no history yet)
  useEffect(() => {
    if ((state.status === "answering" || state.status === "feedback") && startTime === null) {
      setStartTime(Date.now());
    }
    if (state.status === "idle" || state.status === "finished") {
      setStartTime(null);
    }
  }, [state.status, startTime]);

  // Tick every second while session is active
  useEffect(() => {
    if (state.status !== "answering" && state.status !== "feedback") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [state.status]);

  const elapsed = startTime ? now - startTime : 0;

  // Reset input when a new question is presented
  useEffect(() => {
    if (state.status === "answering") {
      setAnswer("");
      inputRef.current?.focus();
    }
  }, [state.current?.verb.id, state.current?.question, state.status]);

  // While in feedback, Enter advances to the next question
  useEffect(() => {
    if (state.status !== "feedback") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        nextQuestion();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.status, nextQuestion]);

  if (!state.current) return null;
  const q = state.current;
  const last = state.history[state.history.length - 1];
  const showFeedback: boolean = state.status === "feedback" && !!last;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.status === "answering" && answer.trim()) {
      submitAnswer(answer);
    } else if (state.status === "feedback") {
      nextQuestion();
    }
  };

  const progress = state.history.length + (state.status === "answering" ? 1 : 0);

  const kanjiPrompt = promptKanji(q.verb, q.question) ?? q.prompt;
  const showFurigana = state.filters.showFurigana && kanjiPrompt !== q.prompt;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Question {progress} of {state.sessionLength}
        </span>
        <span className="tabular-nums font-medium" aria-label="Session timer">
          ⏱ {formatElapsed(elapsed)}
        </span>
      </div>

      <div className="rounded-lg border bg-card shadow-card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => setFilters({ showFurigana: !state.filters.showFurigana })}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
              state.filters.showFurigana
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
            }`}
          >
            Furigana
          </button>
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
          <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
            <TooltipTrigger asChild>
              <span
                className="ml-auto inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted cursor-help select-none"
                onClick={() => setTooltipOpen((v) => !v)}
              >
                {questionLabel(q.question, q.verb.wordType)}
                <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current opacity-50 text-[9px] leading-none">
                  ?
                </span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="max-w-[220px] text-xs leading-relaxed">{QUESTION_TOOLTIPS[q.question]}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="font-serif text-4xl md:text-5xl text-center my-6 break-keep leading-[1.6]" lang="ja">
          {showFurigana ? (
            pairFurigana(kanjiPrompt, q.prompt).map((seg, i) =>
              seg.ruby ? (
                <ruby key={i}>
                  {seg.base}
                  <rt className="text-sm font-sans text-muted-foreground">{seg.ruby}</rt>
                </ruby>
              ) : (
                <span key={i}>{seg.base}</span>
              ),
            )
          ) : (
            kanjiPrompt
          )}
        </p>
        {sharesDictionary(q.verb.dictionary) && (
          <p className="text-center text-sm text-muted-foreground -mt-4 mb-2" lang="ja">
            {q.verb.reading}
          </p>
        )}
        {(needsSenseCue(q.verb.dictionary, q.verb.reading) || state.filters.showMeaning) && (
          <p className="text-center text-sm text-muted-foreground -mt-3 mb-6">
            {q.verb.meaning.split(";")[0].trim()}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            ref={inputRef}
            value={showFeedback ? last!.userAnswer : answer}
            onChange={(e) => {
              const raw = e.target.value;
              // Only convert ASCII romaji portion; preserve already-kana input.
              const { converted, pending } = romajiToHiragana(raw);
              setAnswer(converted + pending);
            }}
            disabled={showFeedback}
            placeholder="type romaji or kana…"
            className="text-center text-xl h-14 font-serif"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            lang="ja"
            inputMode={"kana" as "text"}
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
                onClick={skipQuestion}
                className="h-12 px-4 text-muted-foreground hover:bg-transparent hover:text-[hsl(var(--accent))]"
                aria-label="Skip question"
              >
                Skip
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              className="w-full h-12"
              autoFocus
            >
              {progress >= state.sessionLength ? "See results" : "Next question"}
            </Button>
          )}
        </form>
      </div>

      {showFeedback && <FeedbackPanel />}
    </div>
  );
}

function FeedbackPanel() {
  const { state } = useSession();
  const r = state.history[state.history.length - 1];
  if (!r) return null;
  const correct = r.correct;
  const stat = getItemStat("verb", `${r.verb.id}::${r.question}`);
  const acc = stat && stat.seen ? Math.round((stat.correct / stat.seen) * 100) : null;
  return (
    <div
      className={`rounded-lg border-2 p-5 space-y-3 ${
        correct
          ? "border-[hsl(var(--feedback-correct-border))] bg-[hsl(var(--feedback-correct-bg))]"
          : "border-[hsl(var(--feedback-incorrect-border))] bg-[hsl(var(--feedback-incorrect-bg))]"
      }`}
    >
      <div className="space-y-2">
        <span
          className={`inline-block text-xs uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
            correct
              ? "bg-[hsl(var(--feedback-badge-correct-bg))] text-[hsl(var(--feedback-badge-correct-text))]"
              : "bg-[hsl(var(--feedback-badge-incorrect-bg))] text-[hsl(var(--feedback-badge-incorrect-text))]"
          }`}
        >
          {correct ? "Correct" : "Incorrect"}
        </span>
        {r.note && (
          <p className="text-sm">
            <span className="text-xs uppercase tracking-wider font-bold mr-2">colloquial / also correct</span>
            <span lang="ja">{r.note}</span>
          </p>
        )}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-baseline gap-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground w-20 shrink-0">Question</span>
            <DiffText base={r.prompt} other={r.expected} tone={correct ? "positive" : "warning"} className="font-serif text-lg" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground w-20 shrink-0">
              {correct ? "Answer" : "Correct"}
            </span>
            <DiffText base={r.expected} other={r.prompt} tone={correct ? "positive" : "warning"} className="font-serif text-lg" />
          </div>
          {!correct && (
            <div className="flex items-baseline gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground w-20 shrink-0">Yours</span>
              <span className="font-serif text-base text-muted-foreground line-through" lang="ja">
                {r.userAnswer}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Dictionary</p>
          <p className="font-serif text-lg" lang="ja">
            {r.verb.dictionary}
            {r.verb.dictionary !== r.verb.reading && (
              <span className="text-muted-foreground text-base ml-2">({r.verb.reading})</span>
            )}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Class</p>
          <p className="text-sm">{verbClassLabel(r.verb.verbClass)}</p>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Meaning</p>
        <p className="text-sm">{r.verb.meaning}</p>
      </div>

      <div className="pt-2 border-t">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Rule</p>
        <RuleExplanation verbClass={r.verb.verbClass} question={r.question} />
      </div>

      <ExampleSentences examples={getVerbExamples(r.verb.id, r.verb.reading)} />


      {acc !== null && stat && stat.seen > 1 && (
        <p className="text-xs text-muted-foreground pt-1">
          You've seen this {stat.seen}× ({acc}% correct)
        </p>
      )}
    </div>
  );
}
