// LUMENFALL — tuning, palette, enemy types and the relic pool.
// Every number the game balances on lives here, in one place.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const BEST_KEY = 'lumenfall.best';
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const PALETTE = {
  night: '#070a18',
  nightDeep: '#04060f',
  ground: '#0d1226',
  groundLine: '#1a2242',
  wall: '#232c52',
  gold: '#ffd166',
  ember: '#ff9f1c',
  flame: '#ff6b35',
  beam: '#fff3b0',
  beamRed: '#ff5d5d',
  beamGreen: '#7dff8a',
  beamBlue: '#6ec6ff',
  torch: '#ffb347',
  text: '#f4ead8',
  muted: '#9aa3c7',
  panel: 'rgba(10, 14, 32, 0.88)',
  panelEdge: '#3a4a7a',
  danger: '#ff4d6d',
  heal: '#7dff8a',
  shard: '#8be9ff',
};

export const PLAYER = {
  radius: 16,
  speed: 250,
  maxHp: 100,
  maxEmber: 100,
  emberDrain: 26, // per second while the beam is on
  emberRegen: 22, // per second while the beam is off
  beamRange: 560,
  beamWidth: 10,
  beamDps: 46,
  pickupRadius: 90,
  invulnerable: 1.2,
};

// Enemy type table. `color` is the beam colour that can hurt it:
// 'white' means any beam hurts it; a colour name means only that prism colour hurts it.
export const ENEMY_TYPES = {
  shade:    { name: 'Shade',        hp: 30,  speed: 88,  radius: 15, dmg: 10, score: 10, color: 'white', shards: 1, tint: '#5b5f8a' },
  wisp:     { name: 'Wisp',         hp: 18,  speed: 165, radius: 11, dmg: 7,  score: 15, color: 'white', shards: 1, tint: '#8f7bd8' },
  crawler:  { name: 'Crawler',      hp: 95,  speed: 46,  radius: 21, dmg: 16, score: 20, color: 'white', shards: 3, tint: '#4a6b4f' },
  spitter:  { name: 'Spitter',      hp: 34,  speed: 70,  radius: 14, dmg: 8,  score: 20, color: 'white', shards: 2, tint: '#b06ab0' },
  splitter: { name: 'Splitter',     hp: 40,  speed: 78,  radius: 16, dmg: 9,  score: 15, color: 'white', shards: 2, tint: '#7a9bb0' },
  flicker:  { name: 'Flicker',      hp: 26,  speed: 120, radius: 12, dmg: 9,  score: 25, color: 'white', shards: 2, tint: '#c7d2fe' },
  crimson:  { name: 'Crimson Shade',hp: 42,  speed: 96,  radius: 15, dmg: 11, score: 30, color: 'red',   shards: 2, tint: '#ff5d5d' },
  verdant:  { name: 'Verdant Shade',hp: 42,  speed: 96,  radius: 15, dmg: 11, score: 30, color: 'green', shards: 2, tint: '#7dff8a' },
  azure:    { name: 'Azure Shade', hp: 42,  speed: 96,  radius: 15, dmg: 11, score: 30, color: 'blue',  shards: 2, tint: '#6ec6ff' },
  elite:    { name: 'Elite Shade',  hp: 260, speed: 72,  radius: 26, dmg: 20, score: 80, color: 'white', shards: 8, tint: '#ffd166' },
};

export const BOSSES = {
  herald: {
    name: 'Gloom Herald', hp: 1500, speed: 62, radius: 44, dmg: 22, score: 500,
    tint: '#a78bfa', pattern: 'summon',
  },
  twinA: {
    name: 'Umbral Twin — Vex', hp: 1100, speed: 96, radius: 36, dmg: 20, score: 400,
    tint: '#f472b6', pattern: 'burst',
  },
  twinB: {
    name: 'Umbral Twin — Mourn', hp: 1100, speed: 96, radius: 36, dmg: 20, score: 400,
    tint: '#38bdf8', pattern: 'burst',
  },
  sovereign: {
    name: 'The Night Sovereign', hp: 3200, speed: 54, radius: 58, dmg: 26, score: 1500,
    tint: '#ff4d6d', pattern: 'sovereign',
  },
};

// The relic pool: drafted 3-at-a-time after every cleared night.
// `max` is how many times it can stack; `tag` groups the tool unlocks.
export const RELICS = [
  { id: 'widebeam',   name: 'Wide Beam',      desc: '+40% beam width, +15% damage',        max: 3, apply: (p) => { p.beamWidth *= 1.4; p.beamDps *= 1.15; } },
  { id: 'focuslens',  name: 'Focus Lens',     desc: '+30% beam damage',                    max: 3, apply: (p) => { p.beamDps *= 1.3; } },
  { id: 'longbeam',   name: 'Long Beam',      desc: '+25% beam range',                     max: 3, apply: (p) => { p.beamRange *= 1.25; } },
  { id: 'emberwell',  name: 'Ember Well',     desc: '+35 max ember, +30% regen',           max: 3, apply: (p) => { p.maxEmber += 35; p.emberRegen *= 1.3; } },
  { id: 'efficient',  name: 'Efficient Wick', desc: 'Beam drains 25% slower',             max: 3, apply: (p) => { p.emberDrain *= 0.75; } },
  { id: 'swiftboots', name: 'Swift Boots',    desc: '+14% move speed',                     max: 3, apply: (p) => { p.speed *= 1.14; } },
  { id: 'ironmantle', name: 'Iron Mantle',    desc: '+25 max health, heal 25 now',         max: 3, apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
  { id: 'magnet',     name: 'Shard Magnet',   desc: '+70% pickup radius',                  max: 3, apply: (p) => { p.pickupRadius *= 1.7; } },
  { id: 'doubler',    name: 'Shard Doubler',  desc: 'Shards worth double score',           max: 2, apply: (p) => { p.shardValue *= 2; } },
  { id: 'crit',       name: 'Kindled Edge',   desc: 'Beam crits: 20% chance x2 damage',    max: 3, apply: (p) => { p.critChance += 0.2; } },
  { id: 'knockback',  name: 'Repelling Light',desc: 'Beam knocks shades back hard',        max: 2, apply: (p) => { p.knockback += 140; } },
  { id: 'lifesteal',  name: 'Ember Leech',    desc: 'Kills heal 2 HP',                     max: 3, apply: (p) => { p.healOnKill += 2; } },
  { id: 'mirror',     name: 'Mirror Polish',  desc: 'Beam bounces +1 off mirrors',         max: 2, apply: (p) => { p.maxBounces += 1; } },
  { id: 'prism',      name: 'Prism Mastery',  desc: 'Prism beams +50% damage',             max: 2, apply: (p) => { p.prismDmg *= 1.5; } },
  { id: 'torchlight', name: 'Torchlight',     desc: 'Light radius +35%, darkness slower',  max: 2, apply: (p) => { p.lightRadius *= 1.35; } },
  { id: 'combo',      name: 'Combo Window',   desc: 'Combo lasts +2s, cap x5',             max: 2, apply: (p) => { p.comboWindow += 2; p.comboCap = 5; } },
  { id: 'thorns',     name: 'Thorn Lantern',  desc: 'Touching shades take 12 dps',         max: 2, apply: (p) => { p.thorns += 12; } },
  { id: 'secondwind', name: 'Second Wind',    desc: 'Revive once per night at 50 HP',      max: 1, apply: (p) => { p.secondWind = true; } },
  { id: 'bossbane',   name: 'Boss Bane',      desc: '+40% damage to bosses and elites',    max: 2, apply: (p) => { p.bossDmg *= 1.4; } },
  { id: 'spread',     name: 'Ember Spread',   desc: 'UNLOCK: Q fires a 5-way ember burst', max: 1, tag: 'spread', apply: (p) => { p.tools.spread = true; } },
  { id: 'lance',      name: 'Sun Lance',      desc: 'UNLOCK: E fires a piercing lance',    max: 1, tag: 'lance', apply: (p) => { p.tools.lance = true; } },
  { id: 'blades',     name: 'Orbiting Blades',desc: 'UNLOCK: 3 light blades orbit you',    max: 3, tag: 'blades', apply: (p) => { p.tools.blades = Math.min(6, (p.tools.blades || 0) + 3); } },
  { id: 'overcharge', name: 'Overcharge',     desc: 'Beam +25% dmg, -15 max HP (risky)',   max: 2, apply: (p) => { p.beamDps *= 1.25; p.maxHp = Math.max(40, p.maxHp - 15); p.hp = Math.min(p.hp, p.maxHp); } },
  { id: 'gilded',     name: 'Gilded Wick',    desc: '+150 score per night cleared',        max: 2, apply: (p) => { p.nightBonus += 150; } },
];

export const RADIO_LINES = [
  'Warden, the dark is thick tonight. Keep the flame alive.',
  'Shards on the ground — gather them, they feed the lantern.',
  'A mirror catches your beam. Use the angles, Warden.',
  'The braziers are cold. Light them before the dark closes in.',
  'Elite shade on the field. It carries a fat purse of shards.',
  'Your beam is the only thing they fear. Hold it steady.',
  'Prism ahead — split the light, match the colours.',
  'The lantern holds. So do you.',
  'Something big is coming. Ready your ember.',
  'Ten nights, Warden. One flame. Do not let it die.',
];

export const COMBO_WINDOW = 3; // seconds between kills to keep the combo alive
