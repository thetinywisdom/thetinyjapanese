import type { JlptLevel } from "@/data/verbs";
import type { SchoolGrade } from "@/data/kanji-radicals";
import {
  JLPT_LEVELS,
  SCHOOL_GRADES,
  type LevelScheme,
} from "@/lib/kanji-levels";
import { kankenChipLabel } from "@/content/learner-copy";
import { useLevelScheme } from "@/features/level-scheme/useLevelScheme";
import { HelpCircle } from "lucide-react";
import { SchemeToggle } from "@/components/SchemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  /** Current scheme as known to the consuming context. Kept in sync globally. */
  scheme: LevelScheme;
  levels: (JlptLevel | SchoolGrade)[];
  /** Called when the level chips change. Scheme is handled globally. */
  onChange: (next: {
    scheme: LevelScheme;
    levels: (JlptLevel | SchoolGrade)[];
  }) => void;
}

/**
 * Level chip picker. The JLPT-vs-Grade toggle lives in the site header
 * (global), so we only render chips here matching the active scheme.
 */
export function LevelPicker({ scheme, levels, onChange }: Props) {
  const [globalScheme] = useLevelScheme();
  // Defer to the global truth in case props drift for a frame.
  const effective = globalScheme ?? scheme;

  const toggle = (l: JlptLevel | SchoolGrade) => {
    const has = (levels as (JlptLevel | SchoolGrade)[]).includes(l);
    const next = has ? levels.filter((x) => x !== l) : [...levels, l];
    if (next.length === 0) return;
    onChange({ scheme: effective, levels: next });
  };

  const items: (JlptLevel | SchoolGrade)[] =
    effective === "jlpt" ? [...JLPT_LEVELS] : [...SCHOOL_GRADES];

  const labelOf = (l: JlptLevel | SchoolGrade) =>
    effective === "jlpt" ? String(l) : `G${l}`;

  const sublabelOf = (l: JlptLevel | SchoolGrade) =>
    effective === "jlpt" ? null : kankenChipLabel(l as SchoolGrade);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {effective === "jlpt" ? "JLPT level" : "School grade"}
        </p>
        <TooltipProvider>
          <Tooltip>
            <div className="inline-flex items-center rounded-full border border-border bg-background p-0.5 pr-1 gap-0.5">
              <SchemeToggle size="xs" className="border-0 bg-transparent p-0" />
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="About level systems"
                  className="inline-flex items-center justify-center h-6 w-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-help"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
            </div>
            <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
              <p className="font-medium mb-1">JLPT vs School Grade</p>
              <p>
                JLPT buckets kanji by exam level (N5 ≈ 100, N4 ≈ 300, N3 ≈ 650).
                School Grade follows the order Japanese children learn them (G1–G6 = elementary, G8 = junior high / high school).
                Both cover the same kanji — just different grouping.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((l) => {
          const active = (levels as (JlptLevel | SchoolGrade)[]).includes(l);
          const sub = sublabelOf(l);
          return (
            <button
              key={String(l)}
              type="button"
              onClick={() => toggle(l)}
              title={sub ?? undefined}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
              }`}
            >
              {labelOf(l)}
            </button>
          );
        })}
      </div>
      {effective === "grade" && (
        <p className="text-[11px] text-muted-foreground leading-snug">
          G1–G6 are elementary years 1–6 ({kankenChipLabel(1)} down to {kankenChipLabel(6)}).
          G8 is the remaining jōyō, taught later ({kankenChipLabel(8)}).
        </p>
      )}
    </div>
  );
}
