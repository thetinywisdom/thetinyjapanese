import { useEffect, useImperativeHandle, useRef, forwardRef, useCallback } from "react";

export interface Stroke {
  color: string;
  size: number;
  erase: boolean;
  points: { x: number; y: number }[];
}

export interface DiaryCanvasHandle {
  toDataURL: () => string;
}

interface Props {
  strokes: Stroke[];
  color: string;
  size: number;
  erasing: boolean;
  onStrokeComplete: (stroke: Stroke) => void;
  /** Fired when a new stroke begins, before any pixels are drawn. */
  onStrokeStart?: () => void;
  /** Render only, no drawing (used for thumbnails / export). */
  readOnly?: boolean;
  /** Existing PNG to paint underneath (when re-opening an entry). */
  background?: string;
  /** When true the canvas ignores pointers so objects below can be selected. */
  disabled?: boolean;
}


/** Internal drawing space — 4:3. */
const W = 1200;
const H = 900;

export const DiaryCanvas = forwardRef<DiaryCanvasHandle, Props>(function DiaryCanvas(
  { strokes, color, size, erasing, onStrokeComplete, onStrokeStart, readOnly, background, disabled },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgRef = useRef<HTMLImageElement | null>(null);
  const drawing = useRef<{ active: boolean; pts: { x: number; y: number }[]; id: number | null }>({
    active: false,
    pts: [],
    id: null,
  });

  const paint = useCallback(
    (extra?: Stroke) => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (bgRef.current) ctx.drawImage(bgRef.current, 0, 0, W, H);
      const all = extra ? [...strokes, extra] : strokes;
      for (const s of all) {
        if (s.points.length === 0) continue;
        ctx.globalCompositeOperation = s.erase ? "destination-out" : "source-over";
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(s.points[0].x, s.points[0].y);
        if (s.points.length === 1) ctx.lineTo(s.points[0].x + 0.1, s.points[0].y);
        for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";
    },
    [strokes],
  );

  useEffect(() => {
    if (!background) {
      bgRef.current = null;
      paint();
      return;
    }
    const img = new Image();
    img.onload = () => {
      bgRef.current = img;
      paint();
    };
    img.src = background;
  }, [background, paint]);

  useEffect(() => {
    paint();
  }, [paint]);

  useImperativeHandle(ref, () => ({
    toDataURL: () => canvasRef.current?.toDataURL("image/png") ?? "",
  }));

  const toLocal = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return;
    e.preventDefault();
    onStrokeStart?.();
    canvasRef.current?.setPointerCapture(e.pointerId);

    drawing.current = { active: true, pts: [toLocal(e.clientX, e.clientY)], id: e.pointerId };
    paint({ color, size, erase: erasing, points: drawing.current.pts });
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current.active || e.pointerId !== drawing.current.id) return;
    const p = toLocal(e.clientX, e.clientY);
    const last = drawing.current.pts[drawing.current.pts.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.y - last.y) > 1.5) {
      drawing.current.pts.push(p);
      paint({ color, size, erase: erasing, points: drawing.current.pts });
    }
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current.active || e.pointerId !== drawing.current.id) return;
    canvasRef.current?.releasePointerCapture(e.pointerId);
    const pts = drawing.current.pts;
    drawing.current = { active: false, pts: [], id: null };
    if (pts.length > 0) onStrokeComplete({ color, size, erase: erasing, points: pts });
    else paint();
  };

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className={
        "absolute inset-0 h-full w-full touch-none select-none " +
        (readOnly || disabled
          ? "pointer-events-none"
          : erasing
            ? "cursor-cell"
            : "cursor-crosshair")
      }

      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    />
  );
});
