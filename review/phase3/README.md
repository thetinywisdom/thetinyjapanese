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

## Counts

- Words: 1220 (N5 524, N4 501, N3 195). By type: adj-i 77, adj-na 53, noun 593, verb 497.
- Kanji: 612 (N5 79, N4 166, N3 367).
- Sentences: 2050 (497 verbs, 612 kanji).
- Flagged for a second look: 3 words, 26 kanji, 1 sentences.

## Open questions

- 私 is taught as わたし. わたくし is the formal reading and the one in the old JLPT list.
- 日本 in the diary is にほん, not IPAdic's にっぽん. Both are used; N5 textbooks use にほん.
- 一人 / 二人 are ひとり / ふたり. IPAdic splits them as いちにん / ににん.
- 明日 is あした. あす is also correct and more written.
- 十（とお） versus じゅう: the quiz answer is じゅう. The sentence 卵を十買いました can also be read じゅう.
- 年（とし）is not 今年（ことし）. The sentence is 年に一度.
- 顔（かお）was missing from the word list, so the anchor is the character itself. 笑顔 is えがお.
- 南口 is みなみぐち, so なん is anchored on 南米. Is 南米 the anchor you want?
- 家: the quiz answer is いえ, and うち is also listed. Which one should a multiple-choice item accept?
- 出（しゅつ） is demoted on the N5 card because 出口 is でぐち. Should 出発 be added as the on anchor?
- N3 was cut to keep the list near 1,200. Words left out are the rarer JMdict rows, including 食う (teach 食べる) and most （する）noun glosses.
- Sentences marked `draft` were generated from the gloss. The Japanese masu form is mechanical; the English tense needs a pass.
- 明日・今日・大人 are special readings and are not split into on/kun anchors.
