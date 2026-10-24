import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import type { Pt } from "@/lib/svg-path-sample";
import { STROKE_VIEWBOX } from "@/data/kanji-strokes";

export interface WritingCanvasHandle {
  clearAll: () => void;
  shake: () => void;
  replay: (strokes: string[], speedMs?: number) => Promise<void>;
}

interface Props {
  /** Accepted strokes already inked, as raw user point arrays in viewBox space. */
  acceptedUserStrokes: Pt[][];
  /** Optional ghost path of the next expected stroke (SVG `d`). */
  ghostPath?: string | null;
  /** Optional faded preview of all strokes (gray, for full hint). */
  templatePaths?: string[];
  onStrokeComplete: (points: Pt[]) => void;
  disabled?: boolean;
}

const SIZE = 320; // CSS px; canvas backs with dpr

export const WritingCanvas = forwardRef<WritingCanvasHandle, Props>(function WritingCanvas(
  { acceptedUserStrokes, ghostPath, templatePaths, onStrokeComplete, disabled },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const replayTokenRef = useRef(0);
  const drawingRef = useRef<{ active: boolean; pts: Pt[]; pointerId: number | null }>({
    active: false,
    pts: [],
    pointerId: null,
  });

  function themeColor(name: string, fallback: string): string {
    const canvas = canvasRef.current;
    if (!canvas) return fallback;
    const value = getComputedStyle(canvas).getPropertyValue(name).trim();
    return value ? `hsl(${value})` : fallback;
  }

  // Draw accepted strokes whenever they change.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = SIZE * dpr;
    c.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawAccepted(ctx, acceptedUserStrokes);
  }, [acceptedUserStrokes]);

  function toCanvas(pt: Pt): Pt {
    return { x: (pt.x / STROKE_VIEWBOX) * SIZE, y: (pt.y / STROKE_VIEWBOX) * SIZE };
  }
  function toViewBox(clientX: number, clientY: number): Pt {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * STROKE_VIEWBOX,
      y: ((clientY - rect.top) / rect.height) * STROKE_VIEWBOX,
    };
  }

  function drawAccepted(ctx: CanvasRenderingContext2D, strokes: Pt[][]) {
    ctx.strokeStyle = themeColor("--foreground", "hsl(0 0% 10%)");
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      const p0 = toCanvas(stroke[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < stroke.length; i++) {
        const p = toCanvas(stroke[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }

  function drawCurrent() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawAccepted(ctx, acceptedUserStrokes);
    const pts = drawingRef.current.pts;
    if (pts.length >= 2) {
      ctx.strokeStyle = themeColor("--accent", "hsl(15 85% 55%)");
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      const p0 = toCanvas(pts[0]);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < pts.length; i++) {
        const p = toCanvas(pts[i]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
  }

  useImperativeHandle(ref, () => ({
    clearAll: () => {
      replayTokenRef.current++;
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, SIZE, SIZE);
    },
    shake: () => {
      const el = canvasRef.current?.parentElement;
      if (!el) return;
      el.classList.remove("animate-shake");
      // force reflow
      void el.offsetWidth;
      el.classList.add("animate-shake");
    },
    replay: async (strokes: string[], speedMs = 450) => {
      const { sample } = await import("@/lib/svg-path-sample");
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const token = ++replayTokenRef.current;
      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.strokeStyle = themeColor("--foreground", "hsl(0 0% 10%)");
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const d of strokes) {
        if (replayTokenRef.current !== token) return;
        const pts = sample(d, 48).map(toCanvas);
        const start = performance.now();
        await new Promise<void>((resolve) => {
          const step = (now: number) => {
            if (replayTokenRef.current !== token) { resolve(); return; }
            const t = Math.min(1, (now - start) / speedMs);
            const upto = Math.max(2, Math.floor(t * pts.length));
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < upto; i++) ctx.lineTo(pts[i].x, pts[i].y);
            ctx.stroke();
            if (t < 1) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        });
      }
    },
  }));

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawingRef.current = {
      active: true,
      pts: [toViewBox(e.clientX, e.clientY)],
      pointerId: e.pointerId,
    };
    drawCurrent();
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active) return;
    if (e.pointerId !== drawingRef.current.pointerId) return;
    const p = toViewBox(e.clientX, e.clientY);
    const last = drawingRef.current.pts[drawingRef.current.pts.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 0.5) {
      drawingRef.current.pts.push(p);
      drawCurrent();
    }
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.active) return;
    if (e.pointerId !== drawingRef.current.pointerId) return;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    const pts = drawingRef.current.pts;
    drawingRef.current = { active: false, pts: [], pointerId: null };
    drawCurrent();
    if (pts.length >= 2) onStrokeComplete(pts);
  };

  return (
    <div className="relative mx-auto" style={{ width: SIZE, height: SIZE }}>
      {/* Grid background */}
      <div className="absolute inset-0 rounded-md border bg-card pointer-events-none">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="50" y1="0" x2="50" y2="100" stroke="hsl(var(--border))" strokeWidth="0.3" strokeDasharray="2 2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="hsl(var(--border))" strokeWidth="0.3" strokeDasharray="2 2" />
        </svg>
      </div>
      {/* Template (faint full kanji) */}
      {templatePaths && templatePaths.length > 0 && (
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox={`0 0 ${STROKE_VIEWBOX} ${STROKE_VIEWBOX}`}
        >
          {templatePaths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
      )}
      {/* Ghost guide (next stroke) */}
      {ghostPath && (
        <svg
          ref={overlayRef}
          className="absolute inset-0 h-full w-full pointer-events-none"
          viewBox={`0 0 ${STROKE_VIEWBOX} ${STROKE_VIEWBOX}`}
        >
          <path
            d={ghostPath}
            fill="none"
            stroke="hsl(var(--accent) / 0.5)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3 3"
          />
          <GhostStartDot d={ghostPath} />
        </svg>
      )}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none select-none"
        style={{ width: SIZE, height: SIZE }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
    </div>
  );
});

function GhostStartDot({ d }: { d: string }) {
  // crude: parse first M
  const m = d.match(/^M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/);
  if (!m) return null;
  return <circle cx={Number(m[1])} cy={Number(m[2])} r="3" fill="hsl(var(--accent))" />;
}
