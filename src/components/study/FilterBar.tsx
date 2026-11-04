import { useSession, type Filters, type VerbClassFilter } from "@/features/study/SessionContext";
import { ALL_QUESTION_TYPES, questionLabel, QUESTION_TOOLTIPS, supportedQuestions, type QuestionType } from "@/lib/conjugation";
import { eligibleWords } from "@/features/study/SessionContext";
import { WORD_TYPE_LABEL, type WordType } from "@/data/words";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LevelPicker } from "@/components/kanji/LevelPicker";

const WORD_TYPES: { value: WordType; label: string }[] = [
  { value: "verb", label: WORD_TYPE_LABEL.verb },
  { value: "adj-i", label: WORD_TYPE_LABEL["adj-i"] },
  { value: "adj-na", label: WORD_TYPE_LABEL["adj-na"] },
  { value: "noun", label: WORD_TYPE_LABEL.noun },
];

const CLASSES: { value: VerbClassFilter; label: string }[] = [
  { value: "ichidan", label: "Ichidan" },
  { value: "godan", label: "Godan" },
  { value: "irregular-suru", label: "する" },
  { value: "irregular-kuru", label: "来る" },
];

const QUESTION_GROUPS: { label: string; types: QuestionType[] }[] = [
  {
    label: "Basics · tense × polarity",
    types: ["non-past-affirmative", "non-past-negative", "past-affirmative", "past-negative"],
  },
  { label: "Connecting & commands", types: ["te-form", "imperative"] },
  { label: "Modality & conditionals", types: ["potential", "volitional", "conditional-tara", "provisional-eba"] },
  { label: "Voice (verbs only)", types: ["passive", "causative", "causative-passive"] },
];

const SHORT_LABEL: Partial<Record<QuestionType, string>> = {
  "non-past-affirmative": "Non-past +",
  "non-past-negative": "Non-past −",
  "past-affirmative": "Past +",
  "past-negative": "Past −",
  "conditional-tara": "たら",
  "provisional-eba": "ば",
  "causative-passive": "Caus.-passive",
};

function Chip({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-2.5 py-1 rounded-full border transition-colors font-medium ${
        disabled
          ? "opacity-40 cursor-not-allowed border-border text-muted-foreground"
          : active
            ? "bg-foreground text-background border-foreground"
            : "bg-transparent text-muted-foreground border-border hover:border-foreground/40"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterBar() {
  const { state, setFilters } = useSession();
  const f = state.filters;
  const count = eligibleWords(f).length;

  // Which questions are supported by at least one selected word type.
  const supportedByAny = new Set<QuestionType>();
  for (const t of f.wordTypes) for (const q of supportedQuestions(t)) supportedByAny.add(q);

  const showVerbClasses = f.wordTypes.includes("verb");

  const toggle = <K extends keyof Filters>(key: K, value: Filters[K] extends (infer U)[] ? U : never) => {
    const cur = f[key] as unknown as readonly (typeof value)[];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    if (next.length === 0) return;
    setFilters({ [key]: next } as Partial<Filters>);
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-card shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg">Filters</h2>
        <span className="text-xs text-muted-foreground">{count} words available</span>
      </div>

      <LevelPicker
        scheme={f.scheme}
        levels={f.levels}
        onChange={(n) => setFilters(n)}
      />

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Word type</p>
        <div className="flex flex-wrap gap-2">
          {WORD_TYPES.map((t) => (
            <Chip
              key={t.value}
              active={f.wordTypes.includes(t.value)}
              onClick={() => toggle("wordTypes", t.value)}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </div>

      {showVerbClasses && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Verb class</p>
          <div className="flex flex-wrap gap-2">
            {CLASSES.map((c) => (
              <Chip key={c.value} active={f.classes.includes(c.value)} onClick={() => toggle("classes", c.value)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Question type</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFilters({ questions: [...ALL_QUESTION_TYPES] })}
              className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilters({ questions: QUESTION_GROUPS[0].types })}
              className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
            >
              Basics only
            </button>
          </div>
        </div>
        {QUESTION_GROUPS.map((g) => (
          <div key={g.label} className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground/80">{g.label}</p>
            <div className="flex flex-wrap gap-2">
              {g.types.map((q) => {
                const supported = supportedByAny.has(q);
                return (
                  <Chip
                    key={q}
                    disabled={!supported}
                    active={supported && f.questions.includes(q)}
                    onClick={() => supported && toggle("questions", q)}
                  >
                    <span className="flex items-center gap-1">
                      {SHORT_LABEL[q] ?? questionLabel(q)}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-current opacity-40 hover:opacity-100 cursor-help text-[9px] leading-none select-none"
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            ?
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="max-w-[220px] text-xs leading-relaxed">{QUESTION_TOOLTIPS[q]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </span>
                  </Chip>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Session length</p>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 15, 20, 30].map((n) => (
            <Chip
              key={n}
              active={f.sessionLength === n}
              onClick={() => setFilters({ sessionLength: n })}
            >
              {n}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
