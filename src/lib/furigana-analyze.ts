/**
 * Diary furigana via morphological analysis.
 *
 * kuromoji (IPAdic) tokenises the sentence, then each token is paired with
 * its reading. A short learner lexicon wins over the analyser where IPAdic
 * teaches the wrong word for this course (一人 → いちにん, 日本 → にっぽん).
 * The dictionary files are loaded lazily from this site's own base path
 * (`public` / the GitHub Pages base), never from a CDN, and kept in the
 * Cache API so a later visit works offline.
 */

import { WORDS } from "@/data/words";
import { katakanaToHiragana } from "@/lib/kana";
import { pairFurigana, type Segment } from "@/lib/furigana";
import { publicAsset } from "@/lib/site-base";

export type RubyToken = Segment;

export interface MorphToken {
  surface_form: string;
  reading?: string;
}

export interface MorphTokenizer {
  tokenize(text: string): MorphToken[];
}

const DICT_FILES = [
  "base.dat.gz",
  "check.dat.gz",
  "tid.dat.gz",
  "tid_pos.dat.gz",
  "tid_map.dat.gz",
  "cc.dat.gz",
  "unk.dat.gz",
  "unk_pos.dat.gz",
  "unk_map.dat.gz",
  "unk_char.dat.gz",
  "unk_compat.dat.gz",
  "unk_invoke.dat.gz",
];

const CACHE_NAME = "tiny-japanese-kuromoji-v1";

/**
 * Readings IPAdic gets wrong for a beginner course. These also cover words
 * that are not in the bundled vocabulary list (日本).
 */
const HAND_PREFERRED: Record<string, string> = {
  日本: "にほん",
  日本語: "にほんご",
  日本人: "にほんじん",
  二十歳: "はたち",
  二十日: "はつか",
  二日: "ふつか",
  三日: "みっか",
  四日: "よっか",
  五日: "いつか",
  六日: "むいか",
  七日: "なのか",
  八日: "ようか",
  九日: "ここのか",
  十日: "とおか",
  今朝: "けさ",
  昨日: "きのう",
  一昨日: "おととい",
  上手: "じょうず",
  下手: "へた",
};

const NAN_COUNTER: Record<string, string> = {
  時: "なんじ",
  人: "なんにん",
  日: "なんにち",
  月: "なんがつ",
  年: "なんねん",
  回: "なんかい",
  個: "なんこ",
  本: "なんぼん",
  枚: "なんまい",
  冊: "なんさつ",
  階: "なんかい",
  度: "なんど",
  分: "なんぷん",
  歳: "なんさい",
  才: "なんさい",
  杯: "なんばい",
  匹: "なんびき",
  頭: "なんとう",
  羽: "なんわ",
  台: "なんだい",
  軒: "なんげん",
  足: "なんそく",
  着: "なんちゃく",
  点: "なんてん",
};

/** Context readings that a longest word match would get wrong. Checked first. */
function contextHit(text: string, i: number): { len: number; reading: string } | null {
  if (text.startsWith("来ません", i) || text.startsWith("来ない", i) || text.startsWith("来よう", i)) {
    return { len: 1, reading: "こ" };
  }
  if (text.startsWith("来ます", i) || text.startsWith("来て", i) || text.startsWith("来た", i)) {
    return { len: 1, reading: "き" };
  }
  if (text.startsWith("読み方", i)) return { len: 3, reading: "よみかた" };
  if (text.startsWith("一日", i)) {
    return { len: 2, reading: i > 0 && text[i - 1] === "月" ? "ついたち" : "いちにち" };
  }
  if (text[i] === "何") {
    const counter = NAN_COUNTER[text[i + 1] ?? ""];
    if (counter) return { len: 2, reading: counter };
    const rest = text.slice(i + 1);
    if (rest.startsWith("を") || rest.startsWith("が") || rest.startsWith("も")) return { len: 1, reading: "なに" };
    if (rest.startsWith("だ") || rest.startsWith("です") || rest.startsWith("の")) return { len: 1, reading: "なん" };
  }
  if (text[i] === "方") {
    const prev2 = i >= 2 ? text.slice(i - 2, i) : "";
    if (prev2 === "この" || prev2 === "その" || prev2 === "あの" || prev2 === "どの") {
      return { len: 1, reading: "かた" };
    }
    if (i > 0 && text[i - 1] === "の") return { len: 1, reading: "ほう" };
  }
  if (text[i] === "他") {
    const next = text.charCodeAt(i + 1);
    const nextIsKanji = next >= 0x4e00 && next <= 0x9fff;
    if (!nextIsKanji) return { len: 1, reading: "ほか" };
  }
  return null;
}

const MAX_PREF = 12;

let preferred: Map<string, string> | null = null;

function hasKanji(s: string): boolean {
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c >= 0x4e00 && c <= 0x9fff) return true;
  }
  return false;
}

function buildPreferred(): Map<string, string> {
  if (preferred) return preferred;
  const map = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const w of WORDS) {
    const forms = [w.dictionary, w.kanjiForm].filter((f): f is string => !!f);
    for (const form of forms) {
      if (form.length < 2 || form.length > MAX_PREF || !hasKanji(form)) continue;
      const prev = map.get(form);
      if (prev === undefined) map.set(form, w.reading);
      else if (prev !== w.reading) ambiguous.add(form);
    }
  }
  for (const form of ambiguous) map.delete(form);
  for (const [form, reading] of Object.entries(HAND_PREFERRED)) map.set(form, reading);
  preferred = map;
  return map;
}

function preferredAt(text: string, index: number, pref: Map<string, string>): { len: number; reading: string } | null {
  const max = Math.min(MAX_PREF, text.length - index);
  for (let len = max; len >= 2; len--) {
    const reading = pref.get(text.slice(index, index + len));
    if (reading) return { len, reading };
  }
  return null;
}

function push(out: RubyToken[], seg: RubyToken) {
  const last = out[out.length - 1];
  if (last && !last.ruby && !seg.ruby) last.base += seg.base;
  else out.push(seg);
}

function emitSurface(out: RubyToken[], surface: string, reading: string | undefined) {
  if (!surface) return;
  const kana = reading ? katakanaToHiragana(reading) : "";
  if (!kana || kana === "*" || !hasKanji(surface)) {
    push(out, { base: surface });
    return;
  }
  for (const seg of pairFurigana(surface, kana)) push(out, seg);
}

function emitGap(out: RubyToken[], gap: string, tokenizer: MorphTokenizer) {
  if (!gap) return;
  const tokens = tokenizer.tokenize(gap);
  let covered = "";
  for (const tok of tokens) {
    covered += tok.surface_form;
    emitSurface(out, tok.surface_form, tok.reading);
  }
  if (covered !== gap) push(out, { base: gap.slice(covered.length) });
}

/** Pair kanji in `text` with kana using a prepared tokenizer. */
export function annotateWithTokenizer(text: string, tokenizer: MorphTokenizer): RubyToken[] {
  if (!text) return [];
  const pref = buildPreferred();
  const out: RubyToken[] = [];
  let i = 0;
  while (i < text.length) {
    const ctx = contextHit(text, i);
    if (ctx) {
      emitSurface(out, text.slice(i, i + ctx.len), ctx.reading);
      i += ctx.len;
      continue;
    }
    const hit = preferredAt(text, i, pref);
    if (hit) {
      emitSurface(out, text.slice(i, i + hit.len), hit.reading);
      i += hit.len;
      continue;
    }
    let j = i + 1;
    while (j < text.length && !preferredAt(text, j, pref) && !contextHit(text, j)) j++;
    emitGap(out, text.slice(i, j), tokenizer);
    i = j;
  }
  return out;
}

/** Joined ruby text, for tests and the review table. Kana with no ruby is omitted. */
export function joinedRuby(tokens: RubyToken[]): string {
  return tokens.map((t) => t.ruby ?? "").join("");
}

interface KuromojiModule {
  builder: (opts: { dicPath: string }) => {
    build: (cb: (err: Error | null, tokenizer: MorphTokenizer) => void) => void;
  };
}

let loading: Promise<MorphTokenizer> | null = null;

function dictUrl(): string {
  const base = import.meta.env?.BASE_URL ?? "/";
  return publicAsset(base, "kuromoji").replace(/\/$/, "");
}

async function readDictBuffers(dicUrl: string): Promise<Map<string, ArrayBuffer>> {
  const out = new Map<string, ArrayBuffer>();
  const cache = typeof caches !== "undefined" ? await caches.open(CACHE_NAME) : null;
  await Promise.all(
    DICT_FILES.map(async (file) => {
      const url = `${dicUrl}/${file}`;
      let res = cache ? await cache.match(url) : undefined;
      if (!res) {
        res = await fetch(url);
        if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
        if (cache) await cache.put(url, res.clone());
      }
      out.set(file, await res.arrayBuffer());
    }),
  );
  return out;
}

/**
 * Serve dictionary bytes to kuromoji's XHR loader, including after the
 * network is gone. Other requests still use the real XMLHttpRequest.
 */
function installDictXHR(buffers: Map<string, ArrayBuffer>): () => void {
  const Orig = globalThis.XMLHttpRequest;
  function Patched(this: XMLHttpRequest) {
    const inner = new Orig();
    let dictName: string | null = null;
    const self = this as XMLHttpRequest & {
      onload: ((this: XMLHttpRequest, ev: ProgressEvent) => void) | null;
      onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => void) | null;
    };
    self.responseType = "";
    self.status = 0;
    self.response = null;
    self.onload = null;
    self.onerror = null;
    self.open = (_method: string, url: string) => {
      const name = url.split("?")[0]?.split("/").pop() ?? "";
      if (buffers.has(name)) {
        dictName = name;
        return;
      }
      dictName = null;
      inner.open(_method, url, true);
    };
    self.send = () => {
      if (dictName) {
        self.status = 200;
        self.response = buffers.get(dictName) ?? null;
        queueMicrotask(() => self.onload?.call(self, new ProgressEvent("load")));
        return;
      }
      inner.responseType = self.responseType;
      inner.onload = () => {
        self.status = inner.status;
        self.response = inner.response;
        self.onload?.call(self, new ProgressEvent("load"));
      };
      inner.onerror = () => self.onerror?.call(self, new ProgressEvent("error"));
      inner.send();
    };
    return self;
  }
  globalThis.XMLHttpRequest = Patched as unknown as typeof XMLHttpRequest;
  return () => {
    globalThis.XMLHttpRequest = Orig;
  };
}

export function loadDiaryTokenizer(): Promise<MorphTokenizer> {
  if (!loading) {
    loading = (async () => {
      const dicUrl = dictUrl();
      const buffers = await readDictBuffers(dicUrl);
      const mod = (await import("kuromoji/build/kuromoji.js")) as KuromojiModule & { default?: KuromojiModule };
      const kuromoji = mod.builder ? mod : mod.default;
      if (!kuromoji) throw new Error("kuromoji failed to load");
      const restore = installDictXHR(buffers);
      try {
        return await new Promise<MorphTokenizer>((resolve, reject) => {
          kuromoji.builder({ dicPath: dicUrl }).build((err, tokenizer) => {
            if (err || !tokenizer) reject(err ?? new Error("kuromoji build failed"));
            else resolve(tokenizer);
          });
        });
      } finally {
        restore();
      }
    })().catch((err) => {
      loading = null;
      throw err;
    });
  }
  return loading;
}

export async function annotateDiaryFurigana(text: string): Promise<RubyToken[]> {
  const tokenizer = await loadDiaryTokenizer();
  return annotateWithTokenizer(text, tokenizer);
}
