/**
 * Build the Phase 3 curated sources and merge them into src/data.
 *
 *   node scripts/draft-phase3.mjs
 *
 * This overwrites scripts/curated/*.json. After a teacher edits those files,
 * merge with `node scripts/apply-phase3.mjs` instead. Drafting reads word
 * and kanji data from the local `main` branch, which must still be the
 * pre-curation snapshot.
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SURU_GLOSSES } from "./content-overrides.mjs";
import { EXTRA_KANJI, N5_KANJI } from "./curated/n5-kanji.mjs";
import { KANJI_REPLACEMENTS, REPLACEMENTS, BANNED_SUBSTRINGS, BANNED_JA } from "./example-overrides.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fromHead(rel) {
  return execSync(`git show main:${rel}`, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

const baseWords = JSON.parse(fromHead("src/data/words.json"));
const baseKanji = JSON.parse(fromHead("src/data/kanji-radicals.json"));
const baseExamples = JSON.parse(fromHead("src/data/examples.json"));
const testBlob = execSync("git grep -h . HEAD -- src/lib/__tests__", {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 32 * 1024 * 1024,
});

const KANA_BY_ID = {
  "1577980": {
    dictionary: "いる",
    kanjiForm: "居る",
    meaning: "to be; to exist (people and animals)",
    flag: "Shown in kana. The kanji spelling is 居る.",
  },
  "2842390": {
    reading: "わたし",
    meaning: "I; me",
    flag: "Textbook reading わたし. わたくし is formal — please confirm.",
  },
};

const DROP_N3 = new Set(["食う", "おる"]);

/** N3 headwords worth keeping once N5 and N4 are all in. */
const CORE_N3 = new Set(`
経験 意見 関係 原因 結果 理由 方法 目的 機会 場合 状態 影響 条件 環境 政治 経済 文化 社会
教育 研究 技術 法律 規則 習慣 歴史 未来 過去 現在 時代 世界 国際 平和 安全 危険 事故 解決
成功 失敗 努力 注意 準備 計画 予定 約束 連絡 報告 説明 紹介 案内 参加 出席 卒業 試合 競争
記録 調査 表現 翻訳 情報 機械 製品 商品 生活 自然 季節 地震 警察 責任 自由 興味 感想 記憶
希望 目標 自信 感謝 相手 人気 特徴 性格 感情 態度 変化 完成 発見 作品 小説 記事 記者 広告
番組 画面 患者 治療 健康 精神 緊張 不安 失礼 丁寧 増加 減少 継続 発明 通信 給料 税金 権利
義務 平等 資源 実験 観察 症状 印象 仲間 隣人 長所 短所 夢 苦労 謝罪 礼儀 規則 状況 目的
比較 表現 発見 決定 参加 経験 安心 案内 運転 運動 旅行 練習 準備 説明 相談 卒業 失敗 成功
注意 反対 連絡 約束 予約 利用 調査 表現 変化 増加 減少 完成 継続 競争 計画 教育 出席 出発
入院 合格 生産 放送 翻訳 発音 輸出 輸入 貿易 予習 予定 用意 復習 紹介 招待 食事 心配 経験
法律 政治 経済 文化 社会 歴史 未来 世界 国際 平和 環境 技術 機械 製品 商品 情報 自然 地震
警察 責任 自由 興味 感謝 性格 感情 健康 精神 患者 治療 記事 小説 作品 広告 番組
始める 続ける 決める 伝える 届ける 直す 育てる 増える 増やす 減る 減らす 変える 変わる
調べる 比べる 片付ける 謝る 褒める 叱る 泣く 笑う 急ぐ 遅れる 間に合う 足りる 似合う 似る
生きる 別れる 戻る 戻す 残る 残す 選ぶ 捨てる 拾う 運ぶ 壊す 壊れる 勝つ 負ける 落とす
決まる 決める 混む 痛む 慌てる 甘える 喋る 焦る 受ける 考える 思う 頼る 頼む 届く 直る
治る 治す 育てる 育つ 増す 移す 移る 建てる 建つ 焼く 焼ける 盗む 殺す 守る 助ける
助ける 起こる 起こす 集める 集まる 並べる 並ぶ 届ける 届く 送る 届く 迎える 送る 乗る
降りる 下りる 上げる 下げる 渡す 渡る 通る 通す 曲がる 戻る 進む 進める 止まる 止める
動く 動かす 働く 休む 遊ぶ 怒る 喜ぶ 悲しむ 楽しむ 覚える 忘れる 貸す 借りる 預ける
届く 届ける 片づける 片付ける 謝る 許す 断る 誘う 招待する 参加する 用意する 予約する
説明 案内 紹介 準備 計画 予定 約束 連絡 報告 注意 反対 失敗 成功 経験 意見 関係 理由
方法 目的 場合 状態 影響 条件 環境 危険 安全 事故 解決 努力 興味 感想 記憶 希望 目標
自信 感謝 人気 特徴 性格 感情 態度 自由 責任 法律 政治 経済 文化 社会 歴史 世界 平和
技術 情報 自然 季節 地震 健康 精神 患者 治療 記事 小説 作品 商品 製品 機械 生活
`.split(/\s+/).filter(Boolean));

function isProtected(entry) {
  if (testBlob.includes(`"${entry.id}"`)) return true;
  if (testBlob.includes(`"${entry.dictionary}"`)) return true;
  // Pair tests look up the other verb by reading ("止む" must keep "やめる").
  if (entry.wordType === "verb" && testBlob.includes(`"${entry.reading}"`)) return true;
  return false;
}

function applyWordFix(entry) {
  const fix = KANA_BY_ID[entry.id];
  const next = { ...entry, ...(fix ?? {}) };
  if (next.wordType === "verb") {
    const hand = SURU_GLOSSES[`${next.dictionary}|${next.reading}`] ?? SURU_GLOSSES[next.reading];
    if (hand) next.meaning = hand;
    if (next.id === "1406150") {
      next.meaning = "to exist";
      next.flag = [next.flag, "Gloss rewritten from the noun “existence”."].filter(Boolean).join("; ");
    }
    const meaning = String(next.meaning ?? "").trim();
    if (!/^to /.test(meaning) && !/^\([^)]*\) to /.test(meaning)) {
      const bare = meaning.replace(/^\(する\)\s*/, "").split(";")[0].trim();
      next.meaning = bare ? `to ${bare}` : "to do";
      next.flag = [next.flag, "verb gloss drafted from a noun sense"].filter(Boolean).join("; ");
    }
  }
  return next;
}

function draftWords() {
  const keep = [];
  const n3 = [];
  for (const entry of baseWords.entries) {
    if (entry.jlptLevel === "N5" || entry.jlptLevel === "N4") keep.push(applyWordFix(entry));
    else if (entry.jlptLevel === "N3") n3.push(entry);
  }
  const protectedN3 = [];
  const rest = [];
  for (const entry of n3) {
    if (DROP_N3.has(entry.dictionary) || DROP_N3.has(entry.reading)) continue;
    if (isProtected(entry)) protectedN3.push(applyWordFix(entry));
    else rest.push(entry);
  }
  keep.push(...protectedN3);
  const target = 1220;
  const score = (e) => {
    let s = 0;
    if (CORE_N3.has(e.dictionary)) s += 80;
    if (e.wordType === "verb" && /^to /.test(e.meaning)) s += 50;
    if (e.wordType === "adj-i") s += 40;
    if (e.wordType === "adj-na" && CORE_N3.has(e.dictionary)) s += 30;
    if (e.wordType === "noun" && CORE_N3.has(e.dictionary)) s += 25;
    if (String(e.meaning).startsWith("(する)")) s -= 40;
    s -= Math.min(e.reading.length, 12);
    return s;
  };
  rest.sort((a, b) => score(b) - score(a) || a.reading.localeCompare(b.reading) || a.dictionary.localeCompare(b.dictionary));
  for (const entry of rest) {
    if (keep.length >= target) break;
    if (score(entry) < 20) break;
    keep.push(applyWordFix(entry));
  }
  const order = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
  keep.sort(
    (a, b) =>
      order[a.jlptLevel] - order[b.jlptLevel] ||
      a.wordType.localeCompare(b.wordType) ||
      a.reading.localeCompare(b.reading) ||
      a.dictionary.localeCompare(b.dictionary) ||
      a.id.localeCompare(b.id),
  );
  return keep;
}

function kataToHira(s) {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    out += c >= 0x30a1 && c <= 0x30f6 ? String.fromCharCode(c - 0x60) : ch;
  }
  return out;
}
function hiraToKata(s) {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    out += c >= 0x3041 && c <= 0x3096 ? String.fromCharCode(c + 0x60) : ch;
  }
  return out;
}
function isKanji(ch) {
  const c = ch.charCodeAt(0);
  return c >= 0x4e00 && c <= 0x9fff;
}
function voice(s) {
  const map = { か: "が", き: "ぎ", く: "ぐ", け: "げ", こ: "ご", さ: "ざ", し: "じ", す: "ず", せ: "ぜ", そ: "ぞ", た: "だ", ち: "ぢ", つ: "づ", て: "で", と: "ど", は: "ば", ひ: "び", ふ: "ぶ", へ: "べ", ほ: "ぼ" };
  return map[s[0]] ? map[s[0]] + s.slice(1) : "";
}
function halfVoice(s) {
  const map = { は: "ぱ", ひ: "ぴ", ふ: "ぷ", へ: "ぺ", ほ: "ぽ" };
  return map[s[0]] ? map[s[0]] + s.slice(1) : "";
}
function surfaces(kana) {
  const out = new Set([kana]);
  const last = kana.slice(-1);
  const base = kana.slice(0, -1);
  if (base && "くきつち".includes(last)) {
    out.add(base + "っ");
    if (last === "ち" || last === "つ") out.add(base);
  }
  const v = voice(kana);
  if (v) out.add(v);
  const p = halfVoice(kana);
  if (p) out.add(p);
  return [...out];
}

const SKIP_ALIGN = new Set(["今日", "明日", "昨日", "大人", "一人", "二人", "二十歳", "二十日", "今朝", "今年", "上手", "下手", "友達", "明日", "昨日"]);

/** First KANJIDIC glosses that would teach the wrong idea. */
const MEANING_FIX = {
  主: "main; master",
  仕: "serve",
  去: "leave; past",
  図: "diagram; map",
  堂: "hall",
  員: "member",
  勉: "study",
  台: "stand; counter",
  世: "world; generation",
  不: "not",
  京: "capital",
  品: "goods; item",
  代: "age; substitute",
  以: "by means of",
  令: "order",
  付: "attach",
  他: "other",
  例: "example",
  信: "trust",
  値: "price; value",
  側: "side",
  共: "together",
  加: "add",
  努: "effort",
  労: "labor",
  単: "simple",
  危: "danger",
  和: "harmony; Japanese style",
  困: "trouble",
  変: "change",
  夫: "husband",
  失: "lose",
  娘: "daughter",
  守: "protect",
  完: "complete",
  実: "truth; reality",
  客: "guest; customer",
  室: "room",
  寒: "cold",
  対: "opposite",
  居: "reside",
  屋: "shop",
  平: "flat",
  幸: "happiness",
  底: "bottom",
  店: "shop",
  庭: "garden",
  式: "style; ceremony",
  引: "pull",
  弟: "younger brother",
  弱: "weak",
  強: "strong",
  形: "shape",
  役: "role",
  必: "certain",
  忘: "forget",
  忙: "busy",
  怒: "anger",
  思: "think",
  急: "sudden; urgent",
  性: "nature; gender",
  悲: "sad",
  情: "feeling",
  悪: "bad",
  感: "feeling",
  成: "become; succeed",
  戦: "war; match",
  所: "place",
  才: "talent",
  打: "hit",
  技: "skill",
  投: "throw",
  持: "hold",
  指: "finger; point",
  放: "release",
  敗: "defeat",
  数: "number",
  文: "writing",
  料: "fee; material",
  新: "new",
  方: "direction; person",
  旅: "travel",
  易: "easy",
  昔: "long ago",
  春: "spring",
  昨: "previous",
  昼: "daytime",
  景: "scenery",
  晴: "clear weather",
  暑: "hot",
  暗: "dark",
  曲: "melody; curve",
  更: "further; again",
  最: "most",
  月: "month; moon",
  望: "hope",
  期: "period",
  未: "not yet",
  末: "end",
  本: "book; origin",
  材: "material",
  村: "village",
  束: "bundle",
  杯: "cup",
  果: "fruit; result",
  枝: "branch",
  栄: "prosperity",
  根: "root",
  格: "status; case",
  案: "plan",
  械: "machine",
  極: "extreme",
  様: "manner; Mr/Ms",
  標: "mark",
  横: "side",
  機: "machine; chance",
  欠: "lack",
  次: "next",
  欲: "want",
  歯: "tooth",
  歳: "years old",
  残: "remain",
  段: "step; grade",
  殺: "kill",
  民: "people",
  求: "seek",
  決: "decide",
  沈: "sink",
  河: "river",
  油: "oil",
  治: "govern; heal",
  法: "law; method",
  波: "wave",
  注: "pour; note",
  泳: "swim",
  洗: "wash",
  活: "lively; live",
  流: "flow",
  浅: "shallow",
  浴: "bathe",
  海: "sea",
  消: "extinguish",
  液: "liquid",
  深: "deep",
  混: "mix",
  清: "pure",
  済: "settle; finish",
  減: "decrease",
  渡: "cross",
  測: "measure",
  港: "port",
  満: "full",
  源: "source",
  準: "standard",
  演: "perform",
  漢: "China",
  潔: "pure",
  潜: "conceal",
  潮: "tide",
  激: "violent",
  濃: "thick; dark",
  火: "fire",
  灯: "lamp",
  灰: "ash",
  点: "point; mark",
  無: "nothing",
  然: "so; nature",
  焼: "burn",
  照: "illuminate",
  熱: "heat",
  燃: "burn",
  父: "father",
  片: "one-sided",
  版: "edition",
  牛: "cow",
  物: "thing",
  特: "special",
  犬: "dog",
  状: "condition",
  玉: "ball; jewel",
  王: "king",
  球: "sphere; ball",
  理: "reason; logic",
  産: "give birth; produce",
  用: "use",
  田: "rice field",
  由: "reason",
  申: "say (humble)",
  男: "man",
  町: "town",
  画: "picture; stroke",
  界: "world",
  留: "stay; detain",
  略: "abbreviation",
  番: "number; turn",
  異: "different",
  疑: "doubt",
  病: "illness",
  痛: "pain",
  登: "climb",
  白: "white",
  的: "target; -ical",
  皮: "skin",
  皿: "plate",
  盆: "tray",
  益: "benefit",
  盛: "prosper",
  目: "eye",
  直: "straight; fix",
  相: "mutual; aspect",
  省: "ministry; omit",
  看: "watch",
  真: "truth",
  眼: "eye",
  着: "arrive; wear",
  知: "know",
  短: "short",
  石: "stone",
  研: "polish; research",
  破: "break",
  確: "certain",
  示: "show",
  礼: "thanks; bow",
  社: "company; shrine",
  祖: "ancestor",
  祝: "celebrate",
  神: "god",
  票: "vote; ticket",
  祭: "festival",
  禁: "forbid",
  福: "fortune",
  私: "I; private",
  秋: "autumn",
  科: "department",
  秒: "second",
  種: "seed; kind",
  積: "pile up",
  究: "research",
  空: "sky; empty",
  突: "thrust",
  窓: "window",
  立: "stand",
  童: "child",
  端: "edge",
  競: "compete",
  竹: "bamboo",
  笑: "laugh",
  第: "ordinal prefix",
  筆: "brush; writing",
  等: "equal; class",
  答: "answer",
  算: "calculate",
  管: "pipe; manage",
  箱: "box",
  節: "joint; season",
  米: "rice",
  粉: "powder",
  精: "refined",
  約: "promise; about",
  級: "grade",
  素: "element; plain",
  細: "thin; detailed",
  終: "end",
  組: "group",
  経: "pass through; sutra",
  結: "tie; result",
  給: "supply; salary",
  絵: "picture",
  絶: "cease",
  続: "continue",
  綿: "cotton",
  緑: "green",
  線: "line",
  編: "compile; knit",
  練: "train",
  置: "place",
  美: "beauty",
  群: "group",
  羽: "feather; wing",
  老: "old",
  考: "think",
  者: "person",
  耐: "endure",
  耳: "ear",
  職: "job",
  肉: "meat",
  肌: "skin",
  育: "raise",
  胃: "stomach",
  背: "back",
  能: "ability",
  脈: "pulse",
  脂: "fat",
  脚: "leg",
  腹: "belly",
  腕: "arm",
  自: "oneself",
  至: "reach",
  致: "do; cause",
  興: "interest",
  舌: "tongue",
  舎: "cottage",
  航: "navigate",
  船: "ship",
  良: "good",
  色: "color",
  花: "flower",
  芸: "art",
  若: "young",
  苦: "suffer",
  英: "England; excellence",
  茶: "tea",
  草: "grass",
  荷: "load",
  落: "fall",
  葉: "leaf",
  著: "author; remarkable",
  蔵: "storehouse",
  薬: "medicine",
  処: "deal with",
  虚: "empty",
  虫: "insect",
  血: "blood",
  行: "go",
  術: "art; technique",
  街: "street",
  衛: "defend",
  衣: "clothes",
  表: "surface; express",
  袋: "bag",
  被: "suffer; cover",
  装: "dress; equip",
  裏: "back; reverse",
  補: "supplement",
  製: "manufacture",
  複: "duplicate",
  要: "need",
  見: "see",
  規: "rule",
  視: "look",
  覚: "memorize; awake",
  親: "parent",
  観: "view",
  解: "solve; untie",
  言: "say",
  計: "measure; plan",
  討: "discuss",
  訓: "instruction",
  記: "write down",
  訪: "visit",
  設: "establish",
  許: "permit",
  訳: "translate; reason",
  訴: "sue; appeal",
  詞: "part of speech",
  試: "try",
  詩: "poem",
  話: "talk",
  認: "recognize",
  誤: "mistake",
  説: "explain; theory",
  調: "investigate; tone",
  談: "talk",
  請: "request",
  論: "argument",
  諸: "various",
  識: "knowledge",
  警: "warn",
  議: "deliberate",
  象: "phenomenon; elephant",
  負: "lose; bear",
  財: "wealth",
  貧: "poor",
  貨: "currency",
  責: "responsibility",
  費: "expense",
  資: "resources",
  賛: "approve",
  質: "quality",
  輸: "transport",
  辞: "resign; word",
  農: "farming",
  辺: "vicinity",
  込: "crowded",
  迎: "welcome",
  近: "near",
  返: "return",
  追: "chase",
  退: "retreat",
  送: "send",
  逃: "escape",
  逆: "reverse",
  造: "make",
  連: "connect",
  週: "week",
  進: "advance",
  遅: "late",
  遊: "play",
  運: "carry; luck",
  過: "pass; exceed",
  道: "road",
  達: "reach; plural",
  違: "differ",
  遠: "far",
  適: "suitable",
  選: "choose",
  遺: "leave behind",
  郡: "county",
  部: "part; section",
  郵: "mail",
  郷: "hometown",
  都: "capital",
  配: "distribute",
  酒: "alcohol",
  酸: "acid",
  酵: "ferment",
  酷: "harsh",
  重: "heavy",
  野: "field",
  量: "quantity",
  金: "gold; money",
  針: "needle",
  釣: "fish",
  鉄: "iron",
  鉱: "ore",
  銀: "silver",
  銅: "copper",
  録: "record",
  鏡: "mirror",
  長: "long; chief",
  門: "gate",
  閉: "close",
  開: "open",
  間: "interval; between",
  関: "connection",
  防: "prevent",
  降: "descend",
  限: "limit",
  除: "remove",
  院: "institution",
  陳: "display",
  険: "steep; danger",
  陽: "yang; sun",
  階: "floor; rank",
  際: "occasion",
  雑: "miscellaneous",
  難: "difficult",
  雪: "snow",
  雲: "cloud",
  零: "zero",
  震: "quake",
  青: "blue",
  静: "quiet",
  面: "face; mask",
  順: "order",
  預: "deposit",
  領: "territory",
  頭: "head",
  題: "topic",
  額: "amount; forehead",
  風: "wind; style",
  飛: "fly",
  食: "eat; food",
  飯: "meal",
  飲: "drink",
  飼: "raise animals",
  館: "building",
  首: "neck; head",
  馬: "horse",
  駅: "station",
  験: "test",
  骨: "bone",
  高: "tall; expensive",
  髪: "hair",
  鬼: "demon",
  魚: "fish",
  鳥: "bird",
  鳴: "cry; sound",
  麦: "wheat",
  黄: "yellow",
  黒: "black",
  鼻: "nose",
  齢: "age",
};

function pickPrimary(picked, level) {
  const pool = picked.filter((p) => p.anchor);
  const list = pool.length ? pool : picked;
  const score = (p) => {
    const base = p.anchor ? anchorRank(p.anchor, p.kana) : 9000;
    const kunBias = (level === "N5" || level === "N4") && p.type === "on" ? 4 : 0;
    return base + kunBias;
  };
  return [...list].sort((a, b) => score(a) - score(b) || b.count - a.count)[0]?.kana ?? "";
}

const DEMOTE = {
  行: ["あん", "ゆく", "おこなう"],
  食: ["くう", "くらう", "はむ", "じき"],
  万: ["よろず"],
  校: ["きょう"],
  明: ["みん", "みょう"],
  生: ["なま", "しょう"],
  私: ["わたくし"],
};

function cleanMeaning(raw) {
  const parts = String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const kept = parts.filter((p) => !/^(archaic|obsolete|old name|rare|var\.|variant|exam)$/i.test(p));
  return (kept[0] || parts[0] || "kanji").replace(/\s+/g, " ");
}

function candidatesFor(entry) {
  const list = [];
  for (const on of entry.on ?? []) {
    const kana = kataToHira(on);
    if (!kana) continue;
    for (const surface of surfaces(kana)) {
      list.push({ type: "on", kana, surface, stem: surface, okuri: "", kunDisplay: "" });
    }
  }
  for (const kun of entry.kun ?? []) {
    if (kun.startsWith("-")) continue;
    const [stemRaw, okuri = ""] = kun.split(".");
    const stem = stemRaw.replace(/-/g, "");
    if (!stem) continue;
    const kana = (stem + okuri).replace(/-/g, "");
    list.push({ type: "kun", kana, surface: stem, stem, okuri, kunDisplay: kun.replace(/-/g, "") });
    const voiced = voice(stem);
    if (voiced) list.push({ type: "kun", kana, surface: voiced, stem: voiced, okuri, kunDisplay: kun.replace(/-/g, "") });
  }
  return list;
}

function align(dictStr, reading, iDict, iRead, choices) {
  if (iDict === dictStr.length) return iRead === reading.length ? [] : null;
  const ch = dictStr[iDict];
  if (!isKanji(ch)) {
    if (reading[iRead] !== ch) return null;
    return align(dictStr, reading, iDict + 1, iRead + 1, choices);
  }
  const cands = choices.get(ch);
  if (!cands) return null;
  const ranked = [...cands].sort((a, b) => b.surface.length - a.surface.length);
  for (const cand of ranked) {
    if (cand.okuri) {
      if (!dictStr.startsWith(cand.okuri, iDict + 1)) continue;
      const chunk = cand.stem + cand.okuri;
      if (!reading.startsWith(chunk, iRead)) continue;
      const rest = align(dictStr, reading, iDict + 1 + cand.okuri.length, iRead + chunk.length, choices);
      if (rest) return [{ ...cand, char: ch }, ...rest];
    } else if (reading.startsWith(cand.surface, iRead)) {
      const rest = align(dictStr, reading, iDict + 1, iRead + cand.surface.length, choices);
      if (rest) return [{ ...cand, char: ch }, ...rest];
    }
  }
  return null;
}

function jlptRank(level) {
  return { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 }[level] ?? 9;
}

function anchorRank(anchor, kana) {
  const level = anchor ? jlptRank(anchor.level) : 9;
  const len = anchor?.len ?? 99;
  const voiced = anchor && anchor.surface !== kana ? 1 : 0;
  return level * 100 + len * 2 + voiced * 3;
}

function draftKanji(words) {
  const levels = {};
  for (const n of [5, 4, 3, 2, 1]) {
    const text = readFileSync(resolve(root, `scripts/jlpt-kanji/n${n}.txt`), "utf8");
    for (const ch of text.trim().split("\n")) if (ch) levels[ch] = `N${n}`;
  }
  const file = baseKanji.kanji;
  if (!file["千"]) {
    file["千"] = {
      radicals: ["ノ", "十"],
      on: ["セン"],
      kun: ["ち"],
      meaning: "thousand",
      jlpt: "N5",
      grade: 1,
    };
  }
  const choices = new Map();
  for (const [ch, entry] of Object.entries(file)) choices.set(ch, candidatesFor(entry));

  const hits = new Map();
  for (const w of words) {
    if (!w.dictionary || SKIP_ALIGN.has(w.dictionary) || SKIP_ALIGN.has(w.kanjiForm)) continue;
    if (![...w.dictionary].some(isKanji)) continue;
    const aligned = align(w.dictionary, w.reading, 0, 0, choices);
    if (!aligned) continue;
    for (const part of aligned) {
      const key = `${part.char}\0${part.kana}`;
      let bag = hits.get(key);
      if (!bag) {
        bag = { count: 0, anchor: null, type: part.type, kunDisplay: part.kunDisplay, kana: part.kana };
        hits.set(key, bag);
      }
      const weight = w.jlptLevel === "N5" ? 3 : w.jlptLevel === "N4" ? 2 : w.jlptLevel === "N3" ? 1 : 1;
      bag.count += weight;
      const anchor = {
        word: w.dictionary,
        reading: w.reading,
        level: w.jlptLevel,
        len: [...w.dictionary].length,
        surface: part.surface,
      };
      if (!bag.anchor || anchorRank(anchor, bag.kana) < anchorRank(bag.anchor, bag.kana)) bag.anchor = anchor;
    }
  }

  const out = {};
  const hand = { ...N5_KANJI, ...EXTRA_KANJI };
  for (const [ch, level] of Object.entries(levels)) {
    if (level !== "N5" && level !== "N4" && level !== "N3") continue;
    if (hand[ch]) {
      out[ch] = { ...hand[ch], jlpt: level, source: level === "N5" || EXTRA_KANJI[ch] ? "hand" : "hand" };
      continue;
    }
    const entry = file[ch];
    const demoted = new Set(DEMOTE[ch] ?? []);
    const found = [];
    for (const [key, bag] of hits) {
      const [char, kana] = key.split("\0");
      if (char !== ch || demoted.has(kana) || bag.count <= 0 || !bag.anchor) continue;
      found.push(bag);
    }
    found.sort((a, b) => b.count - a.count || a.kana.localeCompare(b.kana));
    const picked = [];
    const seenType = new Set();
    for (const bag of found) {
      if (picked.some((p) => p.kana === bag.kana)) continue;
      if (picked.length >= 3) break;
      if (picked.length === 2 && !seenType.has(bag.type) && picked.every((p) => p.type !== bag.type)) {
        picked.push(bag);
        break;
      }
      picked.push(bag);
      seenType.add(bag.type);
    }
    let flag = "";
    if (picked.length === 0 && entry) {
      const on = (entry.on ?? []).map(kataToHira).filter((k) => k && !demoted.has(k));
      const kun = (entry.kun ?? [])
        .filter((k) => !k.startsWith("-"))
        .map((k) => ({ display: k, kana: k.replace(/\./g, "").replace(/-/g, "") }))
        .filter((k) => k.kana && !demoted.has(k.kana));
      const first = on[0] ? { type: "on", kana: on[0], kunDisplay: "" } : kun[0] ? { type: "kun", kana: kun[0].kana, kunDisplay: kun[0].display } : null;
      if (first) picked.push({ ...first, anchor: null, count: 0 });
      flag = "no anchor word in the curated list; reading is the common citation form";
    }
    const meaning = MEANING_FIX[ch] ?? cleanMeaning(entry?.meaning);
    if (/exam/i.test(entry?.meaning ?? "") && !MEANING_FIX[ch] && meaning !== "example") {
      flag = [flag, "meaning rewritten away from a misleading gloss"].filter(Boolean).join("; ");
    }
    const primary = pickPrimary(picked, level);
    picked.sort((a, b) => (a.kana === primary ? -1 : 0) - (b.kana === primary ? -1 : 0) || b.count - a.count);
    out[ch] = {
      meaning,
      primary,
      jlpt: level,
      source: "aligned",
      flag,
      demoted: [...demoted],
      readings: picked.map((p) => ({
        type: p.type,
        kana: p.kana,
        anchor: p.anchor?.word ?? "",
        anchorReading: p.anchor?.reading ?? "",
        kunDisplay: p.kunDisplay || "",
        surface: p.anchor?.surface || p.kana,
      })),
      sentences: [],
    };
  }
  const PATCH = {
    顔: {
      meaning: "face",
      primary: "かお",
      jlpt: "N3",
      source: "hand",
      flag: "笑顔 is えがお, so the word 顔（かお）is the anchor. がん is 顔面.",
      demoted: [],
      readings: [
        { type: "kun", kana: "かお", anchor: "顔", anchorReading: "かお", kunDisplay: "かお" },
        { type: "on", kana: "がん", anchor: "顔面", anchorReading: "がんめん" },
      ],
      sentences: [
        { ja: "顔を洗いました。", en: "I washed my face.", reading: "かお", flag: "" },
        { ja: "笑顔がすてきです。", en: "That's a lovely smile.", reading: "がお", flag: "笑顔 is えがお; 顔 here is voiced がお." },
      ],
    },
    昨: {
      meaning: "previous",
      primary: "さく",
      jlpt: "N3",
      source: "hand",
      flag: "昨日 is きのう, a special reading. Teach さく with 昨年.",
      demoted: [],
      readings: [{ type: "on", kana: "さく", anchor: "昨年", anchorReading: "さくねん" }],
      sentences: [{ ja: "昨年、日本へ行きました。", en: "I went to Japan last year.", reading: "さく", flag: "" }],
    },
  };
  for (const [ch, info] of Object.entries(PATCH)) {
    out[ch] = { ...out[ch], ...info, jlpt: out[ch]?.jlpt ?? info.jlpt };
  }
  for (const ch of Object.keys(N5_KANJI)) {
    if (!out[ch]) throw new Error(`N5 kanji missing from study set: ${ch}`);
  }
  return { study: out, radicals: file };
}

const TO_I = { う: "い", く: "き", ぐ: "ぎ", す: "し", つ: "ち", ぬ: "に", ぶ: "び", む: "み", る: "り" };
const IRREG_PAST = {
  eat: "ate", go: "went", come: "came", see: "saw", do: "did", make: "made", take: "took",
  write: "wrote", speak: "spoke", buy: "bought", drink: "drank", meet: "met", leave: "left",
  read: "read", run: "ran", get: "got", give: "gave", sit: "sat", stand: "stood", sleep: "slept",
  sing: "sang", swim: "swam", cut: "cut", put: "put", hear: "heard",
};

function glossOf(meaning) {
  return String(meaning ?? "")
    .split(";")[0]
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/^to\s+/i, "")
    .trim();
}
function masu(entry, past) {
  const d = entry.dictionary;
  let stem = "";
  if (entry.verbClass === "irregular-suru") stem = (d.endsWith("する") ? d.slice(0, -2) : d) + "し";
  else if (entry.verbClass === "irregular-kuru") stem = "来";
  else if (entry.verbClass === "ichidan") stem = d.slice(0, -1);
  else if (String(entry.verbClass).startsWith("godan")) {
    const next = TO_I[d[d.length - 1]];
    if (!next) return null;
    stem = d.slice(0, -1) + next;
  } else return null;
  return past ? `${stem}ました` : `${stem}ます`;
}
function englishPast(gloss) {
  if (!gloss || gloss.includes(" ")) return { text: gloss, rough: true };
  const past = IRREG_PAST[gloss];
  if (past) return { text: past, rough: false };
  if (gloss.endsWith("e")) return { text: gloss + "d", rough: false };
  if (/[^aeiou]y$/.test(gloss)) return { text: gloss.slice(0, -1) + "ied", rough: true };
  return { text: gloss + "ed", rough: true };
}
function allowed(sentence) {
  if (!sentence?.ja || BANNED_JA.has(sentence.ja)) return false;
  return !BANNED_SUBSTRINGS.some((s) => sentence.ja.includes(s) || String(sentence.en ?? "").includes(s));
}

const OPEN_VERBS = {
  "開く|あく": [
    { ja: "ドアが開きました。", en: "The door opened." },
    { ja: "窓が開いています。", en: "The window is open." },
  ],
  "開く|ひらく": [
    { ja: "本を開いてください。", en: "Please open the book." },
    { ja: "駅前に店を開きました。", en: "They opened a shop in front of the station." },
  ],
  "知る|しる": [
    { ja: "その人を知っています。", en: "I know that person." },
    { ja: "名前を知っていますか。", en: "Do you know their name?" },
  ],
};

function draftVerbSentences(words) {
  const byKey = {};
  for (const w of words) {
    if (w.wordType !== "verb") continue;
    if (!["N5", "N4", "N3"].includes(w.jlptLevel)) continue;
    const key = `${w.dictionary}|${w.reading}`;
    let list = OPEN_VERBS[key] ?? REPLACEMENTS[key] ?? null;
    let flag = list ? "" : "draft";
    if (!list) {
      const polite = masu(w, false);
      const did = masu(w, true);
      const gloss = glossOf(w.meaning);
      if (!polite || !gloss) continue;
      const past = englishPast(gloss);
      list = [
        { ja: `今日は${polite}。`, en: `I will ${gloss} today.` },
        { ja: `昨日${did}。`, en: past.rough ? `Yesterday I had to ${gloss}.` : `I ${past.text} yesterday.` },
      ];
      if (past.rough) flag = "draft; check the English";
    }
    const clean = list.filter(allowed).slice(0, 2).map((s) => ({
      ja: s.ja,
      en: s.en,
      reading: w.reading,
      flag,
    }));
    if (clean.length) byKey[`${w.id}|${w.reading}`] = { id: w.id, dictionary: w.dictionary, reading: w.reading, level: w.jlptLevel, sentences: clean };
  }
  return byKey;
}

function draftKanjiSentences(study, verbSentences) {
  const verbByDict = new Map();
  for (const row of Object.values(verbSentences)) {
    if (!verbByDict.has(row.dictionary)) verbByDict.set(row.dictionary, row.sentences);
  }
  const out = {};
  for (const [ch, info] of Object.entries(study)) {
    const hand = (info.sentences ?? []).filter(allowed).map((s) => ({ ...s, flag: s.flag || "" }));
    const made = [];
    if (hand.length) {
      made.push(...hand);
    } else if (KANJI_REPLACEMENTS[ch]) {
      made.push(...KANJI_REPLACEMENTS[ch].map((s) => ({ ...s, reading: info.primary, flag: "" })));
    } else {
      for (const reading of info.readings ?? []) {
        if (!reading.anchor || made.length >= 2) continue;
        const verb = verbByDict.get(reading.anchor);
        if (verb) {
          const hit = verb.find((s) => s.ja.includes(reading.anchor[0]));
          if (hit) {
            made.push({ ja: hit.ja, en: hit.en, reading: reading.kana, flag: hit.flag || "uses the anchor verb" });
            continue;
          }
        }
        const shown = reading.surface && reading.surface !== reading.kana ? reading.surface : reading.kana;
        const voiced = shown !== reading.kana ? `draft; ${reading.kana} is voiced as ${shown} in ${reading.anchor}` : "";
        made.push({
          ja: `これは${reading.anchor}です。`,
          en: `This is ${info.meaning}.`,
          reading: shown,
          flag: voiced || (info.flag ? "draft; " + info.flag : "draft"),
        });
      }
    }
    const unique = [];
    const seen = new Set();
    for (const s of made) {
      if (seen.has(s.ja) || !allowed(s)) continue;
      seen.add(s.ja);
      unique.push(s);
      if (unique.length >= 2) break;
    }
    if (unique.length) out[ch] = unique;
  }
  return out;
}

function writeReview(words, study, verbSentences, kanjiSentences) {
  const dir = resolve(root, "review/phase3");
  mkdirSync(dir, { recursive: true });
  const cell = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  const needsTeacher = (flag) => !!flag && flag !== "uses the anchor verb" && !String(flag).startsWith("draft");
  const flaggedWords = words.filter((w) => needsTeacher(w.flag));
  const wordTable = (rows) =>
    ["| level | word | reading | type | gloss | flag |", "| --- | --- | --- | --- | --- | --- |", ...rows.map((w) => `| ${cell(w.jlptLevel)} | ${cell(w.dictionary)} | ${cell(w.reading)} | ${cell(w.wordType)} | ${cell(w.meaning)} | ${cell(w.flag)} |`)].join("\n");
  writeFileSync(
    resolve(dir, "words.md"),
    `# Phase 3 words\n\nN5–N3 curated list. N2–N1 stay on the JMdict build and are not in this table.\n\n## Check these first\n\n${flaggedWords.length ? wordTable(flaggedWords) : "_No flagged rows._"}\n\n## Full list (${words.length})\n\n${wordTable(words)}\n`,
  );

  const kanjiRows = Object.entries(study).sort((a, b) => jlptRank(a[1].jlpt) - jlptRank(b[1].jlpt) || a[0].localeCompare(b[0]));
  const kanjiLine = ([ch, info]) => {
    const readings = (info.readings ?? [])
      .map((r) => {
      const voiced = r.surface && r.surface !== r.kana && !String(r.kana).startsWith(r.surface);
      return `${r.kana} ${r.type}${r.anchor ? ` · ${r.anchor}（${r.anchorReading}${voiced ? `、ここでは${r.surface}` : ""}）` : ""}`;
    })
      .join("<br>");
    return `| ${cell(info.jlpt)} | ${ch} | ${cell(info.meaning)} | ${cell(info.primary)} | ${readings} | ${cell((info.demoted ?? []).join("、"))} | ${cell(info.flag)} |`;
  };
  const kanjiHead = "| level | kanji | meaning | quiz reading | readings and anchors | demoted | flag |\n| --- | --- | --- | --- | --- | --- | --- |";
  const flaggedKanji = kanjiRows.filter(([, info]) => needsTeacher(info.flag));
  writeFileSync(
    resolve(dir, "kanji.md"),
    `# Phase 3 kanji\n\n## Check these first\n\n${flaggedKanji.length ? `${kanjiHead}\n${flaggedKanji.map(kanjiLine).join("\n")}` : "_No flagged rows._"}\n\n## Full list (${kanjiRows.length})\n\n${kanjiHead}\n${kanjiRows.map(kanjiLine).join("\n")}\n`,
  );

  const sentenceRows = [];
  for (const row of Object.values(verbSentences)) {
    for (const s of row.sentences) {
      sentenceRows.push({ ja: s.ja, reading: s.reading, en: s.en, illustrates: `${row.level} verb ${row.dictionary}`, flag: s.flag });
    }
  }
  for (const [ch, list] of Object.entries(kanjiSentences)) {
    const level = study[ch]?.jlpt ?? "";
    for (const s of list) {
      sentenceRows.push({ ja: s.ja, reading: s.reading, en: s.en, illustrates: `${level} kanji ${ch}`, flag: s.flag });
    }
  }
  const sHead = "| sentence | reading | translation | illustrates | flag |\n| --- | --- | --- | --- | --- |";
  const sLine = (s) => `| ${cell(s.ja)} | ${cell(s.reading)} | ${cell(s.en)} | ${cell(s.illustrates)} | ${cell(s.flag)} |`;
  const flaggedS = sentenceRows.filter((s) => needsTeacher(s.flag));
  writeFileSync(
    resolve(dir, "sentences.md"),
    `# Phase 3 example sentences\n\nOne or two lines for each N5–N3 verb and kanji. A sentence is tied to the reading in the next column.\n\n## Check these first\n\n${flaggedS.length ? `${sHead}\n${flaggedS.map(sLine).join("\n")}` : "_No flagged rows._"}\n\n## Full list (${sentenceRows.length})\n\n${sHead}\n${sentenceRows.map(sLine).join("\n")}\n`,
  );

  const furigana = JSON.parse(readFileSync(resolve(root, "src/lib/__tests__/furigana-golden.json"), "utf8"));
  writeFileSync(
    resolve(dir, "furigana.md"),
    `# Diary furigana\n\nKuromoji tokenises the sentence. A short learner list overrides IPAdic where this course teaches a different reading.\n\n| input | ruby on the kanji | note |\n| --- | --- | --- |\n${furigana.map((r) => `| ${cell(r.input)} | ${cell(r.ruby)} | ${cell(r.note)} |`).join("\n")}\n`,
  );

  const counts = { N5: 0, N4: 0, N3: 0 };
  const types = {};
  for (const w of words) {
    counts[w.jlptLevel] = (counts[w.jlptLevel] ?? 0) + 1;
    types[w.wordType] = (types[w.wordType] ?? 0) + 1;
  }
  const kCounts = { N5: 0, N4: 0, N3: 0 };
  for (const info of Object.values(study)) kCounts[info.jlpt] = (kCounts[info.jlpt] ?? 0) + 1;
  writeFileSync(
    resolve(dir, "README.md"),
    `# Phase 3 review\n\nA native teacher can start with the "Check these first" section of each file.\n\n| file | what to check |\n| --- | --- |\n| [words.md](words.md) | level, kana spelling, English gloss |\n| [kanji.md](kanji.md) | meaning, quiz reading, anchor word for each on/kun, demoted readings |\n| [sentences.md](sentences.md) | the Japanese, the reading it is tied to, the translation |\n| [furigana.md](furigana.md) | diary readings that used to come out wrong |\n\n## Counts\n\n- Words: ${words.length} (N5 ${counts.N5}, N4 ${counts.N4}, N3 ${counts.N3}). By type: ${Object.entries(types).map(([k, v]) => `${k} ${v}`).join(", ")}.\n- Kanji: ${kanjiRows.length} (N5 ${kCounts.N5}, N4 ${kCounts.N4}, N3 ${kCounts.N3}).\n- Sentences: ${sentenceRows.length} (${Object.keys(verbSentences).length} verbs, ${Object.keys(kanjiSentences).length} kanji).\n- Flagged for a second look: ${flaggedWords.length} words, ${flaggedKanji.length} kanji, ${flaggedS.length} sentences.\n\n## Open questions\n\n- 私 is taught as わたし. わたくし is the formal reading and the one in the old JLPT list.\n- 日本 in the diary is にほん, not IPAdic's にっぽん. Both are used; N5 textbooks use にほん.\n- 一人 / 二人 are ひとり / ふたり. IPAdic splits them as いちにん / ににん.\n- 明日 is あした. あす is also correct and more written.\n- 十（とお） versus じゅう: the quiz answer is じゅう. The sentence 卵を十買いました can also be read じゅう.
- 年（とし）is not 今年（ことし）. The sentence is 年に一度.
- 顔（かお）was missing from the word list, so the anchor is the character itself. 笑顔 is えがお.\n- 南口 is みなみぐち, so なん is anchored on 南米. Is 南米 the anchor you want?\n- 家: the quiz answer is いえ, and うち is also listed. Which one should a multiple-choice item accept?\n- 出（しゅつ） is demoted on the N5 card because 出口 is でぐち. Should 出発 be added as the on anchor?\n- N3 was cut to keep the list near 1,200. Words left out are the rarer JMdict rows, including 食う (teach 食べる) and most （する）noun glosses.\n- Sentences marked \`draft\` were generated from the gloss. The Japanese masu form is mechanical; the English tense needs a pass.\n- 明日・今日・大人 are special readings and are not split into on/kun anchors.\n`,
  );
  return { words: words.length, kanji: kanjiRows.length, sentences: sentenceRows.length, flaggedWords: flaggedWords.length, flaggedKanji: flaggedKanji.length, flaggedS: flaggedS.length, counts, kCounts };
}

function stripRuntime(entry) {
  const { flag, ...rest } = entry;
  return rest;
}

function applyAll(words, study, radicals, verbSentences, kanjiSentences) {
  const order = { N5: 0, N4: 1, N3: 2, N2: 3, N1: 4 };
  const higher = baseWords.entries.filter((e) => e.jlptLevel === "N2" || e.jlptLevel === "N1");
  const entries = [...words.map(stripRuntime), ...higher].sort(
    (a, b) =>
      order[a.jlptLevel] - order[b.jlptLevel] ||
      a.wordType.localeCompare(b.wordType) ||
      a.reading.localeCompare(b.reading) ||
      a.dictionary.localeCompare(b.dictionary),
  );
  writeFileSync(
    resolve(root, "src/data/words.json"),
    JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), entries }),
  );

  for (const [ch, info] of Object.entries(study)) {
    const entry = radicals[ch];
    if (!entry) continue;
    entry.meaning = info.meaning;
    const on = (info.readings ?? []).filter((r) => r.type === "on").map((r) => hiraToKata(r.kana));
    const kun = (info.readings ?? []).filter((r) => r.type === "kun").map((r) => r.kunDisplay || r.kana);
    entry.on = on;
    entry.kun = kun;
  }
  writeFileSync(resolve(root, "src/data/kanji-radicals.json"), JSON.stringify({ ...baseKanji, kanji: radicals, generatedAt: new Date().toISOString() }));

  const studyOut = { version: 1, kanji: {} };
  for (const [ch, info] of Object.entries(study)) {
    studyOut.kanji[ch] = {
      meaning: info.meaning,
      primary: info.primary,
      readings: (info.readings ?? []).map((r) => ({
        type: r.type,
        kana: r.kana,
        anchor: r.anchor || undefined,
        anchorReading: r.anchorReading || undefined,
      })),
    };
  }
  writeFileSync(resolve(root, "src/data/kanji-study.json"), JSON.stringify(studyOut));

  const byVerbId = { ...baseExamples.byVerbId };
  for (const row of Object.values(verbSentences)) {
    byVerbId[`${row.id}|${row.reading}`] = row.sentences.map((s) => ({ ja: s.ja, en: s.en }));
    delete byVerbId[row.id];
  }
  const byKanji = { ...baseExamples.byKanji };
  for (const [ch, list] of Object.entries(kanjiSentences)) {
    byKanji[ch] = list.map((s) => ({ ja: s.ja, en: s.en }));
  }
  writeFileSync(
    resolve(root, "src/data/examples.json"),
    JSON.stringify({ version: 3, generatedAt: new Date().toISOString(), key: "id|reading", byVerbId, byKanji }),
  );

  const curatedDir = resolve(root, "scripts/curated");
  mkdirSync(curatedDir, { recursive: true });
  writeFileSync(resolve(curatedDir, "n5-n3-words.json"), JSON.stringify({ version: 1, source: "phase3 curated; N2–N1 are not in this file", words }, null, 2));
  writeFileSync(resolve(curatedDir, "n5-n3-kanji.json"), JSON.stringify({ version: 1, kanji: study }, null, 2));
  writeFileSync(
    resolve(curatedDir, "sentences.json"),
    JSON.stringify({ version: 1, verbs: verbSentences, kanji: kanjiSentences }, null, 2),
  );
}

const words = draftWords();
const { study, radicals } = draftKanji(baseWords.entries);
const verbSentences = draftVerbSentences(words);
const kanjiSentences = draftKanjiSentences(study, verbSentences);
applyAll(words, study, radicals, verbSentences, kanjiSentences);
const stats = writeReview(words, study, verbSentences, kanjiSentences);
console.log(JSON.stringify(stats, null, 2));
const badVerbs = words.filter((w) => w.wordType === "verb" && !/^to /.test(w.meaning) && !/^\([^)]*\) to /.test(w.meaning));
console.log("verbs missing to-gloss", badVerbs.length);
console.log(badVerbs.slice(0, 20).map((w) => `${w.jlptLevel} ${w.dictionary} ${w.meaning}`).join("\n"));
