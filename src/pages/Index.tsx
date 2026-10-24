import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useSession } from "@/features/study/SessionContext";
import { FilterBar } from "@/components/study/FilterBar";
import { PracticeCard } from "@/components/study/PracticeCard";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const Index = () => {
  const { state, startSession, startCriticalSession, criticalCount, reset } = useSession();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (state.status === "finished") {
      navigate("/results");
    }
  }, [state.status, navigate]);

  useEffect(() => {
    if (autoStartedRef.current) return;
    if (searchParams.get("critical") === "1" && criticalCount > 0 && state.status === "idle") {
      autoStartedRef.current = true;
      startCriticalSession();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, criticalCount, state.status, startCriticalSession, setSearchParams]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-16">
        {state.status === "idle" || state.status === "finished" ? (
          <>
            <div className="text-center py-6">
              <h1 className="font-serif text-3xl md:text-4xl mb-2">
                Conjugations Practice
              </h1>
              <p className="text-sm text-muted-foreground">
                Verbs, い/な-adjectives and nouns · JLPT N5–N1. Based on data from{" "}
                <a
                  href="https://www.edrdg.org/jmdict/j_jmdict.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  EDRDG (JMdict)
                </a>
                .
              </p>
            </div>
            <FilterBar />
            <Button
              className="w-full h-14 text-base bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
              onClick={startSession}
            >
              Start session
            </Button>
            {criticalCount > 0 && (
              <>
                <Button
                  variant="outline"
                  className="w-full h-12 text-sm border-[hsl(var(--accent))]/40 text-[hsl(var(--accent))] hover:bg-transparent hover:text-[hsl(var(--accent))] hover:border-[hsl(var(--accent))]"
                  onClick={startCriticalSession}
                >
                  Practice {Math.min(criticalCount, state.filters.sessionLength)} critical item{criticalCount === 1 ? "" : "s"}
                </Button>
                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  A form becomes “critical” after you’ve seen it at least twice and got it right less than 60% of the time.
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <PracticeCard />
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
                <FilterBar />
              </div>
            </details>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
