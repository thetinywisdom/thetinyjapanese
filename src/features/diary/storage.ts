export type WritingDirection = "horizontal" | "vertical";

/** An image or text object placed on top of the drawing. */
export interface DiaryItem {
  id: string;
  kind: "image" | "text";
  /** Position/size as a percentage of the canvas box. */
  x: number;
  y: number;
  /** Width in % of canvas width. */
  w: number;
  /** Height in % of canvas height (images only). */
  h: number;
  /** Data URL (images only). */
  src?: string;
  /** Text content (text only). */
  text?: string;
  /** Font size in % of canvas width (text only). */
  fontSize?: number;
  color?: string;
}

/** One freehand pen/eraser stroke in canvas units (1200x900). */
export interface DiaryStroke {
  color: string;
  size: number;
  erase: boolean;
  points: { x: number; y: number }[];
}

export interface DiaryEntry {
  id: string;
  /** ISO date (yyyy-mm-dd) shown in the Japanese header line. */
  dateISO: string;
  /** PNG data URL of the drawing (empty string when nothing drawn yet). */
  drawing: string;
  text: string;
  direction: WritingDirection;
  items?: DiaryItem[];
  /** Editable pen strokes (newer entries). */
  strokes?: DiaryStroke[];
  /** Flattened drawing captured before strokes became editable. */
  drawingBase?: string;
  updatedAt: number;
}


const KEY = "lovable.diary.entries";

type DiaryListener = () => void;
const diaryListeners = new Set<DiaryListener>();

/** Subscribe to any local diary change (save / delete / bulk replace). */
export function subscribeDiary(fn: DiaryListener): () => void {
  diaryListeners.add(fn);
  return () => {
    diaryListeners.delete(fn);
  };
}

function notifyDiary() {
  diaryListeners.forEach((fn) => fn());
}

export function loadEntries(): DiaryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as DiaryEntry[]).sort(
      (a, b) => b.dateISO.localeCompare(a.dateISO) || b.updatedAt - a.updatedAt
    );
  } catch {
    return [];
  }
}

function persist(entries: DiaryEntry[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries));
    notifyDiary();
    return true;
  } catch {
    return false;
  }
}

/** Overwrite the whole local diary. */
export function replaceAllEntries(entries: DiaryEntry[]): boolean {
  return persist(
    [...entries].sort(
      (a, b) => b.dateISO.localeCompare(a.dateISO) || b.updatedAt - a.updatedAt
    )
  );
}

export function getEntry(id: string): DiaryEntry | undefined {
  return loadEntries().find((e) => e.id === id);
}

export function saveEntry(entry: DiaryEntry): boolean {
  const entries = loadEntries().filter((e) => e.id !== entry.id);
  entries.unshift(entry);
  return persist(entries);
}

export function deleteEntry(id: string): void {
  persist(loadEntries().filter((e) => e.id !== id));
}


export function createEntry(): DiaryEntry {
  const now = new Date();
  return {
    id: `${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    dateISO: toISODate(now),
    drawing: "",
    text: "",
    direction: "vertical",
    updatedAt: now.getTime(),
  };
}

export function toISODate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** 2026年9月4日(金) */
export function formatJapaneseDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${y}年 ${m}月 ${d}日（${wd}）`;
}
