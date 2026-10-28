import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/**
 * Checked-in patch layer for generated word data.
 *
 * `src/data/words.json` is produced by `scripts/build-words.ts` from JMdict
 * (not stored in this repo) plus the JLPT vocab caches. This module is the
 * source of truth for teacher-verified corrections (review items 3–4, 9,
 * 14–31, and the native-teacher follow-up). Both build scripts call
 * `applyContentOverrides` immediately before writing JSON, and
 * `node scripts/apply-content-overrides.mjs` reapplies the same function to
 * the checked-in file when JMdict is not available.
 *
 * する glosses: `scripts/suru-senses.json` is extracted from JMdict (not in
 * this repo) by `scripts/extract-suru-senses.mjs`. For each irregular-suru
 * id it keeps up to two glosses that start with "to " on a sense tagged
 * vs / vs-s / vs-i. When that sense has only a noun or adverb gloss, the
 * value is "(する) …" and is not prefixed with "to ". `SURU_GLOSSES` is
 * applied after the map, so the hand-checked N5–N3 lines win.
 *
 * Re-running the function is safe: drops match stable JMdict ids, field
 * patches overwrite, glosses are absolute, and added rows are inserted only
 * when that id is absent.
 *
 * The app does not read `verbs.json`. Verb rows are the `wordType: "verb"`
 * slice of `words.json` (`src/data/verbs.ts`), so practice and progress share
 * one level, one id, and one gloss.
 */

/** @typedef {"N5"|"N4"|"N3"|"N2"|"N1"} JlptTag */

/** JMdict ent_seq values to remove entirely. */
export const DROP_IDS = [
  // 14–17, 21: not verbs, or noun glosses a learner will misread
  "1189130", // どうぞする
  "1519170", // 帽子する
  "2850596", // パンする
  "1115150", // プールする
  "1125150", // ポストする
  "1093450", // ノートする
  "1075940", // タイプする
  "1347710", // 将来する
  "1261190", // 原因する
  "1272280", // 交通する
  "1192700", // 科学する
  "1335080", // 十分する
  "1588060", // 受付する — the verb is 受け付ける (item 20)
  "1577280", // 暇する — replaced by the ひま na-adjective below
  // 27
  "1339500", // 出切る
  // 9: がる is a suffix, not a verb
  "1631750",
  // 29: suffixes, not words
  "1156990", // 易い
  "1582640", // 難い
  // 28: rare homograph readings
  "1465580", // 入る(いる)
  "1591270", // 来る(きたる)
  "1467520", // 認める(したためる)
  "2859682", // 怒る(いかる)
  "2831360", // 包む(くるむ)
  "1179000", // 汚れる(けがれる)
  "1379730", // 盛る(さかる)
  "1444150", // 吐く(つく)
  "1456895", // 突く(つつく)
  "2657130", // 止まる(とどまる)
  "1419360", // 弾く(はじく)
  "1408815", // 打つ(ぶつ)
  "2859761", // 火傷する(かしょうする)
  // 31
  "1580400", // 上手(うわて)
  "1580485", // 丈夫(じょうふ)
  // 26: いとま is the rare reading; ひま is added below
  "2858986",
];

/**
 * Field patches keyed by JMdict id. `kanjiForm` keeps the old spelling in the
 * furigana index after `dictionary` is switched to the kana learners should see.
 * Ids are stable, so localStorage progress keys (`id::question`) keep working.
 * @type {Record<string, Record<string, string>>}
 */
export const PATCHES = {
  // 3. ある is kana and N5
  "1296400": { dictionary: "ある", jlptLevel: "N5", kanjiForm: "有る", meaning: "to be; to exist" },
  // 4. する, not 為る
  "1157170": { dictionary: "する", jlptLevel: "N5", kanjiForm: "為る", meaning: "to do; to carry out" },
  // 5. くれる is written in kana and is core N5 (呉 is why it was filed as N1)
  "1269130": { dictionary: "くれる", jlptLevel: "N5", kanjiForm: "呉れる", meaning: "to give; to let someone have" },
  // 22
  "1594400": {
    dictionary: "しっかりする",
    kanjiForm: "確りする",
    jlptLevel: "N3",
    meaning: "to hold on firmly; to be steady",
  },
  "1226360": {
    dictionary: "びっくりする",
    kanjiForm: "吃驚する",
    jlptLevel: "N4",
    meaning: "to be surprised",
  },
  // 29 kana display. おかしい / つまらない are also core N5 (item 25).
  "1481920": { dictionary: "うるさい", kanjiForm: "煩い" },
  "1374550": { dictionary: "すごい", kanjiForm: "凄い", meaning: "amazing; great" },
  "1190860": { dictionary: "おかしい", jlptLevel: "N5", kanjiForm: "可笑しい", meaning: "funny; strange" },
  "1008190": { dictionary: "つまらない", jlptLevel: "N5", kanjiForm: "詰らない", meaning: "boring; dull" },
  "1184360": { dictionary: "くだらない", kanjiForm: "下らない" },
  "1259250": { dictionary: "みっともない", kanjiForm: "見っともない" },
  // 28: keep the everyday reading of 火傷 and show it in kana
  "1577310": {
    dictionary: "やけどする",
    kanjiForm: "火傷する",
    meaning: "to get burned; to be scalded",
  },
  // 18–19
  "1602380": {
    dictionary: "広々とする",
    reading: "ひろびろとする",
    meaning: "to be spacious; to be extensive",
  },
  "1604260": {
    dictionary: "丸々とする",
    reading: "まるまるとする",
    meaning: "to be plump; to be round",
  },
  "1552760": {
    dictionary: "留守にする",
    reading: "るすにする",
    meaning: "to be away from home",
  },
  // 24. 終わる / 曲がる / 上がる are N5; the rest are N4–N3.
  "1589600": { jlptLevel: "N5" }, // 終わる
  "1352290": { jlptLevel: "N5" }, // 上がる
  "1239730": { jlptLevel: "N5" }, // 曲がる
  "1333550": { jlptLevel: "N4" }, // 集まる
  "1548550": { jlptLevel: "N4" }, // 落ちる
  "1223660": { jlptLevel: "N4" }, // 起こす
  "1184160": { jlptLevel: "N4" }, // 下がる
  "1611610": { jlptLevel: "N4" }, // 間違う
  "1352570": { jlptLevel: "N4" }, // 上る
  "1207270": { jlptLevel: "N4" }, // 楽しむ
  "1589260": { jlptLevel: "N3" }, // 落とす
  "1591420": { jlptLevel: "N3" }, // 決まる
  "2849867": { jlptLevel: "N3" }, // 混む
  "1432710": { jlptLevel: "N3" }, // 痛む
  "1278830": { jlptLevel: "N3" }, // 慌てる
  "1213440": { jlptLevel: "N3" }, // 甘える
  "1427510": { jlptLevel: "N3" }, // 喋る
  "1350780": { jlptLevel: "N3" }, // 焦る
  // 25. Core adjectives and 椅子 were filed as N1/N3.
  "1532350": { jlptLevel: "N5" }, // 明るい
  "1486650": { jlptLevel: "N5", meaning: "delicious; tasty" },
  "1533580": { jlptLevel: "N5" }, // 面白い
  "1577200": { jlptLevel: "N5" }, // 可愛い
  "2820690": { jlptLevel: "N5" }, // いい
  "1587850": { jlptLevel: "N5" }, // 色々
  "1415000": { jlptLevel: "N5", meaning: "serious; tough; difficult" },
  "1157070": { jlptLevel: "N5" }, // 椅子
  // Native review: core N5 headwords were filed under a harder tag, or in kanji
  // learners do not see. kanjiForm keeps the furigana index.
  "1259290": { jlptLevel: "N5" }, // 見る
  "1535910": { dictionary: "もらう", kanjiForm: "貰う", jlptLevel: "N5", meaning: "to receive; to get" },
  "1375610": { dictionary: "なる", kanjiForm: "成る", jlptLevel: "N5" },
  "1012980": { dictionary: "やる", kanjiForm: "遣る", jlptLevel: "N5", meaning: "to do; to give" },
  "1495770": { dictionary: "つける", kanjiForm: "付ける", jlptLevel: "N5" },
  "1610400": { dictionary: "つける", kanjiForm: "点ける", jlptLevel: "N5" },
  "1207610": { dictionary: "かける", kanjiForm: "掛ける", jlptLevel: "N5" },
  "1207590": { dictionary: "かかる", kanjiForm: "掛かる", jlptLevel: "N5" },
  "1607260": { jlptLevel: "N5" }, // 履く
  "1484330": { jlptLevel: "N5" }, // 被る
  "1547450": { jlptLevel: "N5" }, // 浴びる
  "1427900": { jlptLevel: "N5" }, // 張る
  "1604230": { jlptLevel: "N5" }, // 丸い
  "1495000": { dictionary: "まずい", kanjiForm: "不味い", jlptLevel: "N5" },
  // 上る stays N4. 山に登る is the added 登る row.
  "2784220": { jlptLevel: "N3" }, // マッチする — N5 マッチ is a match for lighting fires
  "1329690": { jlptLevel: "N3" }, // 受け付ける
  "1002430": { jlptLevel: "N4" }, // お茶する is colloquial, not JLPT N5
  "1291330": { meaning: "to put up (an umbrella); to shine (of light)" }, // 差す
  "1444610": { meaning: "to hand over; to give" }, // 渡す
  "1414150": { meaning: "all right; OK; fine" }, // 大丈夫
};

/** Rows the generated dictionary does not contain. Ids are not JMdict seqs. */
export const ADDS = [
  {
    id: "override-dekiru",
    dictionary: "できる",
    reading: "できる",
    meaning: "to be able to; to be completed; to be ready",
    pos: ["v1", "vi"],
    wordType: "verb",
    verbClass: "ichidan",
    jlptLevel: "N5",
  },
  {
    id: "override-hima",
    dictionary: "暇",
    reading: "ひま",
    meaning: "free (time); not busy",
    pos: ["adj-na", "n"],
    wordType: "adj-na",
    verbClass: "adj-na",
    jlptLevel: "N5",
  },
  {
    id: "override-noboru",
    dictionary: "登る",
    reading: "のぼる",
    meaning: "to climb; to go up (a mountain, stairs)",
    pos: ["v5r", "vi"],
    wordType: "verb",
    verbClass: "godan-r",
    jlptLevel: "N5",
  },
  {
    id: "override-kirei",
    dictionary: "きれい",
    kanjiForm: "綺麗",
    reading: "きれい",
    meaning: "pretty; beautiful; clean",
    pos: ["adj-na"],
    wordType: "adj-na",
    verbClass: "adj-na",
    jlptLevel: "N5",
  },
];

/**
 * Hand-checked verb-sense glosses for する verbs.
 * Keyed by the reading after the patches above. These override suru-senses.json.
 * @type {Record<string, string>}
 */
export const SURU_GLOSSES = {
  いみする: "to mean; to signify",
  おちゃする: "to have tea",
  かいものする: "to go shopping",
  けっこんする: "to get married; to marry",
  コピーする: "to copy; to photocopy",
  さくぶんする: "to write a composition",
  さんぽする: "to take a walk",
  しごとする: "to work",
  しつもんする: "to ask a question",
  じゅぎょうする: "to hold a class; to teach a lesson",
  せんたくする: "to do laundry",
  そうじする: "to clean",
  テストする: "to test; to give a test",
  でんわする: "to call; to telephone",
  べんきょうする: "to study",
  マッチする: "to match; to go well with",
  りょうりする: "to cook",
  りょこうする: "to travel",
  れんしゅうする: "to practice",
  する: "to do; to carry out",
  アルバイトする: "to work part-time",
  あんしんする: "to feel relieved",
  あんないする: "to guide; to show around",
  いけんする: "to admonish; to give (someone) a talking-to",
  うんてんする: "to drive",
  うんどうする: "to exercise",
  えんりょする: "to hold back; to refrain",
  かいぎする: "to hold a meeting",
  かいわする: "to converse; to have a conversation",
  かんけいする: "to be related; to concern",
  きゅうこうする: "to hurry; to rush",
  きょういくする: "to educate",
  きょうそうする: "to compete",
  けいかくする: "to plan",
  けいけんする: "to experience",
  げしゅくする: "to board; to lodge",
  けんきゅうする: "to research",
  けんぶつする: "to sightsee",
  こうぎする: "to lecture",
  こしょうする: "to break down; to malfunction",
  しあいする: "to play a match",
  しけんする: "to test; to examine (something)",
  したくする: "to get ready; to prepare",
  しっぱいする: "to fail",
  しゅっせきする: "to attend",
  しゅっぱつする: "to depart",
  じゅんびする: "to prepare",
  しょうかいする: "to introduce",
  しょうたいする: "to invite",
  しょうちする: "to consent; to acknowledge",
  しょくじする: "to have a meal",
  しんぱいする: "to worry",
  すいえいする: "to swim",
  すっとする: "to feel refreshed",
  せいかつする: "to live; to make a living",
  せいさんする: "to produce",
  せつめいする: "to explain",
  せわする: "to look after; to take care of",
  せんそうする: "to wage war",
  そうだんする: "to consult; to discuss",
  そつぎょうする: "to graduate",
  たいいんする: "to leave the hospital",
  だんぼうする: "to heat a room",
  チェックする: "to check",
  ちゅういする: "to be careful; to warn",
  ちゅうしゃする: "to give an injection",
  つごうする: "to arrange (one's schedule)",
  どろぼうする: "to steal",
  にゅういんする: "to be hospitalized",
  にゅうがくする: "to enter a school",
  ねぼうする: "to oversleep",
  はいけんする: "to look at (humble)",
  はつおんする: "to pronounce",
  はっきりする: "to become clear",
  はなみする: "to view the cherry blossoms",
  はんたいする: "to oppose",
  ふくしゅうする: "to review (a lesson)",
  プレゼントする: "to give a present",
  へんじする: "to reply",
  ぼうえきする: "to trade",
  ほうそうする: "to broadcast",
  ほんやくする: "to translate",
  むりする: "to overdo it; to force oneself",
  やくそくする: "to promise",
  ゆしゅつする: "to export",
  ゆにゅうする: "to import",
  よういする: "to prepare",
  よしゅうする: "to prepare for a lesson",
  よていする: "to schedule; to plan",
  よやくする: "to reserve",
  りようする: "to use",
  るすにする: "to be away from home",
  れいぼうする: "to air-condition; to cool a room",
  れんらくする: "to contact",
  しっかりする: "to hold on firmly; to be steady",
  びっくりする: "to be surprised",
  ひろびろとする: "to be spacious; to be extensive",
  まるまるとする: "to be plump; to be round",
  やけどする: "to get burned; to be scalded",
  // Cited noun glosses that the blind "to " prefix had made ungrammatical.
  ゆうしょうする: "to win the championship",
  がくしゅうする: "to study; to learn",
  しゅうちゅうする: "to concentrate",
  たいくつする: "to feel bored; to get bored (with)",
  ゆっくりする: "to take one's time; to relax",
  ほっとする: "to feel relieved",
};

/** @type {Record<string, string>} */
const SURU_SENSES = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "suru-senses.json"), "utf8"),
);

function isVerbEntry(entry) {
  if (entry.wordType) return entry.wordType === "verb";
  const cls = entry.verbClass ?? "";
  return cls !== "noun" && !cls.startsWith("adj");
}

/**
 * @param {any[]} entries
 * @param {{ verbsOnly?: boolean }} [opts]
 */
export function applyContentOverrides(entries, opts = {}) {
  const drop = new Set(DROP_IDS);
  /** @type {any[]} */
  const out = [];
  for (const entry of entries) {
    if (drop.has(entry.id)) continue;
    // A rebuild must not resurrect the rare homophone of できる.
    if (entry.reading === "できる" && (entry.dictionary === "出切る" || entry.dictionary === "出来る")) {
      continue;
    }
    const patch = PATCHES[entry.id];
    out.push(patch ? { ...entry, ...patch } : { ...entry });
  }
  for (const add of ADDS) {
    const exists = out.some(
      (e) => e.id === add.id || (e.dictionary === add.dictionary && e.reading === add.reading && (e.wordType ?? "verb") === add.wordType),
    );
    if (!exists) out.push({ ...add });
  }

  for (const entry of out) {
    if (entry.verbClass !== "irregular-suru") continue;
    const hand = SURU_GLOSSES[entry.reading];
    if (hand) {
      entry.meaning = hand;
      continue;
    }
    const sense = SURU_SENSES[entry.id];
    if (sense) {
      entry.meaning = sense;
      continue;
    }
    const meaning = String(entry.meaning ?? "").trim();
    if (!meaning || meaning.startsWith("(する) ") || /^to\s/i.test(meaning)) continue;
    entry.meaning = `(する) ${meaning}`;
  }

  if (opts.verbsOnly) return out.filter(isVerbEntry);
  return out;
}
