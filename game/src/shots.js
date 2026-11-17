// Deterministic screenshot scenes: each one plays the real rules forward from a fresh
// world for a fixed number of steps, steered by an autopilot (kite the nearest threat,
// aim the beam at it, light braziers when the field is clear), so the frame is what a
// real game looks like and the same seed always gives the same frame.
import { FIELD, STEP } from './config.js';
import { SCREEN_DRAFT, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './world.js';

/** Build a fake input controller driven by the autopilot for this world. */
function autopilotCtl(world) {
  const state = world.state;
  let lastAction = '';
  return {
    move() {
      const p = state.player;
      const target = pickTarget(state);
      if (!target) return { x: 0, y: 0 };
      const dx = target.x - p.x; const dy = target.y - p.y;
      const d = Math.hypot(dx, dy) || 1;
      let mx = 0; let my = 0;
      if (d > 300) { mx = dx / d; my = dy / d; }
      else if (d < 150) { mx = -dx / d; my = -dy / d; }
      else {
        // Strafe around the target.
        const s = Math.sin(state.time * 1.7) > 0 ? 1 : -1;
        mx = (-dy / d) * s; my = (dx / d) * s;
      }
      // Stay inside the field.
      if (p.x < 120) mx += 0.8;
      if (p.x > FIELD.width - 120) mx -= 0.8;
      if (p.y < 120) my += 0.8;
      if (p.y > FIELD.height - 120) my -= 0.8;
      const m = Math.hypot(mx, my) || 1;
      return { x: mx / m, y: my / m };
    },
    aim() {
      const t = pickTarget(state);
      return t ? { x: t.x, y: t.y } : { x: state.player.x, y: state.player.y - 100 };
    },
    firing() {
      const p = state.player;
      return p.stats.ember > 12 && pickTarget(state) !== null;
    },
    actionPressed() {
      const p = state.player;
      if (p.stats.tools.spread && p.spreadCd <= 0 && lastAction !== 'spread') { lastAction = 'spread'; return 'spread'; }
      if (p.stats.tools.lance && p.lanceCd <= 0 && lastAction !== 'lance') { lastAction = 'lance'; return 'lance'; }
      lastAction = '';
      return null;
    },
    click() { return null; },
    wasPressed() { return false; },
    down() { return false; },
    endFrame() {},
  };
}

/** What the autopilot cares about most right now: a boss, then the nearest enemy, then a torch. */
function pickTarget(state) {
  const p = state.player;
  let best = null; let bestD = Infinity;
  let coloured = null; let colouredD = Infinity;
  for (const e of state.enemies) {
    if (e.dead) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (e.color !== 'white') {
      if (d < colouredD) { colouredD = d; coloured = e; }
      continue;
    }
    const score = e.boss ? d * 0.2 : d;
    if (score < bestD) { bestD = score; best = e; }
  }
  if (best && bestD < 560) return best;
  for (const t of state.torches) {
    if (t.lit) continue;
    const d = Math.hypot(t.x - p.x, t.y - p.y);
    if (d < bestD) { bestD = d; best = t; }
  }
  if (best) return best;
  // Only coloured shades left: aim the beam through the nearest prism so it splits.
  if (coloured && state.prisms.length) {
    let prism = null; let pd = Infinity;
    for (const pr of state.prisms) {
      const d = Math.hypot(pr.x - p.x, pr.y - p.y);
      if (d < pd) { pd = d; prism = pr; }
    }
    if (prism) return prism;
  }
  return coloured;
}

/** Run the world forward for `seconds` with the autopilot. Returns true if still playing. */
function runForward(world, seconds) {
  const ctl = autopilotCtl(world);
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP, ctl);
    if (world.state.screen !== SCREEN_PLAY) break;
  }
  return world.state.screen === SCREEN_PLAY;
}

/** One last step with the beam on, aimed at the nearest threat, so the frame shows the beam. */
function finalBeamFrame(world) {
  const ctl = autopilotCtl(world);
  world.step(STEP, ctl);
}

/** Grant the warden a veteran build (real relics from the pool) for the victory scene. */
function veteranBuild(world) {
  const st = world.state.player.stats;
  const wanted = ['focuslens', 'focuslens', 'focuslens', 'widebeam', 'widebeam', 'emberwell', 'emberwell', 'ironmantle', 'ironmantle', 'ironmantle', 'lifesteal', 'lifesteal', 'bossbane', 'bossbane', 'blades', 'blades', 'lance', 'spread', 'secondwind'];
  // Import the pool lazily to keep this module's imports small.
  const pool = world.relicPool();
  for (const id of wanted) {
    const relic = pool.find((r) => r.id === id);
    if (relic) relic.apply(st);
  }
  st.hp = st.maxHp;
  st.ember = st.maxEmber;
}

/**
 * Set `world` to the named scene (cover, title, boss, victory) and return the screen
 * to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'title') {
    for (let i = 0; i < 90; i += 1) world.step(STEP, autopilotCtl(world));
    world.state.screen = SCREEN_TITLE;
    return { screen: SCREEN_TITLE, best: 2480 };
  }
/** A solid mid-campaign build (real relics) so the cover autopilot survives the siege. */
function midBuild(world) {
  const st = world.state.player.stats;
  const pool = world.relicPool();
  for (const id of ['ironmantle', 'ironmantle', 'ironmantle', 'lifesteal', 'lifesteal', 'focuslens', 'focuslens', 'emberwell', 'blades', 'widebeam', 'secondwind']) {
    const relic = pool.find((r) => r.id === id);
    if (relic) relic.apply(st);
  }
  st.hp = st.maxHp;
  st.ember = st.maxEmber;
}

  if (name === 'cover') {
    // Night 8, Siege of the Lantern: lantern, mirrors, prism, elites — the live-combat cover.
    world.startNight(8, false);
    midBuild(world);
    runForward(world, 18);
    finalBeamFrame(world);
    return { screen: SCREEN_PLAY, best: 1240 };
  }
  if (name === 'boss') {
    world.startNight(5, false);
    runForward(world, 18);
    finalBeamFrame(world);
    return { screen: SCREEN_PLAY, best: 1860 };
  }
  if (name === 'victory') {
    // Play the whole campaign for real, night by night, with a veteran build:
    // the victory screen then shows true cumulative kills, shards and time.
    world.startNight(1, false);
    veteranBuild(world);
    const ctl = autopilotCtl(world);
    let attempts = 0;
    let guard = 0;
    while ((world.state.screen === SCREEN_PLAY || world.state.screen === SCREEN_DRAFT) && guard < 40) {
      guard += 1;
      if (world.state.screen === SCREEN_DRAFT) {
        world.chooseRelic(0);
        attempts = 0;
        continue;
      }
      const nightAtStart = world.state.night;
      for (let i = 0; i < 300 / STEP; i += 1) {
        world.step(STEP, ctl);
        if (world.state.screen !== SCREEN_PLAY) break;
      }
      if (world.state.screen === SCREEN_VICTORY) break;
      if (world.state.screen === SCREEN_DRAFT) continue;
      if (world.state.screen === SCREEN_OVER) {
        // Fell in this night: retry it with a hardier build.
        attempts += 1;
        if (attempts >= 3) break;
        world.startNight(nightAtStart, true);
        world.state.player.stats.maxHp += 120;
        world.state.player.stats.hp = world.state.player.stats.maxHp;
        world.state.player.stats.beamDps *= 1.3;
        continue;
      }
      if (world.state.screen === SCREEN_PLAY && world.state.night === nightAtStart) {
        // Stalled on this night: retry it with a hardier build.
        attempts += 1;
        if (attempts >= 3) break;
        world.startNight(nightAtStart, true);
        world.state.player.stats.maxHp += 120;
        world.state.player.stats.hp = world.state.player.stats.maxHp;
        world.state.player.stats.beamDps *= 1.3;
      }
    }
    return { screen: world.state.screen === SCREEN_VICTORY ? SCREEN_VICTORY : SCREEN_OVER, best: world.state.score };
  }
  // Default: night 1 combat.
  world.startNight(1, false);
  runForward(world, 12);
  finalBeamFrame(world);
  return { screen: SCREEN_PLAY, best: 640 };
}
