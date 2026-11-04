import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const choices = [
  {
    to: "/diary",
    kana: "絵日記",
    title: "Picture Diary",
    desc: "Illustrate your day & practice your sentences with picture diary.",
    span: "md:col-span-3",
  },
  {
    to: "/kanji",
    kana: "読み",
    title: "Read",
    desc: "See a kanji, type its reading. With radical breakdowns.",
    span: "md:col-span-3",
  },
  {
    to: "/kanji/remember",
    kana: "覚え",
    title: "Remember",
    desc: "Multiple-choice quiz on meaning, reading, and kanji.",
    span: "md:col-span-2",
  },
  {
    to: "/kanji/write",
    kana: "書き",
    title: "Write",
    desc: "Draw kanji stroke by stroke with live feedback.",
    span: "md:col-span-2",
  },
  {
    to: "/conjugations",
    kana: "活用",
    title: "Conjugations",
    desc: "Verbs, い/な-adjectives and nouns — polite ↔ casual, te-form, negatives, and more.",
    span: "md:col-span-2",
  },
];


export const PracticeChoices = () => (
  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
    {choices.map((c) => (
      <Link
        key={c.to}
        to={c.to}
        className={cn(
          "group rounded-xl border bg-card p-5 md:p-6 shadow-card transition-all hover:border-[hsl(var(--accent))] hover:-translate-y-0.5",
          c.span,
        )}
      >
        <p
          className="font-serif text-5xl mb-4 text-foreground/90 group-hover:text-[hsl(var(--accent))] transition-colors"
          lang="ja"
        >
          {c.kana}
        </p>
        <h2 className="font-serif text-xl mb-1">{c.title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{c.desc}</p>
        <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--accent))]">
          Start <ArrowRight className="h-3 w-3" />
        </span>
      </Link>
    ))}
  </div>
);
