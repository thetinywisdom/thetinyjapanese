/**
 * Rule-based Japanese verb conjugation.
 * Operates on the kana reading of the dictionary form. No AI, no external lookups.
 *
 * Verb classes accepted:
 *   "ichidan"
 *   "godan-u" | "godan-k" | "godan-g" | "godan-s" | "godan-t"
 *   "godan-n" | "godan-b" | "godan-m" | "godan-r"
 *   "godan-iku"           (the 行く exception)
 *   "irregular-suru"      (compounds ending in する; also bare する)
 *   "irregular-kuru"      (来る / くる)
 */

import { normalize, katakanaToHiragana } from "./kana";

export type WordType = "verb" | "adj-i" | "adj-na" | "noun" | "adverb";

export type QuestionType =
  | "non-past-affirmative"
  | "non-past-negative"
  | "past-affirmative"
  | "past-negative"
  | "te-form"
  | "potential"
  | "volitional"
  | "imperative"
  | "conditional-tara"
  | "provisional-eba"
  | "passive"
  | "causative"
  | "causative-passive";

export const ALL_QUESTION_TYPES: QuestionType[] = [
  "non-past-affirmative",
  "non-past-negative",
  "past-affirmative",
  "past-negative",
  "te-form",
  "potential",
  "volitional",
  "imperative",
  "conditional-tara",
  "provisional-eba",
  "passive",
  "causative",
  "causative-passive",
];

/** Question types whose prompt is the polite (-masu / -desu) form. */
const POLITE_PROMPT_QS = new Set<QuestionType>([
  "non-past-affirmative",
  "non-past-negative",
  "past-affirmative",
  "past-negative",
]);

export function promptIsPolite(q: QuestionType): boolean {
  return POLITE_PROMPT_QS.has(q);
}

const COPULA_QUESTIONS: QuestionType[] = [
  "non-past-affirmative", "non-past-negative",
  "past-affirmative", "past-negative",
  "te-form", "conditional-tara", "provisional-eba",
];

/**
 * Forms that do not exist for non-volitional verbs.
 * Passive and causative are included: あられる / あらせる are not modern ある.
 * A short allow-list (分かる, 困る, 降る, 曇る, 疲れる) keeps the causative.
 */
const FULL_SKIP: QuestionType[] = [
  "potential", "imperative", "volitional", "passive", "causative", "causative-passive",
];
/** Same gap, but 分からせる / 困らせる / 降らせる / 曇らせる / 疲れさせる are real. */
const KEEP_CAUSATIVE_SKIP: QuestionType[] = [
  "potential", "imperative", "volitional", "passive", "causative-passive",
];
/** くれる has no potential, passive, or causative. くれ and くれよう stay. */
const KURERU_SKIP: QuestionType[] = ["potential", "passive", "causative", "causative-passive"];
/** Humble / honorific verbs are not drilled as commands, passives, or "can do". 申そう stays. */
const KEIGO_SKIP: QuestionType[] = [
  "potential", "imperative", "passive", "causative", "causative-passive",
];
/** 終わる / 慣れる have no passive. The other forms stay. */
const PASSIVE_ONLY_SKIP: QuestionType[] = ["passive"];
/** 咲く: さける reads as 避ける / 裂ける. 咲かせる and 咲け stay. */
const BLOOM_SKIP: QuestionType[] = ["potential", "passive", "causative-passive"];
/** 消える: the causative idea is 消す. 消えろ stays. */
const VANISH_SKIP: QuestionType[] = ["passive", "causative", "causative-passive"];
/** 続く / 治る / 直る. つづけ and 治れ stay; つづける is 続ける. */
const KEEP_IMPERATIVE_SKIP: QuestionType[] = [
  "potential", "volitional", "passive", "causative", "causative-passive",
];
/** 光る: ひかれる reads as 引かれる. 光らせる stays. */
const HIKARU_SKIP: QuestionType[] = ["potential", "passive", "causative-passive"];
/** なる / 召し上がる: なられる is honorific, めしあがられる is a double honorific. */
const VOICE_SKIP: QuestionType[] = ["passive", "causative", "causative-passive"];
/** 落ちる: おちられる is not used. 落ちろ stays. */
const POTENTIAL_ONLY_SKIP: QuestionType[] = ["potential"];
/** 間に合う keeps 間に合える, 間に合え, and 間に合わせる. */
const MANIAU_SKIP: QuestionType[] = ["passive", "causative-passive"];
/**
 * 頂く / 伺う / 拝見する / 差し上げる keep the potential
 * (いただける, うかがえる, 拝見できる, 差し上げられる). Commands and voice stay skipped.
 */
const KEIGO_KEEP_POTENTIAL_SKIP: QuestionType[] = [
  "imperative", "passive", "causative", "causative-passive",
];

/**
 * Intransitive / stative verbs whose potential or causative is either nonexistent
 * or a different verb (開く→あける, 付く→つける, 違う→ちがえる, …).
 * Match the dictionary spelling, not a short reading: なる is 成る, 鳴る is the one to skip.
 * 開く is handled separately so ひらく keeps ひらける.
 */
const FULL_SKIP_DICTS = new Set([
  "ある", "有る", "できる", "出来る", "要る", "見える", "聞こえる", "似る", "異なる",
  "晴れる", "降り出す", "違う", "生まれる", "閉まる", "始まる",
  "壊れる", "割れる", "折れる", "倒れる", "足りる", "増える", "減る", "冷える", "焼ける",
  "汚れる", "過ぎる", "見つかる", "決まる", "起こる", "届く", "似合う",
  "鳴る", "沸く", "止む", "付く", "痛む", "空く", "込む", "混む",
  "存在する", "意味する", "広々とする", "丸々とする", "びっくりする",
  // Relational / stative single-kanji する. 関せる and 関せよ are not used.
  "関する", "対する", "属する", "反する", "面する", "有する", "要する", "即する", "適する", "化する",
  // N5 time-sense かかる, and N4 statives. Match the dictionary, not the reading:
  // かかる is not 罹る, 暮れる is not くれる, 続く is not 続ける.
  "かかる", "暮れる", "乾く", "揺れる", "亡くなる", "無くなる", "関係する", "すっとする",
  // N3 intransitives whose potential is another verb or does not exist.
  "育つ", "沈む", "経つ", "欠ける", "苦しむ", "売れる", "腐る", "凍る", "燃える",
  "満ちる", "基づく", "優れる", "劣る", "罹る",
]);

const KEIGO_READINGS = new Set([
  "おいでになる", "ぞんじる", "うけたまわる", "たまわる", "たてまつる", "めす",
  "はいけんする", "もうす", "もうしあげる", "さしあげる", "まいる", "いたす",
  "いただく", "うかがう", "おそれいる",
]);
/** These four keep a real potential. The other humble verbs do not. */
const KEIGO_POTENTIAL_DICTS = new Set(["頂く", "いただく", "伺う", "拝見する", "差し上げる"]);
const KEIGO_POTENTIAL_READINGS = new Set(["いただく", "うかがう", "はいけんする", "さしあげる"]);
const KEIGO_DICTS = new Set([
  "お出でになる", "存じる", "承る", "賜る", "奉る", "召す",
  "拝見する", "申す", "申し上げる", "差し上げる", "参る", "致す",
  "頂く", "いただく", "伺う", "恐れ入る",
]);

function bareDictionary(verb: WordLike): string {
  const d = verb.dictionary ?? "";
  const i = d.indexOf("(");
  return i >= 0 ? d.slice(0, i) : d;
}

/** Verbs that may keep a causative (分からせる, 困らせる, 降らせる, 曇らせる, 疲れさせる). */
function keepsCausative(verb: WordLike): boolean {
  const d = bareDictionary(verb);
  const r = verb.reading;
  if (r === "わかる" || d === "分かる" || d === "判る" || d === "解る") return true;
  if (d === "困る" || r === "こまる") return true;
  if (d === "降る") return true;
  if (d === "曇る" || r === "くもる") return true;
  if (d === "疲れる") return true;
  // 済む / 合う keep 済ませる / 合わせる. 会う is a different dictionary.
  if (d === "済む" || d === "合う") return true;
  return false;
}

/**
 * No potential, imperative, volitional, passive, or causative.
 * 分かる / 困る / 降る / 曇る / 疲れる are non-volitional but keep the causative,
 * so they are reported by `isNonVolitional` and not by this predicate.
 */
function isFullySkipped(verb: WordLike): boolean {
  const d = bareDictionary(verb);
  const r = verb.reading;
  if (d === "出切る") return false;
  if (d === "開く") return r === "あく";
  if (FULL_SKIP_DICTS.has(d)) return true;
  if (r === "みえる" || r === "きこえる" || r === "ある" || r === "ことなる") return true;
  if ((r === "できる" || d === "できる" || d === "出来る") && d !== "出切る") return true;
  return false;
}

/** 分かる, 見える, できる, 要る, ある, weather, and the other stative verbs. */
export function isNonVolitional(verb: WordLike): boolean {
  return isFullySkipped(verb) || keepsCausative(verb);
}

export function isKeigoVerb(verb: WordLike): boolean {
  const d = bareDictionary(verb);
  return KEIGO_READINGS.has(verb.reading) || KEIGO_DICTS.has(d);
}

/** Question types that must not be generated or graded for this word. */
export function skippedQuestions(verb: WordLike): QuestionType[] {
  if ((verb.wordType ?? "verb") !== "verb") return [];
  // くれる before the stative lists. 暮れる is not v1-s; it is fully skipped below.
  if (isKureru(verb)) return [...KURERU_SKIP];
  if (keepsCausative(verb)) return [...KEEP_CAUSATIVE_SKIP];
  if (isFullySkipped(verb)) return [...FULL_SKIP];
  const d = bareDictionary(verb);
  if (d === "続く" || d === "治る" || d === "直る") return [...KEEP_IMPERATIVE_SKIP];
  if (d === "光る") return [...HIKARU_SKIP];
  if (d === "落ちる") return [...POTENTIAL_ONLY_SKIP];
  if (d === "咲く") return [...BLOOM_SKIP];
  if (d === "終わる" || d === "慣れる") return [...PASSIVE_ONLY_SKIP];
  if (d === "なる" || d === "召し上がる") return [...VOICE_SKIP];
  if (d === "間に合う") return [...MANIAU_SKIP];
  if (d === "消える") return [...VANISH_SKIP];
  if (KEIGO_POTENTIAL_DICTS.has(d) || KEIGO_POTENTIAL_READINGS.has(verb.reading)) {
    return [...KEIGO_KEEP_POTENTIAL_SKIP];
  }
  if (isKeigoVerb(verb)) return [...KEIGO_SKIP];
  return [];
}

/** 呉れる / くれる (v1-s). Not 暮れる, which has no potential, command, or causative. */
export function isKureru(verb: WordLike): boolean {
  if (verb.pos?.includes("v1-s")) return true;
  const d = bareDictionary(verb);
  if (d === "呉れる" || d === "くれる") return true;
  if (!verb.dictionary && verb.reading === "くれる") return true;
  return false;
}

/** Single-kanji する verbs (愛する, 関する, …). Not ordinary 〜する compounds. */
export function isVsS(verb: WordLike): boolean {
  return !!verb.pos?.includes("vs-s");
}

function finalize(verb: WordLike, forms: Forms): Forms {
  for (const q of skippedQuestions(verb)) {
    delete forms.casual[q];
    delete forms.polite[q];
  }
  return forms;
}

/** Which question types are meaningful for a given word type. */
export function supportedQuestions(wordType: WordType, verb?: WordLike): QuestionType[] {
  if (wordType === "adverb") return [];
  const base = wordType === "verb" ? [...ALL_QUESTION_TYPES] : [...COPULA_QUESTIONS];
  if (!verb) return base;
  const skip = new Set(skippedQuestions({ ...verb, wordType: verb.wordType ?? wordType }));
  return base.filter((q) => !skip.has(q));
}

export interface VerbLike {
  reading: string;
  verbClass: string;
  dictionary?: string;
  /** Optional — defaults to "verb" for backwards compatibility. */
  wordType?: WordType;
  /** JMdict part-of-speech tags. `vs-s` and `v1-s` select irregular subclasses. */
  pos?: string[];
}
export type WordLike = VerbLike;

function isKana(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return (c >= 0x3040 && c <= 0x309f) || (c >= 0x30a0 && c <= 0x30ff) || c === 0x30fc;
}

function splitOkurigana(dict: string): { prefix: string; tail: string } {
  let i = dict.length;
  while (i > 0 && isKana(dict[i - 1])) i--;
  return { prefix: dict.slice(0, i), tail: dict.slice(i) };
}

// ── godan stem helpers ──────────────────────────────────────────────────────
const I_ROW: Record<string, string> = {
  う: "い", く: "き", ぐ: "ぎ", す: "し", つ: "ち",
  ぬ: "に", ぶ: "び", む: "み", る: "り",
};
const A_ROW: Record<string, string> = {
  // う → わ (special)
  う: "わ", く: "か", ぐ: "が", す: "さ", つ: "た",
  ぬ: "な", ぶ: "ば", む: "ま", る: "ら",
};
const E_ROW: Record<string, string> = {
  う: "え", く: "け", ぐ: "げ", す: "せ", つ: "て",
  ぬ: "ね", ぶ: "べ", む: "め", る: "れ",
};
const O_ROW: Record<string, string> = {
  う: "お", く: "こ", ぐ: "ご", す: "そ", つ: "と",
  ぬ: "の", ぶ: "ぼ", む: "も", る: "ろ",
};

const GODAN_PAST_AFF: Record<string, string> = {
  う: "った", つ: "った", る: "った",
  く: "いた", ぐ: "いだ",
  す: "した",
  ぬ: "んだ", ぶ: "んだ", む: "んだ",
};

const GODAN_TE: Record<string, string> = {
  う: "って", つ: "って", る: "って",
  く: "いて", ぐ: "いで",
  す: "して",
  ぬ: "んで", ぶ: "んで", む: "んで",
};

function godanFinalKey(verbClass: string): string {
  const map: Record<string, string> = {
    "godan-u": "う", "godan-k": "く", "godan-g": "ぐ", "godan-s": "す",
    "godan-t": "つ", "godan-n": "ぬ", "godan-b": "ぶ", "godan-m": "む",
    "godan-r": "る", "godan-iku": "く",
  };
  return map[verbClass] ?? "";
}

// ── core: build forms ───────────────────────────────────────────────────────

interface Forms {
  /** Polite forms — only the 4 masu/desu-based questions are populated. */
  polite: Partial<Record<QuestionType, string>>;
  casual: Partial<Record<QuestionType, string>>;
}

/** Copula pattern shared by nouns and な-adjectives. `stem` is the noun/na-adj bare form. */
function copulaForms(stem: string): Forms {
  return {
    polite: {
      "non-past-affirmative": `${stem}です`,
      "non-past-negative": `${stem}ではありません`,
      "past-affirmative": `${stem}でした`,
      "past-negative": `${stem}ではありませんでした`,
    },
    casual: {
      "non-past-affirmative": `${stem}だ`,
      "non-past-negative": `${stem}じゃない`,
      "past-affirmative": `${stem}だった`,
      "past-negative": `${stem}じゃなかった`,
      "te-form": `${stem}で`,
      "conditional-tara": `${stem}だったら`,
      "provisional-eba": `${stem}なら`,
    },
  };
}

/** い-adjective conjugation. `r` is the reading, ends in い. */
function adjIForms(r: string, isYoi: boolean): Forms {
  // Handle irregular いい/よい: everything except the non-past-affirmative
  // uses the よ-stem.
  const stem = isYoi ? "よ" : r.slice(0, -1);
  const dictAff = isYoi ? "いい" : r;
  return {
    polite: {
      "non-past-affirmative": `${dictAff}です`,
      "non-past-negative": `${stem}くないです`,
      "past-affirmative": `${stem}かったです`,
      "past-negative": `${stem}くなかったです`,
    },
    casual: {
      "non-past-affirmative": dictAff,
      "non-past-negative": `${stem}くない`,
      "past-affirmative": `${stem}かった`,
      "past-negative": `${stem}くなかった`,
      "te-form": `${stem}くて`,
      "conditional-tara": `${stem}かったら`,
      "provisional-eba": `${stem}ければ`,
    },
  };
}

export function buildForms(verb: WordLike): Forms {
  const r = verb.reading;
  const cls = verb.verbClass;
  const wt: WordType = verb.wordType ?? "verb";

  // ── non-verb dispatch ──
  if (wt === "adj-i") return adjIForms(r, cls === "adj-i-yoi");
  if (wt === "adverb") return { polite: {}, casual: {} };
  if (wt === "adj-na" || wt === "noun") {
    // Never strip a trailing な. JMdict na-adjective readings do not include
    // the copula な, and nouns like 魚 (さかな) and 大人 (おとな) end in な
    // as part of the word itself.
    return copulaForms(r);
  }



  // ── irregular: する / 〜する ──
  if (cls === "irregular-suru") {
    const prefix = r.endsWith("する") ? r.slice(0, -2) : "";
    // vs-s (愛する): potential is せる, or することができる. Not せられる —
    // 愛せられる is the literary passive. あいできる is not Japanese.
    const vsS = isVsS(verb);
    // 達する / 接する / 罰する (促音 + する) take せられる for both the potential
    // and the usual passive (罰せられる). 愛する takes せる / される.
    // Ordinary 勉強する stays できる / される.
    const geminate = prefix.endsWith("っ");
    const potential = !vsS ? `${prefix}できる` : geminate ? `${prefix}せられる` : `${prefix}せる`;
    const passive = vsS && geminate ? `${prefix}せられる` : `${prefix}される`;
    return finalize(verb, {
      polite: {
        "non-past-affirmative": `${prefix}します`,
        "non-past-negative": `${prefix}しません`,
        "past-affirmative": `${prefix}しました`,
        "past-negative": `${prefix}しませんでした`,
      },
      casual: {
        "non-past-affirmative": `${prefix}する`,
        "non-past-negative": `${prefix}しない`,
        "past-affirmative": `${prefix}した`,
        "past-negative": `${prefix}しなかった`,
        "te-form": `${prefix}して`,
        "potential": potential,
        "volitional": `${prefix}しよう`,
        "imperative": vsS ? `${prefix}せよ` : `${prefix}しろ`,
        "conditional-tara": `${prefix}したら`,
        "provisional-eba": `${prefix}すれば`,
        "passive": passive,
        "causative": `${prefix}させる`,
        "causative-passive": `${prefix}させられる`,
      },
    });
  }

  // ── irregular: 来る ──
  if (cls === "irregular-kuru") {
    return finalize(verb, {
      polite: {
        "non-past-affirmative": "きます",
        "non-past-negative": "きません",
        "past-affirmative": "きました",
        "past-negative": "きませんでした",
      },
      casual: {
        "non-past-affirmative": "くる",
        "non-past-negative": "こない",
        "past-affirmative": "きた",
        "past-negative": "こなかった",
        "te-form": "きて",
        "potential": "こられる",
        "volitional": "こよう",
        "imperative": "こい",
        "conditional-tara": "きたら",
        "provisional-eba": "くれば",
        "passive": "こられる",
        "causative": "こさせる",
        "causative-passive": "こさせられる",
      },
    });
  }

  // ── ichidan ──
  if (cls === "ichidan") {
    if (!r.endsWith("る")) throw new Error(`Ichidan must end in る: ${r}`);
    const stem = r.slice(0, -1);
    // くれる (v1-s) commands with くれ, not くれろ. 暮れる stays regular.
    const imperative = isKureru(verb) ? "くれ" : `${stem}ろ`;
    return finalize(verb, {
      polite: {
        "non-past-affirmative": `${stem}ます`,
        "non-past-negative": `${stem}ません`,
        "past-affirmative": `${stem}ました`,
        "past-negative": `${stem}ませんでした`,
      },
      casual: {
        "non-past-affirmative": `${stem}る`,
        "non-past-negative": `${stem}ない`,
        "past-affirmative": `${stem}た`,
        "past-negative": `${stem}なかった`,
        "te-form": `${stem}て`,
        "potential": `${stem}られる`,
        "volitional": `${stem}よう`,
        "imperative": imperative,
        "conditional-tara": `${stem}たら`,
        "provisional-eba": `${stem}れば`,
        "passive": `${stem}られる`,
        "causative": `${stem}させる`,
        "causative-passive": `${stem}させられる`,
      },
    });
  }

  // ── godan ──
  if (cls.startsWith("godan-")) {
    const last = r.slice(-1);
    const stem = r.slice(0, -1);
    const key = godanFinalKey(cls);
    const usedKey = I_ROW[last] ? last : key;
    const iStem = stem + I_ROW[usedKey];
    const aStem = stem + A_ROW[usedKey];
    const eStem = stem + E_ROW[usedKey];
    const oStem = stem + O_ROW[usedKey];
    const isIku = cls === "godan-iku" || (last === "く" && r === "いく");
    const pastAff = isIku ? `${stem}った` : stem + (GODAN_PAST_AFF[usedKey] ?? "た");
    const teForm = isIku ? `${stem}って` : stem + (GODAN_TE[usedKey] ?? "て");
    // ある is the one godan verb whose negative is ない, not あらない.
    const isAru = r === "ある";
    return finalize(verb, {
      polite: {
        "non-past-affirmative": `${iStem}ます`,
        "non-past-negative": `${iStem}ません`,
        "past-affirmative": `${iStem}ました`,
        "past-negative": `${iStem}ませんでした`,
      },
      casual: {
        "non-past-affirmative": r,
        "non-past-negative": isAru ? "ない" : `${aStem}ない`,
        "past-affirmative": pastAff,
        "past-negative": isAru ? "なかった" : `${aStem}なかった`,
        "te-form": teForm,
        "potential": `${eStem}る`,
        "volitional": `${oStem}う`,
        "imperative": eStem,
        "conditional-tara": `${pastAff}ら`,
        "provisional-eba": `${eStem}ば`,
        "passive": `${aStem}れる`,
        "causative": `${aStem}せる`,
        "causative-passive": `${aStem}せられる`,
      },
    });
  }

  throw new Error(`Unsupported verb class: ${cls}`);
}

export function toPolite(verb: VerbLike, q: QuestionType): string | null {
  return buildForms(verb).polite[q] ?? null;
}
export function toCasual(verb: WordLike, q: QuestionType): string {
  const f = buildForms(verb).casual[q];
  if (f == null) throw new Error(`Form ${q} not supported for ${verb.wordType ?? "verb"}: ${verb.reading}`);
  return f;
}

/** Dictionary form (kana). Convenience for non-polite question prompts. */
export function dictionaryReading(verb: VerbLike): string {
  return verb.reading;
}

/** Swap the kana stem of one form for the dictionary's kanji stem. */
export function applyKanji(verb: VerbLike, kana: string): string | null {
  const dict = verb.dictionary;
  if (!dict || dict === verb.reading || !kana) return null;
  const { prefix: kanjiPrefix, tail: dictTail } = splitOkurigana(dict);
  if (!kanjiPrefix) return null;
  // 来る: the vowel changes (く/き/こ) but 来 stays put.
  if (verb.verbClass === "irregular-kuru") return kanjiPrefix + kana.slice(1);
  const reading = verb.reading;
  let kanaPrefixLen = reading.length - dictTail.length;
  if (kanaPrefixLen < 0 || reading.slice(kanaPrefixLen) !== dictTail) {
    kanaPrefixLen = Math.max(1, reading.length - 1);
  }
  const kanaPrefix = reading.slice(0, kanaPrefixLen);
  if (!kana.startsWith(kanaPrefix)) return null;
  return kanjiPrefix + kana.slice(kanaPrefix.length);
}

/**
 * Build kanji-form variants by replacing the kana stem prefix of each
 * generated form with the dictionary's kanji prefix.
 */
export function buildKanjiForms(verb: VerbLike): {
  polite: Partial<Record<QuestionType, string>>;
  casual: Partial<Record<QuestionType, string>>;
} | null {
  const kana = buildForms(verb);
  const mapPart = <T extends Partial<Record<QuestionType, string>>>(forms: T): T => {
    const out: Partial<Record<QuestionType, string>> = {};
    for (const [k, v] of Object.entries(forms)) {
      if (typeof v !== "string") continue;
      const swapped = applyKanji(verb, v);
      if (swapped) out[k as QuestionType] = swapped;
    }
    return out as T;
  };
  const polite = mapPart(kana.polite);
  const casual = mapPart(kana.casual);
  if (!Object.keys(polite).length && !Object.keys(casual).length) return null;
  return { polite, casual };
}

export function toCasualKanji(verb: VerbLike, q: QuestionType): string | null {
  return buildKanjiForms(verb)?.casual[q] ?? null;
}
export function toPoliteKanji(verb: VerbLike, q: QuestionType): string | null {
  return buildKanjiForms(verb)?.polite[q] ?? null;
}

/** Dictionary form with kanji (falls back to reading if no kanji). */
export function dictionaryKanji(verb: VerbLike): string {
  return verb.dictionary && verb.dictionary !== verb.reading
    ? verb.dictionary
    : verb.reading;
}

/** Prompt to display for a question, in kana. */
export function promptReading(verb: VerbLike, q: QuestionType): string {
  if (promptIsPolite(q)) {
    return toPolite(verb, q) ?? verb.reading;
  }
  return verb.reading;
}

/** Prompt to display for a question, with kanji when available. */
export function promptKanji(verb: VerbLike, q: QuestionType): string | null {
  if (promptIsPolite(q)) return toPoliteKanji(verb, q);
  // Non-polite prompts show the dictionary form.
  if (verb.dictionary && verb.dictionary !== verb.reading) return verb.dictionary;
  return null;
}

export interface CheckResult {
  correct: boolean;
  expected: string;
  normalizedInput: string;
  /**
   * Set when the input matched a non-primary variant. The feedback panel
   * shows this under a "colloquial / also correct" heading.
   */
  note?: string;
}

interface Variant {
  text: string;
  note: string;
}

/** Textbook form is `expected`. These are the other answers we accept. */
function extraVariants(verb: WordLike, q: QuestionType, expected: string): Variant[] {
  const out: Variant[] = [];
  const wt = verb.wordType ?? "verb";
  const cls = verb.verbClass;

  // Short causative-passive (飲まされる). Not for す-verbs (話させられる).
  if (
    q === "causative-passive" &&
    cls.startsWith("godan-") &&
    cls !== "godan-s" &&
    expected.endsWith("せられる")
  ) {
    out.push({ text: expected.slice(0, -4) + "される", note: "also correct" });
  }

  if (wt === "noun" || wt === "adj-na") {
    if (q === "non-past-negative" && expected.endsWith("じゃない")) {
      out.push({ text: expected.replace(/じゃない$/, "ではない"), note: "also correct" });
    }
    if (q === "past-negative" && expected.endsWith("じゃなかった")) {
      out.push({ text: expected.replace(/じゃなかった$/, "ではなかった"), note: "also correct" });
    }
    if (q === "provisional-eba" && expected.endsWith("なら")) {
      out.push({ text: expected.slice(0, -2) + "であれば", note: "also correct" });
    }
  }

  // Polite→plain drills ask for たかくない, not the polite prompt (たかくないです / 高くありません).
  // たかくはない is still plain.
  if (wt === "adj-i") {
    if (q === "non-past-negative" && expected.endsWith("くない")) {
      out.push({ text: expected.slice(0, -2) + "はない", note: "also correct" });
    }
    if (q === "past-negative" && expected.endsWith("くなかった")) {
      out.push({ text: expected.replace(/くなかった$/, "くはなかった"), note: "also correct" });
    }
  }

  // ら抜き: 食べられる → 食べれる, 来られる → 来れる. Noted as colloquial.
  if (
    q === "potential" &&
    expected.endsWith("られる") &&
    (cls === "ichidan" || cls === "irregular-kuru")
  ) {
    const written = applyKanji(verb, expected) ?? expected;
    out.push({
      text: expected.slice(0, -3) + "れる",
      note: `colloquial; written: ${written}`,
    });
  }

  if (isVsS(verb) && verb.reading.endsWith("する")) {
    const prefix = verb.reading.slice(0, -2);
    const geminate = prefix.endsWith("っ");
    if (q === "potential") {
      // Non-geminate: せる and することができる only. 愛せられる is passive.
      // Geminate: せられる is primary; せる is the other short potential.
      if (geminate) out.push({ text: `${prefix}せる`, note: "also correct" });
      const periphrastic = `${prefix}することができる`;
      if (periphrastic !== expected) out.push({ text: periphrastic, note: "also correct" });
    }
    if (q === "passive") {
      // 罰せられる / 達せられる / 熱せられる, and the literary 愛せられる.
      const other = geminate ? `${prefix}される` : `${prefix}せられる`;
      if (other !== expected) out.push({ text: other, note: "also correct" });
    }
    if (q === "imperative") {
      const shiro = `${prefix}しろ`;
      if (shiro !== expected) out.push({ text: shiro, note: "also correct" });
    }
  }

  // 説明せよ is the written command. しろ stays the primary form for ordinary する.
  if (cls === "irregular-suru" && q === "imperative" && verb.reading.endsWith("する")) {
    const seyo = `${verb.reading.slice(0, -2)}せよ`;
    if (seyo !== expected && !out.some((v) => v.text === seyo)) {
      out.push({ text: seyo, note: "formal/written" });
    }
  }

  return out;
}

function formMatches(inputHira: string, inputRaw: string, form: string, kanji: string | null): boolean {
  if (inputHira === katakanaToHiragana(normalize(form))) return true;
  return kanji !== null && inputRaw === normalize(kanji);
}

export function checkAnswer(input: string, verb: VerbLike, q: QuestionType): CheckResult {
  const expected = buildForms(verb).casual[q];
  const ni = katakanaToHiragana(normalize(input));
  const niRaw = normalize(input);
  if (expected == null) return { correct: false, expected: "", normalizedInput: ni };
  if (formMatches(ni, niRaw, expected, applyKanji(verb, expected))) {
    return { correct: true, expected, normalizedInput: ni };
  }
  for (const variant of extraVariants(verb, q, expected)) {
    if (formMatches(ni, niRaw, variant.text, applyKanji(verb, variant.text))) {
      return { correct: true, expected, normalizedInput: ni, note: variant.note };
    }
  }
  return { correct: false, expected, normalizedInput: ni };
}

// ── grammar explanations (fixed strings, no AI) ─────────────────────────────

export function explanation(verbClass: string, q: QuestionType): string {
  const cls = verbClass.startsWith("godan-") ? "godan" : verbClass;
  const adjI: Partial<Record<QuestionType, string>> = {
    "non-past-affirmative": "い-adjective: dictionary form ends in い. Polite adds です (高い → 高いです).",
    "non-past-negative": "い-adjective negative: drop い, add くない (高い → 高くない).",
    "past-affirmative": "い-adjective past: drop い, add かった (高い → 高かった).",
    "past-negative": "い-adjective past negative: drop い, add くなかった (高い → 高くなかった).",
    "te-form": "い-adjective te-form: drop い, add くて (高い → 高くて).",
    "conditional-tara": "い-adjective たら: drop い, add かったら (高い → 高かったら).",
    "provisional-eba": "い-adjective ば: drop い, add ければ (高い → 高ければ).",
  };
  const copula: Partial<Record<QuestionType, string>> = {
    "non-past-affirmative": "Copula: add だ (casual) or です (polite).",
    "non-past-negative": "Copula negative: add じゃない (casual) or ではありません (polite).",
    "past-affirmative": "Copula past: add だった (casual) or でした (polite).",
    "past-negative": "Copula past negative: add じゃなかった (casual) or ではありませんでした (polite).",
    "te-form": "Copula te-form: add で (元気で).",
    "conditional-tara": "Copula たら: add だったら (元気だったら).",
    "provisional-eba": "Copula conditional: add なら (元気なら). であれば is also correct.",
  };
  const map: Record<string, Partial<Record<QuestionType, string>>> = {
    ichidan: {
      "non-past-affirmative": "Ichidan: drop ます, the dictionary form ends in る.",
      "non-past-negative": "Ichidan negative: drop る, add ない.",
      "past-affirmative": "Ichidan past: drop る, add た.",
      "past-negative": "Ichidan past negative: drop る, add なかった.",
      "te-form": "Ichidan te-form: drop る, add て.",
      "potential": "Ichidan potential: drop る, add られる (can do).",
      "volitional": "Ichidan volitional: drop る, add よう (let's …).",
      "imperative": "Ichidan imperative: drop る, add ろ (rough command).",
      "conditional-tara": "Ichidan たら: past-affirmative + ら (if/when).",
      "provisional-eba": "Ichidan ば: drop る, add れば (if).",
      "passive": "Ichidan passive: drop る, add られる (is/was …-ed).",
      "causative": "Ichidan causative: drop る, add させる (make/let … do).",
      "causative-passive": "Ichidan causative-passive: drop る, add させられる (be made to …).",
    },
    godan: {
      "non-past-affirmative": "Godan: change the い-row stem before ます back to the う-row.",
      "non-past-negative": "Godan negative: う-row → あ-row, then ない (う → わ, not あ).",
      "past-affirmative": "Godan past (ta-form): う/つ/る → った, く → いた, ぐ → いだ, す → した, ぬ/ぶ/む → んだ.",
      "past-negative": "Godan past negative: あ-row stem + なかった.",
      "te-form": "Godan te-form: same swap as past, but with て/で endings.",
      "potential": "Godan potential: う-row → え-row, add る (書く → 書ける).",
      "volitional": "Godan volitional: う-row → お-row, add う (書く → 書こう).",
      "imperative": "Godan imperative: change う-row to え-row (書く → 書け).",
      "conditional-tara": "Godan たら: past-affirmative + ら (書いた → 書いたら).",
      "provisional-eba": "Godan ば: う-row → え-row, add ば (書く → 書けば).",
      "passive": "Godan passive: う-row → あ-row, add れる (書く → 書かれる).",
      "causative": "Godan causative: う-row → あ-row, add せる (書く → 書かせる).",
      "causative-passive": "Godan causative-passive: う-row → あ-row, add せられる. The short form (飲まされる) is also correct, except for す-verbs.",
    },
    "irregular-suru": {
      "non-past-affirmative": "する → する.",
      "non-past-negative": "する → しない.",
      "past-affirmative": "する → した.",
      "past-negative": "する → しなかった.",
      "te-form": "する → して.",
      "potential": "する → できる. Single-kanji する (愛する) → せる or することができる; 促音 (達する) → せられる. 愛せられる is the passive, not the potential.",
      "volitional": "する → しよう.",
      "imperative": "する → しろ. せよ is also correct in writing (説明せよ). Single-kanji する (愛する) → せよ.",
      "conditional-tara": "する → したら.",
      "provisional-eba": "する → すれば.",
      "passive": "する → される. Single-kanji する also accepts せられる (罰する → 罰せられる).",
      "causative": "する → させる.",
      "causative-passive": "する → させられる.",
    },
    "irregular-kuru": {
      "non-past-affirmative": "来る → くる.",
      "non-past-negative": "来る → こない.",
      "past-affirmative": "来る → きた.",
      "past-negative": "来る → こなかった.",
      "te-form": "来る → きて.",
      "potential": "来る → こられる.",
      "volitional": "来る → こよう.",
      "imperative": "来る → こい.",
      "conditional-tara": "来る → きたら.",
      "provisional-eba": "来る → くれば.",
      "passive": "来る → こられる.",
      "causative": "来る → こさせる.",
      "causative-passive": "来る → こさせられる.",
    },
    "adj-i": adjI,
    "adj-i-yoi": adjI,
    "adj-na": copula,
    noun: copula,
  };
  return map[cls]?.[q] ?? "";
}


const QUESTION_LABELS: Record<QuestionType, string> = {
  "non-past-affirmative": "Non-past affirmative",
  "non-past-negative": "Non-past negative",
  "past-affirmative": "Past affirmative",
  "past-negative": "Past negative",
  "te-form": "Te-form",
  "potential": "Potential",
  "volitional": "Volitional",
  "imperative": "Imperative",
  "conditional-tara": "Conditional たら",
  "provisional-eba": "Provisional ば",
  "passive": "Passive",
  "causative": "Causative",
  "causative-passive": "Causative-passive",
};

export function questionLabel(q: QuestionType, wordType?: WordType): string {
  if (q === "provisional-eba" && (wordType === "noun" || wordType === "adj-na")) {
    return "Conditional (ば/なら)";
  }
  const base = QUESTION_LABELS[q];
  // The four basic prompts show the polite form; the answer is plain.
  if (promptIsPolite(q)) return `${base} · Polite → plain`;
  return base;
}

export const QUESTION_TOOLTIPS: Record<QuestionType, string> = {
  "non-past-affirmative": "The prompt is polite. Answer with the plain form. e.g. 飲みます → 飲む",
  "non-past-negative": "The prompt is polite. Answer with the plain form. e.g. 飲みません → 飲まない",
  "past-affirmative": "The prompt is polite. Answer with the plain form. e.g. 飲みました → 飲んだ",
  "past-negative": "The prompt is polite. Answer with the plain form. e.g. 飲みませんでした → 飲まなかった",
  "te-form": "Connective form used to link clauses. e.g. 食べて, 書いて",
  "potential": "Ability — 'can do'. e.g. 食べられる, 書ける",
  "volitional": "Intention — 'let's do'. e.g. 食べよう, 書こう",
  "imperative": "Direct command. e.g. 食べろ, 書け",
  "conditional-tara": "If/when condition — past + ら. e.g. 食べたら, 書いたら",
  "provisional-eba": "Hypothetical condition. Verbs: e-stem + ば (書けば). Nouns and な-adjectives: なら (元気なら). であれば is also correct.",
  "passive": "Passive voice — 'is done to'. e.g. 食べられる, 書かれる",
  "causative": "Make or let someone do. e.g. 食べさせる, 書かせる",
  "causative-passive": "Be made to do. e.g. 食べさせられる, 書かせられる",
};

export function questionTooltip(q: QuestionType): string {
  return QUESTION_TOOLTIPS[q];
}

export function verbClassLabel(cls: string): string {
  if (cls === "ichidan") return "Ichidan (る-verb)";
  if (cls === "irregular-suru") return "Irregular (する)";
  if (cls === "irregular-kuru") return "Irregular (来る)";
  if (cls === "godan-iku") return "Godan (行く exception)";
  if (cls.startsWith("godan-")) return `Godan (-${cls.slice(-1)})`;
  if (cls === "adj-i" || cls === "adj-i-yoi") return "い-adjective";
  if (cls === "adj-na") return "な-adjective";
  if (cls === "noun") return "Noun";
  return cls;
}

