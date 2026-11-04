import { useEffect, useRef, useState } from "react";
import { useWrite } from "@/features/kanji-write/WriteContext";
import { Button } from "@/components/ui/button";
import { WritingCanvas, type WritingCanvasHandle } from "./WritingCanvas";
import { matchStroke, hintFor, type MatchResult } from "@/lib/stroke-match";
import { getStrokes, type KanjiStrokes } from "@/data/kanji-strokes";
import type { Pt } from "@/lib/svg-path-sample";

export function WriteCard() {
  const { state, finishCard, skipCurrent, advance } = useWrite();
  const canvasRef = useRef<WritingCanvasHandle>(null);
  const [strokes, setStrokes] = useState<KanjiStrokes | null>(null);
  const [strokeIdx, setStrokeIdx] = useState(0);
  const [accepted, setAccepted] = useState<Pt[][]>([]);
  const [feedback, setFeedback] = useState<MatchResult | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const finishedRef = useRef(false);

  const card = state.current;

  // Load stroke data for current card.
  useEffect(() => {
    if (!card) return;
    finishedRef.current = false;
    setStrokeIdx(0);
    setAccepted([]);
    setFeedback(null);
    setShowHint(false);
    setShowTemplate(false);
    setHintsUsed(0);
    setMistakes(0);
    let alive = true;
    getStrokes(card.kanji).then((s) => {
      if (alive) setStrokes(s);
    });
    return () => { alive = false; };
  }, [card?.kanji]);

  const total = strokes?.strokes.length ?? 0;
  const allDone = card != null && strokes !== null && strokeIdx >= total;

  // When all strokes done, mark card as completed (once).
  useEffect(() => {
    if (!card || !allDone || state.status !== "writing" || finishedRef.current) return;
    finishedRef.current = true;
    finishCard({ card, completed: true, hintsUsed, mistakes });
  }, [allDone, state.status, card, finishCard, hintsUsed, mistakes]);

  if (!card) return null;

  const onStrokeComplete = (points: Pt[]) => {
    if (!strokes || allDone) return;
    const expected = strokes.strokes[strokeIdx];
    const res = matchStroke({ points }, expected);
    setFeedback(res);
    if (res.ok) {
      setAccepted((a) => [...a, points]);
      setStrokeIdx((i) => i + 1);
      setShowHint(false);
      setTimeout(() => setFeedback(null), 600);
    } else {
      setMistakes((m) => m + 1);
      canvasRef.current?.shake();
      setTimeout(() => setFeedback(null), 1400);
    }
  };

  const onShowHint = () => {
    setShowHint((v) => {
      if (!v) setHintsUsed((h) => h + 1);
      return !v;
    });
  };

  const onReplay = async () => {
    if (!strokes) return;
    await canvasRef.current?.replay(strokes.strokes);
  };

  const onSkip = () => {
    skipCurrent();
  };

  const totalCards = state.history.length + state.queue.length + 1;
  const progress = state.history.length + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Kanji {progress} of {totalCards}</span>
        <span>Stroke {Math.min(strokeIdx + 1, total)} of {total || "…"}</span>
      </div>

      <div className="rounded-lg border bg-card shadow-card p-5 md:p-6 space-y-4">
        <div className="text-center space-y-1">
          <p className="font-serif text-2xl" lang="ja">{card.kanji}</p>
          <p className="text-sm text-muted-foreground">{card.meaning}</p>
          <p className="text-xs text-muted-foreground" lang="ja">{card.reading}</p>
        </div>

        {!strokes ? (
          <div className="h-[320px] flex items-center justify-center text-sm text-muted-foreground">
            Loading strokes…
          </div>
        ) : (
          <WritingCanvas
            ref={canvasRef}
            acceptedUserStrokes={accepted}
            ghostPath={showHint && !allDone ? strokes.strokes[strokeIdx] : null}
            templatePaths={showTemplate ? strokes.strokes : undefined}
            onStrokeComplete={onStrokeComplete}
            disabled={allDone}
          />
        )}

        {feedback && !feedback.ok && (
          <p className="text-center text-sm text-[hsl(var(--feedback-incorrect-text))]">
            {hintFor(feedback.reason)}
          </p>
        )}
        {feedback?.ok && (
          <p className="text-center text-sm text-[hsl(var(--feedback-correct-text))]">Nice stroke ✓</p>
        )}

        {!allDone ? (
          <div className="flex flex-wrap gap-2 justify-center">
            <Button type="button" variant="outline" size="sm" onClick={onShowHint}>
              {showHint ? "Hide hint" : "Show next stroke"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowTemplate((v) => !v)}
            >
              {showTemplate ? "Hide outline" : "Show full outline"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAccepted([]);
                setStrokeIdx(0);
                canvasRef.current?.clearAll();
              }}
            >
              Clear
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-muted-foreground"
            >
              Skip
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-sm text-[hsl(var(--feedback-correct-text))] font-medium">
              Completed! {mistakes === 0 ? "No mistakes." : `${mistakes} retry${mistakes === 1 ? "" : "s"}.`}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button type="button" variant="outline" size="sm" onClick={onReplay}>
                Replay animation
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  canvasRef.current?.clearAll();
                  advance();
                }}
                className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
                autoFocus
              >
                {state.queue.length === 0 ? "See results" : "Next kanji"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
