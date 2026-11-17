// WebAudio sound effects and procedural music — no audio files, everything is synthesised.
// The music is a quiet minor-key loop: a bass pulse and a sparse arpeggio, scheduled ahead
// so it keeps time even when the frame rate wobbles. Mute (M) silences both.
const NOTE_FREQ = { C3: 130.81, D3: 146.83, Eb3: 155.56, F3: 174.61, G3: 196.0, Ab3: 207.65, Bb3: 233.08, C4: 261.63, Eb4: 311.13, F4: 349.23, G4: 392.0, Ab4: 415.3, Bb4: 466.16, C5: 523.25, Eb5: 622.25, G5: 783.99 };

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicTimer = null;
  let step = 0;
  // A minor progression: Am — F — C — G, in a low register.
  const bass = ['C3', 'F3', 'G3', 'Ab3', 'C3', 'F3', 'Bb3', 'G3'];
  const arp = ['C4', 'Eb4', 'G4', 'C5', 'Eb5', 'G4', 'Eb4', 'G4', 'F4', 'Ab4', 'C5', 'G4', 'Bb4', 'G4', 'F4', 'Eb4'];

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.16;
      musicGain.connect(master);
    } catch {
      return false;
    }
    return true;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol, filterFreq) {
    if (!ensure() || muted) return;
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t0);
  }

  function musicStep() {
    if (!ctx || muted) return;
    const bar = Math.floor(step / 8) % bass.length;
    const beat = step % 8;
    if (beat === 0) tone(NOTE_FREQ[bass[bar]], 0.9, 'sine', 0.5, 0, 0);
    if (beat === 4) tone(NOTE_FREQ[bass[bar]] * 1.5, 0.5, 'sine', 0.25, 0, 0);
    if (step % 2 === 0) {
      const note = arp[(step * 7 + bar * 3) % arp.length];
      tone(NOTE_FREQ[note], 0.35, 'triangle', 0.12, 0, 0);
    }
    step += 1;
  }

  return {
    unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {}); },
    setMuted(m) {
      muted = m;
      if (master) master.gain.value = m ? 0 : 0.5;
      if (m && musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      if (!m && ctx && !musicTimer) musicTimer = setInterval(musicStep, 240);
    },
    isMuted() { return muted; },
    startMusic() {
      if (!ensure()) return;
      if (musicTimer) return;
      musicTimer = setInterval(musicStep, 240);
    },
    stopMusic() { if (musicTimer) { clearInterval(musicTimer); musicTimer = null; } },
    shoot() { tone(880, 0.08, 'sawtooth', 0.05, 0, 440); },
    hit() { tone(220 + Math.random() * 80, 0.06, 'square', 0.06, 0, 110); },
    kill() { tone(520, 0.16, 'triangle', 0.14, 0, 130); noise(0.12, 0.1, 2400); },
    shard() { tone(1240 + Math.random() * 300, 0.09, 'sine', 0.08, 0, 1860); },
    hurt() { tone(140, 0.25, 'sawtooth', 0.16, 0, 60); noise(0.15, 0.12, 900); },
    torch() { tone(392, 0.3, 'sine', 0.12, 0, 784); tone(587, 0.3, 'sine', 0.08, 0.12, 880); },
    boss() { tone(65, 0.9, 'sawtooth', 0.2, 0, 48); tone(98, 0.9, 'sawtooth', 0.12, 0.1, 70); },
    clear() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, 'triangle', 0.12, i * 0.12)); },
    over() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.5, 'triangle', 0.14, i * 0.18)); },
    victory() { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.5, 'triangle', 0.13, i * 0.14)); },
    click() { tone(700, 0.05, 'sine', 0.08); },
    draft() { tone(440, 0.12, 'triangle', 0.1, 0, 660); tone(660, 0.12, 'triangle', 0.08, 0.08, 880); },
  };
}
