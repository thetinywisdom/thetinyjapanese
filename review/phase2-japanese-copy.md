# Phase 2 Japanese copy — applied

A native teacher reviewed the proposals. Every item below is **applied** in the live copy, character for character (fullwidth ！？, wave dash 〜). Optional items (せよ, the 焦る gloss) are applied too.

Live sources:

- `src/content/learner-copy.ts`
- The same tagline in `index.html`: `description`, `og:description`, `twitter:description`
- The sentence under the grade chips is `kankenGradeHelp`, rendered by `LevelPicker`

Items the teacher marked OK and that this pass did not change: the te-form sample コーヒーを飲んで、出かけた。, `diaryBlurbJa` 絵日記, the な-adjective split (きれい / 嫌い vs 有名 / 簡単), `godanNegativeSwaps`, and `conjRows`.

---

## Applied

| Location | Old | New |
|---|---|---|
| `taglineJa` and the 3 meta descriptions | 日本語が上手になりましょう！ | 一緒に日本語、上手になろう！ |
| `kankenChipLabel` grades 1–6 | Kanken 10, Kanken 9, Kanken 8, Kanken 7, Kanken 6, Kanken 5 | 漢検10級, 漢検9級, 漢検8級, 漢検7級, 漢検6級, 漢検5級 |
| `kankenLevelShort[8]` / `kankenChipLabel(8)` | 4–3 / Kanken 4–3 | 4級〜2級 / 漢検4級〜2級 |
| `kankenSectionTitle` | JLPT vs School Grade (Kanken) | JLPT vs School Grade |
| `kankenGradeHelp` (sentence under the chips) | G1–G6 are elementary years 1–6 (Kanken 10 down to Kanken 5). G8 is the remaining jōyō, taught later (Kanken 4–3). | G1–G6 are elementary years 1–6 (roughly 漢検10級〜5級). |
| Potential `sample` | 刺身が食べられますか? | 刺身は食べられますか？ |
| Volitional `sample` | 一緒に行こう! | 一緒に行こう！ |
| Imperative `sample` | 早く来い! | 早く来い！ |
| Passive `sample` | ケーキを食べられた。 — My cake got eaten (on me). | 弟にケーキを食べられた。 — My little brother ate my cake (and I'm upset). |
| Causative `sample` | 子供に野菜を食べさせる。 | 子どもに野菜を食べさせる。 |
| Causative-passive `sample` | 野菜を食べさせられた。 — I was made to eat vegetables. | 母に野菜を食べさせられた。 — My mom made me eat vegetables. |
| Group 1 `rule` | For -る verbs, the vowel before る is a / u / o. | For -る verbs, the vowel before る is usually a / u / o, but some godan verbs end in -iru/-eru (帰る, 入る, 走る, 知る — see the look-alikes). |
| Group 2 `rule` | Always ends in る. The vowel before る is i or e. | Always ends in る. The vowel before る is i or e, but not every -iru/-eru verb is Group 2 (see the look-alikes). |
| Group 3 `rule` | Only two members in the whole language. | Just two core verbs, する and 来る. する also forms compounds like 勉強する. |
| Te-form `g1Rule` | (no 行く exception) | Exception: 行く → 行って (not 行いて). |
| Potential `g2Rule` | Drop る, add られる. | Drop る, add られる. In casual speech many people drop ら (食べれる), but write 食べられる. |
| Causative-passive `g1Rule` | Final う-row → あ-row, then add せられる (う → わ). | Same, plus: Short form 飲まされる is more common in speech (not for す-verbs: 話させられる). |
| Te-form `g3Rule` / `g3Ex` | 来る → きて / して · きて | 来る(くる) → 来て(きて) / して · 来て(きて) |
| Potential `g3Rule` / `g3Ex` | 来る → こられる / できる · こられる | 来る(くる) → 来られる(こられる) / できる · 来られる(こられる) |
| Volitional `g3Rule` / `g3Ex` | 来る → こよう / しよう · こよう | 来る(くる) → 来よう(こよう) / しよう · 来よう(こよう) |
| Imperative `g3Rule` / `g3Ex` | する → しろ · 来る → こい / しろ · こい | する → しろ (written/formal: せよ) · 来る(くる) → 来い(こい) / しろ (written/formal: せよ) · 来い(こい) |
| Conditional たら `g3Rule` / `g3Ex` | 来た → 来たら / したら · 来たら | 来る(くる) → 来たら(きたら) / したら · 来たら(きたら) |
| Provisional ば `g3Rule` / `g3Ex` | 来る → くれば / すれば · くれば | 来る(くる) → 来れば(くれば) / すれば · 来れば(くれば) |
| Passive `g3Rule` / `g3Ex` | 来る → こられる / される · こられる | 来る(くる) → 来られる(こられる) / される · 来られる(こられる) |
| Causative `g3Rule` / `g3Ex` | 来る → こさせる / させる · こさせる | 来る(くる) → 来させる(こさせる) / させる · 来させる(こさせる) |
| Causative-passive `g3Rule` / `g3Ex` | 来る → こさせられる / させられる · こさせられる | 来る(くる) → 来させられる(こさせられる) / させられる · 来させられる(こさせられる) |
| `diaryTextPlaceholder` | テキスト | 今日はどんな一日だった？ |
| `godanLookalikes` 焦る gloss | to be in a hurry / panic | to feel rushed / panic |

## Left as the teacher approved

| Location | Text |
|---|---|
| Te-form `sample` | コーヒーを飲んで、出かけた。 |
| `diaryBlurbJa` | 絵日記 |
| `naAdjectivesEndingInI` | きれい, 嫌い |
| `naAdjectivesOther` | 有名, 簡単 |
| `godanNegativeSwaps`, `conjRows` | unchanged |
