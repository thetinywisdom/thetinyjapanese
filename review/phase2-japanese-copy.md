# Phase 2 Japanese copy — for a native teacher

Nothing in this file has been applied as final Japanese. The site still shows the **current** text. Each string below lives in one place so you can change it without hunting through the app:

- React copy: `src/content/learner-copy.ts`
- The same tagline is also in `index.html` (the `<meta name="description">`, `og:description`, and `twitter:description`). Please update those three if you change `taglineJa`.

Proposals are suggestions only. Please rewrite them however sounds natural.

---

## 1. Tagline

| | |
|---|---|
| Current | 日本語が上手になりましょう！ |
| Location | `taglineJa` in `src/content/learner-copy.ts`. Shown on the home page and on About, next to “Let’s get good at Japanese together.” Also in `index.html` meta descriptions. |
| Proposed | 一緒に日本語を上達させましょう！ |
| Also consider | 日本語、一緒にがんばりましょう！ |
| Reason | This is a calque of “let’s become good at Japanese.” 上手になる is grammatical, but 〜ましょう on that phrase sounds translated, and the English next to it says “together,” which the Japanese never says. A teacher should pick the line; please don’t treat either proposal as approved. |

---

## 2. Kanken label

The school-grade chips are still labeled G1–G6 and G8 (Japanese elementary grade, from kanjidic). The Kanken name is a separate label, not a replacement for the grade number.

What learners see today:

| Grade | Current label | Where |
|---|---|---|
| 1 | Kanken 10 | `kankenChipLabel` / `kankenLevelShort` in `src/content/learner-copy.ts`. Tooltip on the G1 chip, and the sentence under the grade chips (“G1–G6 are elementary years 1–6 (Kanken 10 down to Kanken 5).”). |
| 2 | Kanken 9 | same |
| 3 | Kanken 8 | same |
| 4 | Kanken 7 | same |
| 5 | Kanken 6 | same |
| 6 | Kanken 5 | same |
| 8 | Kanken 4–3 | same. **This used to say “Kanken S”.** S is not a 漢検 level. The unused map already in the code said 4–3, which matches “remaining jōyō,” so the live label was corrected to `4–3`. The Japanese wording was not changed. |
| (heading) | JLPT vs School Grade (Kanken) | `kankenSectionTitle`, heading on `/kanji/learn`. |

| | |
|---|---|
| Proposed chip text | 漢検10級, 漢検9級, 漢検8級, 漢検7級, 漢検6級, 漢検5級, and for grade 8: 漢検4級・3級 |
| Proposed heading | JLPTと学年 — drop “(Kanken)”, or mention 漢検 only as a rough parallel, not as another name for the school grade. |
| Reason | 漢検 is the exam’s name, and levels are counted with 級 (10級 is the easiest). School grade and 漢検 are related but not the same list: grade 8 in this app is “the rest of the jōyō kanji,” which covers more than one 漢検 level. Please confirm the grade 8 wording. If you want the chips to say 漢検10級 instead of “Kanken 10”, edit `kankenChipLabel` only. |

---

## 3. Grammar explanations on `/learn`

These strings were moved into `src/content/learner-copy.ts` and still show the current text. Conjugation tables (飲む → 飲んで, and the rest of `verbGroups`, `conjRows`, `extendedForms`, `godanNegativeSwaps`, `godanLookalikes`) were **not** rewritten. Please still glance at them; the notes below are the spots that look wrong or ambiguous.

### 3.1 Callout that mixed two kinds of な-adjective

| | |
|---|---|
| Current Japanese | きれい, 嫌い, 有名, 簡単 |
| Location | Was one list in the “Godan negative swap” callout on `/learn`. Now split into `naAdjectivesEndingInI` (きれい, 嫌い) and `naAdjectivesOther` (有名, 簡単). |
| What changed | English only. The old sentence said all four “end in い.” 有名 and 簡単 do not. The Japanese words themselves are unchanged. |
| Proposed | No new Japanese. Please confirm きれい and 嫌い are the examples you want for the い-ending trap. |

### 3.2 Example sentences under each form

The Japanese is the part before “ — ”. English glosses are unchanged.

| Current | Location | Proposed | Reason |
|---|---|---|---|
| コーヒーを飲んで、出かけた。 | `extendedForms` Te-form `sample` | コーヒーを飲んでから、出かけた。 | Fine as a て-form link. 〜てから is clearer if the point of the example is “and then.” Optional. |
| 刺身が食べられますか? | Potential `sample` | 刺身は食べられますか。 | が is a normal potential marker, so this may be fine. Please confirm, and whether the halfwidth `?` should be `？`. |
| 一緒に行こう! | Volitional `sample` | (no change proposed) | Natural. Halfwidth `!` only. |
| 早く来い! | Imperative `sample` | (no change proposed) | Natural as a rough command. |
| 雨が降ったら、行かない。 | Conditional たら `sample` | (no change proposed) | Natural. |
| 急げば間に合う。 | Provisional ば `sample` | (no change proposed) | Natural. |
| ケーキを食べられた。 | Passive `sample` | 弟にケーキを食べられた。 | For an ichidan verb, 食べられた is also the potential (“was able to eat the cake”), so the English “My cake got eaten (on me)” doesn’t come through. An agent (弟に) makes the suffering passive obvious. Please replace with whatever you would actually teach. |
| 子供に野菜を食べさせる。 | Causative `sample` | (no change proposed) | Natural. Please confirm the tone you want for “make” vs “let.” |
| 野菜を食べさせられた。 | Causative-passive `sample` | (no change proposed) | Textbook させられる. Please confirm you don’t also want the colloquial short form mentioned. |

### 3.3 Group 3 rule lines (shown as the “rule,” marked Japanese)

Current text, all in `extendedForms[].g3Rule`. No replacement proposed; please correct anything that should mention a second acceptable form (for example 食べれる, 来い / 来よ, せよ).

- する → して · 来る → きて
- する → できる · 来る → こられる
- する → しよう · 来る → こよう
- する → しろ · 来る → こい
- した → したら · 来た → 来たら
- する → すれば · 来る → くれば
- する → される · 来る → こられる
- する → させる · 来る → こさせる
- する → させられる · 来る → こさせられる

The Group 1 / Group 2 rule sentences are English with kana mixed in (`g1Rule`, `g2Rule` on the same objects). Those kana were not rewritten.

---

## 4. Also flagged, not on the three items above

| Current | Location | Proposed | Reason |
|---|---|---|---|
| テキスト | `diaryTextPlaceholder`. Dropped into a new text box on a diary page. | (teacher’s choice — empty, or something like 今日のできごと) | It reads as a placeholder word (“text”), not as the start of a diary. Left unchanged on purpose. |
| 絵日記 | `diaryBlurbJa`. Inside the Diary page intro: “Traditional Japanese picture diary (絵日記)”. | (no change proposed) | This one looks fine. It was only moved so the font and the wording can be edited together. |

---

## What was changed in English around this copy

Not Japanese, listed so the diff is unsurprising:

- “Lets get good” → “Let’s get good” (About).
- “You won't see this in your other devices” → “on your other devices” (Progress).
- The `/learn` intro said “Six more forms” but the page shows nine. It now says “More forms.”
- The な-adjective callout no longer claims that 有名 and 簡単 end in い.
