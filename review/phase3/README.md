# Phase 3 review

A native teacher can start with the "Check these first" section of each file.

| file | what to check |
| --- | --- |
| [words.md](words.md) | level, kana spelling, English gloss |
| [kanji.md](kanji.md) | meaning, quiz reading, anchor word for each on/kun, demoted readings |
| [sentences.md](sentences.md) | the Japanese, the reading it is tied to, the translation |
| [furigana.md](furigana.md) | diary readings that used to come out wrong |
| [words-dropped.md](words-dropped.md) | N3 rows left out to keep the list near 1,200 |

Edits to `scripts/curated/n5-n3-words.json`, `n5-n3-kanji.json`, and `sentences.json` are merged with `node scripts/apply-phase3.mjs`. `node scripts/draft-phase3.mjs` rebuilds those files from scratch and will overwrite corrections.

The recheck list for this pass is [recheck.md](recheck.md).

## Counts

- Words: 1229 (N5 523, N4 499, N3 207). By type: adj-i 79, adj-na 46, noun 705, adverb 4, verb 395.
- Kanji: 612 (N5 79, N4 166, N3 367).
- Hand-written sentences kept: 211 (42 on verbs, 169 on kanji). Template drafts removed. A word or kanji with no hand-written sentence shows none.

## Answers applied

- 私 quiz answer is わたし. わたくし is listed as also correct (formal) and is never a wrong option.
- 日本 is にほん. にっぽん is not marked wrong.
- 一人 / 二人 stay ひとり / ふたり. いちにん and ににん are never distractors.
- 明日 is あした. あす is not marked wrong.
- 十 quiz answer stays じゅう. The とお sentence is 娘は今年で十（とお）になります。
- とし is 兄と私は年（とし）が三つ違います。 年に一度、実家に帰ります stays on ねん.
- 顔 anchor stays かお. 笑顔 is back in the word list, and 笑顔がすてきです stays an extra example.
- 南米 stays the anchor for なん.
- 家 quiz answer is いえ. うち is also correct and is never the other option.
- 出 keeps the quiz answer でる and adds しゅつ · 出発（しゅっぱつ）.
- Nouns that had been stored only as する verbs are nouns again. 勉強 is shown as 勉強（する）.
- Draft sentences are not shipped.
- 今日, 明日, 大人, 今朝, 昨日, 一日, 二十歳, 果物, 眼鏡, 部屋, 八百屋, 上手, 下手, and 時計 are 熟字訓 and are not split into on/kun anchors.
