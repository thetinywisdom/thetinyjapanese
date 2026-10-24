import { Link, useNavigate } from "react-router-dom";
import { useSession } from "@/features/study/SessionContext";
import { questionLabel } from "@/lib/conjugation";
import { Button } from "@/components/ui/button";
import { useOverallStats } from "@/hooks/use-progress";

const Results = () => {
  const { state, score, startSession, reset } = useSession();
  const overall = useOverallStats();
  const navigate = useNavigate();

  if (state.history.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-muted-foreground">No session yet.</p>
        <Link to="/" className="underline">Start one</Link>
      </main>
    );
  }

  const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  // breakdown by question type
  const breakdown: Record<string, { correct: number; total: number }> = {};
  for (const r of state.history) {
    const k = r.question;
    breakdown[k] ??= { correct: 0, total: 0 };
    breakdown[k].total++;
    if (r.correct) breakdown[k].correct++;
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-3xl mb-2">Session complete</h1>
        <p className="text-6xl font-serif my-4">{pct}%</p>
        <p className="text-sm text-muted-foreground">
          Score: {score.correct} / {score.total}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          All-time: {overall.accuracy}% across {overall.totalAnswered} answers ·{" "}
          <Link to="/progress" className="underline">View progress</Link>
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 shadow-card space-y-2">
        <h2 className="font-serif text-lg">By question type</h2>
        {Object.entries(breakdown).map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span>{questionLabel(k as any)}</span>
            <span className="font-mono">
              {v.correct}/{v.total}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          className="h-12 bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:bg-[hsl(var(--accent))]/90"
          onClick={() => {
            startSession();
            navigate("/conjugations");
          }}
        >
          New session
        </Button>
      </div>

      <div className="text-center">
        <button
          onClick={() => {
            reset();
            navigate("/");
          }}
          className="text-sm text-muted-foreground underline"
        >
          Back to home
        </button>
      </div>
    </main>
  );
};

export default Results;
