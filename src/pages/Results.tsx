import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/features/study/SessionContext";
import { questionLabel, type QuestionType } from "@/lib/conjugation";
import { Button } from "@/components/ui/button";
import { useOverallStats } from "@/hooks/use-progress";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const accentButton =
  "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90";

const Results = () => {
  const { state, score, startSession, reset } = useSession();
  const overall = useOverallStats();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      {state.history.length === 0 ? (
        <EmptyResults />
      ) : (
        <SessionResults
          pct={score.total ? Math.round((score.correct / score.total) * 100) : 0}
          correct={score.correct}
          total={score.total}
          overallAccuracy={overall.accuracy}
          overallAnswered={overall.totalAnswered}
          breakdown={breakdownOf(state.history)}
          onNewSession={() => {
            startSession();
            navigate("/conjugations");
          }}
          onHome={() => {
            reset();
            navigate("/");
          }}
        />
      )}
      <SiteFooter />
    </div>
  );
};

function breakdownOf(history: { question: string; correct: boolean }[]) {
  const breakdown: Record<string, { correct: number; total: number }> = {};
  for (const r of history) {
    breakdown[r.question] ??= { correct: 0, total: 0 };
    breakdown[r.question].total++;
    if (r.correct) breakdown[r.question].correct++;
  }
  return breakdown;
}

function EmptyResults() {
  return (
    <main className="page-shell flex flex-1 flex-col items-center justify-center py-16 text-center">
      <h1 className="font-serif text-4xl md:text-5xl mb-3">No session yet</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        Results show up after you finish a conjugation session. Nothing is saved here until then —
        your other practice still lives on this device.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild className={accentButton}>
          <Link to="/conjugations">Start conjugations</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/kanji">Practice kanji</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Back home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/progress">View progress</Link>
        </Button>
      </div>
    </main>
  );
}

function SessionResults({
  pct,
  correct,
  total,
  overallAccuracy,
  overallAnswered,
  breakdown,
  onNewSession,
  onHome,
}: {
  pct: number;
  correct: number;
  total: number;
  overallAccuracy: number;
  overallAnswered: number;
  breakdown: Record<string, { correct: number; total: number }>;
  onNewSession: () => void;
  onHome: () => void;
}) {
  return (
    <main className="page-shell flex-1 py-8 md:py-12">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-3xl md:text-4xl mb-2">Session complete</h1>
          <p className="text-6xl font-serif my-4">{pct}%</p>
          <p className="text-sm text-muted-foreground">
            Score: {correct} / {total}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            All-time: {overallAccuracy}% across {overallAnswered} answers ·{" "}
            <Link to="/progress" className="underline hover:text-foreground">
              View progress
            </Link>
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-card space-y-2">
          <h2 className="font-serif text-lg">By question type</h2>
          {Object.entries(breakdown).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span>{questionLabel(k as QuestionType)}</span>
              <span className="font-mono">
                {v.correct}/{v.total}
              </span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button className={`h-12 ${accentButton}`} onClick={onNewSession}>
            New session
          </Button>
          <Button variant="outline" className="h-12" onClick={onHome}>
            Back to home
          </Button>
        </div>
      </div>
    </main>
  );
}

export default Results;
