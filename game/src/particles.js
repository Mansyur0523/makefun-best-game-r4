// Particles, floating damage numbers and burst effects — the game's juice.
// Everything here is cosmetic: it never changes the rules, only how they feel.
import { FIELD } from './config.js';
import { clamp } from './random.js';

export function createParticles(rand = Math.random) {
  const parts = [];
  const texts = [];

  function burst(x, y, color, count, speed = 160, life = 0.6) {
    for (let i = 0; i < count; i += 1) {
      const a = rand() * Math.PI * 2;
      const v = speed * (0.4 + rand() * 0.8);
      parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: life * (0.6 + rand() * 0.7), maxLife: life,
        size: 2 + rand() * 3.5, color, drag: 0.92,
      });
    }
    if (parts.length > 600) parts.splice(0, parts.length - 600);
  }

  function emberTrail(x, y, color) {
    parts.push({
      x: x + (rand() - 0.5) * 8, y: y + (rand() - 0.5) * 8,
      vx: (rand() - 0.5) * 30, vy: -20 - rand() * 30,
      life: 0.5, maxLife: 0.5, size: 2 + rand() * 2, color, drag: 0.98,
    });
  }

  function damageNumber(x, y, text, color = '#ffe9a8') {
    texts.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
    if (texts.length > 40) texts.shift();
  }

  function update(dt) {
    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= p.drag; p.vy *= p.drag;
      p.x = clamp(p.x, 0, FIELD.width); p.y = clamp(p.y, 0, FIELD.height);
    }
    for (let i = texts.length - 1; i >= 0; i -= 1) {
      const t = texts[i];
      t.life -= dt;
      t.y -= 34 * dt;
      if (t.life <= 0) texts.splice(i, 1);
    }
  }

  function draw(ctx) {
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + p.life / p.maxLife), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px system-ui, sans-serif';
    for (const t of texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  return { burst, emberTrail, damageNumber, update, draw, parts, texts };
}
