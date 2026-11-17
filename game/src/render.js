// LUMENFALL renderer: paints the field, the beam, the HUD, the minimap and every screen.
// The canvas is a fixed 1280x720 logical field, letterboxed to the window.
import { FIELD, FONT, PALETTE } from './config.js';
import { objectiveText } from './nights.js';
import {
  SCREEN_DRAFT, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY,
} from './world.js';

export { SCREEN_DRAFT, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = FIELD.width * dpr;
    canvas.height = FIELD.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function drawField(state) {
    const def = state.nightDef;
    ctx.fillStyle = def.tint;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Faint floor grid.
    ctx.strokeStyle = PALETTE.groundLine;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    for (let x = 80; x < FIELD.width; x += 80) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD.height); ctx.stroke();
    }
    for (let y = 80; y < FIELD.height; y += 80) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD.width, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Border wall.
    ctx.strokeStyle = PALETTE.wall;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, FIELD.width - 6, FIELD.height - 6);
    // Location labels.
    ctx.fillStyle = 'rgba(154, 163, 199, 0.55)';
    ctx.font = '600 13px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText('EMBER GATE', 24, 34);
    ctx.fillText('MIRROR HALL', FIELD.width - 130, 34);
    ctx.fillText('PRISM GARDEN', 24, FIELD.height - 22);
    ctx.fillText('THE HOLLOW', FIELD.width - 120, FIELD.height - 22);
  }

  function drawTorches(state) {
    for (const t of state.torches) {
      if (t.lit) {
        const g = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, 90);
        g.addColorStop(0, 'rgba(255, 179, 71, 0.55)');
        g.addColorStop(1, 'rgba(255, 179, 71, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(t.x, t.y, 90, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffb347';
        ctx.beginPath(); ctx.arc(t.x, t.y, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath(); ctx.arc(t.x, t.y, 6, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.strokeStyle = '#5a6285';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(t.x, t.y, 14, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#3a4066';
        ctx.beginPath(); ctx.arc(t.x, t.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#9aa3c7';
        ctx.font = '600 11px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('UNLIT', t.x, t.y + 30);
      }
    }
  }

  function drawMirrorsPrisms(state) {
    for (const m of state.mirrors) {
      ctx.strokeStyle = '#cfe8ff';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(m.x1, m.y1); ctx.lineTo(m.x2, m.y2); ctx.stroke();
      ctx.strokeStyle = '#6ec6ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(m.x1, m.y1); ctx.lineTo(m.x2, m.y2); ctx.stroke();
    }
    for (const p of state.prisms) {
      const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.radius + 18);
      g.addColorStop(0, 'rgba(255,255,255,0.8)');
      g.addColorStop(0.5, 'rgba(140, 200, 255, 0.35)');
      g.addColorStop(1, 'rgba(140, 200, 255, 0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#eaf6ff';
      ctx.beginPath();
      for (let i = 0; i < 3; i += 1) {
        const a = -Math.PI / 2 + (i / 3) * Math.PI * 2;
        const px = p.x + Math.cos(a) * p.radius;
        const py = p.y + Math.sin(a) * p.radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#5a6285';
      ctx.font = '600 11px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('PRISM', p.x, p.y + p.radius + 16);
    }
  }

  function drawLantern(state) {
    const l = state.lantern;
    if (!l) return;
    const g = ctx.createRadialGradient(l.x, l.y, 6, l.x, l.y, 120);
    g.addColorStop(0, 'rgba(255, 209, 102, 0.6)');
    g.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(l.x, l.y, 120, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(l.x, l.y, l.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a4a00';
    ctx.beginPath(); ctx.arc(l.x, l.y, l.radius * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.arc(l.x, l.y, l.radius * 0.3, 0, Math.PI * 2); ctx.fill();
    // Lantern HP bar.
    const w = 90;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(l.x - w / 2, l.y - l.radius - 22, w, 9);
    ctx.fillStyle = l.hp / l.maxHp > 0.4 ? '#7dff8a' : '#ff4d6d';
    ctx.fillRect(l.x - w / 2, l.y - l.radius - 22, w * Math.max(0, l.hp / l.maxHp), 9);
    ctx.fillStyle = '#f4ead8';
    ctx.font = '600 11px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('GREAT LANTERN', l.x, l.y - l.radius - 28);
  }

  function drawEnemies(state) {
    for (const e of state.enemies) {
      const flash = e.flash > 0;
      ctx.fillStyle = flash ? '#ffffff' : e.tint;
      ctx.beginPath(); ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2); ctx.fill();
      // Eyes: two glowing dots facing the player.
      const ang = Math.atan2(state.player.y - e.y, state.player.x - e.x);
      const ex = Math.cos(ang); const ey = Math.sin(ang);
      const px = -ey; const py = ex;
      ctx.fillStyle = e.color === 'white' ? '#ffd166' : e.color === 'red' ? '#ff5d5d' : e.color === 'green' ? '#7dff8a' : '#6ec6ff';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(e.x + ex * e.radius * 0.35 + px * s * e.radius * 0.4, e.y + ey * e.radius * 0.35 + py * s * e.radius * 0.4, e.boss ? 5 : 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (e.elite) {
        ctx.strokeStyle = '#ffd166';
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffd166';
        ctx.font = 'bold 11px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('ELITE', e.x, e.y - e.radius - 8);
      }
      if (e.boss) {
        ctx.strokeStyle = e.tint;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.radius + 6, 0, Math.PI * 2); ctx.stroke();
      }
      // HP bar for hurt enemies and bosses.
      if (e.hp < e.maxHp) {
        const w = e.boss ? 90 : e.radius * 2;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(e.x - w / 2, e.y - e.radius - 12, w, 6);
        ctx.fillStyle = '#ff4d6d';
        ctx.fillRect(e.x - w / 2, e.y - e.radius - 12, w * Math.max(0, e.hp / e.maxHp), 6);
      }
    }
  }

  function drawPlayer(state) {
    const p = state.player;
    const st = p.stats;
    // Orbiting blades.
    const n = st.tools.blades;
    if (n) {
      for (let i = 0; i < n; i += 1) {
        const a = p.bladeAngle + (i / n) * Math.PI * 2;
        const bx = p.x + Math.cos(a) * 64;
        const by = p.y + Math.sin(a) * 64;
        ctx.strokeStyle = '#fff3b0';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(bx - Math.cos(a) * 10, by - Math.sin(a) * 10); ctx.lineTo(bx + Math.cos(a) * 10, by + Math.sin(a) * 10); ctx.stroke();
      }
    }
    // Player glow.
    const g = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 70);
    g.addColorStop(0, 'rgba(255, 209, 102, 0.5)');
    g.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, 70, 0, Math.PI * 2); ctx.fill();
    // Body: the warden with the lantern.
    ctx.fillStyle = p.invuln > 0 && Math.floor(state.time * 12) % 2 === 0 ? '#fff3b0' : '#ffd166';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#7a4a00';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.stroke();
    // Lantern held toward the aim.
    const lx = p.x + Math.cos(p.aimAngle) * 22;
    const ly = p.y + Math.sin(p.aimAngle) * 22;
    ctx.fillStyle = '#ff9f1c';
    ctx.beginPath(); ctx.arc(lx, ly, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.arc(lx, ly, 3.5, 0, Math.PI * 2); ctx.fill();
    // Aim tick.
    ctx.strokeStyle = 'rgba(255, 243, 176, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + Math.cos(p.aimAngle) * 30, p.y + Math.sin(p.aimAngle) * 30);
    ctx.lineTo(p.x + Math.cos(p.aimAngle) * 40, p.y + Math.sin(p.aimAngle) * 40);
    ctx.stroke();
  }

  function drawBeams(state) {
    const st = state.player.stats;
    for (const seg of state.beams) {
      const color = seg.color === 'white' ? '#fff3b0' : seg.color === 'red' ? '#ff5d5d' : seg.color === 'green' ? '#7dff8a' : '#6ec6ff';
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = st.beamWidth + 8;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(seg.x1, seg.y1); ctx.lineTo(seg.x2, seg.y2); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineWidth = st.beamWidth;
      ctx.beginPath(); ctx.moveTo(seg.x1, seg.y1); ctx.lineTo(seg.x2, seg.y2); ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(seg.x1, seg.y1); ctx.lineTo(seg.x2, seg.y2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
    for (const s of state.spreadShots) {
      ctx.fillStyle = '#ff9f1c';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath(); ctx.arc(s.x, s.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    if (state.lance) {
      const l = state.lance;
      ctx.globalAlpha = l.life / l.maxLife;
      ctx.strokeStyle = '#fff3b0';
      ctx.lineWidth = 18;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawBoltsShards(state) {
    for (const b of state.bolts) {
      ctx.fillStyle = b.fromBoss ? '#ff4d6d' : '#b06ab0';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    for (const s of state.shards) {
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(state.time * 2 + s.x);
      ctx.fillStyle = '#8be9ff';
      ctx.fillRect(-4, -4, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    }
  }

  function drawDarkness(state) {
    // Darkness closes in around the warden; lit torches push it back.
    const p = state.player;
    const r = state.screen === SCREEN_PLAY ? 300 + (state.lightRadius ? 0 : 0) : 520;
    const lightR = Math.max(200, 340 + (state.torches.filter((t) => t.lit).length * 50));
    const g = ctx.createRadialGradient(p.x, p.y, lightR * 0.45, p.x, p.y, lightR);
    g.addColorStop(0, 'rgba(4, 6, 15, 0)');
    g.addColorStop(1, `rgba(4, 6, 15, ${0.42 + state.nightDef.darkness * 0.22})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    void r;
  }

  function drawHud(state) {
    const p = state.player;
    const st = p.stats;
    const def = state.nightDef;
    // Top-left panel: health, ember, score.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 12, 12, 300, 96, 10); ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 12, 12, 300, 96, 10); ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 17px ' + FONT;
    ctx.fillText(`NIGHT ${state.night} / 10`, 24, 34);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '12px ' + FONT;
    ctx.fillText(def.name.replace(/^Night \d+ — /, ''), 24, 52);
    // HP bar.
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, 24, 60, 180, 12, 6); ctx.fill();
    ctx.fillStyle = st.hp / st.maxHp > 0.35 ? '#7dff8a' : '#ff4d6d';
    roundRect(ctx, 24, 60, 180 * Math.max(0, st.hp / st.maxHp), 12, 6); ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 11px ' + FONT;
    ctx.fillText(`HP ${Math.ceil(st.hp)}/${st.maxHp}`, 212, 70);
    // Ember bar.
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    roundRect(ctx, 24, 78, 180, 12, 6); ctx.fill();
    ctx.fillStyle = '#ff9f1c';
    roundRect(ctx, 24, 78, 180 * Math.max(0, st.ember / st.maxEmber), 12, 6); ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.fillText(`EMBER ${Math.ceil(st.ember)}`, 212, 88);
    // Score + shards.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 12, 116, 300, 34, 10); ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 16px ' + FONT;
    ctx.fillText(`SCORE ${state.score.toLocaleString('en-US')}`, 24, 138);
    ctx.fillStyle = '#8be9ff';
    ctx.fillText(`◆ ${state.shardsCollected}`, 220, 138);
    // Objective line.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, FIELD.width / 2 - 210, 12, 420, 34, 10); ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 14px ' + FONT;
    ctx.textAlign = 'center';
    const obj = objectiveText(def);
    const progress = def.objective === 'survive' || def.objective === 'defend'
      ? `  ${Math.min(state.kills, def.quota)}/${def.quota}`
      : def.objective === 'light'
        ? `  ${state.torches.filter((t) => t.lit).length}/${state.torches.length}`
        : '';
    ctx.fillText(`◎ ${obj}${progress}`, FIELD.width / 2, 34);
    // Boss bar.
    const bosses = state.enemies.filter((e) => e.boss && !e.dead);
    if (bosses.length) {
      const b = bosses[0];
      const w = 460;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      roundRect(ctx, FIELD.width / 2 - w / 2, 54, w, 22, 8); ctx.fill();
      ctx.fillStyle = '#ff4d6d';
      roundRect(ctx, FIELD.width / 2 - w / 2 + 2, 56, (w - 4) * Math.max(0, b.hp / b.maxHp), 18, 6); ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px ' + FONT;
      ctx.fillText(`${b.name}  ${Math.ceil(b.hp)} / ${b.maxHp}`, FIELD.width / 2, 69);
    }
    // Combo.
    if (state.combo >= 2) {
      ctx.fillStyle = '#ffd166';
      ctx.font = 'bold 22px ' + FONT;
      ctx.textAlign = 'right';
      ctx.fillText(`COMBO x${state.combo}`, FIELD.width - 24, 172);
    }
    // Kill feed.
    ctx.textAlign = 'left';
    ctx.font = '12px ' + FONT;
    state.feed.forEach((line, i) => {
      ctx.globalAlpha = 1 - i * 0.18;
      ctx.fillStyle = '#cdd3ea';
      ctx.fillText(line, 24, 190 + i * 18);
    });
    ctx.globalAlpha = 1;
    // Radio callout.
    if (state.radioTimer > 0) {
      ctx.fillStyle = 'rgba(10, 14, 32, 0.8)';
      roundRect(ctx, FIELD.width / 2 - 300, FIELD.height - 52, 600, 30, 10); ctx.fill();
      ctx.fillStyle = '#ffd166';
      ctx.font = 'italic 14px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(`“${state.radioText}”`, FIELD.width / 2, FIELD.height - 32);
    }
    // Controls hint.
    ctx.fillStyle = 'rgba(154, 163, 199, 0.7)';
    ctx.font = '11px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText('WASD move · Mouse aim · Hold LMB / Space beam · Q spread · E lance · P pause · M mute', 24, FIELD.height - 14);
    // Best score.
    ctx.textAlign = 'right';
    ctx.fillText(`BEST ${state.best.toLocaleString('en-US')}`, FIELD.width - 24, FIELD.height - 14);
  }

  function drawMinimap(state) {
    const mw = 150; const mh = 84;
    const mx = FIELD.width - mw - 16; const my = 56;
    const sx = mw / FIELD.width; const sy = mh / FIELD.height;
    ctx.fillStyle = 'rgba(10, 14, 32, 0.85)';
    roundRect(ctx, mx, my, mw, mh, 8); ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 1.5;
    roundRect(ctx, mx, my, mw, mh, 8); ctx.stroke();
    ctx.fillStyle = '#9aa3c7';
    ctx.font = 'bold 10px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText('MINIMAP', mx + 8, my + 13);
    for (const t of state.torches) {
      ctx.fillStyle = t.lit ? '#ffb347' : '#5a6285';
      ctx.fillRect(mx + t.x * sx - 2, my + t.y * sy - 2, 4, 4);
    }
    if (state.lantern) {
      ctx.fillStyle = '#ffd166';
      ctx.beginPath(); ctx.arc(mx + state.lantern.x * sx, my + state.lantern.y * sy, 4, 0, Math.PI * 2); ctx.fill();
    }
    for (const e of state.enemies) {
      ctx.fillStyle = e.boss ? '#ff4d6d' : e.tint;
      ctx.beginPath(); ctx.arc(mx + e.x * sx, my + e.y * sy, e.boss ? 4 : 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(mx + state.player.x * sx, my + state.player.y * sy, 3.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawBanner(state) {
    if (state.bannerTimer <= 0) return;
    ctx.globalAlpha = Math.min(1, state.bannerTimer);
    ctx.fillStyle = 'rgba(4, 6, 15, 0.55)';
    ctx.fillRect(0, FIELD.height / 2 - 64, FIELD.width, 128);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 44px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText(state.banner, FIELD.width / 2, FIELD.height / 2 - 6);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '18px ' + FONT;
    ctx.fillText(state.nightDef.sub, FIELD.width / 2, FIELD.height / 2 + 30);
    ctx.globalAlpha = 1;
  }

  function drawTitle(state, best) {
    ctx.fillStyle = '#070a18';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Big glowing lantern art.
    const cx = FIELD.width / 2; const cy = 250;
    const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 260);
    g.addColorStop(0, 'rgba(255, 209, 102, 0.75)');
    g.addColorStop(0.4, 'rgba(255, 159, 28, 0.25)');
    g.addColorStop(1, 'rgba(255, 159, 28, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, 260, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a4a00';
    ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
    // Beams fanning out.
    ctx.strokeStyle = 'rgba(255, 243, 176, 0.32)';
    ctx.lineWidth = 6;
    for (const a of [-2.4, -1.9, -1.4, -0.9, -0.4, 0.1, 0.6, 1.1, 1.6]) {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * 235, cy + Math.sin(a) * 235);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 72px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('LUMENFALL', cx, 130);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '22px ' + FONT;
    ctx.fillText('Ten Nights of the Ember Warden', cx, 168);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '16px ' + FONT;
    ctx.fillText('Your beam is the only light the dark fears. Aim it with the mouse,', cx, 470);
    ctx.fillText('bend it with mirrors, split it with prisms, and guard the lanterns.', cx, 494);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 20px ' + FONT;
    const blink = Math.floor(state.time * 2) % 2 === 0;
    if (blink) ctx.fillText('— CLICK or press ENTER to begin —', cx, 560);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '14px ' + FONT;
    ctx.fillText('WASD move · Mouse aim · Hold click / Space to fire the beam · Q spread · E lance · P pause · M mute', cx, 610);
    if (best > 0) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 16px ' + FONT;
      ctx.fillText(`BEST SCORE ${best.toLocaleString('en-US')}`, cx, 646);
    }
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '13px ' + FONT;
    ctx.fillText('10 nights · 10 enemy kinds · 24 relics · mirrors, prisms and braziers', cx, 676);
  }

  function drawDraft(state) {
    drawPlayScene(state);
    ctx.fillStyle = 'rgba(4, 6, 15, 0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 40px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText(`NIGHT ${state.night} CLEARED`, FIELD.width / 2, 110);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '18px ' + FONT;
    ctx.fillText('The dawn holds — for now. Choose a relic for the night ahead.', FIELD.width / 2, 146);
    ctx.fillText(`Score ${state.score.toLocaleString('en-US')}  ·  Shards ${state.shardsCollected}  ·  Kills ${state.killsTotal}`, FIELD.width / 2, 176);
    const cards = state.draft || [];
    const cw = 300; const ch = 220; const gap = 30;
    const total = cards.length * cw + (cards.length - 1) * gap;
    const x0 = (FIELD.width - total) / 2;
    cards.forEach((r, i) => {
      const x = x0 + i * (cw + gap);
      const y = 240;
      ctx.fillStyle = PALETTE.panel;
      roundRect(ctx, x, y, cw, ch, 14); ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 2;
      roundRect(ctx, x, y, cw, ch, 14); ctx.stroke();
      ctx.fillStyle = PALETTE.gold;
      ctx.font = 'bold 15px ' + FONT;
      ctx.fillText(`[${i + 1}]  RELIC`, x + cw / 2, y + 36);
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 22px ' + FONT;
      ctx.fillText(r.name, x + cw / 2, y + 76);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = '15px ' + FONT;
      wrapText(r.desc, x + cw / 2, y + 112, cw - 36, 22);
      ctx.fillStyle = '#8be9ff';
      ctx.font = '13px ' + FONT;
      ctx.fillText('Click the card or press its number', x + cw / 2, y + ch - 22);
    });
    state.draftRects = cards.map((_, i) => ({ x: x0 + i * (cw + gap), y: 240, w: cw, h: ch }));
  }

  function wrapText(text, cx, y, maxW, lineH) {
    const words = text.split(' ');
    let line = '';
    let ly = y;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, cx, ly);
        line = w;
        ly += lineH;
      } else line = test;
    }
    if (line) ctx.fillText(line, cx, ly);
  }

  function drawPaused(state) {
    drawPlayScene(state);
    ctx.fillStyle = 'rgba(4, 6, 15, 0.7)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 48px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2 - 10);
    ctx.font = '18px ' + FONT;
    ctx.fillText('P or Esc to resume · R to restart · M to mute', FIELD.width / 2, FIELD.height / 2 + 30);
  }

  function drawOver(state) {
    drawPlayScene(state);
    ctx.fillStyle = 'rgba(10, 4, 10, 0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = '#ff4d6d';
    ctx.font = 'bold 52px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('THE LIGHT DIES', FIELD.width / 2, 250);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px ' + FONT;
    ctx.fillText(`The dark took the warden on Night ${state.night}.`, FIELD.width / 2, 300);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 26px ' + FONT;
    ctx.fillText(`SCORE ${state.score.toLocaleString('en-US')}   ·   BEST ${state.best.toLocaleString('en-US')}`, FIELD.width / 2, 350);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '16px ' + FONT;
    ctx.fillText(`Nights cleared ${state.nightsCleared} · Kills ${state.killsTotal} · Shards ${state.shardsCollected} · Best combo x${state.comboBest}`, FIELD.width / 2, 388);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 20px ' + FONT;
    const blink = Math.floor(state.time * 2) % 2 === 0;
    if (blink) ctx.fillText('— Press ENTER or R to try again —', FIELD.width / 2, 470);
  }

  function drawVictory(state) {
    ctx.fillStyle = '#0a120c';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    const cx = FIELD.width / 2;
    const g = ctx.createRadialGradient(cx, 280, 10, cx, 280, 320);
    g.addColorStop(0, 'rgba(255, 243, 176, 0.9)');
    g.addColorStop(0.5, 'rgba(255, 209, 102, 0.3)');
    g.addColorStop(1, 'rgba(255, 209, 102, 0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, 280, 320, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 56px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('DAWN BREAKS', cx, 180);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '22px ' + FONT;
    ctx.fillText('Ten nights. One flame. The Night Sovereign is dust,', cx, 380);
    ctx.fillText('and the sun rises over the Ember Warden.', cx, 412);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 28px ' + FONT;
    ctx.fillText(`FINAL SCORE ${state.score.toLocaleString('en-US')}   ·   BEST ${state.best.toLocaleString('en-US')}`, cx, 470);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '16px ' + FONT;
    ctx.fillText(`Kills ${state.killsTotal} · Shards ${state.shardsCollected} · Best combo x${state.comboBest} · Time ${Math.floor(state.elapsed / 60)}:${String(Math.floor(state.elapsed % 60)).padStart(2, '0')}`, cx, 510);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 20px ' + FONT;
    const blink = Math.floor(state.time * 2) % 2 === 0;
    if (blink) ctx.fillText('— ENTER: endless night · R: play again —', cx, 580);
  }

  function drawPlayScene(state) {
    const shakeX = state.shakeMag ? Math.sin(state.time * 91.7) * 0.5 * state.shakeMag : 0;
    const shakeY = state.shakeMag ? Math.cos(state.time * 83.3) * 0.5 * state.shakeMag : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawField(state);
    drawTorches(state);
    drawMirrorsPrisms(state);
    drawLantern(state);
    drawBoltsShards(state);
    drawEnemies(state);
    drawPlayer(state);
    drawBeams(state);
    state.particles.draw(ctx);
    drawDarkness(state);
    ctx.restore();
    if (state.hurtFlash > 0) {
      ctx.fillStyle = `rgba(255, 40, 70, ${state.hurtFlash * 0.35})`;
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    }
    drawHud(state);
    drawMinimap(state);
    drawBanner(state);
  }

  function draw(state, screen, best) {
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_DRAFT) drawDraft(state);
    else if (screen === SCREEN_PAUSED) drawPaused(state);
    else if (screen === SCREEN_OVER) drawOver(state);
    else if (screen === SCREEN_VICTORY) drawVictory(state);
    else drawPlayScene(state);
    const status = document.getElementById('status');
    if (status) {
      status.textContent = screen === SCREEN_PLAY
        ? `Night ${state.night} of 10. Score ${state.score}. Health ${Math.ceil(state.player.stats.hp)}.`
        : screen;
    }
  }

  return { draw, drawPlayScene };
}
