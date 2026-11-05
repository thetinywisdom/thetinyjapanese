/**
 * Apply the native-teacher review of PR #4 to scripts/curated/*.
 * Idempotent. Does not run draft-phase3.mjs.
 *
 *   node scripts/apply-teacher-review.mjs
 *   node scripts/apply-phase3.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(readFileSync(resolve(root, rel), "utf8"));
const wordsFile = read("scripts/curated/n5-n3-words.json");
const kanjiFile = read("scripts/curated/n5-n3-kanji.json");
const sentences = read("scripts/curated/sentences.json");
const words = wordsFile.words;
const log = [];
const note = (group, id, field, oldV, newV) => {
  log.push({ group, id, field, old: oldV, new: newV });
};

function byDict(d) {
  return words.filter((w) => w.dictionary === d);
}

const GLOSS = {
  コップ: "glass; cup (for drinking)",
  アルバイト: "part-time job",
  息子: "son",
  野菜: "vegetable",
  島: "island",
  早い: "early; soon",
  一緒: "together; same",
  言葉: "word(s); language",
  先: "ahead; first; (the) future",
  後: "after; later; behind",
  背: "height; back",
  横: "side; beside; horizontal",
  周り: "surroundings; around",
  休む: "to rest; to take a day off",
  台所: "kitchen",
  黒: "black",
  白: "white",
  門: "gate",
  葉書: "postcard",
  切手: "(postage) stamp",
  カレンダー: "calendar",
  ペット: "pet",
  フォーク: "fork",
  スプーン: "spoon",
  コート: "coat",
  シャツ: "shirt",
  デパート: "department store",
  丈夫: "sturdy; strong; healthy",
  結構: "fine; good enough; quite; (no) thank you",
  謝る: "to apologize",
  眠る: "to sleep",
  泊まる: "to stay (overnight)",
  踊る: "to dance",
  合う: "to fit; to match; to suit",
  下げる: "to lower",
  起こす: "to wake (someone) up; to cause",
  折る: "to fold; to break",
  差し上げる: "to give (humble)",
  参る: "to go; to come (humble)",
  木綿: "cotton",
  夢: "dream",
  血: "blood",
  妻: "wife",
  祖父: "grandfather",
  国際: "international",
  人口: "population",
  ピアノ: "piano",
  安全: "safe",
  危険: "dangerous",
  自由: "free",
  不便: "inconvenient",
  別: "separate; different; another",
  健康: "healthy; health",
  平和: "peaceful; peace",
  不安: "anxious; anxiety",
  平等: "equal; equality",
  大人: "adult; grown-up",
  黄色: "yellow",
  味: "flavor",
  楽しみ: "something to look forward to",
  ソフト: "software",
  時々: "sometimes; occasionally",
  初めて: "for the first time",
  大体: "roughly; mostly",
};

for (const [dict, meaning] of Object.entries(GLOSS)) {
  for (const w of byDict(dict)) {
    if (w.meaning === meaning) continue;
    note("B2", `${w.id} ${w.dictionary}`, "meaning", w.meaning, meaning);
    w.meaning = meaning;
  }
}
const nichi = words.find((w) => w.id === "2083100");
if (nichi && nichi.meaning !== "day (counter), e.g. 三日間") {
  note("B2", "2083100 日", "meaning", nichi.meaning, "day (counter), e.g. 三日間");
  nichi.meaning = "day (counter), e.g. 三日間";
}
const tame = words.find((w) => w.id === "1157080");
if (tame) {
  if (tame.dictionary !== "ため") {
    note("B2", "1157080 為", "dictionary", tame.dictionary, "ため");
    tame.kanjiForm = "為";
    tame.dictionary = "ため";
  }
  const m = "for (the sake of); in order to; because of";
  if (tame.meaning !== m) {
    note("B2", "1157080 ため", "meaning", tame.meaning, m);
    tame.meaning = m;
  }
}

const TYPE = {
  大人: "noun",
  黄色: "noun",
  味: "noun",
  楽しみ: "noun",
  ソフト: "noun",
};
for (const [dict, wordType] of Object.entries(TYPE)) {
  for (const w of byDict(dict)) {
    if (w.wordType === wordType) continue;
    note("other", `${w.id} ${w.dictionary}`, "wordType", w.wordType, wordType);
    w.wordType = wordType;
    w.verbClass = wordType;
  }
}
const ADVERBS = {
  時々: null,
  初めて: null,
  大体: null,
};
for (const dict of Object.keys(ADVERBS)) {
  for (const w of byDict(dict)) {
    if (w.wordType === "adverb") continue;
    note("other", `${w.id} ${w.dictionary}`, "wordType", w.wordType, "adverb");
    w.wordType = "adverb";
    w.verbClass = "adverb";
  }
}
const nakanaka = words.find((w) => w.id === "1599420");
if (nakanaka && nakanaka.dictionary !== "なかなか") {
  note("other", "1599420 中々", "dictionary", nakanaka.dictionary, "なかなか");
  nakanaka.kanjiForm = nakanaka.kanjiForm || "中々";
  nakanaka.dictionary = "なかなか";
  nakanaka.wordType = "adverb";
  nakanaka.verbClass = "adverb";
  nakanaka.meaning = "quite; (not) easily";
}
const ichigatsu = words.find((w) => w.id === "1162130");
if (ichigatsu && ichigatsu.reading !== "いちがつ") {
  note("other", "1162130 一月", "reading", ichigatsu.reading, "いちがつ");
  note("other", "1162130 一月", "meaning", ichigatsu.meaning, "January");
  ichigatsu.reading = "いちがつ";
  ichigatsu.meaning = "January";
}
const sou = words.findIndex((w) => w.id === "1006610");
if (sou >= 0) {
  note("other", "1006610 そう", "entry", words[sou].meaning, "(removed; grammar 〜そう)");
  words.splice(sou, 1);
}
const jibiki = words.findIndex((w) => w.dictionary === "字引");
if (jibiki >= 0) {
  note("other", `${words[jibiki].id} 字引`, "entry", words[jibiki].meaning, "(removed; 辞書 is in the list)");
  words.splice(jibiki, 1);
}
const kangofu = words.find((w) => w.dictionary === "看護婦");
if (kangofu) {
  note("other", `${kangofu.id} 看護婦`, "dictionary", "看護婦", "看護師");
  kangofu.dictionary = "看護師";
  kangofu.reading = "かんごし";
  kangofu.meaning = "nurse";
}
for (const dict of ["ワープロ", "テープレコーダー", "電報", "汽車", "灰皿"]) {
  for (const w of byDict(dict)) {
    if (w.meaning.includes("old-fashioned")) continue;
    const next = `${w.meaning} (old-fashioned)`;
    note("other", `${w.id} ${w.dictionary}`, "meaning", w.meaning, next);
    w.meaning = next;
  }
}
const daku = words.find((w) => w.id === "1584090");
if (daku && daku.reading !== "だく") {
  note("B3", "1584090 抱く", "reading", daku.reading, "だく");
  daku.reading = "だく";
  daku.meaning = "to hold; to hug";
}

const KEEP_SURU = new Set(["する", "存在する", "拝見する", "愛する", "関する", "対する", "達する", "適する", "罰する", "はっきりする", "しっかりする", "びっくりする", "ゆっくりする", "何とかする"]);
const NOUN_ONLY = {
  意見: "opinion",
  急行: "express (train)",
  都合: "convenience; circumstances",
  泥棒: "thief",
  試験: "exam",
  試合: "match; game",
  会議: "meeting",
  授業: "class; lesson",
  戦争: "war",
  水泳: "swimming",
  意味: "meaning",
  仕事: "job; work",
};
const NO_SURU_FLAG = new Set(["お茶", "お花見", "作文", "暖房", "冷房", "テスト", ...Object.keys(NOUN_ONLY)]);
const BOTH = {
  勉強: "study; to study",
  電話: "telephone; to call",
  結婚: "marriage; to get married",
  洗濯: "laundry; to do laundry",
  料理: "cooking; to cook",
  旅行: "travel; to travel",
  練習: "practice; to practice",
  散歩: "a walk; to take a walk",
  掃除: "cleaning; to clean",
  買い物: "shopping; to go shopping",
  質問: "a question; to ask a question",
  食事: "a meal; to have a meal",
  返事: "a reply; to reply",
  アルバイト: "part-time job; to work part-time",
};

function bothGloss(meaning) {
  const first = String(meaning).split(";")[0].trim();
  if (!first.startsWith("to ")) return meaning;
  const bare = first.slice(3);
  return `${bare}; ${meaning}`;
}
function stripSuru(w) {
  let dict = w.dictionary;
  let reading = w.reading;
  if (dict === "留守にする") {
    dict = "留守";
    reading = "るす";
  } else if (dict === "花見する") {
    dict = "お花見";
    reading = "おはなみ";
  } else if (dict.endsWith("する")) {
    dict = dict.slice(0, -2);
    if (reading.endsWith("する")) reading = reading.slice(0, -2);
  }
  return { dict, reading };
}

const DROP = new Set(["罹る", "轢く", "撃つ", "狂う", "止す", "至る", "作文する", "マッチする"]);
for (let i = words.length - 1; i >= 0; i--) {
  if (!DROP.has(words[i].dictionary)) continue;
  note("other", `${words[i].id} ${words[i].dictionary}`, "entry", words[i].jlptLevel, "(removed to make room)");
  words.splice(i, 1);
}

const dropSuru = words.findIndex((w) => w.dictionary === "すっとする");
if (dropSuru >= 0) {
  note("B4", `${words[dropSuru].id} すっとする`, "entry", words[dropSuru].meaning, "(removed; not N4)");
  words.splice(dropSuru, 1);
}

for (const w of [...words]) {
  const pos = w.pos || [];
  if (w.wordType !== "verb") continue;
  if (!pos.includes("n") || !pos.includes("vs")) continue;
  if (KEEP_SURU.has(w.dictionary)) continue;
  if (!w.dictionary.endsWith("する") && w.dictionary !== "留守にする") continue;
  const { dict, reading } = stripSuru(w);
  const suru = !NO_SURU_FLAG.has(dict);
  const meaning = NOUN_ONLY[dict] || BOTH[dict] || (suru ? bothGloss(w.meaning) : w.meaning.replace(/^\(する\)\s*/, ""));
  note("B4", `${w.id} ${w.dictionary}`, "dictionary", w.dictionary, suru ? `${dict}（する）` : dict);
  note("B4", `${w.id} ${dict}`, "meaning", w.meaning, meaning);
  w.dictionary = dict;
  w.reading = reading;
  w.wordType = "noun";
  w.verbClass = "noun";
  w.meaning = meaning;
  if (suru) w.suru = true;
  else delete w.suru;
}

const mainWords = JSON.parse(execSync("git show origin/main:src/data/words.json", { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
const BRING = ["嬉しい", "嘘", "鍵", "汗", "肩", "氷", "笑顔", "お腹", "思い出", "頃", "全て", "結局", "諦める", "信じる", "感じる", "詳しい"];
const haveId = new Set(words.map((w) => w.id));
for (const dict of BRING) {
  const src = mainWords.entries.find((e) => e.dictionary === dict && e.jlptLevel === "N3");
  if (!src) {
    note("other", dict, "entry", "(missing on main)", "NOT ADDED");
    continue;
  }
  if (haveId.has(src.id)) continue;
  const entry = { ...src };
  if (dict === "氷") entry.meaning = "ice";
  if (dict === "頃") entry.meaning = "time; around";
  words.push(entry);
  haveId.add(src.id);
  note("other", `${src.id} ${dict}`, "entry", "(dropped)", `${src.jlptLevel} ${src.reading} ${entry.meaning}`);
}
const SURU_BACK = [
  ["1151120", "挨拶", "あいさつ", "greeting; to greet"],
  ["1200220", "怪我", "けが", "injury; to get injured"],
  ["1196970", "我慢", "がまん", "patience; to endure"],
  ["1257040", "喧嘩", "けんか", "quarrel; to quarrel"],
];
for (const [id, dict, reading, meaning] of SURU_BACK) {
  if (haveId.has(id)) continue;
  const src = mainWords.entries.find((e) => e.id === id);
  words.push({
    ...src,
    dictionary: dict,
    reading,
    meaning,
    wordType: "noun",
    verbClass: "noun",
    suru: true,
  });
  note("other", `${id} ${src.dictionary}`, "dictionary", src.dictionary, `${dict}（する）`);
  note("B4", `${id} ${dict}`, "meaning", src.meaning, meaning);
}

function R(type, kana, anchor, anchorReading, kunDisplay) {
  const row = { type, kana, anchor, anchorReading: anchorReading || "", kunDisplay: kunDisplay || "" };
  return row;
}
const REPLACE = {
  伝: { primary: "つたえる", readings: [R("kun", "つたえる", "伝える", "つたえる", "つた.える"), R("on", "でん", "伝統", "でんとう")], demote: ["つだう"] },
  言: { primary: "いう", readings: [R("kun", "いう", "言う", "いう", "い.う"), R("kun", "こと", "言葉", "ことば"), R("on", "げん", "言語", "げんご")] },
  好: { primary: "すき", meaning: "like; fond", readings: [R("kun", "すき", "好き", "すき"), R("on", "こう", "格好", "かっこう"), R("kun", "このむ", "好む", "このむ", "この.む")] },
  速: { primary: "はやい", readings: [R("kun", "はやい", "速い", "はやい", "はや.い"), R("on", "そく", "速度", "そくど")] },
  守: { primary: "まもる", readings: [R("kun", "まもる", "守る", "まもる", "まも.る"), R("on", "す", "留守", "るす")] },
  供: { primary: "きょう", readings: [R("on", "きょう", "提供", "ていきょう"), R("kun", "とも", "お供", "おとも")] },
  屋: { primary: "や", readings: [R("kun", "や", "本屋", "ほんや"), R("on", "おく", "屋上", "おくじょう")] },
  楽: { primary: "たのしい", meaning: "fun; comfort; music", readings: [R("kun", "たのしい", "楽しい", "たのしい", "たの.しい"), R("on", "がく", "音楽", "おんがく")] },
  合: { primary: "あう", meaning: "fit; match; together", readings: [R("kun", "あう", "合う", "あう", "あ.う"), R("on", "ごう", "都合", "つごう"), R("kun", "あい", "試合", "しあい")] },
  直: { primary: "なおす", readings: [R("kun", "なおす", "直す", "なおす", "なお.す"), R("on", "ちょく", "直接", "ちょくせつ")], demote: ["じき", "すぐ", "あて"] },
  側: { primary: "がわ", readings: [R("kun", "がわ", "右側", "みぎがわ")], demote: ["そば"] },
  抱: { primary: "だく", readings: [R("kun", "だく", "抱く", "だく", "だ.く"), R("kun", "かかえる", "抱える", "かかえる", "かか.える")], demote: ["いだく"] },
  偶: { primary: "ぐう", readings: [R("on", "ぐう", "偶然", "ぐうぜん")], demote: ["たま"] },
  飛: { primary: "とぶ", readings: [R("kun", "とぶ", "飛ぶ", "とぶ", "と.ぶ"), R("on", "ひ", "飛行機", "ひこうき")] },
  治: { primary: "なおる", readings: [R("kun", "なおる", "治る", "なおる", "なお.る"), R("on", "じ", "政治", "せいじ"), R("on", "ち", "自治", "じち")] },
  求: { primary: "もとめる", readings: [R("kun", "もとめる", "求める", "もとめる", "もと.める"), R("on", "きゅう", "要求", "ようきゅう")] },
  良: { primary: "よい", readings: [R("kun", "よい", "良い", "よい"), R("on", "りょう", "不良", "ふりょう")] },
  偉: { primary: "えらい", readings: [R("kun", "えらい", "偉い", "えらい")] },
  暮: { primary: "くらす", meaning: "live; get dark", readings: [R("kun", "くらす", "暮らす", "くらす", "くら.す"), R("kun", "くれる", "暮れる", "くれる", "く.れる")] },
  実: { primary: "じつ", readings: [R("on", "じつ", "実は", "じつは"), R("kun", "み", "実", "み")] },
  夫: { primary: "おっと", readings: [R("kun", "おっと", "夫", "おっと"), R("on", "ふう", "夫婦", "ふうふ"), R("on", "ふ", "夫人", "ふじん")] },
  面: { primary: "めん", readings: [R("on", "めん", "面接", "めんせつ"), R("kun", "おも", "面白い", "おもしろい")] },
  原: { primary: "げん", meaning: "origin; field", readings: [R("on", "げん", "原因", "げんいん"), R("kun", "はら", "野原", "のはら")] },
  当: { primary: "あたる", readings: [R("kun", "あたる", "当たる", "あたる", "あ.たる"), R("on", "とう", "本当", "ほんとう")], demote: ["あて"] },
  他: { primary: "ほか", readings: [R("kun", "ほか", "他", "ほか"), R("on", "た", "その他", "そのた")] },
  死: { primary: "しぬ", readings: [R("kun", "しぬ", "死ぬ", "しぬ", "し.ぬ"), R("on", "し", "死亡", "しぼう")] },
};

const kanji = kanjiFile.kanji;
for (const [ch, spec] of Object.entries(REPLACE)) {
  const info = kanji[ch];
  if (!info) {
    note("B3", ch, "kanji", "(missing)", "NOT APPLIED");
    continue;
  }
  const oldP = info.primary;
  if (spec.meaning && info.meaning !== spec.meaning) {
    note("B3", ch, "meaning", info.meaning, spec.meaning);
    info.meaning = spec.meaning;
  }
  if (info.primary !== spec.primary) note("B3", ch, "quiz reading", info.primary, spec.primary);
  info.primary = spec.primary;
  info.readings = spec.readings;
  info.demoted = [...new Set([...(info.demoted || []), ...(spec.demote || [])])];
  if (oldP === spec.primary && !spec.meaning) {
    /* quiz unchanged, readings still replaced */
  }
}

const ANCHOR = {
  "行\0ぎょう": ["行事", "ぎょうじ"],
  "北\0ほく": ["東北", "とうほく"],
  "事\0こと": ["事", "こと"],
  "京\0きょう": ["東京", "とうきょう"],
  "正\0せい": ["正解", "せいかい"],
  "正\0しょう": ["正月", "しょうがつ"],
  "様\0よう": ["様子", "ようす"],
  "君\0くん": ["田中君", "たなかくん"],
  "立\0りつ": ["私立", "しりつ"],
  "歩\0ほ": ["歩道", "ほどう"],
  "失\0しつ": ["失礼", "しつれい"],
  "報\0ほう": ["情報", "じょうほう"],
  "神\0しん": ["精神", "せいしん"],
  "神\0じん": ["神社", "じんじゃ"],
  "組\0くみ": ["組", "くみ"],
  "葉\0は": ["葉", "は"],
  "草\0そう": ["雑草", "ざっそう"],
  "負\0ふ": ["負担", "ふたん"],
  "倒\0とう": ["倒産", "とうさん"],
  "付\0つける": ["付ける", "つける"],
  "積\0せき": ["面積", "めんせき"],
  "歳\0さい": ["何歳", "なんさい"],
  "馬\0ば": ["競馬", "けいば"],
  "都\0と": ["東京都", "とうきょうと"],
  "都\0つ": ["都合", "つごう"],
  "陽\0よう": ["太陽", "たいよう"],
  "関\0かん": ["関係", "かんけい"],
  "声\0せい": ["音声", "おんせい"],
  "験\0けん": ["試験", "しけん"],
  "試\0し": ["試験", "しけん"],
  "色\0しき": ["景色", "けしき"],
  "主\0しゅ": ["主人", "しゅじん"],
  "主\0ぬし": ["持ち主", "もちぬし"],
  "婦\0ふ": ["主婦", "しゅふ"],
  "飯\0はん": ["ご飯", "ごはん"],
  "味\0み": ["意味", "いみ"],
  "加\0か": ["参加", "さんか"],
  "置\0ち": ["位置", "いち"],
  "真\0ま": ["真ん中", "まんなか"],
  "能\0のう": ["才能", "さいのう"],
  "容\0よう": ["内容", "ないよう"],
  "受\0じゅ": ["受験", "じゅけん"],
  "上\0じょう": ["以上", "いじょう"],
};
for (const [ch, info] of Object.entries(kanji)) {
  for (const r of info.readings || []) {
    const key = `${ch}\0${r.kana}`;
    if (ANCHOR[key]) {
      const [a, ar] = ANCHOR[key];
      if (r.anchor !== a) note("B3", `${ch} ${r.kana}`, "anchor", `${r.anchor}（${r.anchorReading}）`, `${a}（${ar}）`);
      r.anchor = a;
      r.anchorReading = ar;
    }
  }
}
const taste = kanji["味"];
if (taste && taste.primary !== "あじ") {
  if (!taste.readings.some((r) => r.kana === "あじ")) {
    taste.readings.unshift(R("kun", "あじ", "味", "あじ"));
  }
  note("B3", "味", "quiz reading", taste.primary, "あじ");
  taste.primary = "あじ";
}

function ensure(ch, row, { primary } = {}) {
  const info = kanji[ch];
  if (!info) return;
  if (!info.readings.some((r) => r.kana === row.kana)) {
    info.readings.push(row);
    note("B3", ch, "reading", "(none)", `${row.kana} · ${row.anchor}`);
  }
  if (primary && info.primary !== row.kana) {
    note("B3", ch, "quiz reading", info.primary, row.kana);
    info.primary = row.kana;
  }
}
ensure("達", R("kun", "たち", "友達", "ともだち"));
ensure("必", R("kun", "かならず", "必ず", "かならず"));
ensure("全", R("kun", "まったく", "全く", "まったく"));
ensure("最", R("kun", "もっとも", "最も", "もっとも"));
ensure("亡", R("kun", "なくなる", "亡くなる", "なくなる", "な.くなる"));
ensure("迷", R("kun", "まよう", "迷う", "まよう", "まよ.う"));
ensure("通", R("kun", "とおる", "通る", "とおる", "とお.る"));
ensure("開", R("kun", "ひらく", "開く", "ひらく", "ひら.く"));
if (kanji["出"]) {
  const has = kanji["出"].readings.some((r) => r.kana === "しゅつ");
  if (!has) {
    kanji["出"].readings.push(R("on", "しゅつ", "出発", "しゅっぱつ"));
    kanji["出"].demoted = (kanji["出"].demoted || []).filter((d) => d !== "しゅつ");
    note("B3", "出", "reading", "(demoted)", "しゅつ · 出発（しゅっぱつ）; quiz stays でる");
  }
}
if (kanji["日"]) {
  for (const r of kanji["日"].readings) {
    if (r.kana === "び" && r.type !== "kun") {
      note("B3", "日 び", "type", r.type, "kun");
      r.type = "kun";
    }
  }
}
if (kanji["差"]) {
  for (const r of kanji["差"].readings) {
    if (r.kana === "さす") r.type = "kun";
    if (r.kana === "さ") {
      if (r.anchor !== "時差") note("B3", "差 さ", "anchor", r.anchor, "時差");
      r.type = "on";
      r.anchor = "時差";
      r.anchorReading = "じさ";
    }
  }
}
if (kanji["正"] && !kanji["正"].readings.some((r) => r.kana === "しょう")) {
  kanji["正"].readings.push(R("on", "しょう", "正月", "しょうがつ"));
}
if (kanji["家"]) {
  for (const r of kanji["家"].readings) {
    if (r.kana === "うち") r.note = "also correct (home). Never a distractor next to いえ.";
  }
}
if (kanji["私"]) {
  if (!kanji["私"].readings.some((r) => r.kana === "わたくし")) {
    kanji["私"].readings.push({ type: "kun", kana: "わたくし", anchor: "私", anchorReading: "わたくし", note: "also correct (formal). Never a wrong distractor." });
    note("other", "私", "reading", "(none)", "わたくし also correct (formal)");
  }
}

const DEMOTE = {
  仕: ["つかえる"], 代: ["しろ"], 会: ["え"], 体: ["てい"], 図: ["はかる"], 字: ["あざ"], 業: ["ごう"], 文: ["ふみ"], 注: ["さす"], 病: ["やむ"], 発: ["ほつ", "たつ"], 目: ["ぼく"], 研: ["とぐ"], 社: ["やしろ"], 野: ["の"], 音: ["ね"], 有: ["う"], 公: ["おおやけ"], 歩: ["あゆむ"], 質: ["しち"], 末: ["うら"], 未: ["ひつじ", "まだ"], 機: ["はた"], 給: ["たまう"], 役: ["えき"], 反: ["たん"], 労: ["いたわる"], 勝: ["まさる"], 恥: ["はじらう"], 戦: ["いくさ"], 果: ["はて"], 更: ["ふける"], 杯: ["さかずき"], 経: ["へる"], 説: ["とく"], 越: ["えつ"], 際: ["きわ"], 留: ["とどめる"], 交: ["まじえる"], 点: ["つく"], 放: ["はなれる"], 遅: ["おくらす"], 過: ["あやまち"],
};
const DEDUPE = {
  写: ["うつ"], 切: ["きり"], 答: ["こたえ"], 考: ["かんがえ"], 使: ["つかい"], 貸: ["かし"], 持: ["もてる"], 建: ["たて"], 違: ["ちがい"], 盗: ["ぬすみ"], 調: ["しらべ"], 育: ["そだち"], 流: ["ながれ"], 落: ["おち"], 取: ["とり"], 早: ["はや"],
};
for (const [ch, kanas] of Object.entries({ ...DEMOTE, ...DEDUPE })) {
  const info = kanji[ch];
  if (!info) continue;
  const before = info.readings.length;
  info.readings = info.readings.filter((r) => !kanas.includes(r.kana));
  if (info.readings.length !== before) {
    note("B3", ch, "demoted", kanas.join("、"), info.readings.map((r) => r.kana).join("、") || "(none left)");
    info.demoted = [...new Set([...(info.demoted || []), ...kanas])];
    if (!info.readings.some((r) => r.kana === info.primary) && info.readings[0]) {
      note("B3", ch, "quiz reading", info.primary, info.readings[0].kana);
      info.primary = info.readings[0].kana;
    }
  }
}
const MEANING = {
  安: "cheap; safe", 帰: "return (home)", 号: "number; issue", 参: "visit (humble); take part", 向: "face; toward", 優: "gentle; excellent", 似: "resemble", 余: "surplus; extra", 緒: "cord; (一緒) together", 座: "sit; seat", 頂: "top; receive (humble)", 告: "tell; announce", 探: "search; look for", 抜: "pull out", 商: "trade; commerce", 漢: "Han China (as in 漢字)", 以: "from; (以上・以下) and over / under", 合: "fit; match; together",
};
for (const [ch, meaning] of Object.entries(MEANING)) {
  const info = kanji[ch];
  if (!info || info.meaning === meaning) continue;
  note("B3", ch, "meaning", info.meaning, meaning);
  info.meaning = meaning;
}
let stripped = 0;
for (const [ch, info] of Object.entries(kanji)) {
  for (const r of info.readings || []) {
    if (typeof r.anchor === "string" && r.anchor.endsWith("する")) {
      const next = r.anchor.slice(0, -2);
      note("B3", `${ch} ${r.kana}`, "anchor", r.anchor, next);
      r.anchor = next;
      if (typeof r.anchorReading === "string" && r.anchorReading.endsWith("する")) r.anchorReading = r.anchorReading.slice(0, -2);
      stripped++;
    }
  }
}

const SENTENCE_FIX = [
  ["卵を十買いました。", "娘は今年で十（とお）になります。", "She turns ten this year.", "とお"],
  ["年に一度、実家に帰ります。", "兄と私は年（とし）が三つ違います。", "My older brother and I are three years apart.", "とし"],
  ["北海道は冬が長いです。", "東北（とうほく）の冬は寒いです。", "Winter in Tohoku is cold.", "ほく"],
  ["紙は白紙です。", "白紙に名前を書いてください。", "Please write your name on a blank sheet.", "はく"],
  ["女子の生徒も来ます。", "このクラスは女子が多いです。", "There are many girls in this class.", "じょ"],
  ["日本は島の国です。", "どこの国から来ましたか。", "Which country are you from?", "くに"],
  ["潮が引いた。", "ドアを引いてください。", "Please pull the door.", "ひく"],
  ["今日は元気です。", "祖母はとても元気です。", "My grandmother is very well.", "き"],
];
function rewrite(list, where) {
  if (!list) return;
  for (const s of list) {
    for (const [from, ja, en] of SENTENCE_FIX) {
      if (s.ja === from) {
        note("B1", where, "sentence", s.ja, ja);
        s.ja = ja;
        s.en = en;
        s.flag = "";
      }
    }
  }
}
for (const [ch, list] of Object.entries(sentences.kanji)) rewrite(list, `kanji ${ch}`);
for (const row of Object.values(sentences.verbs)) rewrite(row.sentences, `verb ${row.dictionary}`);

const nen = sentences.kanji["年"];
if (nen && !nen.some((s) => s.ja.includes("年に一度"))) {
  nen.push({ ja: "年に一度、実家に帰ります。", en: "I go back to my parents' house once a year.", reading: "ねん", flag: "" });
  note("B1", "kanji 年 ねん", "sentence", "(none)", "年に一度、実家に帰ります。");
}
if (sentences.kanji["仕"]) {
  sentences.kanji["仕"] = sentences.kanji["仕"].filter((s) => !s.ja.includes("仕事します"));
  if (!sentences.kanji["仕"].some((s) => s.ja.startsWith("父は毎日仕事"))) {
    sentences.kanji["仕"].push({ ja: "父は毎日仕事に行きます。", en: "My father goes to work every day.", reading: "し", flag: "" });
    note("B1", "kanji 仕", "sentence", "今日は仕事します。", "父は毎日仕事に行きます。");
  }
}
if (sentences.kanji["兄"]) {
  sentences.kanji["兄"] = [{ ja: "兄弟は何人いますか。", en: "How many siblings do you have?", reading: "きょう", flag: "" }];
  note("B1", "kanji 兄", "sentence", "これは兄弟です。", "兄弟は何人いますか。");
}
delete sentences.kanji["弟"];

function keepSentence(s) {
  const f = s.flag || "";
  if (!f) return true;
  if (f === "uses the anchor verb") return true;
  if (f.startsWith("笑顔")) return true;
  return false;
}
let removed = 0;
let kept = 0;
for (const row of Object.values(sentences.verbs)) {
  const before = row.sentences.length;
  row.sentences = row.sentences.filter(keepSentence);
  removed += before - row.sentences.length;
  kept += row.sentences.length;
}
for (const [ch, list] of Object.entries(sentences.kanji)) {
  const next = list.filter(keepSentence);
  removed += list.length - next.length;
  kept += next.length;
  if (next.length) sentences.kanji[ch] = next;
  else delete sentences.kanji[ch];
}
for (const [id, row] of Object.entries(sentences.verbs)) {
  if (!row.sentences.length) delete sentences.verbs[id];
}
const byId = new Map(words.map((w) => [w.id, w]));
for (const row of Object.values(sentences.verbs)) {
  const w = byId.get(row.id);
  if (!w) continue;
  row.dictionary = w.dictionary;
  row.reading = w.reading;
}
note("B1", "sentences", "draft rows", String(removed), `removed; ${kept} hand-written kept`);

writeFileSync(resolve(root, "scripts/curated/n5-n3-words.json"), JSON.stringify(wordsFile, null, 2));
writeFileSync(resolve(root, "scripts/curated/n5-n3-kanji.json"), JSON.stringify(kanjiFile, null, 2));
writeFileSync(resolve(root, "scripts/curated/sentences.json"), JSON.stringify(sentences, null, 2));

const goldenPath = resolve(root, "src/lib/__tests__/conjugation-golden.json");
const golden = JSON.parse(readFileSync(goldenPath, "utf8"));
const nextGolden = golden.filter((row) => {
  const w = words.find((entry) => entry.id === row.id);
  return !(w && row.wordType === "verb" && w.wordType !== "verb");
});
if (nextGolden.length !== golden.length) {
  note("B4", "conjugation-golden", "rows", String(golden.length), String(nextGolden.length));
  writeFileSync(goldenPath, JSON.stringify(nextGolden));
}

const groups = ["B1", "B2", "B3", "B4", "other"];
const lines = ["# Phase 3 recheck", "", "Applied on top of the curated files. The draft script was not re-run.", ""];
for (const g of groups) {
  const rows = log.filter((r) => r.group === g);
  lines.push(`## ${g} (${rows.length})`, "", "| id / headword | field | old → new |", "| --- | --- | --- |");
  for (const r of rows) {
    const cell = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
    lines.push(`| ${cell(r.id)} | ${cell(r.field)} | ${cell(r.old)} → ${cell(r.new)} |`);
  }
  lines.push("");
}
lines.push("## Not applied", "", "- 速い is not in the word list (no stable id), so 早い was glossed as “early; soon” and 速い was not added.", "- §4b sample sentences (会う, 見える, …) were not generated. The review says not to invent replacements in this PR.", "- 出（しゅつ） is a taught reading with anchor 出発. The quiz answer stays でる, because 出 is an N5 kanji and the card has one answer.", "- にっぽん and あす are not quiz distractors. Nothing in the app marks them wrong.", "");
writeFileSync(resolve(root, "review/phase3/recheck.md"), lines.join("\n"));
console.log(`words ${words.length} sentences kept ${kept} removed ${removed} log ${log.length} golden ${nextGolden.length}`);
