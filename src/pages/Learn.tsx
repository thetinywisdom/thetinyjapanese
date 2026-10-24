import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

const verbGroups = [
  {
    group: "Group 1",
    name: "Godan / う-verbs",
    label: "godan-*",
    rule: "Dictionary form ends in any う-row kana (う, く, ぐ, す, つ, ぬ, ぶ, む, る). For -る verbs, the vowel before る is a / u / o.",
    examples: "飲む (nomu), 書く (kaku), 話す (hanasu), 帰る (kaeru)",
  },
  {
    group: "Group 2",
    name: "Ichidan / る-verbs",
    label: "ichidan",
    rule: "Always ends in る. The vowel before る is i or e.",
    examples: "食べる (taberu), 見る (miru), 起きる (okiru)",
  },
  {
    group: "Group 3",
    name: "Irregular",
    label: "irregular-suru, irregular-kuru",
    rule: "Only two members in the whole language.",
    examples: "する (to do), 来る (kuru, to come)",
  },
];

const conjRows = [
  { form: "Non-past affirmative", g1: "飲む", g2: "食べる", g3: "する" },
  { form: "Non-past negative", g1: "飲まない", g2: "食べない", g3: "しない" },
  { form: "Past affirmative", g1: "飲んだ", g2: "食べた", g3: "した" },
  { form: "Past negative", g1: "飲まなかった", g2: "食べなかった", g3: "しなかった" },
];

const extendedForms = [
  {
    form: "Te-form",
    meaning: "Connector",
    use: "Links clauses, makes requests (〜てください), continuous tense (〜ている).",
    g1Rule: "Same swap as past, with て/で. む/ぶ/ぬ → んで · く → いて · ぐ → いで · す → して · つ/る/う → って",
    g1Ex: "飲む → 飲んで",
    g2Rule: "Drop る, add て.",
    g2Ex: "食べる → 食べて",
    g3Rule: "する → して · 来る → きて",
    g3Ex: "して · きて",
    sample: "コーヒーを飲んで、出かけた。 — I had coffee and went out.",
  },
  {
    form: "Potential",
    meaning: "“Can do”",
    use: "Ability or possibility.",
    g1Rule: "Final う-row → え-row, then add る.",
    g1Ex: "飲む → 飲める",
    g2Rule: "Drop る, add られる.",
    g2Ex: "食べる → 食べられる",
    g3Rule: "する → できる · 来る → こられる",
    g3Ex: "できる · こられる",
    sample: "刺身が食べられますか? — Can you eat sashimi?",
  },
  {
    form: "Volitional",
    meaning: "“Let’s …”",
    use: "Suggestions, invitations, expressing intent.",
    g1Rule: "Final う-row → お-row, then add う (long vowel).",
    g1Ex: "飲む → 飲もう",
    g2Rule: "Drop る, add よう.",
    g2Ex: "食べる → 食べよう",
    g3Rule: "する → しよう · 来る → こよう",
    g3Ex: "しよう · こよう",
    sample: "一緒に行こう! — Let’s go together!",
  },
  {
    form: "Imperative",
    meaning: "Direct command",
    use: "Rough — feels harsh. Common in signs, sports, anger.",
    g1Rule: "Final う-row → え-row.",
    g1Ex: "飲む → 飲め",
    g2Rule: "Drop る, add ろ.",
    g2Ex: "食べる → 食べろ",
    g3Rule: "する → しろ · 来る → こい",
    g3Ex: "しろ · こい",
    sample: "早く来い! — Get here, fast!",
  },
  {
    form: "Conditional たら",
    meaning: "“If / when …”",
    use: "Most flexible conditional — works for hypotheticals and timing.",
    g1Rule: "Take the past-affirmative form, add ら.",
    g1Ex: "飲んだ → 飲んだら",
    g2Rule: "Take the past-affirmative form, add ら.",
    g2Ex: "食べた → 食べたら",
    g3Rule: "した → したら · 来た → 来たら",
    g3Ex: "したら · 来たら",
    sample: "雨が降ったら、行かない。 — If it rains, I won’t go.",
  },
  {
    form: "Provisional ば",
    meaning: "“If X (then Y)”",
    use: "More hypothetical or general than たら. Common in proverbs.",
    g1Rule: "Final う-row → え-row, then add ば.",
    g1Ex: "飲む → 飲めば",
    g2Rule: "Drop る, add れば.",
    g2Ex: "食べる → 食べれば",
    g3Rule: "する → すれば · 来る → くれば",
    g3Ex: "すれば · くれば",
    sample: "急げば間に合う。 — If you hurry, you’ll make it.",
  },
  {
    form: "Passive",
    meaning: "“Is/was …-ed”",
    use: "Action received by the subject. Also used for adversity (something happened to you).",
    g1Rule: "Final う-row → あ-row, then add れる (う → わ, not あ).",
    g1Ex: "飲む → 飲まれる",
    g2Rule: "Drop る, add られる.",
    g2Ex: "食べる → 食べられる",
    g3Rule: "する → される · 来る → こられる",
    g3Ex: "される · こられる",
    sample: "ケーキを食べられた。 — My cake got eaten (on me).",
  },
  {
    form: "Causative",
    meaning: "“Make / let … do”",
    use: "Force or permit someone to do something.",
    g1Rule: "Final う-row → あ-row, then add せる (う → わ).",
    g1Ex: "飲む → 飲ませる",
    g2Rule: "Drop る, add させる.",
    g2Ex: "食べる → 食べさせる",
    g3Rule: "する → させる · 来る → こさせる",
    g3Ex: "させる · こさせる",
    sample: "子供に野菜を食べさせる。 — I make the kids eat vegetables.",
  },
  {
    form: "Causative-passive",
    meaning: "“Be made to do”",
    use: "Forced into doing something — often reluctantly.",
    g1Rule: "Final う-row → あ-row, then add せられる (う → わ).",
    g1Ex: "飲む → 飲ませられる",
    g2Rule: "Drop る, add させられる.",
    g2Ex: "食べる → 食べさせられる",
    g3Rule: "する → させられる · 来る → こさせられる",
    g3Ex: "させられる · こさせられる",
    sample: "野菜を食べさせられた。 — I was made to eat vegetables.",
  },
];

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

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-10 pb-16">
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
              <li>
                <span className="font-serif" lang="ja">帰る</span>{" "}
                <span className="text-muted-foreground">(かえる) — to return home</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">入る</span>{" "}
                <span className="text-muted-foreground">(はいる) — to enter</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">走る</span>{" "}
                <span className="text-muted-foreground">(はしる) — to run</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">知る</span>{" "}
                <span className="text-muted-foreground">(しる) — to know</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">切る</span>{" "}
                <span className="text-muted-foreground">(きる) — to cut</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">要る</span>{" "}
                <span className="text-muted-foreground">(いる) — to need</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">滑る</span>{" "}
                <span className="text-muted-foreground">(すべる) — to slip / slide</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">喋る</span>{" "}
                <span className="text-muted-foreground">(しゃべる) — to chat / talk</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">蹴る</span>{" "}
                <span className="text-muted-foreground">(ける) — to kick</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">減る</span>{" "}
                <span className="text-muted-foreground">(へる) — to decrease</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">焦る</span>{" "}
                <span className="text-muted-foreground">(あせる) — to be in a hurry / panic</span>
              </li>
              <li>
                <span className="font-serif" lang="ja">限る</span>{" "}
                <span className="text-muted-foreground">(かぎる) — to limit</span>
              </li>
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
                {[
                  { from: "う", to: "わ", example: "買う → 買わない" },
                  { from: "く", to: "か", example: "書く → 書かない" },
                  { from: "ぐ", to: "が", example: "泳ぐ → 泳がない" },
                  { from: "す", to: "さ", example: "話す → 話さない" },
                  { from: "つ", to: "た", example: "待つ → 待たない" },
                  { from: "ぬ", to: "な", example: "死ぬ → 死なない" },
                  { from: "ぶ", to: "ば", example: "遊ぶ → 遊ばない" },
                  { from: "む", to: "ま", example: "飲む → 飲まない" },
                  { from: "る", to: "ら", example: "売る → 売らない" },
                ].map((r) => (
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
              きれい, 嫌い, 有名, 簡単
            </span>
            . The <span lang="ja">い</span> here isn't the adjective ending; it's part of the kanji
            reading.
          </Callout>
        </Section>

        <Section
          title="Beyond the basics"
          intro="Six more forms the practice tool covers. Each is a single rule per verb group — no new vocabulary, just new tail swaps."
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
                  <span className="font-serif" lang="ja">{r.sample}</span>
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
