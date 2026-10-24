import { explanation } from "@/lib/conjugation";
import type { QuestionType } from "@/lib/conjugation";

type Row = { from: string; to: string; example: string };

function RuleTable({
  intro,
  headers,
  rows,
  footer,
}: {
  intro?: string;
  headers: [string, string, string];
  rows: Row[];
  footer?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {intro && <p className="text-sm leading-relaxed">{intro}</p>}
      <div className="overflow-x-auto rounded-md border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-center p-2">{headers[0]}</th>
              <th className="text-center p-2">{headers[1]}</th>
              <th className="text-center p-2">{headers[2]}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="p-2 text-center font-serif" lang="ja">
                  {r.from}
                </td>
                <td className="p-2 text-center font-serif" lang="ja">
                  {r.to}
                </td>
                <td className="p-2 text-center font-serif" lang="ja">
                  {r.example}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer && <p className="text-xs text-muted-foreground">{footer}</p>}
    </div>
  );
}

// ── Godan tables ────────────────────────────────────────────────────────────

const godanPastRows: Row[] = [
  { from: "う", to: "った", example: "買う → 買った" },
  { from: "つ", to: "った", example: "待つ → 待った" },
  { from: "る", to: "った", example: "ある → あった" },
  { from: "く", to: "いた", example: "書く → 書いた" },
  { from: "ぐ", to: "いだ", example: "泳ぐ → 泳いだ" },
  { from: "す", to: "した", example: "話す → 話した" },
  { from: "ぬ", to: "んだ", example: "死ぬ → 死んだ" },
  { from: "ぶ", to: "んだ", example: "遊ぶ → 遊んだ" },
  { from: "む", to: "んだ", example: "飲む → 飲んだ" },
];

const godanTeRows: Row[] = [
  { from: "う", to: "って", example: "買う → 買って" },
  { from: "つ", to: "って", example: "待つ → 待って" },
  { from: "る", to: "って", example: "売る → 売って" },
  { from: "く", to: "いて", example: "書く → 書いて" },
  { from: "ぐ", to: "いで", example: "泳ぐ → 泳いで" },
  { from: "す", to: "して", example: "話す → 話して" },
  { from: "ぬ", to: "んで", example: "死ぬ → 死んで" },
  { from: "ぶ", to: "んで", example: "遊ぶ → 遊んで" },
  { from: "む", to: "んで", example: "飲む → 飲んで" },
];

const godanNegRows: Row[] = [
  { from: "う", to: "わ", example: "買う → 買わない" },
  { from: "く", to: "か", example: "書く → 書かない" },
  { from: "ぐ", to: "が", example: "泳ぐ → 泳がない" },
  { from: "す", to: "さ", example: "話す → 話さない" },
  { from: "つ", to: "た", example: "待つ → 待たない" },
  { from: "ぬ", to: "な", example: "死ぬ → 死なない" },
  { from: "ぶ", to: "ば", example: "遊ぶ → 遊ばない" },
  { from: "む", to: "ま", example: "飲む → 飲まない" },
  { from: "る", to: "ら", example: "売る → 売らない" },
];

const godanIRows: Row[] = [
  { from: "う", to: "い", example: "買う → 買います" },
  { from: "く", to: "き", example: "書く → 書きます" },
  { from: "ぐ", to: "ぎ", example: "泳ぐ → 泳ぎます" },
  { from: "す", to: "し", example: "話す → 話します" },
  { from: "つ", to: "ち", example: "待つ → 待ちます" },
  { from: "ぬ", to: "に", example: "死ぬ → 死にます" },
  { from: "ぶ", to: "び", example: "遊ぶ → 遊びます" },
  { from: "む", to: "み", example: "飲む → 飲みます" },
  { from: "る", to: "り", example: "売る → 売ります" },
];

// う-row → え-row (potential / imperative / eba)
const godanERows: Row[] = [
  { from: "う", to: "え", example: "買う → 買える" },
  { from: "く", to: "け", example: "書く → 書ける" },
  { from: "ぐ", to: "げ", example: "泳ぐ → 泳げる" },
  { from: "す", to: "せ", example: "話す → 話せる" },
  { from: "つ", to: "て", example: "待つ → 待てる" },
  { from: "ぬ", to: "ね", example: "死ぬ → 死ねる" },
  { from: "ぶ", to: "べ", example: "遊ぶ → 遊べる" },
  { from: "む", to: "め", example: "飲む → 飲める" },
  { from: "る", to: "れ", example: "売る → 売れる" },
];

// う-row → お-row (volitional)
const godanORows: Row[] = [
  { from: "う", to: "お", example: "買う → 買おう" },
  { from: "く", to: "こ", example: "書く → 書こう" },
  { from: "ぐ", to: "ご", example: "泳ぐ → 泳ごう" },
  { from: "す", to: "そ", example: "話す → 話そう" },
  { from: "つ", to: "と", example: "待つ → 待とう" },
  { from: "ぬ", to: "の", example: "死ぬ → 死のう" },
  { from: "ぶ", to: "ぼ", example: "遊ぶ → 遊ぼう" },
  { from: "む", to: "も", example: "飲む → 飲もう" },
  { from: "る", to: "ろ", example: "売る → 売ろう" },
];

// ── Ichidan / Irregular: simple drop-add tables ─────────────────────────────

const ichidanRows: Record<QuestionType, Row[]> = {
  "non-past-affirmative": [{ from: "〜る", to: "〜る", example: "食べる" }],
  "non-past-negative": [{ from: "〜る", to: "〜ない", example: "食べる → 食べない" }],
  "past-affirmative": [{ from: "〜る", to: "〜た", example: "食べる → 食べた" }],
  "past-negative": [{ from: "〜る", to: "〜なかった", example: "食べる → 食べなかった" }],
  "te-form": [{ from: "〜る", to: "〜て", example: "食べる → 食べて" }],
  "potential": [{ from: "〜る", to: "〜られる", example: "食べる → 食べられる" }],
  "volitional": [{ from: "〜る", to: "〜よう", example: "食べる → 食べよう" }],
  "imperative": [{ from: "〜る", to: "〜ろ", example: "食べる → 食べろ" }],
  "conditional-tara": [{ from: "〜る", to: "〜たら", example: "食べる → 食べたら" }],
  "provisional-eba": [{ from: "〜る", to: "〜れば", example: "食べる → 食べれば" }],
  "passive": [{ from: "〜る", to: "〜られる", example: "食べる → 食べられる" }],
  "causative": [{ from: "〜る", to: "〜させる", example: "食べる → 食べさせる" }],
  "causative-passive": [{ from: "〜る", to: "〜させられる", example: "食べる → 食べさせられる" }],
};

const suruRows: Record<QuestionType, Row[]> = {
  "non-past-affirmative": [{ from: "する", to: "する", example: "勉強する" }],
  "non-past-negative": [{ from: "する", to: "しない", example: "勉強しない" }],
  "past-affirmative": [{ from: "する", to: "した", example: "勉強した" }],
  "past-negative": [{ from: "する", to: "しなかった", example: "勉強しなかった" }],
  "te-form": [{ from: "する", to: "して", example: "勉強して" }],
  "potential": [{ from: "する", to: "できる", example: "勉強できる" }],
  "volitional": [{ from: "する", to: "しよう", example: "勉強しよう" }],
  "imperative": [{ from: "する", to: "しろ", example: "勉強しろ" }],
  "conditional-tara": [{ from: "する", to: "したら", example: "勉強したら" }],
  "provisional-eba": [{ from: "する", to: "すれば", example: "勉強すれば" }],
  "passive": [{ from: "する", to: "される", example: "勉強される" }],
  "causative": [{ from: "する", to: "させる", example: "勉強させる" }],
  "causative-passive": [{ from: "する", to: "させられる", example: "勉強させられる" }],
};

const kuruRows: Record<QuestionType, Row[]> = {
  "non-past-affirmative": [{ from: "来る", to: "くる", example: "来る" }],
  "non-past-negative": [{ from: "来る", to: "こない", example: "来ない (こない)" }],
  "past-affirmative": [{ from: "来る", to: "きた", example: "来た (きた)" }],
  "past-negative": [{ from: "来る", to: "こなかった", example: "来なかった (こなかった)" }],
  "te-form": [{ from: "来る", to: "きて", example: "来て (きて)" }],
  "potential": [{ from: "来る", to: "こられる", example: "来られる (こられる)" }],
  "volitional": [{ from: "来る", to: "こよう", example: "来よう (こよう)" }],
  "imperative": [{ from: "来る", to: "こい", example: "来い (こい)" }],
  "conditional-tara": [{ from: "来る", to: "きたら", example: "来たら (きたら)" }],
  "provisional-eba": [{ from: "来る", to: "くれば", example: "来れば (くれば)" }],
  "passive": [{ from: "来る", to: "こられる", example: "来られる (こられる)" }],
  "causative": [{ from: "来る", to: "こさせる", example: "来させる (こさせる)" }],
  "causative-passive": [{ from: "来る", to: "こさせられる", example: "来させられる (こさせられる)" }],
};

export function RuleExplanation({
  verbClass,
  question,
}: {
  verbClass: string;
  question: QuestionType;
}) {
  const isGodan = verbClass.startsWith("godan-");

  if (isGodan) {
    if (question === "past-affirmative") {
      return (
        <RuleTable
          intro="Godan past (ta-form): swap the final う-row mora for the matching ending below."
          headers={["Ending", "Becomes", "Example"]}
          rows={godanPastRows}
          footer={
            <>
              Exception: <span lang="ja" className="font-serif">行く → 行った</span> (not{" "}
              <span lang="ja" className="font-serif">行いた</span>).
            </>
          }
        />
      );
    }
    if (question === "te-form") {
      return (
        <RuleTable
          intro="Godan te-form: same swap as past, but with て/で endings."
          headers={["Ending", "Becomes", "Example"]}
          rows={godanTeRows}
          footer={
            <>
              Exception: <span lang="ja" className="font-serif">行く → 行って</span>.
            </>
          }
        />
      );
    }
    if (question === "non-past-negative") {
      return (
        <RuleTable
          intro="Godan negative: change the final う-row mora to its あ-row form, then add ない."
          headers={["Ending", "Becomes", "Example"]}
          rows={godanNegRows}
          footer={
            <>
              Note: <span lang="ja" className="font-serif">う → わ</span> (not{" "}
              <span lang="ja" className="font-serif">あ</span>). Also:{" "}
              <span lang="ja" className="font-serif">ある → ない</span> (irregular).
            </>
          }
        />
      );
    }
    if (question === "past-negative") {
      return (
        <RuleTable
          intro="Godan past negative: take the negative stem (あ-row), then add なかった."
          headers={["Ending", "Becomes", "Example"]}
          rows={godanNegRows.map((r) => ({
            from: r.from,
            to: r.to,
            example: r.example.replace("ない", "なかった"),
          }))}
        />
      );
    }
    if (question === "non-past-affirmative") {
      return (
        <RuleTable
          intro="Polite → dictionary: change the い-row stem before ます back to the う-row."
          headers={["ます stem", "Dictionary", "Example"]}
          rows={godanIRows.map((r) => ({
            from: r.to,
            to: r.from,
            example: r.example.split(" → ").reverse().join(" → "),
          }))}
        />
      );
    }
    if (question === "potential") {
      return (
        <RuleTable
          intro="Godan potential: change the final う-row mora to え-row, then add る (can do)."
          headers={["Ending", "Becomes", "Example"]}
          rows={godanERows}
        />
      );
    }
    if (question === "volitional") {
      return (
        <RuleTable
          intro="Godan volitional: change the final う-row mora to お-row, then add う (let's …)."
          headers={["Ending", "Becomes", "Example"]}
          rows={godanORows}
        />
      );
    }
    if (question === "imperative") {
      return (
        <RuleTable
          intro="Godan imperative: change the final う-row mora to え-row (rough command)."
          headers={["Ending", "Becomes", "Example"]}
          rows={godanERows.map((r) => ({
            from: r.from,
            to: r.to,
            example: r.example.replace("る", ""),
          }))}
        />
      );
    }
    if (question === "provisional-eba") {
      return (
        <RuleTable
          intro="Godan ば-form: change the final う-row mora to え-row, then add ば (if)."
          headers={["Ending", "Becomes", "Example"]}
          rows={godanERows.map((r) => ({
            from: r.from,
            to: r.to,
            example: r.example.replace("る", "ば"),
          }))}
        />
      );
    }
    if (question === "conditional-tara") {
      return (
        <RuleTable
          intro="Godan たら: take the past-affirmative form, then add ら (if/when)."
          headers={["Ending", "Becomes", "Example"]}
          rows={godanPastRows.map((r) => ({
            from: r.from,
            to: r.to + "ら",
            example: r.example + "ら",
          }))}
        />
      );
    }
  }

  if (verbClass === "ichidan") {
    return (
      <RuleTable
        intro="Ichidan (る-verb): drop る, then add the ending."
        headers={["Pattern", "Becomes", "Example"]}
        rows={ichidanRows[question]}
      />
    );
  }

  if (verbClass === "irregular-suru") {
    return (
      <RuleTable
        intro="Irregular する."
        headers={["Form", "Becomes", "Example"]}
        rows={suruRows[question]}
      />
    );
  }

  if (verbClass === "irregular-kuru") {
    return (
      <RuleTable
        intro="Irregular 来る — the vowel of 来 changes (く / き / こ)."
        headers={["Form", "Reading", "Example"]}
        rows={kuruRows[question]}
      />
    );
  }

  return <p className="text-sm leading-relaxed">{explanation(verbClass, question)}</p>;
}
