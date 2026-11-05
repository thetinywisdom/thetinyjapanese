import { useEffect, useState } from "react";
import { annotateDiaryFurigana, type RubyToken } from "@/lib/furigana-analyze";

/**
 * Renders diary text with furigana. The analyser loads on first use;
 * until then the same characters are shown without ruby so the line
 * does not disappear.
 */
export function FuriganaText({ text }: { text: string }) {
  const [tokens, setTokens] = useState<RubyToken[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTokens(null);
    annotateDiaryFurigana(text)
      .then((next) => {
        if (!cancelled) setTokens(next);
      })
      .catch(() => {
        if (!cancelled) setTokens([{ base: text }]);
      });
    return () => {
      cancelled = true;
    };
  }, [text]);

  const shown = tokens ?? [{ base: text }];
  return (
    <>
      {shown.map((t, i) =>
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
