// Keyboard + mouse input, mapped to the game's logical 1280x720 field.
// The canvas is letterboxed to the window; mouse coordinates are converted back to field space.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_MUTE = 'mute';
export const ACTION_RESTART = 'restart';
export const ACTION_SPREAD = 'spread';
export const ACTION_LANCE = 'lance';

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // edge-triggered: cleared after each frame is read
  let mouseX = FIELD.width / 2;
  let mouseY = FIELD.height / 2 - 120;
  let mouseDown = false;
  let mouseClicked = false;
  let clickX = 0;
  let clickY = 0;

  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const ox = (rect.width - FIELD.width * scale) / 2;
    const oy = (rect.height - FIELD.height * scale) / 2;
    return { x: (clientX - rect.left - ox) / scale, y: (clientY - rect.top - oy) / scale };
  }

  function onKeyDown(event) {
    const k = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) event.preventDefault();
    if (!keys.has(k)) pressed.add(k);
    keys.add(k);
  }
  function onKeyUp(event) { keys.delete(event.key.toLowerCase()); }
  function onMouseMove(event) {
    const p = toField(event.clientX, event.clientY);
    mouseX = p.x; mouseY = p.y;
  }
  function onMouseDown(event) {
    if (event.button !== 0) return;
    const p = toField(event.clientX, event.clientY);
    mouseX = p.x; mouseY = p.y;
    mouseDown = true;
    mouseClicked = true;
    clickX = p.x; clickY = p.y;
  }
  function onMouseUp(event) { if (event.button === 0) mouseDown = false; }
  function onBlur() { keys.clear(); mouseDown = false; }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  return {
    /** Movement vector from WASD / arrows, normalised. */
    move() {
      let x = 0; let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) { x *= 0.7071; y *= 0.7071; }
      return { x, y };
    },
    aim() { return { x: mouseX, y: mouseY }; },
    firing() { return mouseDown || keys.has(' '); },
    down(k) { return keys.has(k); },
    /** True once for the frame the key went down. */
    wasPressed(k) { return pressed.has(k); },
    /** True once for the frame the mouse was clicked; also returns the field position. */
    click() {
      if (!mouseClicked) return null;
      mouseClicked = false;
      return { x: clickX, y: clickY };
    },
    actionPressed() {
      if (pressed.has('enter') || pressed.has(' ')) return ACTION_CONFIRM;
      if (pressed.has('p') || pressed.has('escape')) return ACTION_PAUSE;
      if (pressed.has('m')) return ACTION_MUTE;
      if (pressed.has('r')) return ACTION_RESTART;
      if (pressed.has('q')) return ACTION_SPREAD;
      if (pressed.has('e')) return ACTION_LANCE;
      return null;
    },
    endFrame() { pressed.clear(); },
  };
}
