// A small seeded random number generator (mulberry32): the same seed gives the same game,
// which is what makes the screenshot scenes repeatable.
export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry from a weighted table [[key, weight], ...] using `rand`. */
export function pickWeighted(rand, table) {
  let total = 0;
  for (const [, w] of table) total += w;
  let roll = rand() * total;
  for (const [key, w] of table) {
    roll -= w;
    if (roll <= 0) return key;
  }
  return table[table.length - 1][0];
}

/** Shuffle a copy of an array in place with the seeded rng. */
export function shuffle(rand, array) {
  const out = array.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function dist2(ax, ay, bx, by) { const dx = ax - bx; const dy = ay - by; return dx * dx + dy * dy; }
export function lerp(a, b, t) { return a + (b - a) * t; }
