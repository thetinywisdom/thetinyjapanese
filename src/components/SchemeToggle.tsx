import { useLevelScheme } from "@/features/level-scheme/useLevelScheme";
import type { LevelScheme } from "@/lib/kanji-levels";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "xs";
}

/**
 * Compact pill toggle used in the site header. Flipping it updates the
 * global level scheme, which every practice context subscribes to.
 */
export function SchemeToggle({ className, size = "sm" }: Props) {
  const [scheme, setScheme] = useLevelScheme();
  const opts: { value: LevelScheme; label: string }[] = [
    { value: "jlpt", label: "JLPT" },
    { value: "grade", label: "Grade" },
  ];
  const pad = size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]";

  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-border bg-background p-0.5 font-medium",
        className,
      )}
      role="group"
      aria-label="Level system"
    >
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => setScheme(o.value)}
          className={cn(
            "rounded-full transition-colors",
            pad,
            scheme === o.value
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={scheme === o.value}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
