import type { Example } from "@/data/examples";

interface Props {
  examples: Example[];
}

export function ExampleSentences({ examples }: Props) {
  if (examples.length === 0) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        Examples
      </p>
      <ul className="space-y-2">
        {examples.map((ex, i) => (
          <li key={i} className="space-y-0.5">
            <p className="font-serif text-base leading-snug" lang="ja">
              {ex.ja}
            </p>
            <p className="text-xs text-muted-foreground leading-snug">{ex.en}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
