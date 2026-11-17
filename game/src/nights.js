// The campaign: ten nights, each its own arena, objective and enemy mix.
// Objective kinds: 'survive' (kill the quota), 'light' (light every brazier),
// 'defend' (keep the Great Lantern alive while the quota dies), 'boss' (slay the boss).
// Mirrors and prisms are placed per night; torches start unlit and the dark closes in
// as the night wears on unless they are lit.
export const NIGHTS = [
  {
    name: 'Night 1 — First Ember', sub: 'Learn the beam. Survive the dark.',
    objective: 'survive', quota: 18, spawnInterval: 1.5,
    table: [['shade', 10]],
    torches: [{ x: 220, y: 140 }, { x: 1060, y: 580 }],
    mirrors: [], prisms: [], lantern: null, boss: null,
    tint: '#0d1226', darkness: 0.25,
  },
  {
    name: 'Night 2 — The Long Dark', sub: 'Wisps dart through the gloom. Keep moving.',
    objective: 'survive', quota: 26, spawnInterval: 1.25,
    table: [['shade', 7], ['wisp', 5]],
    torches: [{ x: 180, y: 180 }, { x: 1100, y: 180 }, { x: 180, y: 540 }, { x: 1100, y: 540 }],
    mirrors: [], prisms: [], lantern: null, boss: null,
    tint: '#0c1024', darkness: 0.35,
  },
  {
    name: 'Night 3 — Brazier Watch', sub: 'Light all six braziers with your beam.',
    objective: 'light', quota: 0, spawnInterval: 1.4,
    table: [['shade', 8], ['wisp', 3]],
    torches: [
      { x: 160, y: 120 }, { x: 640, y: 110 }, { x: 1120, y: 120 },
      { x: 160, y: 600 }, { x: 640, y: 610 }, { x: 1120, y: 600 },
    ],
    mirrors: [], prisms: [], lantern: null, boss: null,
    tint: '#10142c', darkness: 0.45,
  },
  {
    name: 'Night 4 — The Hollow', sub: 'Crawlers come for the Great Lantern. Guard it.',
    objective: 'defend', quota: 24, spawnInterval: 1.2,
    table: [['shade', 6], ['crawler', 4], ['spitter', 3]],
    torches: [{ x: 300, y: 360 }, { x: 980, y: 360 }],
    mirrors: [{ x1: 420, y1: 200, x2: 520, y2: 200 }, { x1: 760, y1: 520, x2: 860, y2: 520 }],
    prisms: [], lantern: { x: 640, y: 360, hp: 220 }, boss: null,
    tint: '#12102a', darkness: 0.4,
  },
  {
    name: 'Night 5 — Herald of Gloom', sub: 'A boss walks the dark. Slay the Herald.',
    objective: 'boss', quota: 0, spawnInterval: 1.6,
    table: [['shade', 6], ['wisp', 4], ['spitter', 2]],
    torches: [{ x: 200, y: 360 }, { x: 1080, y: 360 }],
    mirrors: [{ x1: 640, y1: 160, x2: 740, y2: 160 }],
    prisms: [], lantern: null, boss: 'herald',
    tint: '#160f2e', darkness: 0.5,
  },
  {
    name: 'Night 6 — Hall of Mirrors', sub: 'Braziers hide behind glass. Bend the beam.',
    objective: 'light', quota: 0, spawnInterval: 1.3,
    table: [['shade', 6], ['flicker', 4], ['wisp', 3]],
    torches: [
      { x: 150, y: 130 }, { x: 1130, y: 130 }, { x: 150, y: 590 },
      { x: 1130, y: 590 }, { x: 640, y: 90 }, { x: 640, y: 630 },
    ],
    mirrors: [
      { x1: 380, y1: 240, x2: 480, y2: 340 },
      { x1: 900, y1: 240, x2: 800, y2: 340 },
      { x1: 380, y1: 480, x2: 480, y2: 380 },
      { x1: 900, y1: 480, x2: 800, y2: 380 },
    ],
    prisms: [], lantern: null, boss: null,
    tint: '#0e1428', darkness: 0.55,
  },
  {
    name: 'Night 7 — Prism Garden', sub: 'Coloured shades fear only their own colour. Split the light.',
    objective: 'survive', quota: 30, spawnInterval: 1.15,
    table: [['crimson', 4], ['verdant', 4], ['azure', 4], ['shade', 4]],
    torches: [{ x: 320, y: 200 }, { x: 960, y: 520 }],
    mirrors: [{ x1: 640, y1: 300, x2: 640, y2: 420 }],
    prisms: [{ x: 640, y: 360, radius: 30 }, { x: 320, y: 520, radius: 26 }],
    lantern: null, boss: null,
    tint: '#101a26', darkness: 0.45,
  },
  {
    name: 'Night 8 — Siege of the Lantern', sub: 'Elites lead the siege. Hold the light.',
    objective: 'defend', quota: 30, spawnInterval: 1.0,
    table: [['shade', 5], ['crawler', 4], ['spitter', 3], ['splitter', 3], ['elite', 1]],
    torches: [{ x: 240, y: 200 }, { x: 1040, y: 200 }, { x: 240, y: 520 }, { x: 1040, y: 520 }],
    mirrors: [{ x1: 440, y1: 180, x2: 540, y2: 180 }, { x1: 740, y1: 540, x2: 840, y2: 540 }],
    prisms: [{ x: 640, y: 120, radius: 26 }],
    lantern: { x: 640, y: 360, hp: 300 }, boss: null,
    tint: '#141028', darkness: 0.5,
  },
  {
    name: 'Night 9 — The Umbral Twins', sub: 'Two bosses, one night. Split them apart.',
    objective: 'boss', quota: 0, spawnInterval: 1.5,
    table: [['flicker', 4], ['wisp', 4], ['spitter', 3]],
    torches: [{ x: 200, y: 180 }, { x: 1080, y: 180 }, { x: 200, y: 540 }, { x: 1080, y: 540 }],
    mirrors: [{ x1: 320, y1: 360, x2: 420, y2: 360 }, { x1: 860, y1: 360, x2: 960, y2: 360 }],
    prisms: [{ x: 640, y: 360, radius: 30 }],
    lantern: null, boss: 'twins',
    tint: '#180f24', darkness: 0.55,
  },
  {
    name: 'Night 10 — The Night Sovereign', sub: 'End the dark, or be swallowed by it.',
    objective: 'boss', quota: 0, spawnInterval: 1.4,
    table: [['shade', 5], ['wisp', 3], ['crawler', 3], ['crimson', 2], ['verdant', 2], ['azure', 2]],
    torches: [
      { x: 180, y: 140 }, { x: 1100, y: 140 }, { x: 180, y: 580 },
      { x: 1100, y: 580 }, { x: 640, y: 100 }, { x: 640, y: 620 },
    ],
    mirrors: [
      { x1: 400, y1: 220, x2: 500, y2: 220 }, { x1: 780, y1: 220, x2: 880, y2: 220 },
      { x1: 400, y1: 500, x2: 500, y2: 500 }, { x1: 780, y1: 500, x2: 880, y2: 500 },
    ],
    prisms: [{ x: 320, y: 360, radius: 28 }, { x: 960, y: 360, radius: 28 }],
    lantern: { x: 640, y: 360, hp: 400 }, boss: 'sovereign',
    tint: '#1a0d1e', darkness: 0.6,
  },
];

/** Human-readable objective line for the HUD and the night banner. */
export function objectiveText(nightDef) {
  if (nightDef.objective === 'survive') return `Slay ${nightDef.quota} shades`;
  if (nightDef.objective === 'light') return 'Light every brazier';
  if (nightDef.objective === 'defend') return `Guard the lantern — slay ${nightDef.quota}`;
  return 'Slay the boss';
}
