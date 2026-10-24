import { useWrite } from "@/features/kanji-write/WriteContext";
import { LevelPicker } from "@/components/kanji/LevelPicker";

const LENGTHS = [3, 5, 10, 20];

export function WriteFilterBar() {
  const { state, setFilters, clearedHiddenCount } = useWrite();
  const { scheme, levels, sessionLength, includeCleared } = state.filters;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <LevelPicker
        scheme={scheme}
        levels={levels}
        onChange={(n) => setFilters(n)}
      />

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
