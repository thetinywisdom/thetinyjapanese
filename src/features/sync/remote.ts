import { supabase } from "@/integrations/supabase/client";
import type { DiaryEntry } from "@/features/diary/storage";
import type { FullSnapshot, StateSnapshot } from "./types";
import { emptyState } from "./snapshot";

/** Rough cap per diary row so one huge drawing cannot break the whole sync. */
const MAX_ENTRY_CHARS = 900_000;

interface DiaryRow {
  id: string;
  date_iso: string;
  text: string;
  direction: string;
  items: unknown;
  strokes: unknown;
  drawing: string;
  drawing_base: string | null;
  entry_updated_at: number;
}

function rowToEntry(r: DiaryRow): DiaryEntry {
  return {
    id: r.id,
    dateISO: r.date_iso,
    drawing: r.drawing ?? "",
    text: r.text ?? "",
    direction: r.direction === "horizontal" ? "horizontal" : "vertical",
    items: (r.items as DiaryEntry["items"]) ?? [],
    strokes: (r.strokes as DiaryEntry["strokes"]) ?? [],
    drawingBase: r.drawing_base ?? undefined,
    updatedAt: Number(r.entry_updated_at) || 0,
  };
}

function entryToRow(userId: string, e: DiaryEntry) {
  let drawing = e.drawing ?? "";
  let drawingBase = e.drawingBase ?? null;
  if (drawing.length + (drawingBase?.length ?? 0) > MAX_ENTRY_CHARS) {
    drawing = "";
    drawingBase = null;
  }
  return {
    user_id: userId,
    id: e.id,
    date_iso: e.dateISO,
    text: e.text ?? "",
    direction: e.direction ?? "vertical",
    items: e.items ?? [],
    strokes: e.strokes ?? [],
    drawing,
    drawing_base: drawingBase,
    entry_updated_at: e.updatedAt ?? 0,
  };
}

export async function fetchRemote(userId: string): Promise<FullSnapshot> {
  const [stateRes, diaryRes] = await Promise.all([
    supabase.from("user_state").select("data").eq("user_id", userId).maybeSingle(),
    supabase.from("diary_entries").select("*").eq("user_id", userId),
  ]);
  if (stateRes.error) throw stateRes.error;
  if (diaryRes.error) throw diaryRes.error;

  const raw = stateRes.data?.data as unknown;
  const state: StateSnapshot =
    raw && typeof raw === "object" ? { ...emptyState(), ...(raw as StateSnapshot) } : emptyState();
  const diary = ((diaryRes.data ?? []) as unknown as DiaryRow[]).map(rowToEntry);
  return { state, diary };
}

export async function pushRemote(userId: string, snap: FullSnapshot): Promise<number> {
  const stateRes = await supabase
    .from("user_state")
    .upsert({ user_id: userId, data: snap.state as unknown as never }, { onConflict: "user_id" });
  if (stateRes.error) throw stateRes.error;

  let skipped = 0;
  for (const entry of snap.diary) {
    const row = entryToRow(userId, entry);
    if (!row.drawing && entry.drawing) skipped += 1;
    const { error } = await supabase
      .from("diary_entries")
      .upsert(row as unknown as never, { onConflict: "user_id,id" });
    if (error) throw error;
  }

  // Remove remote entries the learner deleted locally.
  const ids = snap.diary.map((e) => e.id);
  const del = ids.length
    ? await supabase
        .from("diary_entries")
        .delete()
        .eq("user_id", userId)
        .not("id", "in", `(${ids.map((i) => `"${i}"`).join(",")})`)
    : await supabase.from("diary_entries").delete().eq("user_id", userId);
  if (del.error) throw del.error;

  return skipped;
}
