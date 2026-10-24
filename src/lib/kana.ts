/** Normalisation helpers for comparing user input. */

export function normalize(s: string): string {
  return s
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "")
    // strip trailing punctuation
    .replace(/[。、.,!?！？]+$/g, "");
}

const KATA_TO_HIRA_OFFSET = 0x60;
export function katakanaToHiragana(s: string): string {
  let out = "";
  for (const ch of s) {
    const code = ch.charCodeAt(0);
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCharCode(code - KATA_TO_HIRA_OFFSET);
    } else {
      out += ch;
    }
  }
  return out;
}
