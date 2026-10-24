import { decomposeWord } from "@/data/kanji-radicals";

interface Props {
  word: string;
}

export function RadicalBreakdown({ word }: Props) {
  const breakdown = decomposeWord(word);
  if (breakdown.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        Kanji breakdown
      </p>
      <ul className="space-y-3">
        {breakdown.map(({ char, radicals, meaning, on, kun }) => (
          <li key={char} className="flex items-start gap-3 text-sm">
            <span
              className="font-serif text-2xl leading-none w-8 shrink-0 text-center pt-0.5"
              lang="ja"
            >
              {char}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              {meaning && <p className="text-foreground leading-snug">{meaning}</p>}
              {(on?.length || kun?.length || radicals.length > 0) && (
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    {on?.length ? (
                      <tr className="border-t border-border/60">
                        <td className="py-2 pr-3 align-top uppercase tracking-wider text-muted-foreground w-16">
                          On
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1.5" lang="ja">
                            {on.map((r, i) => (
                              <span
                                key={i}
                                className="font-serif text-foreground bg-muted/60 rounded px-1.5 py-0.5"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    {kun?.length ? (
                      <tr className="border-t border-border/60">
                        <td className="py-2 pr-3 align-top uppercase tracking-wider text-muted-foreground w-16">
                          Kun
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1.5" lang="ja">
                            {kun.map((r, i) => (
                              <span
                                key={i}
                                className="font-serif text-foreground bg-muted/60 rounded px-1.5 py-0.5"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                    {radicals.length > 0 && (
                      <tr className="border-t border-border/60">
                        <td className="py-2 pr-3 align-top uppercase tracking-wider text-muted-foreground w-16">
                          Radicals
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1.5">
                            {radicals.map((r, i) => (
                              <span
                                key={i}
                                className="inline-flex items-baseline gap-1 bg-muted/60 rounded px-1.5 py-0.5"
                              >
                                <span className="font-serif text-foreground" lang="ja">
                                  {r.char}
                                </span>
                                {r.name && (
                                  <span className="text-muted-foreground">{r.name}</span>
                                )}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
