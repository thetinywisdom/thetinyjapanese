import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DiaryCanvas, type DiaryCanvasHandle, type Stroke } from "@/components/diary/DiaryCanvas";
import { DiaryToolbar, CRAYON_COLORS, type DiaryTool } from "@/components/diary/DiaryToolbar";
import { type KanaMode } from "@/components/diary/DiaryTextToolbar";
import { DiaryPaper } from "@/components/diary/DiaryPaper";
import { DiaryStage, newItemId, type PctRect } from "@/components/diary/DiaryStage";
import {
  CANVAS_H,
  CANVAS_W,
  hitStroke,
  strokeBounds,
  translateStroke,
} from "@/features/diary/stroke-select";
import {
  getEntry,
  saveEntry,
  type DiaryEntry as Entry,
  type DiaryItem,
  type WritingDirection,
} from "@/features/diary/storage";

/** Read a file into a PNG/JPEG data URL, capped at 900px on the long edge. */
function fileToDataURL(file: File): Promise<{ src: string; ratio: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve({ src: c.toDataURL("image/png"), ratio: img.height / img.width });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const KANA_MODE_KEY = "lovable.diary.kanaMode";

function loadKanaMode(): KanaMode {
  if (typeof window === "undefined") return "hiragana";
  const raw = window.localStorage.getItem(KANA_MODE_KEY);
  return raw === "katakana" || raw === "romaji" ? raw : "hiragana";
}

function saveKanaMode(mode: KanaMode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KANA_MODE_KEY, mode);
}

const DiaryEntryPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();

  const [entry, setEntry] = useState<Entry | null>(null);
  const [baseImage, setBaseImage] = useState<string>("");
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  const [color, setColor] = useState(CRAYON_COLORS[0].value);
  const [size, setSize] = useState(12);
  const [tool, setTool] = useState<DiaryTool>("select");
  const [kanaMode, setKanaMode] = useState<KanaMode>("hiragana");
  const [saved, setSaved] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedStrokes, setSelectedStrokes] = useState<number[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const clearSelection = () => {
    setSelectedIds([]);
    setSelectedStrokes([]);
  };

  const canvasRef = useRef<DiaryCanvasHandle>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const entryRef = useRef<Entry | null>(null);
  entryRef.current = entry;

  useEffect(() => {
    const found = getEntry(id);
    if (!found) {
      navigate("/diary", { replace: true });
      return;
    }
    setEntry(found);
    setStrokes(found.strokes ?? []);
    setBaseImage(found.strokes ? (found.drawingBase ?? "") : found.drawing);
    setKanaMode(loadKanaMode());
  }, [id, navigate]);

  useEffect(() => {
    if (tool !== "select") setSelectedStrokes([]);
  }, [tool]);

  const items = entry?.items ?? [];
  const setItems = (next: DiaryItem[]) =>
    setEntry((prev) => (prev ? { ...prev, items: next } : prev));

  // ---- Undo / redo history covering strokes AND canvas objects ----
  type Snapshot = { strokes: Stroke[]; items: DiaryItem[]; baseImage: string };
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  const snapRef = useRef<Snapshot>({ strokes: [], items: [], baseImage: "" });
  snapRef.current = { strokes, items, baseImage };

  /** Record the current state before a change so it can be undone. */
  const commit = useCallback(() => {
    setPast((p) => [...p.slice(-49), snapRef.current]);
    setFuture([]);
  }, []);

  const applySnapshot = (s: Snapshot) => {
    setStrokes(s.strokes);
    setBaseImage(s.baseImage);
    setEntry((prev) => (prev ? { ...prev, items: s.items, drawing: s.baseImage } : prev));
    setSelectedIds([]);
    setSelectedStrokes([]);
  };

  const undo = () => {
    if (past.length === 0) return;
    const s = past[past.length - 1];
    setPast(past.slice(0, -1));
    setFuture([...future, snapRef.current]);
    applySnapshot(s);
  };

  const redo = () => {
    if (future.length === 0) return;
    const s = future[future.length - 1];
    setFuture(future.slice(0, -1));
    setPast([...past, snapRef.current]);
    applySnapshot(s);
  };



  const addText = () => {
    const item: DiaryItem = {
      id: newItemId(),
      kind: "text",
      x: 12,
      y: 12,
      w: 50,
      h: 0,
      text: "テキスト",
      fontSize: 6,
      color: color,
    };
    commit();
    setItems([...items, item]);
    setSelectedIds([item.id]);
    setSelectedStrokes([]);
  };

  const addImageFiles = async (files: FileList | File[]) => {
    const picked = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (picked.length === 0) return;
    try {
      const loaded = await Promise.all(picked.map(fileToDataURL));
      const next = loaded.map(({ src, ratio }, i) => ({
        id: newItemId(),
        kind: "image" as const,
        x: 10 + i * 4,
        y: 10 + i * 4,
        w: 40,
        h: (40 * ratio * 4) / 3, // canvas is 4:3, so % height differs from % width
        src,
      }));
      commit();
      setItems([...items, ...next]);
      setSelectedIds(next.map((n) => n.id));
      setSelectedStrokes([]);
    } catch {
      toast.error("Couldn't add that image.");
    }
  };

  /** Duplicate everything selected (objects and pen strokes). */
  const duplicateSelection = () => {
    if (selectedIds.length === 0 && selectedStrokes.length === 0) return;
    commit();
    const copies = items
      .filter((i) => selectedIds.includes(i.id))
      .map((i) => ({ ...i, id: newItemId(), x: i.x + 4, y: i.y + 4 }));
    if (copies.length > 0) setItems([...items, ...copies]);
    const strokeCopies = selectedStrokes
      .map((i) => strokes[i])
      .filter(Boolean)
      .map((st) => translateStroke(st, 30, 30));
    if (strokeCopies.length > 0) {
      setStrokes((prev) => [...prev, ...strokeCopies]);
      setSelectedStrokes(strokeCopies.map((_, i) => strokes.length + i));
    }
    setSelectedIds(copies.map((c) => c.id));
  };

  const removeSelection = () => {
    if (selectedIds.length === 0 && selectedStrokes.length === 0) return;
    commit();
    if (selectedIds.length > 0) setItems(items.filter((i) => !selectedIds.includes(i.id)));
    if (selectedStrokes.length > 0)
      setStrokes((prev) => prev.filter((_, i) => !selectedStrokes.includes(i)));
    clearSelection();
  };

  // ---- Selecting and moving objects + pen strokes together ----
  const dragBase = useRef<{ items: DiaryItem[]; strokes: Stroke[] } | null>(null);

  /** Pointer went down on empty space: select a stroke there, if any. */
  const onStageBackgroundDown = (pct: { x: number; y: number }, additive: boolean) => {
    if (tool !== "select") return false;
    const hit = hitStroke(strokes, (pct.x / 100) * CANVAS_W, (pct.y / 100) * CANVAS_H);
    if (hit === null) return false;
    if (additive) {
      setSelectedStrokes((prev) => (prev.includes(hit) ? prev : [...prev, hit]));
    } else if (!selectedStrokes.includes(hit)) {
      setSelectedStrokes([hit]);
      setSelectedIds([]);
    }
    return true;
  };

  const onDragStart = () => {
    commit();
    dragBase.current = { items, strokes };
  };

  const onMoveSelection = (dx: number, dy: number) => {
    const base = dragBase.current;
    if (!base) return;
    if (selectedIds.length > 0) {
      setItems(
        base.items.map((i) =>
          selectedIds.includes(i.id)
            ? {
                ...i,
                x: Math.min(98, Math.max(-20, i.x + dx)),
                y: Math.min(98, Math.max(-20, i.y + dy)),
              }
            : i,
        ),
      );
    }
    if (selectedStrokes.length > 0) {
      const cdx = (dx / 100) * CANVAS_W;
      const cdy = (dy / 100) * CANVAS_H;
      setStrokes(
        base.strokes.map((st, i) => (selectedStrokes.includes(i) ? translateStroke(st, cdx, cdy) : st)),
      );
    }
  };

  const marqueeBase = useRef<{ ids: string[]; strokes: number[] }>({ ids: [], strokes: [] });

  const onMarqueeStart = () => {
    marqueeBase.current = { ids: selectedIds, strokes: selectedStrokes };
  };

  const onMarquee = (rect: PctRect, itemIds: string[], additive: boolean) => {
    const hits: number[] = [];
    strokes.forEach((st, i) => {
      const b = strokeBounds(st);
      if (!b) return;
      const x = (b.x / CANVAS_W) * 100;
      const y = (b.y / CANVAS_H) * 100;
      const w = (b.w / CANVAS_W) * 100;
      const h = (b.h / CANVAS_H) * 100;
      if (x < rect.x + rect.w && x + w > rect.x && y < rect.y + rect.h && y + h > rect.y) hits.push(i);
    });
    const base = marqueeBase.current;
    setSelectedIds(additive ? Array.from(new Set([...base.ids, ...itemIds])) : itemIds);
    setSelectedStrokes(additive ? Array.from(new Set([...base.strokes, ...hits])) : hits);
  };

  const selectItem = (id: string | null, additive?: boolean) => {
    if (id === null) {
      clearSelection();
      return;
    }
    setSelectedIds((prev) =>
      additive ? (prev.includes(id) ? prev : [...prev, id]) : [id],
    );
    if (!additive) setSelectedStrokes([]);
  };

  // Keyboard: delete / duplicate / select all.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedIds(items.map((i) => i.id));
        setSelectedStrokes(strokes.map((_, i) => i));
      } else if (mod && (e.key.toLowerCase() === "c" || e.key.toLowerCase() === "d")) {
        e.preventDefault();
        duplicateSelection();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length === 0 && selectedStrokes.length === 0) return;
        e.preventDefault();
        removeSelection();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Paste images straight from the system clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length > 0) {
        e.preventDefault();
        void addImageFiles(files);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  });

  const strokesRef = useRef<Stroke[]>([]);
  strokesRef.current = strokes;
  const baseImageRef = useRef("");
  baseImageRef.current = baseImage;

  const persist = useCallback(() => {
    const prev = entryRef.current;
    if (!prev) return;
    const next: Entry = {
      ...prev,
      drawing: canvasRef.current?.toDataURL() ?? prev.drawing,
      strokes: strokesRef.current,
      drawingBase: baseImageRef.current,
      updatedAt: Date.now(),
    };
    if (!saveEntry(next)) {
      toast.error("Couldn't save — this device's storage is full.");
      return;
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }, []);

  // Autosave a moment after the last change.
  useEffect(() => {
    if (!entry) return;
    const t = window.setTimeout(persist, 800);
    return () => window.clearTimeout(t);
  }, [entry?.text, entry?.direction, entry?.dateISO, entry?.items, strokes, persist, entry]);




  /** Render the diary paper to a PNG data URL, hiding the toolbars during capture. */
  const renderPaperPng = async (): Promise<string | null> => {
    if (!paperRef.current) return null;
    const { toPng } = await import("html-to-image");
    const node = paperRef.current;
    node.classList.add("diary-exporting");
    // Let the layout settle after the toolbars are hidden so the capture is tight.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      return await toPng(node, { pixelRatio: 2, cacheBust: true });
    } finally {
      node.classList.remove("diary-exporting");
    }
  };

  /** Shrink the capture into a compact JPEG so the phone link stays light. */
  const toCompactJpeg = (png: string): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode"));
      img.onload = () => {
        const max = 1400;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = png;
    });

  const download = async () => {
    try {
      const png = await renderPaperPng();
      if (!png) return;
      const a = document.createElement("a");
      a.href = png;
      a.download = `enikki-${entry?.dateISO ?? "entry"}.png`;
      a.click();
    } catch {
      toast.error("Couldn't create the image. Please try again.");
    }
  };

  /** Host a copy of the image and show a QR code that opens the download link. */
  const shareQr = async () => {
    if (shareBusy) return;
    setShareBusy(true);
    try {
      const png = await renderPaperPng();
      if (!png) return;
      const jpeg = await toCompactJpeg(png);
      const { data, error } = await supabase.functions.invoke("diary-share", {
        body: { image: jpeg },
      });
      const url: unknown = (data as { url?: unknown } | null)?.url;
      if (error || typeof url !== "string" || url.length === 0) throw new Error("share");
      const qr = await QRCode.toDataURL(url, { width: 512, margin: 2 });
      setQrDataUrl(qr);
      setShareOpen(true);
    } catch {
      toast.error("Couldn't create the QR code. Please try again.");
    } finally {
      setShareBusy(false);
    }
  };

  if (!entry) return null;

  const setDirection = (direction: WritingDirection) =>
    setEntry((prev) => (prev ? { ...prev, direction } : prev));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/diary"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All entries
          </Link>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-xs text-muted-foreground transition-opacity",
                saved ? "opacity-100" : "opacity-0",
              )}
            >
              Saved
            </span>
            <Button variant="outline" size="sm" onClick={download} className="gap-1">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={shareQr}
              disabled={shareBusy}
              className="gap-1"
            >
              <QrCode className="h-4 w-4" /> QR code
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs text-muted-foreground inline-flex items-center gap-2">
            Date
            <input
              type="date"
              value={entry.dateISO}
              onChange={(e) => setEntry({ ...entry, dateISO: e.target.value })}
              className="h-8 rounded-md border bg-card px-2 text-xs text-foreground"
            />
          </label>

        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void addImageFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <DiaryPaper
          ref={paperRef}
          dateISO={entry.dateISO}
          direction={entry.direction}
          text={entry.text}
          kanaMode={kanaMode}
          onText={(text) => setEntry({ ...entry, text })}
          onKanaMode={(m) => {
            setKanaMode(m);
            saveKanaMode(m);
          }}
          onDirection={setDirection}
          toolbar={
            <DiaryToolbar
              color={color}
              size={size}
              tool={tool}
              canUndo={past.length > 0}
              canRedo={future.length > 0}
              onColor={setColor}
              onSize={setSize}
              onTool={setTool}
              onUndo={undo}
              onRedo={redo}
              onClear={() => {
                commit();
                setStrokes([]);
                setBaseImage("");
                clearSelection();
                setEntry((prev) => (prev ? { ...prev, drawing: "", items: [] } : prev));
              }}
              onImage={() => fileRef.current?.click()}
              onText={addText}
              onCopy={duplicateSelection}
              hasSelection={selectedIds.length > 0 || selectedStrokes.length > 0}
            />
          }
          canvas={
            <DiaryStage
              items={items}
              selectedIds={selectedIds}
              onSelect={selectItem}
              onChange={setItems}
              onCommit={commit}
              onBackgroundPointerDown={onStageBackgroundDown}
              onDragStart={onDragStart}
              onMoveSelection={onMoveSelection}
              onMarqueeStart={onMarqueeStart}
              onMarquee={onMarquee}
              selectionDisabled={tool !== "select"}
              className="rounded-t-none border-t-0 diary-export-top"
            >
              <DiaryCanvas
                ref={canvasRef}
                strokes={strokes}
                color={color}
                size={size}
                erasing={tool === "eraser"}
                disabled={tool === "select"}
                background={baseImage || undefined}
                onStrokeStart={commit}
                onStrokeComplete={(s) => setStrokes((prev) => [...prev, s])}
              />
              {tool === "select" &&
                selectedStrokes.map((idx) => {
                  const st = strokes[idx];
                  const b = st && strokeBounds(st);
                  if (!b) return null;
                  return (
                    <span
                      key={idx}
                      aria-hidden
                      className="pointer-events-none absolute rounded-sm border-2 border-dashed border-[hsl(var(--accent))]"
                      style={{
                        left: `${(b.x / CANVAS_W) * 100}%`,
                        top: `${(b.y / CANVAS_H) * 100}%`,
                        width: `${(b.w / CANVAS_W) * 100}%`,
                        height: `${(b.h / CANVAS_H) * 100}%`,
                      }}
                    />
                  );
                })}
            </DiaryStage>
          }

        />

      </main>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader className="text-center sm:text-center sm:items-center">
            <DialogTitle>Scan to download</DialogTitle>
            <DialogDescription>
              Scan this code with your phone camera to download the diary image. The link
              works for 7 days.
            </DialogDescription>
          </DialogHeader>
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR code to download this diary image"
              className="mx-auto h-56 w-56 rounded-md border bg-white p-2"
            />
          ) : (
            <div className="mx-auto h-56 w-56 animate-pulse rounded-md bg-muted" />
          )}
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
};

export default DiaryEntryPage;
