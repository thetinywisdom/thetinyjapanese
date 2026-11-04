import { useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useKanji } from "@/features/kanji/KanjiContext";
import { KanjiFilterBar } from "@/components/kanji/KanjiFilterBar";
import { KanjiCard } from "@/components/kanji/KanjiCard";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const Kanji = () => {
  const { state, poolSize, startSession, startCriticalSession, criticalCount, reset } = useKanji();
  const finished = state.status === "finished";
  const idle = state.status === "idle" || finished;
  const [searchParams, setSearchParams] = useSearchParams();
  const autoStartedRef = useRef(false);

  const correct = state.history.filter((r) => r.correct).length;

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (searchParams.get("critical") === "1" && criticalCount > 0 && idle) {
      autoStartedRef.current = true;
      if (finished) reset();
      startCriticalSession();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, criticalCount, idle, finished, reset, startCriticalSession, setSearchParams]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-16">
        {idle ? (
          <>
            <div className="text-center py-6">
              <h1 className="font-serif text-3xl md:text-4xl mb-2">Kanji recognition</h1>
              <p className="text-sm text-muted-foreground">
                See a kanji, type its reading. JLPT N5–N1.
              </p>
              <Link
                to="/kanji/write"
                className="inline-block mt-3 text-xs text-[hsl(var(--accent))] hover:underline"
              >
                Or practice writing kanji by hand →
              </Link>
              <Link
                to="/kanji/remember"
                className="block mt-1 text-xs text-[hsl(var(--accent))] hover:underline"
              >
                Or try multiple-choice remember mode →
              </Link>
            </div>

            {finished && (
              <div className="rounded-lg border bg-card p-4 text-sm text-center space-y-1">
                <p className="font-serif text-lg">
                  Score: {correct} / {state.history.length}
                </p>
                <Link to="/progress" className="text-xs text-[hsl(var(--accent))] underline hover:text-[hsl(var(--accent))]/80">
                  View progress
                </Link>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {poolSize} kanji in selected levels
            </p>

            <KanjiFilterBar />
            <Button
              className="w-full h-14 text-base bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
              onClick={() => {
                if (finished) reset();
                startSession();
              }}
              disabled={poolSize === 0}
            >
              {finished ? "Start another session" : "Start session"}
            </Button>
            {criticalCount > 0 ? (
              <Button
                variant="outline"
                className="w-full h-12 text-sm border-[hsl(var(--accent))]/40 text-[hsl(var(--accent))] hover:bg-transparent hover:text-[hsl(var(--accent))] hover:border-[hsl(var(--accent))]"
                onClick={() => {
                  if (finished) reset();
                  startCriticalSession();
                }}
              >
                Practice {Math.min(criticalCount, state.filters.sessionLength)} critical item{criticalCount === 1 ? "" : "s"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                No critical kanji items — nice work.
              </p>
            )}
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
              A kanji becomes “critical” after you’ve seen it at least twice and got the reading right less than 60% of the time.
            </p>
          </>
        ) : (
          <>
            <KanjiCard />
            <p className="text-center">
              <button
                type="button"
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Need to take a break? End session
              </button>
            </p>
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground py-2">
                Adjust filters
              </summary>
              <div className="mt-2">
                <KanjiFilterBar />
              </div>
            </details>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Kanji;
