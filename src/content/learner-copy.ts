/**
 * Learner-facing strings a native teacher can edit in one place.
 *
 * The Japanese below is the teacher's final wording from the Phase 2 review.
 * The same tagline is duplicated in the three description meta tags in index.html.
 */

/** Home and About tagline. Also duplicated in index.html meta descriptions. */
export const taglineJa = "一緒に日本語、上手になろう！";

/**
 * Kanken level next to a school grade.
 * Grades 1–6 are the number before 級 (10級 is the easiest).
 * Grade 8 is the remaining jōyō list, which runs 4級 through 2級.
 */
export const kankenLevelShort: Record<number, string> = {
  1: "10",
  2: "9",
  3: "8",
  4: "7",
  5: "6",
  6: "5",
  8: "4級〜2級",
};

/** Visible label for a school grade's nearest Kanken level. */
export function kankenChipLabel(grade: number): string {
  if (grade === 8) return "漢検4級〜2級";
  const level = kankenLevelShort[grade] ?? String(grade);
  return `漢検${level}級`;
}

/** Heading on /kanji/learn. */
export const kankenSectionTitle = "JLPT vs School Grade";

/** Sentence under the school-grade chips. */
export const kankenGradeHelp =
  "G1–G6 are elementary years 1–6 (roughly 漢検10級〜5級).";

/** Placeholder dropped into a new diary text box. */
export const diaryTextPlaceholder = "今日はどんな一日だった？";

/** Short name of the picture-diary format, inside the Diary intro. */
export const diaryBlurbJa = "絵日記";

export const godanLookalikes = [
  { word: "帰る", reading: "かえる", gloss: "to return home" },
  { word: "入る", reading: "はいる", gloss: "to enter" },
  { word: "走る", reading: "はしる", gloss: "to run" },
  { word: "知る", reading: "しる", gloss: "to know" },
  { word: "切る", reading: "きる", gloss: "to cut" },
  { word: "要る", reading: "いる", gloss: "to need" },
  { word: "滑る", reading: "すべる", gloss: "to slip / slide" },
  { word: "喋る", reading: "しゃべる", gloss: "to chat / talk" },
  { word: "蹴る", reading: "ける", gloss: "to kick" },
  { word: "減る", reading: "へる", gloss: "to decrease" },
  { word: "焦る", reading: "あせる", gloss: "to feel rushed / panic" },
  { word: "限る", reading: "かぎる", gloss: "to limit" },
] as const;

/** な-adjectives whose dictionary form happens to end in い. */
export const naAdjectivesEndingInI = ["きれい", "嫌い"] as const;

/** Common な-adjectives that do not end in い. Not part of the い-ending trap. */
export const naAdjectivesOther = ["有名", "簡単"] as const;

export const verbGroups = [
  {
    group: "Group 1",
    name: "Godan / う-verbs",
    label: "godan-*",
    rule: "Dictionary form ends in any う-row kana (う, く, ぐ, す, つ, ぬ, ぶ, む, る). For -る verbs, the vowel before る is usually a / u / o, but some godan verbs end in -iru/-eru (帰る, 入る, 走る, 知る — see the look-alikes).",
    examples: "飲む (nomu), 書く (kaku), 話す (hanasu), 帰る (kaeru)",
  },
  {
    group: "Group 2",
    name: "Ichidan / る-verbs",
    label: "ichidan",
    rule: "Always ends in る. The vowel before る is i or e, but not every -iru/-eru verb is Group 2 (see the look-alikes).",
    examples: "食べる (taberu), 見る (miru), 起きる (okiru)",
  },
  {
    group: "Group 3",
    name: "Irregular",
    label: "irregular-suru, irregular-kuru",
    rule: "Just two core verbs, する and 来る. する also forms compounds like 勉強する.",
    examples: "する (to do), 来る (kuru, to come)",
  },
] as const;

export const conjRows = [
  { form: "Non-past affirmative", g1: "飲む", g2: "食べる", g3: "する" },
  { form: "Non-past negative", g1: "飲まない", g2: "食べない", g3: "しない" },
  { form: "Past affirmative", g1: "飲んだ", g2: "食べた", g3: "した" },
  { form: "Past negative", g1: "飲まなかった", g2: "食べなかった", g3: "しなかった" },
] as const;

export const extendedForms = [
  {
    form: "Te-form",
    meaning: "Connector",
    use: "Links clauses, makes requests (〜てください), continuous tense (〜ている).",
    g1Rule: "Same swap as past, with て/で. む/ぶ/ぬ → んで · く → いて · ぐ → いで · す → して · つ/る/う → って. Exception: 行く → 行って (not 行いて).",
    g1Ex: "飲む → 飲んで",
    g2Rule: "Drop る, add て.",
    g2Ex: "食べる → 食べて",
    g3Rule: "する → して · 来る(くる) → 来て(きて)",
    g3Ex: "して · 来て(きて)",
    sample: "コーヒーを飲んで、出かけた。 — I had coffee and went out.",
  },
  {
    form: "Potential",
    meaning: "“Can do”",
    use: "Ability or possibility.",
    g1Rule: "Final う-row → え-row, then add る.",
    g1Ex: "飲む → 飲める",
    g2Rule: "Drop る, add られる. In casual speech many people drop ら (食べれる), but write 食べられる.",
    g2Ex: "食べる → 食べられる",
    g3Rule: "する → できる · 来る(くる) → 来られる(こられる)",
    g3Ex: "できる · 来られる(こられる)",
    sample: "刺身は食べられますか？ — Can you eat sashimi?",
  },
  {
    form: "Volitional",
    meaning: "“Let’s …”",
    use: "Suggestions, invitations, expressing intent.",
    g1Rule: "Final う-row → お-row, then add う (long vowel).",
    g1Ex: "飲む → 飲もう",
    g2Rule: "Drop る, add よう.",
    g2Ex: "食べる → 食べよう",
    g3Rule: "する → しよう · 来る(くる) → 来よう(こよう)",
    g3Ex: "しよう · 来よう(こよう)",
    sample: "一緒に行こう！ — Let’s go together!",
  },
  {
    form: "Imperative",
    meaning: "Direct command",
    use: "Rough — feels harsh. Common in signs, sports, anger.",
    g1Rule: "Final う-row → え-row.",
    g1Ex: "飲む → 飲め",
    g2Rule: "Drop る, add ろ.",
    g2Ex: "食べる → 食べろ",
    g3Rule: "する → しろ (written/formal: せよ) · 来る(くる) → 来い(こい)",
    g3Ex: "しろ (written/formal: せよ) · 来い(こい)",
    sample: "早く来い！ — Get here, fast!",
  },
  {
    form: "Conditional たら",
    meaning: "“If / when …”",
    use: "Most flexible conditional — works for hypotheticals and timing.",
    g1Rule: "Take the past-affirmative form, add ら.",
    g1Ex: "飲んだ → 飲んだら",
    g2Rule: "Take the past-affirmative form, add ら.",
    g2Ex: "食べた → 食べたら",
    g3Rule: "した → したら · 来る(くる) → 来たら(きたら)",
    g3Ex: "したら · 来たら(きたら)",
    sample: "雨が降ったら、行かない。 — If it rains, I won’t go.",
  },
  {
    form: "Provisional ば",
    meaning: "“If X (then Y)”",
    use: "More hypothetical or general than たら. Common in proverbs.",
    g1Rule: "Final う-row → え-row, then add ば.",
    g1Ex: "飲む → 飲めば",
    g2Rule: "Drop る, add れば.",
    g2Ex: "食べる → 食べれば",
    g3Rule: "する → すれば · 来る(くる) → 来れば(くれば)",
    g3Ex: "すれば · 来れば(くれば)",
    sample: "急げば間に合う。 — If you hurry, you’ll make it.",
  },
  {
    form: "Passive",
    meaning: "“Is/was …-ed”",
    use: "Action received by the subject. Also used for adversity (something happened to you).",
    g1Rule: "Final う-row → あ-row, then add れる (う → わ, not あ).",
    g1Ex: "飲む → 飲まれる",
    g2Rule: "Drop る, add られる.",
    g2Ex: "食べる → 食べられる",
    g3Rule: "する → される · 来る(くる) → 来られる(こられる)",
    g3Ex: "される · 来られる(こられる)",
    sample: "弟にケーキを食べられた。 — My little brother ate my cake (and I'm upset).",
  },
  {
    form: "Causative",
    meaning: "“Make / let … do”",
    use: "Force or permit someone to do something.",
    g1Rule: "Final う-row → あ-row, then add せる (う → わ).",
    g1Ex: "飲む → 飲ませる",
    g2Rule: "Drop る, add させる.",
    g2Ex: "食べる → 食べさせる",
    g3Rule: "する → させる · 来る(くる) → 来させる(こさせる)",
    g3Ex: "させる · 来させる(こさせる)",
    sample: "子どもに野菜を食べさせる。 — I make the kids eat vegetables.",
  },
  {
    form: "Causative-passive",
    meaning: "“Be made to do”",
    use: "Forced into doing something — often reluctantly.",
    g1Rule: "Final う-row → あ-row, then add せられる (う → わ). Short form 飲まされる is more common in speech (not for す-verbs: 話させられる).",
    g1Ex: "飲む → 飲ませられる",
    g2Rule: "Drop る, add させられる.",
    g2Ex: "食べる → 食べさせられる",
    g3Rule: "する → させられる · 来る(くる) → 来させられる(こさせられる)",
    g3Ex: "させられる · 来させられる(こさせられる)",
    sample: "母に野菜を食べさせられた。 — My mom made me eat vegetables.",
  },
] as const;

export const godanNegativeSwaps = [
  { from: "う", to: "わ", example: "買う → 買わない" },
  { from: "く", to: "か", example: "書く → 書かない" },
  { from: "ぐ", to: "が", example: "泳ぐ → 泳がない" },
  { from: "す", to: "さ", example: "話す → 話さない" },
  { from: "つ", to: "た", example: "待つ → 待たない" },
  { from: "ぬ", to: "な", example: "死ぬ → 死なない" },
  { from: "ぶ", to: "ば", example: "遊ぶ → 遊ばない" },
  { from: "む", to: "ま", example: "飲む → 飲まない" },
  { from: "る", to: "ら", example: "売る → 売らない" },
] as const;
