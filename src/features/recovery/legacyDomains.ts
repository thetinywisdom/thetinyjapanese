import type { FullSnapshot, StateSnapshot } from "@/features/sync/types";
import type { DiaryEntry } from "@/features/diary/storage";
import { PREF_KEYS, emptyState, readLocalSnapshot, writeLocalSnapshot } from "@/features/sync/snapshot";
import { mergeState, mergeDiary } from "@/features/sync/merge";

/**
 * The app used to live on other domains. localStorage is per-origin, so a
 * learner who used an older address still has their progress there. We embed a
 * tiny bridge page from each old origin and pull whatever it can still read.
 */
export const LEGACY_ORIGINS = [
  "https://japanese.thetinywisdom.com",
  "https://thetinyjapanese.com",
  "https://www.thetinyjapanese.com",
  "https://tinyjapanese.com",
  "https://www.tinyjapanese.com",
];

const DONE_KEY = "tk.legacy-import.v1";
const BRIDGE_PATH = "/legacy-bridge.html";
const TIMEOUT_MS = 6000;

type RawStore = Record<string, string>;

function parse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Turn a raw localStorage dump from an old origin into an app snapshot. */
export function snapshotFromRaw(raw: RawStore): FullSnapshot {
  const base = emptyState();
  const prefs: Record<string, string> = {};
  for (const key of PREF_KEYS) {
    const v = raw[key];
    if (v != null) prefs[key] = v;
  }
  const state: StateSnapshot = {
    ...base,
    updatedAt: 0,
    progress: {
      verb: parse(raw["tk.progress.v1.verbs"], {}),
      kanji: parse(raw["tk.progress.v1.kanji"], {}),
      "kanji-remember": parse(raw["tk.progress.v1.kanji-remember"], {}),
      "kanji-write": parse(raw["tk.progress.v1.kanji-write"], {}),
    },
    sessions: parse(raw["tk.progress.v1.sessions"], []),
    streak: parse(raw["tk.progress.v1.streak"], base.streak),
    clearedKanji: parse(raw["tk.progress.v1.cleared-kanji"], [] as string[]),
    kanjiStreaks: parse(raw["tk.progress.v1.kanji-streak"], {}),
    prefs,
  };
  const diary = parse(raw["lovable.diary.entries"], [] as DiaryEntry[]);
  return { state, diary };
}

export function snapshotIsEmpty(snap: FullSnapshot): boolean {
  const p = snap.state.progress;
  const items =
    Object.keys(p.verb).length +
    Object.keys(p.kanji).length +
    Object.keys(p["kanji-remember"]).length +
    Object.keys(p["kanji-write"]).length;
  return items === 0 && snap.diary.length === 0 && snap.state.sessions.length === 0;
}

function fetchFromOrigin(origin: string): Promise<RawStore> {
  return new Promise((resolve) => {
    if (origin === window.location.origin) return resolve({});
    let settled = false;
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none";
    iframe.src = `${origin}${BRIDGE_PATH}`;

    const finish = (data: RawStore) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      iframe.remove();
      resolve(data);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin) return;
      const d = event.data as { type?: string; data?: RawStore } | null;
      if (!d || typeof d !== "object") return;
      if (d.type === "tk-legacy-storage-ready") {
        iframe.contentWindow?.postMessage({ type: "tk-legacy-storage-request" }, origin);
        return;
      }
      if (d.type === "tk-legacy-storage") finish(d.data ?? {});
    };

    const timer = window.setTimeout(() => finish({}), TIMEOUT_MS);
    window.addEventListener("message", onMessage);
    iframe.addEventListener("load", () => {
      iframe.contentWindow?.postMessage({ type: "tk-legacy-storage-request" }, origin);
    });
    iframe.addEventListener("error", () => finish({}));
    document.body.appendChild(iframe);
  });
}

/**
 * Pull progress from the old domains and merge it into this device's data.
 * Runs at most once per browser. Returns true when something was recovered.
 */
export async function importLegacyDomains(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(DONE_KEY)) return false;
  } catch {
    return false;
  }

  const results = await Promise.all(LEGACY_ORIGINS.map((o) => fetchFromOrigin(o)));

  let merged = readLocalSnapshot();
  let recovered = false;
  for (const raw of results) {
    if (!raw || Object.keys(raw).length === 0) continue;
    const remote = snapshotFromRaw(raw);
    if (snapshotIsEmpty(remote)) continue;
    merged = {
      state: mergeState(merged.state, remote.state),
      diary: mergeDiary(merged.diary, remote.diary),
    };
    recovered = true;
  }

  if (recovered) writeLocalSnapshot(merged);
  try {
    localStorage.setItem(DONE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
  return recovered;
}
