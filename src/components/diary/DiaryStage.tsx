import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { DiaryItem } from "@/features/diary/storage";

export interface PctRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  items: DiaryItem[];
  selectedIds: string[];
  onSelect: (id: string | null, additive?: boolean) => void;
  onChange: (items: DiaryItem[]) => void;
  /** Called just before a change begins, so the parent can record undo history. */
  onCommit?: () => void;
  /** Pointer went down on empty space — returns true when a pen stroke was hit there. */
  onBackgroundPointerDown?: (pct: { x: number; y: number }, additive: boolean) => boolean;
  /** A move drag started; the parent should snapshot the current state. */
  onDragStart?: () => void;
  /** Move every selected object by a delta measured in % of the stage. */
  onMoveSelection?: (dx: number, dy: number) => void;
  /** A marquee drag began; the parent should snapshot its current selection as the baseline. */
  onMarqueeStart?: () => void;
  /** A marquee updated/finished: item ids inside it, plus the rectangle for stroke hit-testing. */
  onMarquee?: (rect: PctRect, itemIds: string[], additive: boolean) => void;
  /** The drawing canvas. */
  children: ReactNode;
  readOnly?: boolean;
  /** Selection/marquee interactions are off (e.g. pen or eraser tool active). */
  selectionDisabled?: boolean;
  className?: string;
}

type DragState =
  | {
      mode: "move";
      startX: number;
      startY: number;
      rect: DOMRect;
    }
  | {
      mode: "resize";
      id: string;
      startX: number;
      item: DiaryItem;
      rect: DOMRect;
    }
  | null;

export function newItemId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function DiaryStage({
  items,
  selectedIds,
  onSelect,
  onChange,
  onCommit,
  onBackgroundPointerDown,
  onDragStart,
  onMoveSelection,
  onMarqueeStart,
  onMarquee,
  children,
  readOnly,
  selectionDisabled,
  className,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const drag = useRef<DragState>(null);
  const marqueeStart = useRef<{ x: number; y: number; additive: boolean } | null>(null);
  const [marquee, setMarquee] = useState<PctRect | null>(null);
  const [width, setWidth] = useState(600);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const update = (id: string, patch: Partial<DiaryItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const pctOf = (clientX: number, clientY: number, rect: DOMRect) => ({
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  });

  const startMove = (e: React.PointerEvent) => {
    const rect = stageRef.current!.getBoundingClientRect();
    onDragStart?.();
    drag.current = { mode: "move", startX: e.clientX, startY: e.clientY, rect };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const onItemDown = (e: React.PointerEvent, item: DiaryItem) => {
    if (readOnly || selectionDisabled || editingId === item.id) return;
    e.preventDefault();
    e.stopPropagation();
    if (!selectedIds.includes(item.id)) onSelect(item.id, e.shiftKey);
    startMove(e);
  };

  const onResizeDown = (e: React.PointerEvent, item: DiaryItem) => {
    if (readOnly || selectionDisabled) return;
    e.preventDefault();
    e.stopPropagation();
    onCommit?.();
    const rect = stageRef.current!.getBoundingClientRect();
    drag.current = { mode: "resize", id: item.id, startX: e.clientX, item, rect };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onRootDown = (e: React.PointerEvent) => {
    if (readOnly || selectionDisabled) return;
    const rect = stageRef.current!.getBoundingClientRect();
    const pct = pctOf(e.clientX, e.clientY, rect);
    const hitStrokeHere = onBackgroundPointerDown?.(pct, e.shiftKey) ?? false;
    if (hitStrokeHere) {
      startMove(e);
      return;
    }
    if (!e.shiftKey) onSelect(null);
    onMarqueeStart?.();
    marqueeStart.current = { x: pct.x, y: pct.y, additive: e.shiftKey };
    setMarquee({ x: pct.x, y: pct.y, w: 0, h: 0 });
  };

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) {
      const dx = ((e.clientX - d.startX) / d.rect.width) * 100;
      if (d.mode === "move") {
        const dy = ((e.clientY - d.startY) / d.rect.height) * 100;
        onMoveSelection?.(dx, dy);
      } else {
        const scale = Math.max(0.15, 1 + dx / Math.max(d.item.w, 5));
        if (d.item.kind === "image") {
          update(d.id, {
            w: Math.min(200, Math.max(5, d.item.w * scale)),
            h: Math.min(200, Math.max(5, d.item.h * scale)),
          });
        } else {
          update(d.id, {
            w: Math.min(200, Math.max(8, d.item.w * scale)),
            fontSize: Math.min(40, Math.max(2, (d.item.fontSize ?? 6) * scale)),
          });
        }
      }
      return;
    }

    const m = marqueeStart.current;
    if (m) {
      const stageRect = stageRef.current!.getBoundingClientRect();
      const p = pctOf(e.clientX, e.clientY, stageRect);
      const next = {
        x: Math.min(m.x, p.x),
        y: Math.min(m.y, p.y),
        w: Math.abs(p.x - m.x),
        h: Math.abs(p.y - m.y),
      };
      setMarquee(next);
      applyMarquee(next, m.additive);
    }
  };

  const applyMarquee = (rect: PctRect, additive: boolean) => {
    const stage = stageRef.current!.getBoundingClientRect();
    const ids: string[] = [];
    for (const [id, node] of nodeRefs.current) {
      const r = node.getBoundingClientRect();
      const x = ((r.left - stage.left) / stage.width) * 100;
      const y = ((r.top - stage.top) / stage.height) * 100;
      const w = (r.width / stage.width) * 100;
      const h = (r.height / stage.height) * 100;
      const overlaps =
        x < rect.x + rect.w && x + w > rect.x && y < rect.y + rect.h && y + h > rect.y;
      if (overlaps) ids.push(id);
    }
    onMarquee?.(rect, ids, additive);
  };

  const end = () => {
    drag.current = null;
    marqueeStart.current = null;
    setMarquee(null);
  };

  return (
    <div
      ref={stageRef}
      className={cn(
        "relative w-full aspect-[4/3] rounded-md border bg-card overflow-hidden",
        className,
      )}
      onPointerDown={onRootDown}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <div
            key={item.id}
            ref={(el) => {
              if (el) nodeRefs.current.set(item.id, el);
              else nodeRefs.current.delete(item.id);
            }}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.w}%`,
              height: item.kind === "image" ? `${item.h}%` : undefined,
            }}
            className={cn(
              "absolute touch-none",
              readOnly || selectionDisabled ? "pointer-events-none" : "cursor-move",
              selected && !readOnly && "outline outline-2 outline-[hsl(var(--accent))]",
            )}
            onPointerDown={(e) => onItemDown(e, item)}
            onDoubleClick={() => item.kind === "text" && !readOnly && setEditingId(item.id)}
          >
            {item.kind === "image" ? (
              <img
                src={item.src}
                alt="Diary sticker"
                draggable={false}
                className="h-full w-full object-contain select-none pointer-events-none"
              />
            ) : editingId === item.id ? (
              <textarea
                autoFocus
                value={item.text ?? ""}
                lang="ja"
                onPointerDown={(e) => e.stopPropagation()}
                onFocus={() => onCommit?.()}
                onChange={(e) => update(item.id, { text: e.target.value })}
                onBlur={() => setEditingId(null)}
                style={{
                  fontSize: `${((item.fontSize ?? 6) / 100) * width}px`,
                  color: item.color,
                }}
                className="font-jp w-full resize-none bg-transparent outline-none leading-tight"
                rows={Math.max(1, (item.text ?? "").split("\n").length)}
              />
            ) : (
              <p
                lang="ja"
                style={{
                  fontSize: `${((item.fontSize ?? 6) / 100) * width}px`,
                  color: item.color,
                }}
                className="font-jp leading-tight whitespace-pre-wrap break-words select-none"
              >
                {item.text || "テキスト"}
              </p>
            )}

            {selected && selectedIds.length === 1 && !readOnly && (
              <span
                role="presentation"
                onPointerDown={(e) => onResizeDown(e, item)}
                className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border-2 border-[hsl(var(--accent))] bg-background cursor-nwse-resize"
              />
            )}
          </div>
        );
      })}

      {/* Drawing layer sits on top so pen strokes go over images. */}
      {children}

      {marquee && (marquee.w > 0.5 || marquee.h > 0.5) && (
        <span
          aria-hidden
          className="pointer-events-none absolute border border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.12)]"
          style={{
            left: `${marquee.x}%`,
            top: `${marquee.y}%`,
            width: `${marquee.w}%`,
            height: `${marquee.h}%`,
          }}
        />
      )}
    </div>
  );
}
