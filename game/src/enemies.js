// Enemies: spawning, AI steering and boss patterns.
// Each enemy is a plain object; the world owns the arrays and calls these helpers.
import { BOSSES, ENEMY_TYPES, FIELD } from './config.js';
import { clamp, dist2, pickWeighted } from './random.js';

let nextId = 1;

/** Spawn one enemy of `type` at the field edge, far from the player. */
export function spawnEnemy(rand, type, player, nightScale) {
  const def = ENEMY_TYPES[type];
  const side = Math.floor(rand() * 4);
  let x; let y;
  if (side === 0) { x = rand() * FIELD.width; y = 30; }
  else if (side === 1) { x = rand() * FIELD.width; y = FIELD.height - 30; }
  else if (side === 2) { x = 30; y = rand() * FIELD.height; }
  else { x = FIELD.width - 30; y = rand() * FIELD.height; }
  // Never spawn on top of the player.
  if (dist2(x, y, player.x, player.y) < 240 * 240) { x = FIELD.width - x; y = FIELD.height - y; }
  const hpScale = 1 + (nightScale - 1) * 0.12;
  return {
    id: nextId, type, name: def.name,
    x, y, vx: 0, vy: 0,
    hp: def.hp * hpScale, maxHp: def.hp * hpScale,
    speed: def.speed * (0.9 + rand() * 0.2), radius: def.radius,
    dmg: def.dmg, score: def.score, color: def.color, shards: def.shards,
    tint: def.tint, boss: false, elite: type === 'elite',
    flash: 0, phase: rand() * Math.PI * 2, fireTimer: 1 + rand(), teleportTimer: 2 + rand() * 2,
    patternTimer: 3, dead: false,
  };
}

/** Spawn a boss by key ('herald', 'twinA', 'twinB', 'sovereign'). */
export function spawnBoss(rand, key, player) {
  const def = BOSSES[key];
  const x = key === 'twinB' ? FIELD.width - 320 : 320;
  const y = 120;
  return {
    id: nextId, type: key, name: def.name,
    x, y, vx: 0, vy: 0,
    hp: def.hp, maxHp: def.hp, speed: def.speed, radius: def.radius,
    dmg: def.dmg, score: def.score, color: 'white', shards: 25,
    tint: def.tint, boss: true, elite: false, pattern: def.pattern,
    flash: 0, phase: rand() * Math.PI * 2, fireTimer: 2, teleportTimer: 4,
    patternTimer: 4, dead: false,
  };
}

/** Pick the next spawn type for a night from its weighted table. */
export function pickSpawnType(rand, nightDef) {
  return pickWeighted(rand, nightDef.table);
}

/** Steer one enemy for a step. `target` is what it chases (player or lantern). */
export function steerEnemy(e, dt, target, state) {
  const dx = target.x - e.x; const dy = target.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  let mx = dx / d; let my = dy / d;
  let speed = e.speed;

  if (e.type === 'wisp') {
    // Erratic sine weave.
    const wob = Math.sin(state.time * 5 + e.phase) * 0.9;
    const px = -my; const py = mx;
    mx += px * wob; my += py * wob;
    const m = Math.hypot(mx, my) || 1;
    mx /= m; my /= m;
  } else if (e.type === 'spitter') {
    // Keep a firing distance: approach until 260, then hold and shoot.
    if (d < 220) { mx = -mx; my = -my; speed *= 0.8; }
    else if (d < 300) { mx = 0; my = 0; }
    e.fireTimer -= dt;
    if (e.fireTimer <= 0 && d < 520) {
      e.fireTimer = 2.2;
      state.bolts.push({
        x: e.x, y: e.y, vx: (dx / d) * 210, vy: (dy / d) * 210,
        radius: 7, dmg: e.dmg, life: 4, fromBoss: false,
      });
    }
  } else if (e.type === 'flicker') {
    e.teleportTimer -= dt;
    if (e.teleportTimer <= 0) {
      e.teleportTimer = 2.5 + state.rand() * 2;
      const ang = state.rand() * Math.PI * 2;
      const jump = 120 + state.rand() * 120;
      e.x = clamp(target.x + Math.cos(ang) * jump, 40, FIELD.width - 40);
      e.y = clamp(target.y + Math.sin(ang) * jump, 40, FIELD.height - 40);
      state.spawnBurst(e.x, e.y, '#c7d2fe', 10);
    }
  }

  if (e.boss) {
    e.patternTimer -= dt;
    if (e.patternTimer <= 0) {
      e.patternTimer = e.pattern === 'sovereign' ? 5 : 4;
      bossPattern(e, state);
    }
    if (e.pattern === 'burst' || e.pattern === 'sovereign') {
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && d < 560) {
        e.fireTimer = 2.6;
        const n = e.pattern === 'sovereign' ? 10 : 6;
        for (let i = 0; i < n; i += 1) {
          const a = (i / n) * Math.PI * 2 + e.phase;
          state.bolts.push({
            x: e.x, y: e.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170,
            radius: 8, dmg: e.dmg - 6, life: 5, fromBoss: true,
          });
        }
      }
    }
  }

  e.vx = mx * speed; e.vy = my * speed;
  e.x += e.vx * dt; e.y += e.vy * dt;
  e.x = clamp(e.x, e.radius, FIELD.width - e.radius);
  e.y = clamp(e.y, e.radius, FIELD.height - e.radius);
  if (e.flash > 0) e.flash -= dt;
}

/** A boss's special: summon shades, or a radial bolt burst. */
export function bossPattern(e, state) {
  if (e.pattern === 'summon') {
    for (let i = 0; i < 3; i += 1) {
      const add = spawnEnemy(state.rand, 'shade', state.player, state.night);
      add.x = clamp(e.x + (state.rand() - 0.5) * 160, 40, FIELD.width - 40);
      add.y = clamp(e.y + (state.rand() - 0.5) * 160, 40, FIELD.height - 40);
      state.enemies.push(add);
    }
    state.radio('The Herald calls more shades from the dark!', 3);
    state.spawnBurst(e.x, e.y, '#a78bfa', 24);
  } else if (e.pattern === 'sovereign') {
    // The Sovereign charges the player.
    const dx = state.player.x - e.x; const dy = state.player.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.x += (dx / d) * 130; e.y += (dy / d) * 130;
    e.x = clamp(e.x, e.radius, FIELD.width - e.radius);
    e.y = clamp(e.y, e.radius, FIELD.height - e.radius);
    state.spawnBurst(e.x, e.y, '#ff4d6d', 20);
    state.shake(10);
  }
  // 'burst' twins fire their radial bolts from steerEnemy's fireTimer.
}
