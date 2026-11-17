// LUMENFALL world: the whole simulation — player, beam, enemies, torches, lantern,
// shards, combo, bosses, night flow and the relic draft between nights.
// The renderer only reads this state; it never changes the rules.
import {
  BEST_KEY, COMBO_WINDOW, ENEMY_TYPES, FIELD, PALETTE, PLAYER, RELICS, STEP,
} from './config.js';
import { NIGHTS, objectiveText } from './nights.js';
import { pickSpawnType, spawnBoss, spawnEnemy, steerEnemy } from './enemies.js';
import { segmentHitsCircle, traceBeam, tracePrismSplits } from './beam.js';
import { createParticles } from './particles.js';
import { clamp, dist2, shuffle } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_CLEAR = 1;
export const EVENT_OVER = 2;
export const EVENT_BOSS = 4;

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_DRAFT = 'draft';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_VICTORY = 'victory';

function basePlayerStats() {
  return {
    speed: PLAYER.speed, maxHp: PLAYER.maxHp, hp: PLAYER.maxHp,
    maxEmber: PLAYER.maxEmber, ember: PLAYER.maxEmber,
    emberDrain: PLAYER.emberDrain, emberRegen: PLAYER.emberRegen,
    beamRange: PLAYER.beamRange, beamWidth: PLAYER.beamWidth, beamDps: PLAYER.beamDps,
    pickupRadius: PLAYER.pickupRadius, knockback: 60, critChance: 0,
    healOnKill: 0, maxBounces: 1, prismDmg: 1, lightRadius: 260,
    comboWindow: COMBO_WINDOW, comboCap: 3, thorns: 0, secondWind: false,
    bossDmg: 1, shardValue: 1, nightBonus: 0,
    tools: { spread: false, lance: false, blades: 0 },
    relics: [], relicCounts: {},
  };
}

export function createWorld(rand, audio) {
  const particles = createParticles(rand);
  const state = {
    rand, audio, time: 0, screen: SCREEN_TITLE,
    night: 1, nightTime: 0, nightDef: NIGHTS[0],
    player: { x: FIELD.width / 2, y: FIELD.height / 2 + 80, radius: PLAYER.radius, stats: basePlayerStats(), invuln: 0, aimAngle: -Math.PI / 2, firing: false, spreadCd: 0, lanceCd: 0, bladeAngle: 0, usedSecondWind: false },
    enemies: [], bolts: [], shards: [], beams: [], spreadShots: [], lance: null,
    mirrors: [], prisms: [], torches: [], lantern: null, boss: null,
    kills: 0, killsTotal: 0, score: 0, shardsCollected: 0, combo: 0, comboTimer: 0, comboBest: 0,
    feed: [], radioText: '', radioTimer: 0, radioIndex: 0,
    banner: '', bannerTimer: 0, shakeMag: 0, hurtFlash: 0,
    spawnTimer: 1.2, draft: null, victory: false, endless: false,
    best: 0, elapsed: 0, nightsCleared: 0,
  };
  state.particles = particles;

  function radio(text, seconds = 4) {
    state.radioText = text;
    state.radioTimer = seconds;
  }

  function feed(text) {
    state.feed.unshift(text);
    if (state.feed.length > 5) state.feed.pop();
  }

  function shake(mag) { state.shakeMag = Math.max(state.shakeMag, mag); }

  function spawnBurst(x, y, color, count) { particles.burst(x, y, color, count); }

  function addScore(n) { state.score += n; }

  function startNight(n, keepPlayer) {
    const def = NIGHTS[n - 1];
    state.night = n;
    state.nightDef = def;
    state.nightTime = 0;
    state.kills = 0;
    state.enemies = [];
    state.bolts = [];
    state.shards = [];
    state.beams = [];
    state.spreadShots = [];
    state.lance = null;
    state.boss = null;
    state.spawnTimer = 1.0;
    state.combo = 0; state.comboTimer = 0;
    state.mirrors = def.mirrors.map((m) => ({ ...m }));
    state.prisms = def.prisms.map((p) => ({ ...p }));
    state.torches = def.torches.map((t) => ({ x: t.x, y: t.y, lit: false, radius: 26 }));
    state.lantern = def.lantern ? { x: def.lantern.x, y: def.lantern.y, hp: def.lantern.hp, maxHp: def.lantern.hp, radius: 34 } : null;
    const p = state.player;
    p.x = FIELD.width / 2; p.y = FIELD.height / 2 + 140;
    p.invuln = 1;
    if (!keepPlayer) {
      p.stats = basePlayerStats();
      state.score = 0; state.killsTotal = 0; state.shardsCollected = 0;
      state.nightsCleared = 0; state.elapsed = 0; state.victory = false; state.endless = false;
    } else {
      p.stats.hp = Math.min(p.stats.maxHp, p.stats.hp + 30);
      p.stats.ember = p.stats.maxEmber;
      p.usedSecondWind = false;
    }
    state.banner = def.name;
    state.bannerTimer = 2.6;
    state.screen = SCREEN_PLAY;
    radio(def.sub, 4);
    if (def.boss === 'herald') {
      state.boss = spawnBoss(rand, 'herald', p);
      state.enemies.push(state.boss);
      audio.boss();
      radio('The Gloom Herald walks the dark!', 4);
    } else if (def.boss === 'twins') {
      const a = spawnBoss(rand, 'twinA', p);
      const b = spawnBoss(rand, 'twinB', p);
      state.enemies.push(a, b);
      state.boss = a;
      audio.boss();
      radio('The Umbral Twins have come!', 4);
    } else if (def.boss === 'sovereign') {
      state.boss = spawnBoss(rand, 'sovereign', p);
      state.enemies.push(state.boss);
      audio.boss();
      radio('The Night Sovereign rises. End this!', 4);
    }
  }

  function reset() {
    startNight(1, false);
    state.screen = SCREEN_TITLE;
  }

  function lightRadius() {
    const lit = state.torches.filter((t) => t.lit).length;
    const total = Math.max(1, state.torches.length);
    const base = state.player.stats.lightRadius;
    return base * (0.55 + 0.45 * (lit / total)) * (1 - state.nightDef.darkness * 0.25);
  }

  function dropShards(x, y, count, value) {
    for (let i = 0; i < count; i += 1) {
      const a = rand() * Math.PI * 2;
      const d = 8 + rand() * 26;
      state.shards.push({
        x: clamp(x + Math.cos(a) * d, 16, FIELD.width - 16),
        y: clamp(y + Math.sin(a) * d, 16, FIELD.height - 16),
        vx: Math.cos(a) * 40, vy: Math.sin(a) * 40,
        value, life: 14, magnet: false,
      });
    }
    if (state.shards.length > 220) state.shards.splice(0, state.shards.length - 220);
  }

  function killEnemy(e, byBeam) {
    if (e.dead) return;
    e.dead = true;
    state.kills += 1;
    state.killsTotal += 1;
    const mult = 1 + Math.min(state.combo, state.player.stats.comboCap) * 0.25;
    const gained = Math.round(e.score * mult);
    state.score += gained;
    particles.burst(e.x, e.y, e.tint, e.boss ? 40 : 14, e.boss ? 260 : 170);
    particles.damageNumber(e.x, e.y - e.radius, `+${gained}`, '#ffe9a8');
    dropShards(e.x, e.y, e.shards, 5);
    feed(`${e.name} slain  +${gained}`);
    if (state.player.stats.healOnKill > 0) {
      state.player.stats.hp = Math.min(state.player.stats.maxHp, state.player.stats.hp + state.player.stats.healOnKill);
    }
    state.combo += 1;
    state.comboTimer = state.player.stats.comboWindow;
    state.comboBest = Math.max(state.comboBest, state.combo);
    if (state.combo > 0 && state.combo % 5 === 0) {
      radio(`Combo x${state.combo}! The light burns brighter.`, 2.5);
    }
    audio.kill();
    if (e.type === 'splitter') {
      for (let i = 0; i < 2; i += 1) {
        const mini = spawnEnemy(rand, 'shade', state.player, state.night);
        mini.x = clamp(e.x + (i === 0 ? -24 : 24), 30, FIELD.width - 30);
        mini.y = clamp(e.y, 30, FIELD.height - 30);
        mini.hp = 14; mini.maxHp = 14; mini.radius = 11;
        state.enemies.push(mini);
      }
    }
    if (e.boss) {
      shake(16);
      dropShards(e.x, e.y, 20, 10);
      feed(`${e.name} DESTROYED  +${e.score}`);
      radio(`${e.name} is gone. The night lifts.`, 4);
    }
    if (byBeam) shake(2);
  }

  function damagePlayer(amount) {
    const p = state.player;
    if (p.invuln > 0 || state.screen !== SCREEN_PLAY) return;
    p.stats.hp -= amount;
    p.invuln = 0.6;
    state.hurtFlash = 0.55;
    shake(7);
    audio.hurt();
    particles.burst(p.x, p.y, '#ff4d6d', 12, 140);
    if (p.stats.hp <= 0) {
      if (p.stats.secondWind && !p.usedSecondWind) {
        p.usedSecondWind = true;
        p.stats.hp = 50;
        p.invuln = 2;
        radio('Second Wind! The lantern refuses to die.', 4);
        particles.burst(p.x, p.y, '#ffd166', 40, 240);
        return;
      }
      p.stats.hp = 0;
      state.screen = SCREEN_OVER;
      audio.stopMusic();
      audio.over();
      state.best = Math.max(state.best, state.score);
      saveBest();
    }
  }

  function saveBest() {
    try { window.localStorage.setItem(BEST_KEY, String(state.best)); } catch { /* storage off */ }
  }

  function readBest() {
    try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; }
    catch { return 0; }
  }

  function fireBeam(dt, aim) {
    const p = state.player;
    const st = p.stats;
    const angle = Math.atan2(aim.y - p.y, aim.x - p.x);
    p.aimAngle = angle;
    if (st.ember <= 0) { p.firing = false; state.beams = []; return; }
    st.ember = Math.max(0, st.ember - st.emberDrain * dt);
    p.firing = true;
    const traced = traceBeam(p, angle, st.beamRange, 'white', state.mirrors, state.prisms, st.maxBounces);
    let segments = traced.segments.slice();
    for (const hit of traced.prismHits) {
      segments = segments.concat(tracePrismSplits(hit, st.beamRange, state.mirrors, state.prisms, st.maxBounces));
    }
    state.beams = segments;
    // Damage: every enemy touched by any segment, colour rules apply.
    for (const seg of segments) {
      for (const e of state.enemies) {
        if (e.dead) continue;
        const colourOk = seg.color === 'white' ? e.color === 'white' : e.color === seg.color;
        if (!colourOk) continue;
        if (!segmentHitsCircle(seg, e.x, e.y, e.radius, st.beamWidth)) continue;
        let dps = st.beamDps * (seg.color === 'white' ? 1 : st.prismDmg);
        if (e.boss || e.elite) dps *= st.bossDmg;
        let crit = false;
        if (rand() < st.critChance) { dps *= 2; crit = true; }
        e.hp -= dps * dt;
        e.flash = 0.08;
        const kb = st.knockback * dt;
        const ka = Math.atan2(e.y - p.y, e.x - p.x);
        e.x = clamp(e.x + Math.cos(ka) * kb, e.radius, FIELD.width - e.radius);
        e.y = clamp(e.y + Math.sin(ka) * kb, e.radius, FIELD.height - e.radius);
        if (rand() < dt * 6) {
          particles.damageNumber(e.x + (rand() - 0.5) * 20, e.y - e.radius - 6, String(Math.round(dps * dt * 60)), crit ? '#ffd166' : '#fff3b0');
        }
        if (e.hp <= 0) killEnemy(e, true);
      }
      // Torches light from any beam colour.
      for (const t of state.torches) {
        if (t.lit) continue;
        if (segmentHitsCircle(seg, t.x, t.y, t.radius, st.beamWidth)) {
          t.lit = true;
          state.score += 25;
          particles.burst(t.x, t.y, PALETTE.torch, 22, 150);
          audio.torch();
          feed('Brazier lit  +25');
          radio('A brazier catches. The dark pulls back.', 2.5);
        }
      }
    }
    if (rand() < dt * 30) {
      const tip = segments.length ? segments[segments.length - 1] : null;
      if (tip) particles.emberTrail((tip.x1 + tip.x2) / 2, (tip.y1 + tip.y2) / 2, '#fff3b0');
    }
  }

  function fireSpread() {
    const p = state.player;
    if (p.spreadCd > 0 || !p.stats.tools.spread) return;
    p.spreadCd = 1.6;
    const base = p.aimAngle;
    for (let i = -2; i <= 2; i += 1) {
      const a = base + i * 0.16;
      state.spreadShots.push({
        x: p.x, y: p.y, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620,
        life: 0.55, radius: 6, dmg: 34,
      });
    }
    audio.shoot();
    shake(3);
  }

  function fireLance() {
    const p = state.player;
    if (p.lanceCd > 0 || !p.stats.tools.lance) return;
    p.lanceCd = 3.5;
    const angle = p.aimAngle;
    state.lance = {
      x1: p.x, y1: p.y,
      x2: p.x + Math.cos(angle) * 900, y2: p.y + Math.sin(angle) * 900,
      life: 0.22, maxLife: 0.22,
    };
    for (const e of state.enemies) {
      if (e.dead) continue;
      if (segmentHitsCircle(state.lance, e.x, e.y, e.radius, 26)) {
        e.hp -= 120 * (e.boss ? 0.6 : 1);
        e.flash = 0.12;
        if (e.hp <= 0) killEnemy(e, false);
      }
    }
    audio.shoot();
    shake(5);
    particles.burst(p.x + Math.cos(angle) * 60, p.y + Math.sin(angle) * 60, '#fff3b0', 16, 200);
  }

  function updateBlades(dt) {
    const p = state.player;
    const n = p.stats.tools.blades;
    if (!n) return;
    p.bladeAngle += dt * 3.2;
    for (let i = 0; i < n; i += 1) {
      const a = p.bladeAngle + (i / n) * Math.PI * 2;
      const bx = p.x + Math.cos(a) * 64;
      const by = p.y + Math.sin(a) * 64;
      for (const e of state.enemies) {
        if (e.dead) continue;
        if (dist2(bx, by, e.x, e.y) < (e.radius + 14) * (e.radius + 14)) {
          e.hp -= 30 * dt * 3;
          e.flash = 0.06;
          if (e.hp <= 0) killEnemy(e, false);
        }
      }
    }
  }

  function objectiveDone() {
    const def = state.nightDef;
    if (def.objective === 'survive') return state.kills >= def.quota;
    if (def.objective === 'light') return state.torches.every((t) => t.lit);
    if (def.objective === 'defend') return state.kills >= def.quota && (!state.lantern || state.lantern.hp > 0);
    if (def.objective === 'boss') return state.enemies.filter((e) => e.boss && !e.dead).length === 0 && state.boss !== null;
    return false;
  }

  function openDraft() {
    const owned = state.player.stats.relicCounts;
    const pool = RELICS.filter((r) => (owned[r.id] ?? 0) < r.max);
    const choices = shuffle(rand, pool).slice(0, 3);
    state.draft = choices;
    state.screen = SCREEN_DRAFT;
    audio.draft();
  }

  function chooseRelic(index) {
    if (state.screen !== SCREEN_DRAFT || !state.draft) return;
    const relic = state.draft[index];
    if (!relic) return;
    const st = state.player.stats;
    relic.apply(st);
    st.relics.push(relic.id);
    st.relicCounts[relic.id] = (st.relicCounts[relic.id] ?? 0) + 1;
    state.score += 50;
    feed(`Relic taken: ${relic.name}`);
    audio.clear();
    state.draft = null;
    state.nightsCleared += 1;
    state.score += 100 + state.night * 50 + st.nightBonus;
    if (state.night >= 10) {
      state.victory = true;
      state.screen = SCREEN_VICTORY;
      state.best = Math.max(state.best, state.score);
      saveBest();
      audio.stopMusic();
      audio.victory();
      return;
    }
    startNight(state.night + 1, true);
  }

  function step(dt, ctl) {
    state.time += dt;
    if (state.screen === SCREEN_PLAY) state.elapsed += dt;
    if (state.bannerTimer > 0) state.bannerTimer -= dt;
    if (state.radioTimer > 0) state.radioTimer -= dt;
    if (state.hurtFlash > 0) state.hurtFlash -= dt;
    state.shakeMag = Math.max(0, state.shakeMag - dt * 30);
    particles.update(dt);

    if (state.screen !== SCREEN_PLAY) return EVENT_NONE;

    const p = state.player;
    const st = p.stats;
    state.nightTime += dt;
    if (p.invuln > 0) p.invuln -= dt;
    if (p.spreadCd > 0) p.spreadCd -= dt;
    if (p.lanceCd > 0) p.lanceCd -= dt;
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) state.combo = 0;
    }

    // Movement.
    const mv = ctl.move();
    p.x = clamp(p.x + mv.x * st.speed * dt, p.radius, FIELD.width - p.radius);
    p.y = clamp(p.y + mv.y * st.speed * dt, p.radius, FIELD.height - p.radius);
    const aim = ctl.aim();
    p.aimAngle = Math.atan2(aim.y - p.y, aim.x - p.x);

    // Tools.
    const action = ctl.actionPressed ? ctl.actionPressed() : null;
    if (action === 'spread') fireSpread();
    if (action === 'lance') fireLance();

    // Beam: hold to fire, but an empty ember still recharges — holding the mouse
    // down at 0 ember must never brick the weapon.
    if (ctl.firing() && st.ember > 0) fireBeam(dt, aim);
    else {
      p.firing = false;
      state.beams = [];
      st.ember = Math.min(st.maxEmber, st.ember + st.emberRegen * dt);
    }
    updateBlades(dt);

    // Spread shots.
    for (let i = state.spreadShots.length - 1; i >= 0; i -= 1) {
      const s = state.spreadShots[i];
      s.life -= dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      let hit = false;
      for (const e of state.enemies) {
        if (e.dead) continue;
        if (dist2(s.x, s.y, e.x, e.y) < (e.radius + s.radius) * (e.radius + s.radius)) {
          e.hp -= s.dmg;
          e.flash = 0.08;
          hit = true;
          if (e.hp <= 0) killEnemy(e, false);
          break;
        }
      }
      if (hit || s.life <= 0 || s.x < 0 || s.x > FIELD.width || s.y < 0 || s.y > FIELD.height) {
        particles.burst(s.x, s.y, '#ff9f1c', 6, 90);
        state.spreadShots.splice(i, 1);
      }
    }
    if (state.lance) {
      state.lance.life -= dt;
      if (state.lance.life <= 0) state.lance = null;
    }

    // Spawning.
    state.spawnTimer -= dt;
    const aliveBosses = state.enemies.filter((e) => e.boss && !e.dead).length;
    const cap = 14 + state.night * 2;
    if (state.spawnTimer <= 0 && state.enemies.filter((e) => !e.dead).length < cap) {
      state.spawnTimer = Math.max(0.45, state.nightDef.spawnInterval * (0.9 + rand() * 0.2));
      const type = pickSpawnType(rand, state.nightDef);
      state.enemies.push(spawnEnemy(rand, type, p, state.night));
      // Elites slip in from night 4 on.
      if (state.night >= 4 && rand() < 0.06) {
        state.enemies.push(spawnEnemy(rand, 'elite', p, state.night));
        radio('An Elite Shade stalks the field!', 3);
      }
    }

    // Enemy AI + contact damage.
    const target = state.lantern && state.lantern.hp > 0 && state.nightDef.objective === 'defend'
      ? (rand() < 0.55 ? state.lantern : p) : p;
    for (const e of state.enemies) {
      if (e.dead) continue;
      const chase = e.type === 'spitter' || e.boss ? p : target;
      steerEnemy(e, dt, chase, {
        rand, time: state.time, player: p, enemies: state.enemies, bolts: state.bolts,
        radio, spawnBurst, shake,
      });
      // Touching the player hurts.
      if (dist2(e.x, e.y, p.x, p.y) < (e.radius + p.radius) * (e.radius + p.radius)) {
        damagePlayer(e.dmg * dt * 2);
        const dx = p.x - e.x; const dy = p.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        p.x = clamp(p.x + (dx / d) * 26 * dt * 10, p.radius, FIELD.width - p.radius);
        p.y = clamp(p.y + (dy / d) * 26 * dt * 10, p.radius, FIELD.height - p.radius);
      }
      // Touching the lantern hurts it.
      if (state.lantern && dist2(e.x, e.y, state.lantern.x, state.lantern.y) < (e.radius + state.lantern.radius) * (e.radius + state.lantern.radius)) {
        state.lantern.hp -= e.dmg * dt * 1.5;
        particles.burst(state.lantern.x, state.lantern.y, '#ff4d6d', 2, 60);
        if (state.lantern.hp <= 0) {
          state.lantern.hp = 0;
          radio('The Great Lantern has fallen!', 4);
        }
      }
      // Thorn lantern retaliation.
      if (st.thorns > 0 && dist2(e.x, e.y, p.x, p.y) < (e.radius + p.radius + 26) * (e.radius + p.radius + 26)) {
        e.hp -= st.thorns * dt;
        if (e.hp <= 0) killEnemy(e, false);
      }
    }
    state.enemies = state.enemies.filter((e) => !e.dead);

    // Enemy bolts.
    for (let i = state.bolts.length - 1; i >= 0; i -= 1) {
      const b = state.bolts[i];
      b.life -= dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (dist2(b.x, b.y, p.x, p.y) < (b.radius + p.radius) * (b.radius + p.radius)) {
        damagePlayer(b.dmg);
        state.bolts.splice(i, 1);
        continue;
      }
      if (state.lantern && dist2(b.x, b.y, state.lantern.x, state.lantern.y) < (b.radius + state.lantern.radius) * (b.radius + state.lantern.radius)) {
        state.lantern.hp -= b.dmg;
        state.bolts.splice(i, 1);
        continue;
      }
      if (b.life <= 0 || b.x < -20 || b.x > FIELD.width + 20 || b.y < -20 || b.y > FIELD.height + 20) state.bolts.splice(i, 1);
    }

    // Shards: drift, magnet, collect.
    for (let i = state.shards.length - 1; i >= 0; i -= 1) {
      const s = state.shards[i];
      s.life -= dt;
      const d2 = dist2(s.x, s.y, p.x, p.y);
      if (d2 < st.pickupRadius * st.pickupRadius) {
        const d = Math.sqrt(d2) || 1;
        s.x += ((p.x - s.x) / d) * 420 * dt;
        s.y += ((p.y - s.y) / d) * 420 * dt;
      } else {
        s.x += s.vx * dt; s.y += s.vy * dt;
        s.vx *= 0.94; s.vy *= 0.94;
      }
      if (d2 < (p.radius + 12) * (p.radius + 12)) {
        state.shardsCollected += 1;
        state.score += s.value * st.shardValue;
        audio.shard();
        particles.burst(s.x, s.y, '#8be9ff', 4, 70);
        state.shards.splice(i, 1);
        continue;
      }
      if (s.life <= 0) state.shards.splice(i, 1);
    }

    // Lantern destroyed = night lost.
    if (state.lantern && state.lantern.hp <= 0 && state.nightDef.objective === 'defend') {
      state.screen = SCREEN_OVER;
      audio.stopMusic();
      audio.over();
      state.best = Math.max(state.best, state.score);
      saveBest();
      return EVENT_OVER;
    }

    // Night cleared?
    if (objectiveDone()) {
      const bonus = 100 + state.night * 50 + st.nightBonus;
      state.score += bonus;
      audio.clear();
      if (state.night >= 10) {
        state.victory = true;
        state.screen = SCREEN_VICTORY;
        state.best = Math.max(state.best, state.score);
        saveBest();
        audio.stopMusic();
        audio.victory();
        return EVENT_CLEAR;
      }
      openDraft();
      return EVENT_CLEAR;
    }

    // Radio ambience, rotating lines.
    if (state.radioTimer <= 0 && state.time % 24 < dt) {
      const lines = [
        'Warden, the dark is thick tonight. Keep the flame alive.',
        'Shards on the ground — gather them, they feed the lantern.',
        'Your beam is the only thing they fear. Hold it steady.',
        'The lantern holds. So do you.',
      ];
      radio(lines[state.radioIndex % lines.length], 4);
      state.radioIndex += 1;
    }
    return EVENT_NONE;
  }

  /** Start endless mode after victory: nights loop, harder each time. */
  function startEndless() {
    state.endless = true;
    state.victory = false;
    startNight(1, true);
    state.nightDef = { ...NIGHTS[0], spawnInterval: 0.7, quota: 999 };
    radio('Endless night. How long can one flame last?', 4);
  }

  state.best = readBest();
  return {
    state, particles, reset, startNight, step, chooseRelic, startEndless,
    radio, feed, shake, spawnBurst, addScore, lightRadius, relicPool: () => RELICS,
    objectiveText: () => objectiveText(state.nightDef),
  };
}
