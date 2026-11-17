// LUMENFALL boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the renderer
// paints what is there. The game moves between six screens: title, play, relic draft,
// paused, game over and victory.
//
// ?seed=N fixes the random pattern. ?shot=cover|title|boss|victory (with &seed=N) stages
// that scene instead of running the loop, paints it twice and sets window.__shotReady.
// ?speed=N runs the simulation N times faster (a playtest aid).
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, SCREEN_DRAFT, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './world.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
const speedParam = Number.parseFloat(params.get('speed') ?? '1');
const speed = Number.isFinite(speedParam) && speedParam > 0 && speedParam <= 16 ? speedParam : 1;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();
const world = createWorld(createRandom(seed), audio);
const renderer = createRenderer(canvas);
window.__game = world;
window.__LUMENFALL = { world, seed };

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; }
  catch { return 0; }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let muted = false;
  world.reset();
  screen = SCREEN_TITLE;

  function startPlay() {
    audio.unlock();
    audio.startMusic();
    world.startNight(1, false);
    screen = SCREEN_PLAY;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const frameDt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    const action = input.actionPressed();
    const click = input.click();

    // Global keys.
    if (action === ACTION_MUTE) {
      muted = !muted;
      audio.setMuted(muted);
    }

    if (screen === SCREEN_TITLE) {
      world.step(frameDt, input);
      if (action === ACTION_CONFIRM || click) startPlay();
    } else if (screen === SCREEN_PLAY) {
      if (action === ACTION_PAUSE) {
        screen = SCREEN_PAUSED;
      } else if (action === ACTION_RESTART) {
        startPlay();
      } else {
        accumulator += frameDt * speed;
        while (accumulator >= STEP) {
          world.step(STEP, input);
          accumulator -= STEP;
          if (world.state.screen !== SCREEN_PLAY) break;
        }
        if (world.state.screen === SCREEN_DRAFT) screen = SCREEN_DRAFT;
        else if (world.state.screen === SCREEN_OVER) { screen = SCREEN_OVER; best = Math.max(best, world.state.score); }
        else if (world.state.screen === SCREEN_VICTORY) { screen = SCREEN_VICTORY; best = Math.max(best, world.state.score); }
      }
    } else if (screen === SCREEN_DRAFT) {
      world.step(frameDt, input);
      if (action === ACTION_RESTART) startPlay();
      else {
        let picked = -1;
        if (input.wasPressed('1')) picked = 0;
        else if (input.wasPressed('2')) picked = 1;
        else if (input.wasPressed('3')) picked = 2;
        else if (click && world.state.draftRects) {
          world.state.draftRects.forEach((r, i) => {
            if (click.x >= r.x && click.x <= r.x + r.w && click.y >= r.y && click.y <= r.y + r.h) picked = i;
          });
        }
        if (picked >= 0) {
          world.chooseRelic(picked);
          if (world.state.screen === SCREEN_PLAY) screen = SCREEN_PLAY;
          else if (world.state.screen === SCREEN_VICTORY) { screen = SCREEN_VICTORY; best = Math.max(best, world.state.score); }
        }
      }
    } else if (screen === SCREEN_PAUSED) {
      if (action === ACTION_PAUSE || action === ACTION_CONFIRM) screen = SCREEN_PLAY;
      else if (action === ACTION_RESTART) startPlay();
    } else if (screen === SCREEN_OVER) {
      world.step(frameDt, input);
      if (action === ACTION_CONFIRM || action === ACTION_RESTART) startPlay();
    } else if (screen === SCREEN_VICTORY) {
      world.step(frameDt, input);
      if (action === ACTION_CONFIRM) {
        world.startEndless();
        screen = SCREEN_PLAY;
      } else if (action === ACTION_RESTART) startPlay();
    }

    renderer.draw(world.state, screen, best);
    window.__uiScreen = screen;
    input.endFrame();
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
