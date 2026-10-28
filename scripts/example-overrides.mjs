/**
 * Sentence fixes for examples.json (review items 32–51).
 *
 * build-examples.ts applies `sanitizeSentenceList` / `replacementFor` after it
 * picks Tatoeba lines, and keys the result by `${id}|${reading}`.
 * `node scripts/patch-examples.mjs` does the same to the checked-in file,
 * re-picking only homograph verbs from scripts/cache/examples.utf so the
 * unreviewed remainder of the corpus is left in place.
 *
 * Any sentence containing 気違い or 色盲 is removed.
 */

/** Substrings that must never ship. */
export const BANNED_SUBSTRINGS = ["気違い", "色盲"];

/** Exact sentences to drop wherever they were attached. */
export const BANNED_JA = new Set([
  "持ち物をまとめなさい。",
  "彼は学者ぶっている。",
  "彼の振る舞いは芝居じみていた。",
  "気違いじみた愚かな世俗の競争から逃れたい。",
  "彼は約束をたがえない。",
  "彼らは時をたがえず橋を完成した。",
  "彼は市長を務めた。",
  "彼は議長を務めた。",
  "彼は兄と取っ組み合った。",
  "胃がもたれます。",
  "明日たちます。",
  "消しておいて。",
  "考えておくよ。",
  "待ってあげる。",
  "頭痛が直った。",
  "困難を省みず前進すべし。",
  "彼は肩をならべていた。",
  "私は飛べます。",
  "星降る夜に。",
  "恩をあだで返すな。",
  "辱を知れ。",
  "潮の全てはひく。",
  "鳥は歌います。",
  "牡丹餅で腰打つ。",
  "今我が鎖を解き。",
  "ノってるね。",
  "さあ話したまえ。",
  "色盲です。",
]);

/**
 * Full replacement lists for flagged cards. Key is `dictionary|reading`
 * using the dictionary form AFTER content overrides.
 * @type {Record<string, {ja: string, en: string}[]>}
 */
export const REPLACEMENTS = {
  "集める|あつめる": [
    { ja: "切手を集めています。", en: "I'm collecting stamps." },
    { ja: "何か集めていますか。", en: "Do you collect anything?" },
  ],
  "振る|ふる": [
    { ja: "手を振りました。", en: "I waved my hand." },
    { ja: "塩を少し振ってください。", en: "Please sprinkle a little salt." },
  ],
  "染みる|しみる": [
    { ja: "この薬は傷に染みる。", en: "This medicine stings the cut." },
    { ja: "音楽が心に染みる。", en: "The music touches my heart." },
  ],
  "違える|ちがえる": [
    { ja: "寝ている間に首の筋を違えた。", en: "I cricked my neck in my sleep." },
    { ja: "朝起きたら首の筋を違えていた。", en: "I woke up with a crick in my neck." },
  ],
  "勤める|つとめる": [
    { ja: "会社に勤めています。", en: "I work at a company." },
    { ja: "父は銀行に勤めている。", en: "My father works at a bank." },
  ],
  "取り組む|とりくむ": [
    { ja: "問題に取り組んでいます。", en: "I'm working on the problem." },
    { ja: "新しい計画に取り組む。", en: "We'll tackle the new plan." },
  ],
  "持つ|もつ": [
    { ja: "傘を持っています。", en: "I have an umbrella." },
    { ja: "右手に荷物を持ってください。", en: "Please hold the bag in your right hand." },
  ],
  "立つ|たつ": [
    { ja: "ここに立ってください。", en: "Please stand here." },
    { ja: "駅の前に立っています。", en: "I'm standing in front of the station." },
  ],
  "置く|おく": [
    { ja: "本を机に置いた。", en: "I put the book on the desk." },
    { ja: "ここに置いてください。", en: "Please put it here." },
  ],
  "上げる|あげる": [
    { ja: "手を上げてください。", en: "Please raise your hand." },
    { ja: "荷物を棚に上げた。", en: "I put the bag up on the shelf." },
  ],
  "治る|なおる": [
    { ja: "頭痛が治った。", en: "My headache is gone." },
    { ja: "かぜが治らない。", en: "I can't get rid of my cold." },
  ],
  "顧みる|かえりみる": [
    { ja: "過去を顧みる。", en: "I look back on the past." },
    { ja: "危険を顧みず進んだ。", en: "They pressed on, heedless of the danger." },
  ],
  "並べる|ならべる": [
    { ja: "本を大きさの順に並べた。", en: "I lined the books up by size." },
    { ja: "名前を五十音順に並べてください。", en: "Please put the names in gojūon order." },
  ],
  "飛ぶ|とぶ": [
    { ja: "鳥は空を飛ぶ。", en: "Birds fly." },
    { ja: "飛行機が空を飛んでいる。", en: "A plane is flying." },
  ],
  "降る|ふる": [
    { ja: "雨が降っています。", en: "It's raining." },
    { ja: "雪が降りそうだ。", en: "It looks like it will snow." },
  ],
  "返す|かえす": [
    { ja: "お金は明日返します。", en: "I'll give the money back tomorrow." },
    { ja: "本を図書館に返した。", en: "I returned the book to the library." },
  ],
  "知る|しる": [
    { ja: "恥を知れ。", en: "Have you no shame?" },
    { ja: "その人を知っています。", en: "I know that person." },
  ],
  "引く|ひく": [
    { ja: "潮が引いた。", en: "The tide went out." },
    { ja: "辞書を引いてください。", en: "Please look it up in a dictionary." },
  ],
  "歌う|うたう": [
    { ja: "歌を歌いましょう。", en: "Let's sing a song." },
    { ja: "一曲歌いたい。", en: "I want to sing a song." },
  ],
  "打つ|うつ": [
    { ja: "ボールを打つ。", en: "I hit the ball." },
    { ja: "彼はボールを打った。", en: "He hit the ball." },
  ],
  "解く|とく": [
    { ja: "この問題を解いてください。", en: "Please solve this problem." },
    { ja: "この問題はもう解いた。", en: "I've already solved this problem." },
  ],
  "乗る|のる": [
    { ja: "電車に乗ります。", en: "I'll take the train." },
    { ja: "駅でバスに乗った。", en: "I got on the bus at the station." },
  ],
  "潜る|くぐる": [
    { ja: "鳥居の下をくぐった。", en: "I passed under the torii." },
    { ja: "低い門をくぐって入った。", en: "I ducked through the low gate." },
  ],
  "退く|どく": [
    { ja: "ちょっとどいて。", en: "Step aside." },
    { ja: "そこをどいてください。", en: "Please get out of the way." },
  ],
  "話す|はなす": [
    { ja: "日本語を話します。", en: "I speak Japanese." },
    { ja: "先生と話した。", en: "I talked with the teacher." },
  ],
};

export const KANJI_REPLACEMENTS = {
  色: [
    { ja: "この色が好きです。", en: "I like this color." },
    { ja: "何色がいいですか。", en: "What color do you want?" },
  ],
};

export function sentenceAllowed(sentence) {
  if (!sentence?.ja) return false;
  if (BANNED_JA.has(sentence.ja)) return false;
  return !BANNED_SUBSTRINGS.some((s) => sentence.ja.includes(s) || (sentence.en ?? "").includes(s));
}

export function replacementFor(dictionary, reading) {
  return REPLACEMENTS[`${dictionary}|${reading}`] ?? null;
}

/** Drop banned lines. Does not invent replacements. */
export function sanitizeSentenceList(list) {
  return (list ?? []).filter(sentenceAllowed);
}
