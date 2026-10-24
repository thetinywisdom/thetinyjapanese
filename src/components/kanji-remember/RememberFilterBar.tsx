import { useRemember, REMEMBER_QUESTION_LABELS, type RememberQuestionType } from "@/features/kanji-remember/RememberContext";
import { LevelPicker } from "@/components/kanji/LevelPicker";

const LENGTHS = [5, 10, 20, 30];
const QUESTIONS: RememberQuestionType[] = ["meaning", "reading", "kanji"];

export function RememberFilterBar() {
  const { state, setFilters, clearedHiddenCount } = useRemember();
  const { scheme, levels, sessionLength, questions, includeCleared } = state.filters;

  const toggleQuestion = (q: RememberQuestionType) => {
    const has = questions.includes(q);
    const next = has ? questions.filter((x) => x !== q) : [...questions, q];
    if (next.length === 0) return;
    setFilters({ questions: next });
  };

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <LevelPicker
        scheme={scheme}
        levels={levels}
        onChange={(n) => setFilters(n)}
      />

      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Question types</p>
        <div className="flex flex-wrap gap-2">
          {QUESTIONS.map((q) => {
            const active = questions.includes(q);
            return (
              <button
                key={q}
                type="button"
                onClick={() => toggleQuestion(q)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
                }`}
              >
                {REMEMBER_QUESTION_LABELS[q]}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Session length</p>
        <div className="flex flex-wrap gap-2">
          {LENGTHS.map((n) => {
            const active = sessionLength === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setFilters({ sessionLength: n })}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
                }`}
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Cleared kanji</p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilters({ includeCleared: !includeCleared })}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
              includeCleared
                ? "bg-foreground text-background border-foreground"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
            }`}
          >
            {includeCleared ? "Including cleared" : "Hiding cleared"}
          </button>
          {clearedHiddenCount > 0 && !includeCleared && (
            <span className="text-[11px] text-muted-foreground">
              {clearedHiddenCount} hidden
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
