import {
  forwardRef,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { hiraganaToKatakana, romajiToHiragana } from "@/lib/romaji";
import { formatJapaneseDate, type WritingDirection } from "@/features/diary/storage";
import { DiaryTextToolbar, type KanaMode } from "@/components/diary/DiaryTextToolbar";
import { FuriganaText } from "@/components/diary/FuriganaText";


interface Props {
  dateISO: string;
  direction: WritingDirection;
  text: string;
  kanaMode: KanaMode;
  onText?: (t: string) => void;
  onKanaMode?: (m: KanaMode) => void;
  onDirection?: (d: WritingDirection) => void;
  /** Toolbar rendered directly above the canvas. */
  toolbar?: ReactNode;
  /** The drawing area (live canvas or a static image). */
  canvas: ReactNode;
  readOnly?: boolean;
}

export const DiaryPaper = forwardRef<HTMLDivElement, Props>(function DiaryPaper(
  { dateISO, direction, text, kanaMode, onText, onKanaMode, onDirection, toolbar, canvas, readOnly },
  ref,
) {
  const vertical = direction === "vertical";
  const [focused, setFocused] = useState(false);
  const showRuby = !focused && /[\u4e00-\u9fff]/.test(text);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastFitting = useRef(text);
  // Vertical writing: fit as many evenly spaced columns as the box width allows.
  const [colPx, setColPx] = useState(36);
  const [cols, setCols] = useState(12);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (!w) return;
      const n = Math.max(1, Math.round(w / 36));
      setCols(n);
      setColPx(w / n);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxLines = vertical ? cols : 12;

  // Keep the entry within the visible 12 lines: revert any edit that overflows.
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    const overflows = vertical
      ? el.scrollWidth > el.clientWidth + 1
      : el.scrollHeight > el.clientHeight + 1;
    const tooManyLines = text.split("\n").length > maxLines;
    if ((overflows || tooManyLines) && text !== lastFitting.current) {
      onText?.(lastFitting.current);
    } else if (!overflows && !tooManyLines) {
      lastFitting.current = text;
    }
  }, [text, vertical, onText, maxLines]);

  // Type in romaji → get hiragana or katakana depending on the active mode.
  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    const el = e.target;
    const raw = el.value;
    if (kanaMode === "romaji") {
      onText?.(raw);
      return;
    }
    const pos = el.selectionStart ?? raw.length;
    const { converted, pending } = romajiToHiragana(raw.slice(0, pos));
    const script = kanaMode === "katakana" ? hiraganaToKatakana(converted) : converted;
    const head = script + pending;
    const next = head + raw.slice(pos);
    onText?.(next);
    if (next !== raw) {
      requestAnimationFrame(() => {
        try {
          el.setSelectionRange(head.length, head.length);
        } catch {
          /* element may be unmounted */
        }
      });
    }
  }

  const shared = cn(
    "block h-[27rem] w-full rounded-md rounded-t-none border border-t-0 font-jp text-base",
    vertical
      ? "bg-diary-lines-v px-0 py-1 [writing-mode:vertical-rl]"
      : "bg-diary-lines-h px-3 py-1 leading-[2.25rem]",
  );

  const textareaClass = cn(
    shared,
    "diary-export-top resize-none overflow-hidden outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]",
    showRuby && "text-transparent",
  );

  return (
    <div ref={ref} className="rounded-lg border bg-diary-paper p-4 sm:p-6 shadow-card">
      <p className="font-jp text-lg sm:text-xl tracking-wide mb-4" lang="ja">
        {formatJapaneseDate(dateISO)}
      </p>

      {toolbar}

      {canvas}

      <div className="mt-4">
        {!readOnly && onKanaMode && onDirection ? (
          <DiaryTextToolbar
            kanaMode={kanaMode}
            direction={direction}
            onKanaMode={onKanaMode}
            onDirection={onDirection}
          />
        ) : null}
        <div className="relative" ref={wrapRef} style={vertical ? { ["--diary-col" as string]: `${colPx}px` } : undefined}>
          <textarea
            ref={taRef}
            value={text}
            readOnly={readOnly}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="ここに日記を書きましょう…"
            lang="ja"
            spellCheck={false}
            className={textareaClass}
            style={vertical ? { lineHeight: `${colPx}px` } : undefined}
          />
          {showRuby ? (
            <div
              aria-hidden
              lang="ja"
              className={cn(
                shared,
                "diary-export-top pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-foreground",
              )}
              style={vertical ? { lineHeight: `${colPx}px` } : undefined}
            >
              <FuriganaText text={text} />
            </div>
          ) : null}
        </div>
      </div>

      <div
        data-export-only
        className="-mx-4 sm:-mx-6 mt-3 grid grid-cols-2 px-4 sm:px-6 text-xs text-muted-foreground"
      >
        <span className="text-left">The Tiny Japanese Toolkit</span>
        <span className="text-right">www.thetinyjapanese.com</span>
      </div>
    </div>
  );

});
