/**
 * Romaji → Hiragana converter (Hepburn-ish, with common variants).
 *
 * Designed for live, on-keystroke conversion in an input box.
 * Returns { converted, pending } so the caller can re-render the value as
 * `converted + pending` — pending is the trailing romaji that may still
 * combine with the next keystroke (e.g. "k", "ky", "n").
 */

// Order matters within the table only when one key is a prefix of another.
// We always match the longest possible key from the current position.
const MAP: Record<string, string> = {
  // basic vowels
  a: "あ", i: "い", u: "う", e: "え", o: "お",

  // k / g
  ka: "か", ki: "き", ku: "く", ke: "け", ko: "こ",
  ga: "が", gi: "ぎ", gu: "ぐ", ge: "げ", go: "ご",
  kya: "きゃ", kyu: "きゅ", kyo: "きょ",
  gya: "ぎゃ", gyu: "ぎゅ", gyo: "ぎょ",

  // s / z
  sa: "さ", shi: "し", si: "し", su: "す", se: "せ", so: "そ",
  za: "ざ", ji: "じ", zi: "じ", zu: "ず", ze: "ぜ", zo: "ぞ",
  sha: "しゃ", shu: "しゅ", sho: "しょ",
  sya: "しゃ", syu: "しゅ", syo: "しょ",
  ja: "じゃ", ju: "じゅ", jo: "じょ",
  jya: "じゃ", jyu: "じゅ", jyo: "じょ",
  zya: "じゃ", zyu: "じゅ", zyo: "じょ",

  // t / d
  ta: "た", chi: "ち", ti: "ち", tsu: "つ", tu: "つ", te: "て", to: "と",
  da: "だ", di: "ぢ", du: "づ", de: "で", do: "ど",
  cha: "ちゃ", chu: "ちゅ", cho: "ちょ",
  tya: "ちゃ", tyu: "ちゅ", tyo: "ちょ",
  cya: "ちゃ", cyu: "ちゅ", cyo: "ちょ",
  dya: "ぢゃ", dyu: "ぢゅ", dyo: "ぢょ",
  tsa: "つぁ", tse: "つぇ", tso: "つぉ",

  // n
  na: "な", ni: "に", nu: "ぬ", ne: "ね", no: "の",
  nya: "にゃ", nyu: "にゅ", nyo: "にょ",

  // h / b / p
  ha: "は", hi: "ひ", fu: "ふ", hu: "ふ", he: "へ", ho: "ほ",
  ba: "ば", bi: "び", bu: "ぶ", be: "べ", bo: "ぼ",
  pa: "ぱ", pi: "ぴ", pu: "ぷ", pe: "ぺ", po: "ぽ",
  hya: "ひゃ", hyu: "ひゅ", hyo: "ひょ",
  bya: "びゃ", byu: "びゅ", byo: "びょ",
  pya: "ぴゃ", pyu: "ぴゅ", pyo: "ぴょ",
  fa: "ふぁ", fi: "ふぃ", fe: "ふぇ", fo: "ふぉ",

  // m
  ma: "ま", mi: "み", mu: "む", me: "め", mo: "も",
  mya: "みゃ", myu: "みゅ", myo: "みょ",

  // y
  ya: "や", yu: "ゆ", yo: "よ",

  // r
  ra: "ら", ri: "り", ru: "る", re: "れ", ro: "ろ",
  rya: "りゃ", ryu: "りゅ", ryo: "りょ",

  // w
  wa: "わ", wi: "うぃ", we: "うぇ", wo: "を",

  // n' and special
  "n'": "ん", nn: "ん",

  // small kana via x/l prefix
  xa: "ぁ", xi: "ぃ", xu: "ぅ", xe: "ぇ", xo: "ぉ",
  la: "ぁ", li: "ぃ", lu: "ぅ", le: "ぇ", lo: "ぉ",
  xtu: "っ", xtsu: "っ", ltu: "っ", ltsu: "っ",
  xya: "ゃ", xyu: "ゅ", xyo: "ょ",
  lya: "ゃ", lyu: "ゅ", lyo: "ょ",

  // punctuation
  "-": "ー", ",": "、", ".": "。", "?": "？", "!": "！",
};

const MAX_KEY_LEN = 4;
const KEYS = Object.keys(MAP);

function isPrefixOfKey(s: string): boolean {
  return KEYS.some((k) => k.length > s.length && k.startsWith(s));
}


/**
 * Convert a buffer of romaji into hiragana.
 * Returns the fully-converted prefix plus any unconvertible trailing
 * romaji that should remain editable.
 */
export function romajiToHiragana(buf: string): { converted: string; pending: string } {
  let out = "";
  let i = 0;
  const s = buf.toLowerCase();

  while (i < s.length) {
    const ch = s[i];

    // sokuon: doubled romaji consonant (kk, tt, pp, ss, ...) but not "nn" (handled below).
    // Restrict to ASCII consonants so adjacent identical kana (e.g. たた) don't trigger っ.
    if (
      /^[bcdfghjklmpqrstvwxyz]$/.test(ch) &&
      ch !== "n" &&
      i + 1 < s.length && s[i + 1] === ch
    ) {
      out += "っ";
      i += 1;
      continue;
    }

    // "n" followed by a non-vowel/non-y consonant becomes ん (e.g. "honda" → ほんだ).
    // But keep "ny..." as a digraph (にゃ etc.) and don't eat into possible future input.
    if (ch === "n" && i + 1 < s.length) {
      const nxt = s[i + 1];
      if (nxt === "'") { out += "ん"; i += 2; continue; }
      // "nn" + vowel/y → ん + な行 (e.g. "konnichiwa" → こんにちわ)
      if (nxt === "n" && /^[aiueoy]$/.test(s[i + 2] ?? "")) { out += "ん"; i += 1; continue; }
      if (
        nxt !== "a" && nxt !== "i" && nxt !== "u" && nxt !== "e" && nxt !== "o" &&
        nxt !== "y" && nxt !== "n"
      ) {
        out += "ん";
        i += 1;
        continue;
      }
    }

    // longest-match lookup
    let matched = false;
    const maxLen = Math.min(MAX_KEY_LEN, s.length - i);
    for (let len = maxLen; len >= 1; len--) {
      const slice = s.slice(i, i + len);
      const hira = MAP[slice];
      if (hira !== undefined) {
        out += hira;
        i += len;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Already kana / kanji / other char — pass through.
    if (!/^[a-z'-]$/.test(ch)) {
      out += buf[i];
      i += 1;
      continue;
    }

    // Trailing romaji that could still become kana with the next keystroke.
    const rest = s.slice(i);
    if (rest.length <= MAX_KEY_LEN && isPrefixOfKey(rest)) {
      return { converted: out, pending: rest };
    }

    // Otherwise it's just a letter that never forms kana (e.g. "my") — keep it.
    out += buf[i];
    i += 1;

  }

  return { converted: out, pending: "" };
}

const HIRA_TO_KATA_OFFSET = 0x60;
export function hiraganaToKatakana(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= 0x3041 && code <= 0x3096) {
      out += String.fromCharCode(code + HIRA_TO_KATA_OFFSET);
    } else {
      out += ch;
    }
  }
  return out;
}
