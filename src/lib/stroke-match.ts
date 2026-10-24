import { sample, resample, type Pt } from "@/lib/svg-path-sample";

const N = 32;

export interface MatchResult {
  ok: boolean;
  reason?: "direction" | "position" | "shape" | "tooShort";
  scores: { direction: number; position: number; shape: number };
}

export interface MatchThresholds {
  /** dot product of unit start→end vectors, min */
  direction: number;
  /** centroid distance, max (KanjiVG units) */
  position: number;
  /** mean point-to-point distance, max (KanjiVG units) */
  shape: number;
  /** minimum polyline length to even consider, KanjiVG units */
  minLength: number;
}

export const DEFAULT_THRESHOLDS: MatchThresholds = {
  direction: 0.3,
  position: 28,
  shape: 26,
  minLength: 6,
};

function centroid(p: Pt[]): Pt {
  let x = 0, y = 0;
  for (const pt of p) { x += pt.x; y += pt.y; }
  return { x: x / p.length, y: y / p.length };
}

function pathLength(p: Pt[]): number {
  let len = 0;
  for (let i = 1; i < p.length; i++) {
    len += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
  }
  return len;
}

function unitVec(from: Pt, to: Pt): Pt {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

export interface UserStrokeInput {
  /** Raw user points in KanjiVG-space (already normalized to viewBox). */
  points: Pt[];
}

/**
 * Compare a user-drawn stroke (in 109×109 space) against an expected SVG path.
 * Pure function — easy to unit-test.
 */
export function matchStroke(
  user: UserStrokeInput,
  expectedPath: string,
  thresholds: MatchThresholds = DEFAULT_THRESHOLDS,
): MatchResult {
  if (user.points.length < 2 || pathLength(user.points) < thresholds.minLength) {
    return {
      ok: false,
      reason: "tooShort",
      scores: { direction: 0, position: Infinity, shape: Infinity },
    };
  }

  const u = resample(user.points, N);
  const e = sample(expectedPath, N);

  // direction
  const uDir = unitVec(u[0], u[N - 1]);
  const eDir = unitVec(e[0], e[N - 1]);
  const direction = uDir.x * eDir.x + uDir.y * eDir.y;

  // position (centroid distance)
  const uc = centroid(u);
  const ec = centroid(e);
  const position = Math.hypot(uc.x - ec.x, uc.y - ec.y);

  // shape: point-wise distance, try forward and reversed (reject reversed)
  let shape = 0;
  for (let i = 0; i < N; i++) {
    shape += Math.hypot(u[i].x - e[i].x, u[i].y - e[i].y);
  }
  shape /= N;

  const scores = { direction, position, shape };

  if (direction < thresholds.direction) return { ok: false, reason: "direction", scores };
  if (position > thresholds.position) return { ok: false, reason: "position", scores };
  if (shape > thresholds.shape) return { ok: false, reason: "shape", scores };
  return { ok: true, scores };
}

export function hintFor(reason: MatchResult["reason"]): string {
  switch (reason) {
    case "direction": return "Wrong direction — check where the stroke should start and end.";
    case "position":  return "Wrong position — try drawing it closer to where it belongs.";
    case "shape":     return "Shape doesn't quite match — show hint to see the stroke.";
    case "tooShort":  return "Stroke too short.";
    default:          return "";
  }
}
