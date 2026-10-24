import { Link } from "react-router-dom";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const readingRows = [
  {
    type: "On'yomi (音読み)",
    origin: "Chinese-derived reading",
    when: "Usually used in compounds (two or more kanji together).",
    example: "学校 (がっこう) — school",
  },
  {
    type: "Kun'yomi (訓読み)",
    origin: "Native Japanese reading",
    when: "Usually used when the kanji stands alone or has okurigana (kana tail).",
    example: "学ぶ (まなぶ) — to learn",
  },
];

const radicalRows = [
  { rad: "氵", name: "water", examples: "海, 河, 湖" },
  { rad: "木", name: "tree", examples: "林, 森, 校" },
  { rad: "心", name: "heart / mind", examples: "思, 想, 念" },
  { rad: "言", name: "speech", examples: "話, 語, 読" },
  { rad: "日", name: "sun / day", examples: "明, 時, 曜" },
  { rad: "亻", name: "person", examples: "何, 休, 体" },
];

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">{intro}</p>
      {children}
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--accent))]/40 bg-[hsl(var(--orange-light))] p-4 text-sm leading-relaxed">
      {children}
    </div>
  );
}

const KanjiLearn = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-10 pb-16">
        <div className="text-center py-4">
          <h1 className="font-serif text-3xl md:text-4xl mb-2">Learn the basics of kanji</h1>
          <p className="text-sm text-muted-foreground">
            What kanji are, how they're read, and how to start recognizing them.
          </p>
        </div>

        <Section
          title="What is kanji?"
          intro="Japanese is written with three scripts. Hiragana and katakana are phonetic — each character is one sound. Kanji are different: they're logographic characters borrowed from Chinese, and each one carries meaning plus one or more readings."
        >
          <Callout>
            You'll meet roughly 100 kanji at JLPT N5, ~300 by N4, and ~650 by N3. You don't need to
            learn them all at once — just the ones in the words you actually use.
          </Callout>
        </Section>

        <Section
          title="JLPT vs School Grade (Kanken)"
          intro="Two different ways to organize kanji difficulty. You can switch between them in the header — here's what each means."
        >
          <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">System</th>
                  <th className="text-left p-3">What it is</th>
                  <th className="text-left p-3">How it buckets kanji</th>
                  <th className="text-left p-3">Best for</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t align-top">
                  <td className="p-3 font-medium whitespace-nowrap">JLPT (N5–N1)</td>
                  <td className="p-3">The Japanese Language Proficiency Test — the standard exam for non-native speakers.</td>
                  <td className="p-3 leading-relaxed">
                    Based on exam frequency and practical usage. N5 ≈ 100 kanji, N4 ≈ 300, N3 ≈ 650, N2 ≈ 1,000, N1 ≈ 2,000+.
                  </td>
                  <td className="p-3">Learners preparing for the JLPT or following a textbook path.</td>
                </tr>
                <tr className="border-t align-top">
                  <td className="p-3 font-medium whitespace-nowrap">School Grade (G1–G8)</td>
                  <td className="p-3">The order Japanese children learn kanji in school — also called kyōiku and jōyō kanji.</td>
                  <td className="p-3 leading-relaxed">
                    G1–G6 = elementary years 1–6 (kyōiku kanji). G8 = remaining jōyō taught in junior high and high school.
                  </td>
                  <td className="p-3">Learners who want to build literacy the same way native speakers do.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout>
            <strong>Both cover the same kanji.</strong> The difference is the order and grouping. JLPT buckets by exam level; School Grade buckets by when Japanese kids learn them. Pick the one that matches your study goal — you can switch anytime in the header toggle.
          </Callout>
        </Section>

        <Section
          title="On'yomi vs Kun'yomi"
          intro="Most kanji have at least two readings. Which one you use depends on the word."
        >
          <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Reading type</th>
                  <th className="text-left p-3">Origin</th>
                  <th className="text-left p-3">When it's used</th>
                  <th className="text-left p-3">Example</th>
                </tr>
              </thead>
              <tbody>
                {readingRows.map((r) => (
                  <tr key={r.type} className="border-t align-top">
                    <td className="p-3 font-medium whitespace-nowrap">{r.type}</td>
                    <td className="p-3">{r.origin}</td>
                    <td className="p-3 leading-relaxed">{r.when}</td>
                    <td className="p-3 font-serif" lang="ja">
                      {r.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Callout>
            <strong>Don't try to memorize every reading.</strong> Learn kanji inside the words you
            see them in. The right reading will come naturally with the word.
          </Callout>
        </Section>

        <Section
          title="Radicals — the building blocks"
          intro="Most kanji are built from smaller parts called radicals. Radicals often hint at meaning (e.g. anything with 氵 tends to relate to water). Spotting them turns kanji from 'random shapes' into 'small combinations'."
        >
          <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-center p-3">Radical</th>
                  <th className="text-left p-3">Meaning</th>
                  <th className="text-left p-3">Found in</th>
                </tr>
              </thead>
              <tbody>
                {radicalRows.map((r) => (
                  <tr key={r.rad} className="border-t">
                    <td className="p-3 text-center font-serif text-2xl" lang="ja">
                      {r.rad}
                    </td>
                    <td className="p-3">{r.name}</td>
                    <td className="p-3 font-serif" lang="ja">
                      {r.examples}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            In the practice tool, every answer screen shows the radical breakdown of the kanji you
            just saw — use it to slowly build a mental library.
          </p>
        </Section>


        <Section
          title="How to read a word with kanji"
          intro="Two quick walk-throughs of common patterns."
        >
          <div className="rounded-lg border bg-card shadow-card p-5 space-y-2">
            <p className="font-serif text-2xl" lang="ja">
              食べる <span className="text-muted-foreground text-base">(たべる) — to eat</span>
            </p>
            <p className="text-sm leading-relaxed">
              <span lang="ja" className="font-serif">食</span> uses its kun'yomi reading{" "}
              <span lang="ja" className="font-serif">た</span>. The kana tail{" "}
              <span lang="ja" className="font-serif">べる</span> is okurigana — it stays in
              hiragana and changes when the verb conjugates (
              <span lang="ja" className="font-serif">食べた</span>,{" "}
              <span lang="ja" className="font-serif">食べない</span>).
            </p>
          </div>

          <div className="rounded-lg border bg-card shadow-card p-5 space-y-2">
            <p className="font-serif text-2xl" lang="ja">
              学校 <span className="text-muted-foreground text-base">(がっこう) — school</span>
            </p>
            <p className="text-sm leading-relaxed">
              Two kanji glued together with no kana — a compound. Both use their on'yomi readings:{" "}
              <span lang="ja" className="font-serif">学</span> (がく) +{" "}
              <span lang="ja" className="font-serif">校</span> (こう). The two sounds blend into{" "}
              <span lang="ja" className="font-serif">がっこう</span>.
            </p>
          </div>
        </Section>

        <Section
          title="Tips for getting started"
          intro="A few habits that make kanji feel manageable."
        >
          <ul className="space-y-2 text-sm leading-relaxed list-disc pl-5">
            <li>Learn kanji inside words, not in isolation — readings only make sense in context.</li>
            <li>Notice radicals as you go. You don't need to memorize a list; recognition is enough.</li>
            <li>Review little and often. Five minutes a day beats one long session a week.</li>
            <li>Stage difficulty with JLPT or School Grade levels — start easy and add harder sets only when the current ones feel comfortable.</li>
          </ul>

          <p className="text-sm">
            <Link to="/kanji" className="underline hover:text-[hsl(var(--accent))]">
              Ready? Start practicing →
            </Link>
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default KanjiLearn;
