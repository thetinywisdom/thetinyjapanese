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

export type WordType = "verb" | "adj-i" | "adj-na" | "noun";

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

/** Which question types are meaningful for a given word type. */
export function supportedQuestions(wordType: WordType): QuestionType[] {
  if (wordType === "verb") return [...ALL_QUESTION_TYPES];
  if (wordType === "adj-i") {
    return [
      "non-past-affirmative", "non-past-negative",
      "past-affirmative", "past-negative",
      "te-form", "conditional-tara", "provisional-eba",
    ];
  }
  // adj-na / noun (share copula pattern)
  return [
    "non-past-affirmative", "non-past-negative",
    "past-affirmative", "past-negative",
    "te-form", "conditional-tara", "provisional-eba",
  ];
}

export interface VerbLike {
  reading: string;
  verbClass: string;
  dictionary?: string;
  /** Optional — defaults to "verb" for backwards compatibility. */
  wordType?: WordType;
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
  if (wt === "adj-na" || wt === "noun") {
    // Drop trailing な if any (JMdict readings rarely include it).
    const stem = r.endsWith("な") ? r.slice(0, -1) : r;
    return copulaForms(stem);
  }



  // ── irregular: する / 〜する ──
  if (cls === "irregular-suru") {
    const prefix = r.endsWith("する") ? r.slice(0, -2) : "";
    return {
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
        "potential": `${prefix}できる`,
        "volitional": `${prefix}しよう`,
        "imperative": `${prefix}しろ`,
        "conditional-tara": `${prefix}したら`,
        "provisional-eba": `${prefix}すれば`,
        "passive": `${prefix}される`,
        "causative": `${prefix}させる`,
        "causative-passive": `${prefix}させられる`,
      },
    };
  }

  // ── irregular: 来る ──
  if (cls === "irregular-kuru") {
    return {
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
    };
  }

  // ── ichidan ──
  if (cls === "ichidan") {
    if (!r.endsWith("る")) throw new Error(`Ichidan must end in る: ${r}`);
    const stem = r.slice(0, -1);
    return {
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
        "imperative": `${stem}ろ`,
        "conditional-tara": `${stem}たら`,
        "provisional-eba": `${stem}れば`,
        "passive": `${stem}られる`,
        "causative": `${stem}させる`,
        "causative-passive": `${stem}させられる`,
      },
    };
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
    return {
      polite: {
        "non-past-affirmative": `${iStem}ます`,
        "non-past-negative": `${iStem}ません`,
        "past-affirmative": `${iStem}ました`,
        "past-negative": `${iStem}ませんでした`,
      },
      casual: {
        "non-past-affirmative": r,
        "non-past-negative": `${aStem}ない`,
        "past-affirmative": pastAff,
        "past-negative": `${aStem}なかった`,
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
    };
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

/**
 * Build kanji-form variants by replacing the kana stem prefix of each
 * generated form with the dictionary's kanji prefix.
 */
export function buildKanjiForms(verb: VerbLike): {
  polite: Partial<Record<QuestionType, string>>;
  casual: Partial<Record<QuestionType, string>>;
} | null {
  const dict = verb.dictionary;
  if (!dict || dict === verb.reading) return null;

  const { prefix: kanjiPrefix, tail: dictTail } = splitOkurigana(dict);
  if (!kanjiPrefix) return null;

  const kana = buildForms(verb);

  // 来る is special: the reading vowel changes (く/き/こ) but 来 stays put.
  if (verb.verbClass === "irregular-kuru") {
    const swap = (s: string) => kanjiPrefix + s.slice(1);
    const mapPart = <T extends Partial<Record<QuestionType, string>>>(forms: T): T => {
      const out: Partial<Record<QuestionType, string>> = {};
      for (const [k, v] of Object.entries(forms)) {
        if (typeof v === "string") out[k as QuestionType] = swap(v);
      }
      return out as T;
    };
    return { polite: mapPart(kana.polite), casual: mapPart(kana.casual) };
  }

  const reading = verb.reading;
  let kanaPrefixLen = reading.length - dictTail.length;
  if (kanaPrefixLen < 0 || reading.slice(kanaPrefixLen) !== dictTail) {
    kanaPrefixLen = Math.max(1, reading.length - 1);
  }
  const kanaPrefix = reading.slice(0, kanaPrefixLen);

  const swap = (s: string): string =>
    s.startsWith(kanaPrefix) ? kanjiPrefix + s.slice(kanaPrefix.length) : s;

  const mapPart = <T extends Partial<Record<QuestionType, string>>>(forms: T): T => {
    const out: Partial<Record<QuestionType, string>> = {};
    for (const [k, v] of Object.entries(forms)) {
      if (typeof v === "string") out[k as QuestionType] = swap(v);
    }
    return out as T;
  };

  return { polite: mapPart(kana.polite), casual: mapPart(kana.casual) };
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
}

export function checkAnswer(input: string, verb: VerbLike, q: QuestionType): CheckResult {
  const expected = toCasual(verb, q);
  const expectedKanji = toCasualKanji(verb, q);
  const ni = katakanaToHiragana(normalize(input));
  const ne = katakanaToHiragana(normalize(expected));
  const niRaw = normalize(input);
  const correct = ni === ne || (expectedKanji !== null && niRaw === normalize(expectedKanji));
  return { correct, expected, normalizedInput: ni };
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
    "provisional-eba": "Copula なら: add なら (元気なら).",
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
      "causative-passive": "Godan causative-passive: う-row → あ-row, add せられる.",
    },
    "irregular-suru": {
      "non-past-affirmative": "する → する.",
      "non-past-negative": "する → しない.",
      "past-affirmative": "する → した.",
      "past-negative": "する → しなかった.",
      "te-form": "する → して.",
      "potential": "する → できる.",
      "volitional": "する → しよう.",
      "imperative": "する → しろ.",
      "conditional-tara": "する → したら.",
      "provisional-eba": "する → すれば.",
      "passive": "する → される.",
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


export function questionLabel(q: QuestionType): string {
  return {
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
  }[q];
}

export const QUESTION_TOOLTIPS: Record<QuestionType, string> = {
  "non-past-affirmative": "Present or future tense, positive. e.g. 食べる, 書く",
  "non-past-negative": "Present or future tense, negative. e.g. 食べない, 書かない",
  "past-affirmative": "Past tense, positive. e.g. 食べた, 書いた",
  "past-negative": "Past tense, negative. e.g. 食べなかった, 書かなかった",
  "te-form": "Connective form used to link clauses. e.g. 食べて, 書いて",
  "potential": "Ability — 'can do'. e.g. 食べられる, 書ける",
  "volitional": "Intention — 'let's do'. e.g. 食べよう, 書こう",
  "imperative": "Direct command. e.g. 食べろ, 書け",
  "conditional-tara": "If/when condition — past + ら. e.g. 食べたら, 書いたら",
  "provisional-eba": "Hypothetical condition — e-stem + ば. e.g. 食べれば, 書けば",
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

