import type { Stroke } from "@/components/diary/DiaryCanvas";

/** Internal drawing space of the diary canvas. */
export const CANVAS_W = 1200;
export const CANVAS_H = 900;

function distToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Shortest distance from a point to a stroke's path, in canvas units. */
export function distanceToStroke(stroke: Stroke, px: number, py: number): number {
  const pts = stroke.points;
  if (pts.length === 0) return Infinity;
  if (pts.length === 1) return Math.hypot(px - pts[0].x, py - pts[0].y);
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const d = distToSegment(px, py, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Index of the topmost stroke under the point, or null.
 * `slack` widens the hit area so thin strokes are still easy to tap.
 */
export function hitStroke(strokes: Stroke[], px: number, py: number, slack = 10): number | null {
  for (let i = strokes.length - 1; i >= 0; i--) {
    const s = strokes[i];
    if (s.erase) continue;
    if (distanceToStroke(s, px, py) <= s.size / 2 + slack) return i;
  }
  return null;
}

export interface StrokeBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Bounding box of a stroke in canvas units, padded by its own line width. */
export function strokeBounds(stroke: Stroke): StrokeBounds | null {
  if (stroke.points.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of stroke.points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const pad = stroke.size / 2 + 4;
  return {
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + pad * 2,
    h: maxY - minY + pad * 2,
  };
}

/** Move every point of a stroke by a canvas-unit delta. */
export function translateStroke(stroke: Stroke, dx: number, dy: number): Stroke {
  return { ...stroke, points: stroke.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
}
