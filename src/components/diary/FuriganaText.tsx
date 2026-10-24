import { useMemo } from "react";
import { annotateFurigana } from "@/lib/furigana-text";

/** Renders Japanese text with furigana above any kanji it recognises. */
export function FuriganaText({ text }: { text: string }) {
  const tokens = useMemo(() => annotateFurigana(text), [text]);
  return (
    <>
      {tokens.map((t, i) =>
        t.ruby ? (
          <ruby key={i}>
            {t.base}
            <rt className="text-[0.5em] font-normal">{t.ruby}</rt>
          </ruby>
        ) : (
          <span key={i}>{t.base}</span>
        ),
      )}
    </>
  );
}
