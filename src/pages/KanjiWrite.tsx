import { Link } from "react-router-dom";
import { useWrite } from "@/features/kanji-write/WriteContext";
import { WriteFilterBar } from "@/components/kanji-write/WriteFilterBar";
import { WriteCard } from "@/components/kanji-write/WriteCard";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const KanjiWrite = () => {
  const { state, poolSize, ready, startSession, reset } = useWrite();
  const finished = state.status === "finished";
  const idle = state.status === "idle" || finished;
  const completed = state.history.filter((r) => r.completed).length;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="practice-shell py-6 space-y-5 pb-16">
        {idle ? (
          <>
            <div className="text-center py-6">
              <h1 className="font-serif text-3xl md:text-4xl mb-2">Kanji writing</h1>
              <p className="text-sm text-muted-foreground">
                Draw each kanji stroke-by-stroke with your mouse or finger.
              </p>
              <Link
                to="/kanji"
                className="inline-block mt-3 text-xs text-[hsl(var(--accent))] hover:underline"
              >
                Or learn to recognize kanji →
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
                  Score: {completed} / {state.history.length}
                </p>
                <Link to="/progress" className="text-xs text-[hsl(var(--accent))] underline hover:text-[hsl(var(--accent))]/80">
                  View progress
                </Link>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {ready ? `${poolSize} kanji available in selected levels` : "Loading stroke data…"}
            </p>

            <WriteFilterBar />
            <Button
              className="w-full h-14 text-base bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
              onClick={() => {
                if (finished) reset();
                startSession();
              }}
              disabled={!ready || poolSize === 0}
            >
              {finished ? "Start another session" : "Start session"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">

              Stroke data from{" "}
              <a
                href="https://kanjivg.tagaini.net/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                KanjiVG
              </a>{" "}
              (CC-BY-SA 3.0).
            </p>
          </>
        ) : (
          <>
            <WriteCard />
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
              <summary className="cursor-pointer text-muted-foreground py-2">Adjust filters</summary>
              <div className="mt-2">
                <WriteFilterBar />
              </div>
            </details>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default KanjiWrite;
