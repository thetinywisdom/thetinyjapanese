import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  conjRows,
  extendedForms,
  godanLookalikes,
  godanNegativeSwaps,
  naAdjectivesEndingInI,
  naAdjectivesOther,
  verbGroups,
} from "@/content/learner-copy";

const adjectives = [
  {
    type: "い-adjective",
    id: "Ends in い (い is part of the word, not okurigana).",
    behavior: "Conjugates like a verb. たかい → たかかった, たかくない.",
    examples: "高い, 安い, 楽しい, 新しい",
  },
  {
    type: "な-adjective",
    id: "Takes な before a noun.",
    behavior: "Behaves like a noun + copula. きれい → きれいだった, きれいじゃない.",
    examples: "きれい, 静か, 元気, 便利",
  },
];

function Section({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">{intro}</p>
      {children}
    </section>
  );
}

function Sample({ text }: { text: string }) {
  const splitAt = text.indexOf(" — ");
  if (splitAt === -1) {
    return <span className="font-serif" lang="ja">{text}</span>;
  }
  return (
    <>
      <span className="font-serif" lang="ja">{text.slice(0, splitAt)}</span>
      <span> — {text.slice(splitAt + 3)}</span>
    </>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--accent))]/40 bg-[hsl(var(--orange-light))] p-4 text-sm leading-relaxed">
      {children}
    </div>
  );
}

const Learn = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="page-shell py-6 space-y-10 pb-16">
        <div className="text-center py-4">
          <h1 className="font-serif text-3xl md:text-4xl mb-2">Learn the basics</h1>
          <p className="text-sm text-muted-foreground">
            Verb groups and adjective types — the foundation behind every transformation.
          </p>
        </div>

        <Section
          title="Verb groups"
          intro="Japanese verbs fall into three groups. The group decides how a verb conjugates — every form in this app is built from these rules."
        >
          <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Group</th>
                  <th className="text-left p-3">Common name</th>
                  <th className="text-left p-3">How to identify</th>
                  <th className="text-left p-3">Examples</th>
                </tr>
              </thead>
              <tbody>
                {verbGroups.map((g) => (
                  <tr key={g.group} className="border-t align-top">
                    <td className="p-3 font-medium whitespace-nowrap">{g.group}</td>
                    <td className="p-3">{g.name}</td>
                    <td className="p-3 leading-relaxed">{g.rule}</td>
                    <td className="p-3" lang="ja">
                      {g.examples}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout>
            <p className="mb-2">
              <strong>Watch out:</strong> some verbs end in <span lang="ja">いる/える</span> but are
              actually Group 1 (Godan). The most common ones to memorize:
            </p>
            <ul className="space-y-1">
              {godanLookalikes.map((v) => (
                <li key={v.word}>
                  <span className="font-serif" lang="ja">{v.word}</span>{" "}
                  <span className="text-muted-foreground">({v.reading}) — {v.gloss}</span>
                </li>
              ))}
            </ul>
          </Callout>
        </Section>

        <Section
          title="The four basic forms"
          intro="Tense × polarity — start here. Notice how each group changes its tail differently."
        >
          <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Form</th>
                  <th className="text-left p-3" lang="ja">
                    Group 1 (飲む)
                  </th>
                  <th className="text-left p-3" lang="ja">
                    Group 2 (食べる)
                  </th>
                  <th className="text-left p-3" lang="ja">
                    Group 3 (する)
                  </th>
                </tr>
              </thead>
              <tbody>
                {conjRows.map((r) => (
                  <tr key={r.form} className="border-t">
                    <td className="p-3 font-medium">{r.form}</td>
                    <td className="p-3 font-serif" lang="ja">
                      {r.g1}
                    </td>
                    <td className="p-3 font-serif" lang="ja">
                      {r.g2}
                    </td>
                    <td className="p-3 font-serif" lang="ja">
                      {r.g3}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="The Godan negative swap"
          intro="The Group 1 negative rule is really one move on the kana chart: take the final う-row mora of the dictionary form and slide it up to the あ-row, then add ない. Nine endings, nine swaps."
        >
          <div className="overflow-x-auto rounded-md border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-center p-2">Ending</th>
                  <th className="text-center p-2">Becomes</th>
                  <th className="text-center p-2">Example</th>
                </tr>
              </thead>
              <tbody>
                {godanNegativeSwaps.map((r) => (
                  <tr key={r.from} className="border-t">
                    <td className="p-2 text-center font-serif" lang="ja">{r.from}</td>
                    <td className="p-2 text-center font-serif" lang="ja">{r.to}</td>
                    <td className="p-2 text-center font-serif" lang="ja">{r.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout>
            <strong>Watch out:</strong> a few words end in <span lang="ja">い</span> but are actually
            な-adjectives —{" "}
            <span lang="ja" className="font-serif">
              {naAdjectivesEndingInI.join(", ")}
            </span>
            . The <span lang="ja">い</span> here isn't the adjective ending; it's part of the word.
            Other common な-adjectives don't end in <span lang="ja">い</span> at all —{" "}
            <span lang="ja" className="font-serif">
              {naAdjectivesOther.join(", ")}
            </span>
            .
          </Callout>
        </Section>

        <Section
          title="Beyond the basics"
          intro="More forms the practice tool covers. Each is a single rule per verb group — no new vocabulary, just new tail swaps."
        >
          <div className="space-y-6">
            {extendedForms.map((r) => (
              <div
                key={r.form}
                className="overflow-hidden rounded-lg border bg-card shadow-card"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b bg-muted/60 px-4 py-3">
                  <div>
                    <h3 className="font-serif text-lg leading-tight">{r.form}</h3>
                    <p className="text-xs text-muted-foreground">{r.meaning}</p>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md text-right">{r.use}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                      <tr className="border-b">
                        <th className="text-left p-3 w-24">Group</th>
                        <th className="text-left p-3">Rule</th>
                        <th className="text-left p-3 w-48">Example</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b align-top">
                        <td className="p-3 font-medium">Group 1<br /><span className="text-xs text-muted-foreground font-normal">Godan</span></td>
                        <td className="p-3 leading-relaxed">{r.g1Rule}</td>
                        <td className="p-3 font-serif" lang="ja">{r.g1Ex}</td>
                      </tr>
                      <tr className="border-b align-top">
                        <td className="p-3 font-medium">Group 2<br /><span className="text-xs text-muted-foreground font-normal">Ichidan</span></td>
                        <td className="p-3 leading-relaxed">{r.g2Rule}</td>
                        <td className="p-3 font-serif" lang="ja">{r.g2Ex}</td>
                      </tr>
                      <tr className="align-top">
                        <td className="p-3 font-medium">Group 3<br /><span className="text-xs text-muted-foreground font-normal">Irregular</span></td>
                        <td className="p-3 leading-relaxed font-serif" lang="ja">{r.g3Rule}</td>
                        <td className="p-3 font-serif" lang="ja">{r.g3Ex}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="border-t bg-[hsl(var(--orange-light))]/40 px-4 py-3 text-sm">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground mr-2">In use</span>
                  <Sample text={r.sample} />
                </div>
              </div>
            ))}
          </div>

          <Callout>
            <strong>Tip:</strong> たら and ば both translate as “if” in English, but{" "}
            <span lang="ja" className="font-serif">たら</span> is the everyday choice (“if/when X
            happens”), while <span lang="ja" className="font-serif">ば</span> is more hypothetical
            or proverbial. When in doubt, reach for <span lang="ja" className="font-serif">たら</span>.
          </Callout>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default Learn;
