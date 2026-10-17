// Adaptive layered soundtrack engine — the professional standard for web
// game music (vertical layering, à la MDN "Audio for Web Games" + No Man's
// Sky style procedural scoring):
//   - a 16-step lookahead sequencer (the "Tale of Two Clocks" pattern:
//     setInterval only schedules; the AudioContext clock does the timing)
//   - intensity layers: bass + pad always, drums at intensity >= 1,
//     arpeggio lead at intensity >= 2
//   - boss mode swaps in a driving double-kick, snare backbeat and a
//     dissonant minor-second tremolo bed (the classic boss-theme trick)
//   - duck() sweeps a master lowpass + gain dip for boss-death slow-motion
// Key: A phrygian (dark, space-horror feel), 132 BPM, 4-bar chord loop.

const BPM = 132;
const STEPS_PER_BAR = 16;
const STEP_TIME = 60 / BPM / 4; // seconds per 16th note
const LOOKAHEAD_S = 0.14; // schedule this far ahead of the audio clock
const TICK_MS = 25; // scheduler poll interval

// 4-bar chord loop (root/mid/top frequencies, A phrygian flavour):
// Am -> F -> G -> Em
const CHORDS: Array<{ root: number; tones: number[] }> = [
  { root: 110.0, tones: [110.0, 130.81, 164.81] },   // A2 C3 E3
  { root: 87.31, tones: [87.31, 110.0, 130.81] },    // F2 A2 C3
  { root: 98.0, tones: [98.0, 123.47, 146.83] },     // G2 B2 D3
  { root: 82.41, tones: [82.41, 98.0, 123.47] },     // E2 G2 B2
];

// Industrial syncopated bassline: which 16th steps hit the chord root.
const BASS_STEPS = new Set([0, 3, 6, 8, 10, 14]);
// Drums: four-on-the-floor-ish stomp (0, 6, 10) — drives without tiring.
const KICK_STEPS = new Set([0, 6, 10]);
const KICK_BOSS_STEPS = new Set([0, 4, 8, 12]); // boss: double-time stomp
const HAT_STEPS = new Set([2, 6, 10, 14]);
const SNARE_STEPS = new Set([4, 12]); // boss-mode backbeat
// Arpeggio scale degrees (semitone offsets from A) cycling every step at
// intensity 2 — phrygian: A Bb C D E F G.
const ARP_SEMITONES = [0, 3, 5, 7, 10, 12, 15, 12, 10, 7, 5, 3, 0, 3, 7, 12];
const A4 = 440;

export type MusicIntensity = 0 | 1 | 2;

export class MusicEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private timer: number | null = null;
  private nextStepTime = 0;
  private step = 0;
  private bar = 0;
  private playing = false;
  private intensity: MusicIntensity = 1;
  private bossMode = false;
  private volume = 0.5;
  private duckUntil = 0;

  /** Start (or resume) the soundtrack. Safe to call repeatedly. */
  start(): void {
    if (this.playing) {
      this.resumeCtx();
      return;
    }
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return; // no WebAudio — stay silent, game still runs
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume * 0.5;
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 16000; // open until a duck sweeps it
      this.filter.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    this.playing = true;
    this.resumeCtx();
    this.nextStepTime = this.ctx.currentTime + 0.06;
    this.timer = window.setInterval(() => this.schedule(), TICK_MS);
  }

  stop(): void {
    this.playing = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** 0 = menu calm, 1 = combat, 2 = intense (boss / low HP / late waves). */
  setIntensity(i: MusicIntensity): void {
    this.intensity = i;
  }

  setBossMode(on: boolean): void {
    this.bossMode = on;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume * 0.5, this.ctx.currentTime, 0.05);
    }
  }

  /** Boss-death slow-motion feel: muffle + dip, then recover. */
  duck(seconds: number): void {
    if (!this.ctx || !this.filter || !this.master) return;
    const t = this.ctx.currentTime;
    this.filter.frequency.cancelScheduledValues(t);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, t);
    this.filter.frequency.exponentialRampToValueAtTime(90, t + seconds * 0.55);
    this.filter.frequency.exponentialRampToValueAtTime(16000, t + seconds);
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(this.volume * 0.15, t + 0.1);
    this.master.gain.linearRampToValueAtTime(this.volume * 0.5, t + seconds);
    this.duckUntil = t + seconds;
  }

  isRunning(): boolean {
    return this.playing;
  }

  private resumeCtx(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /** Lookahead scheduler: queue every step that falls inside the window. */
  private schedule(): void {
    if (!this.ctx || !this.playing) return;
    while (this.nextStepTime < this.ctx.currentTime + LOOKAHEAD_S) {
      this.scheduleStep(this.step, this.bar, this.nextStepTime);
      this.step++;
      if (this.step >= STEPS_PER_BAR) {
        this.step = 0;
        this.bar++;
      }
      this.nextStepTime += STEP_TIME;
    }
  }

  private scheduleStep(step: number, bar: number, when: number): void {
    const chord = CHORDS[bar % CHORDS.length] ?? CHORDS[0]!;
    const inBoss = this.bossMode;
    const intensity = this.intensity;

    // Bass: always present — the harmonic anchor.
    if (BASS_STEPS.has(step)) {
      const octaveDown = step === 0 ? 0.5 : 1;
      this.bass(chord.root * octaveDown, when, STEP_TIME * 1.6, inBoss);
    }

    // Pad: one soft swell per bar.
    if (step === 0) {
      this.pad(chord.tones, when);
    }

    // Drums layer.
    if (intensity >= 1) {
      const kicks = inBoss ? KICK_BOSS_STEPS : KICK_STEPS;
      if (kicks.has(step)) this.kick(when);
      if (HAT_STEPS.has(step)) this.hat(when, step === 10);
    }

    // Boss percussion layer.
    if (inBoss && SNARE_STEPS.has(step)) {
      this.snare(when);
    }

    // Lead arpeggio — only when the action is hot.
    if (intensity >= 2) {
      const semi = ARP_SEMITONES[step] ?? 0;
      const freq = A4 * Math.pow(2, semi / 12) * 0.5; // A3 base
      this.arp(freq, when, inBoss);
    }

    // Boss bed: dissonant minor-second tremolo sustained through the bar.
    if (inBoss && step === 0) {
      this.bossBed(chord.root, when);
    }
  }

  // ---- voices -----------------------------------------------------------

  private bass(freq: number, when: number, dur: number, punchy: boolean): void {
    if (!this.ctx || !this.filter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filt = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(punchy ? 900 : 600, when);
    filt.frequency.exponentialRampToValueAtTime(180, when + dur);
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(0.16, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(filt);
    filt.connect(gain);
    gain.connect(this.filter);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  private pad(tones: number[], when: number): void {
    if (!this.ctx || !this.filter) return;
    const dur = STEP_TIME * STEPS_PER_BAR;
    for (const f of tones) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filt = this.ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.value = f * 2; // one octave up, airy
      osc.detune.value = (Math.random() - 0.5) * 14;
      filt.type = 'lowpass';
      filt.frequency.value = 520;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.linearRampToValueAtTime(0.028, when + dur * 0.4);
      gain.gain.linearRampToValueAtTime(0.0001, when + dur * 1.05);
      osc.connect(filt);
      filt.connect(gain);
      gain.connect(this.filter);
      osc.start(when);
      osc.stop(when + dur * 1.1);
    }
  }

  private kick(when: number): void {
    if (!this.ctx || !this.filter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + 0.11);
    gain.gain.setValueAtTime(0.5, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.14);
    osc.connect(gain);
    gain.connect(this.filter);
    osc.start(when);
    osc.stop(when + 0.16);
  }

  private hat(when: number, accent: boolean): void {
    if (!this.ctx || !this.filter) return;
    const len = 0.04;
    const buffer = this.ctx.createBuffer(1, Math.ceil(this.ctx.sampleRate * len), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'highpass';
    filt.frequency.value = 7000;
    const gain = this.ctx.createGain();
    gain.gain.value = accent ? 0.09 : 0.05;
    src.connect(filt);
    filt.connect(gain);
    gain.connect(this.filter);
    src.start(when);
  }

  private snare(when: number): void {
    if (!this.ctx || !this.filter) return;
    const len = 0.16;
    const buffer = this.ctx.createBuffer(1, Math.ceil(this.ctx.sampleRate * len), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 1800;
    filt.Q.value = 0.8;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + len);
    src.connect(filt);
    filt.connect(gain);
    gain.connect(this.filter);
    src.start(when);

    // Snare body.
    const body = this.ctx.createOscillator();
    const bodyGain = this.ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(190, when);
    body.frequency.exponentialRampToValueAtTime(120, when + 0.1);
    bodyGain.gain.setValueAtTime(0.16, when);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, when + 0.1);
    body.connect(bodyGain);
    bodyGain.connect(this.filter);
    body.start(when);
    body.stop(when + 0.12);
  }

  private arp(freq: number, when: number, boss: boolean): void {
    if (!this.ctx || !this.filter) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = boss ? freq * 2 : freq;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(boss ? 0.085 : 0.06, when + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, when + STEP_TIME * 1.4);
    osc.connect(gain);
    gain.connect(this.filter);
    osc.start(when);
    osc.stop(when + STEP_TIME * 1.5);
  }

  /** Dissonant tremolo bed: root + semitone-above saws beating against
   *  each other under an LFO — the instant "boss theme" signature. */
  private bossBed(root: number, when: number): void {
    if (!this.ctx || !this.filter) return;
    const dur = STEP_TIME * STEPS_PER_BAR;
    const t = when;
    for (const f of [root, root * Math.pow(2, 1 / 12)]) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const trem = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const filt = this.ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.value = f;
      filt.type = 'lowpass';
      filt.frequency.value = 900;
      trem.gain.value = 0.5;
      lfo.type = 'sine';
      lfo.frequency.value = 9;
      lfoGain.gain.value = 0.5;
      lfo.connect(lfoGain);
      lfoGain.connect(trem.gain);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.035, t + 0.3);
      gain.gain.setValueAtTime(0.035, t + dur * 0.85);
      gain.gain.linearRampToValueAtTime(0.0001, t + dur);
      osc.connect(filt);
      filt.connect(trem);
      trem.connect(gain);
      gain.connect(this.filter);
      osc.start(t);
      lfo.start(t);
      osc.stop(t + dur + 0.1);
      lfo.stop(t + dur + 0.1);
    }
  }
}
