// The lantern beam: a ray from the warden that reflects off mirrors and splits in prisms.
// Mirrors are line segments; prisms are circles that split one ray into three coloured rays.
// A beam is a list of segments {x1,y1,x2,y2,color}; colour 'white' hurts ordinary shades,
// a coloured ray only hurts shades of the same colour (and bosses).
import { FIELD } from './config.js';
import { clamp } from './random.js';

const PRISM_COLORS = ['red', 'green', 'blue'];
const PRISM_SPREAD = 0.55; // radians between the split rays

/** Distance from point (px,py) to segment (x1,y1)-(x2,y2). */
export function pointSegmentDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1; const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  const cx = x1 + t * dx; const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

/** Ray vs segment intersection. Returns distance along the ray, or Infinity. */
function raySegment(ox, oy, dx, dy, x1, y1, x2, y2) {
  const ex = x2 - x1; const ey = y2 - y1;
  const denom = dx * ey - dy * ex;
  if (Math.abs(denom) < 1e-9) return Infinity;
  const t = ((x1 - ox) * ey - (y1 - oy) * ex) / denom;
  const u = ((x1 - ox) * dy - (y1 - oy) * dx) / denom;
  if (t < 0 || u < 0 || u > 1) return Infinity;
  return t;
}

/** Ray vs circle intersection. Returns distance along the ray, or Infinity. */
function rayCircle(ox, oy, dx, dy, cx, cy, r) {
  const lx = cx - ox; const ly = cy - oy;
  const tca = lx * dx + ly * dy;
  if (tca < 0) return Infinity;
  const d2 = lx * lx + ly * ly - tca * tca;
  if (d2 > r * r) return Infinity;
  return tca - Math.sqrt(r * r - d2);
}

/**
 * Trace one beam. `origin` {x,y}, `angle`, `range`, `color`, `maxBounces`, `depth`.
 * Returns { segments, prismHits: [{x,y,angle}] } — prism hits are where a split happened,
 * so the caller can draw the split glow and know which torches a coloured ray lit.
 */
export function traceBeam(origin, angle, range, color, mirrors, prisms, maxBounces, depth = 0) {
  const segments = [];
  const prismHits = [];
  let ox = origin.x; let oy = origin.y;
  let dx = Math.cos(angle); let dy = Math.sin(angle);
  let remaining = range;
  let bounces = 0;
  const hitPrisms = new Set();

  while (remaining > 0.5 && bounces <= maxBounces) {
    // Nearest mirror hit.
    let bestT = Infinity; let bestMirror = null;
    for (const m of mirrors) {
      const t = raySegment(ox, oy, dx, dy, m.x1, m.y1, m.x2, m.y2);
      if (t < bestT && t <= remaining) { bestT = t; bestMirror = m; }
    }
    // Nearest prism hit (only for the white parent ray; coloured rays pass through).
    let prismT = Infinity; let bestPrism = null;
    if (color === 'white' && depth === 0) {
      for (const p of prisms) {
        if (hitPrisms.has(p)) continue;
        const t = rayCircle(ox, oy, dx, dy, p.x, p.y, p.radius);
        if (t < prismT && t <= remaining) { prismT = t; bestPrism = p; }
      }
    }
    // Nearest field edge.
    let edgeT = remaining;
    if (dx > 0) edgeT = Math.min(edgeT, (FIELD.width - ox) / dx);
    if (dx < 0) edgeT = Math.min(edgeT, (0 - ox) / dx);
    if (dy > 0) edgeT = Math.min(edgeT, (FIELD.height - oy) / dy);
    if (dy < 0) edgeT = Math.min(edgeT, (0 - oy) / dy);
    edgeT = Math.max(0, edgeT);

    if (bestPrism && prismT <= bestT && prismT <= edgeT) {
      // Beam enters the prism: the white ray ends here and three coloured rays leave it.
      segments.push({ x1: ox, y1: oy, x2: ox + dx * prismT, y2: oy + dy * prismT, color });
      prismHits.push({ x: ox + dx * prismT, y: oy + dy * prismT, angle });
      hitPrisms.add(bestPrism);
      return { segments, prismHits };
    }
    if (bestMirror && bestT <= edgeT) {
      const hx = ox + dx * bestT; const hy = oy + dy * bestT;
      segments.push({ x1: ox, y1: oy, x2: hx, y2: hy, color });
      // Reflect the direction across the mirror's normal.
      const mx = bestMirror.x2 - bestMirror.x1; const my = bestMirror.y2 - bestMirror.y1;
      const mLen = Math.hypot(mx, my) || 1;
      const nx = -my / mLen; const ny = mx / mLen;
      const dot = dx * nx + dy * ny;
      dx = dx - 2 * dot * nx; dy = dy - 2 * dot * ny;
      ox = hx + dx * 0.5; oy = hy + dy * 0.5;
      remaining -= bestT;
      bounces += 1;
      continue;
    }
    // Nothing in the way: run to the edge (or the end of the range).
    const t = Math.min(remaining, edgeT);
    segments.push({ x1: ox, y1: oy, x2: ox + dx * t, y2: oy + dy * t, color });
    return { segments, prismHits };
  }
  return { segments, prismHits };
}

/** Split a prism hit into three coloured child beams and trace each of them. */
export function tracePrismSplits(hit, range, mirrors, prisms, maxBounces) {
  const out = [];
  for (let i = -1; i <= 1; i += 1) {
    const color = PRISM_COLORS[i + 1];
    const child = traceBeam(
      { x: hit.x, y: hit.y }, hit.angle + i * PRISM_SPREAD, range * 0.8, color,
      mirrors, prisms, maxBounces, 1,
    );
    out.push(...child.segments);
  }
  return out;
}

/** Does a beam segment touch a circle (enemy, torch, lantern)? */
export function segmentHitsCircle(seg, cx, cy, radius, beamWidth) {
  return pointSegmentDist(cx, cy, seg.x1, seg.y1, seg.x2, seg.y2) <= radius + beamWidth / 2;
}
