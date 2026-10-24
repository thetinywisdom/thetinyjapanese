/**
 * Tiny SVG path sampler for KanjiVG-style `d` strings.
 * Supports M/m, L/l, H/h, V/v, C/c, S/s, Q/q, T/t, Z/z. Arcs are not used by KanjiVG.
 *
 * sample(d, n) returns `n` evenly-spaced points along the path (by arc length).
 */
export interface Pt {
  x: number;
  y: number;
}

type Cmd = { type: string; args: number[] };

function tokenize(d: string): Cmd[] {
  const out: Cmd[] = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const type = m[1];
    const args =
      m[2]
        .trim()
        .split(/[\s,]+|(?=-)/)
        .filter((s) => s !== "" && s !== "-")
        .map(Number)
        .filter((n) => Number.isFinite(n)) ?? [];
    out.push({ type, args });
  }
  return out;
}

function bezier3(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

function bezier2(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/** Flatten any KanjiVG path into a dense polyline. */
export function flatten(d: string, samplesPerCurve = 24): Pt[] {
  const cmds = tokenize(d);
  const pts: Pt[] = [];
  let cx = 0, cy = 0;
  let startX = 0, startY = 0;
  let lastCtrlX = 0, lastCtrlY = 0;
  let lastCmd = "";

  for (const { type, args } of cmds) {
    const rel = type === type.toLowerCase();
    const t = type.toUpperCase();
    let i = 0;
    const consume = () => args.slice(i, (i += 2));

    if (t === "M") {
      const [x, y] = consume();
      cx = rel ? cx + x : x;
      cy = rel ? cy + y : y;
      startX = cx; startY = cy;
      pts.push({ x: cx, y: cy });
      // subsequent pairs treated as L
      while (i < args.length) {
        const [nx, ny] = consume();
        cx = rel ? cx + nx : nx;
        cy = rel ? cy + ny : ny;
        pts.push({ x: cx, y: cy });
      }
    } else if (t === "L") {
      while (i < args.length) {
        const [nx, ny] = consume();
        cx = rel ? cx + nx : nx;
        cy = rel ? cy + ny : ny;
        pts.push({ x: cx, y: cy });
      }
    } else if (t === "H") {
      while (i < args.length) {
        const nx = args[i++];
        cx = rel ? cx + nx : nx;
        pts.push({ x: cx, y: cy });
      }
    } else if (t === "V") {
      while (i < args.length) {
        const ny = args[i++];
        cy = rel ? cy + ny : ny;
        pts.push({ x: cx, y: cy });
      }
    } else if (t === "C") {
      while (i < args.length) {
        const x1 = (rel ? cx : 0) + args[i++];
        const y1 = (rel ? cy : 0) + args[i++];
        const x2 = (rel ? cx : 0) + args[i++];
        const y2 = (rel ? cy : 0) + args[i++];
        const x = (rel ? cx : 0) + args[i++];
        const y = (rel ? cy : 0) + args[i++];
        const p0 = { x: cx, y: cy };
        const p1 = { x: x1, y: y1 };
        const p2 = { x: x2, y: y2 };
        const p3 = { x, y };
        for (let s = 1; s <= samplesPerCurve; s++) {
          pts.push(bezier3(p0, p1, p2, p3, s / samplesPerCurve));
        }
        cx = x; cy = y;
        lastCtrlX = x2; lastCtrlY = y2;
      }
    } else if (t === "S") {
      while (i < args.length) {
        const x2 = (rel ? cx : 0) + args[i++];
        const y2 = (rel ? cy : 0) + args[i++];
        const x = (rel ? cx : 0) + args[i++];
        const y = (rel ? cy : 0) + args[i++];
        const reflect = /[CS]/i.test(lastCmd);
        const x1 = reflect ? 2 * cx - lastCtrlX : cx;
        const y1 = reflect ? 2 * cy - lastCtrlY : cy;
        const p0 = { x: cx, y: cy };
        const p1 = { x: x1, y: y1 };
        const p2 = { x: x2, y: y2 };
        const p3 = { x, y };
        for (let s = 1; s <= samplesPerCurve; s++) {
          pts.push(bezier3(p0, p1, p2, p3, s / samplesPerCurve));
        }
        cx = x; cy = y;
        lastCtrlX = x2; lastCtrlY = y2;
      }
    } else if (t === "Q") {
      while (i < args.length) {
        const x1 = (rel ? cx : 0) + args[i++];
        const y1 = (rel ? cy : 0) + args[i++];
        const x = (rel ? cx : 0) + args[i++];
        const y = (rel ? cy : 0) + args[i++];
        const p0 = { x: cx, y: cy };
        const p1 = { x: x1, y: y1 };
        const p2 = { x, y };
        for (let s = 1; s <= samplesPerCurve; s++) {
          pts.push(bezier2(p0, p1, p2, s / samplesPerCurve));
        }
        cx = x; cy = y;
        lastCtrlX = x1; lastCtrlY = y1;
      }
    } else if (t === "T") {
      while (i < args.length) {
        const x = (rel ? cx : 0) + args[i++];
        const y = (rel ? cy : 0) + args[i++];
        const reflect = /[QT]/i.test(lastCmd);
        const x1 = reflect ? 2 * cx - lastCtrlX : cx;
        const y1 = reflect ? 2 * cy - lastCtrlY : cy;
        const p0 = { x: cx, y: cy };
        const p1 = { x: x1, y: y1 };
        const p2 = { x, y };
        for (let s = 1; s <= samplesPerCurve; s++) {
          pts.push(bezier2(p0, p1, p2, s / samplesPerCurve));
        }
        cx = x; cy = y;
        lastCtrlX = x1; lastCtrlY = y1;
      }
    } else if (t === "Z") {
      pts.push({ x: startX, y: startY });
      cx = startX; cy = startY;
    }
    lastCmd = t;
  }
  return pts;
}

/** Resample a polyline into `n` evenly-spaced points by arc length. */
export function resample(pts: Pt[], n: number): Pt[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return new Array(n).fill(pts[0]);
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  const total = cum[cum.length - 1];
  if (total === 0) return new Array(n).fill(pts[0]);
  const out: Pt[] = [];
  for (let k = 0; k < n; k++) {
    const target = (k / (n - 1)) * total;
    // binary search
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    if (lo === 0) {
      out.push(pts[0]);
    } else {
      const t = (target - cum[lo - 1]) / (cum[lo] - cum[lo - 1] || 1);
      out.push({
        x: pts[lo - 1].x + t * (pts[lo].x - pts[lo - 1].x),
        y: pts[lo - 1].y + t * (pts[lo].y - pts[lo - 1].y),
      });
    }
  }
  return out;
}

/** Convenience: flatten then resample. */
export function sample(d: string, n = 32): Pt[] {
  return resample(flatten(d), n);
}
