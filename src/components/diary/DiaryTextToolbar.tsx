import { cn } from "@/lib/utils";
import { type WritingDirection } from "@/features/diary/storage";

export type KanaMode = "hiragana" | "katakana" | "romaji";

const KANA_OPTIONS: { mode: KanaMode; label: string; title: string; jp?: boolean }[] = [
  { mode: "hiragana", label: "あ", title: "Hiragana input", jp: true },
  { mode: "katakana", label: "ア", title: "Katakana input", jp: true },
  { mode: "romaji", label: "A", title: "Alphabet (no conversion)" },
];

interface Props {
  kanaMode: KanaMode;
  direction: WritingDirection;
  onKanaMode: (m: KanaMode) => void;
  onDirection: (d: WritingDirection) => void;
}

export function DiaryTextToolbar({ kanaMode, direction, onKanaMode, onDirection }: Props) {
  return (
    <div data-export-hide className="flex items-center justify-between gap-2 overflow-x-auto rounded-t-md border border-b-0 bg-background/90 backdrop-blur p-1.5">
      <div className="inline-flex overflow-hidden rounded-md border text-sm">
        {KANA_OPTIONS.map((o, i) => (
          <button
            key={o.mode}
            type="button"
            onClick={() => onKanaMode(o.mode)}
            aria-pressed={kanaMode === o.mode}
            title={o.title}
            lang={o.jp ? "ja" : undefined}
            className={cn(
              "h-8 min-w-9 px-2",
              o.jp && "font-jp",
              i > 0 && "border-l",
              kanaMode === o.mode ? "bg-muted font-medium" : "hover:bg-muted/50",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      <div className="inline-flex overflow-hidden rounded-md border text-xs">
        <button
          type="button"
          onClick={() => onDirection("vertical")}
          aria-pressed={direction === "vertical"}
          className={cn("h-8 px-3", direction === "vertical" ? "bg-muted font-medium" : "hover:bg-muted/50")}
          lang="ja"
        >
          縦書き
        </button>
        <button
          type="button"
          onClick={() => onDirection("horizontal")}
          aria-pressed={direction === "horizontal"}
          className={cn(
            "h-8 border-l px-3",
            direction === "horizontal" ? "bg-muted font-medium" : "hover:bg-muted/50",
          )}
          lang="ja"
        >
          横書き
        </button>
      </div>
    </div>
  );
}
