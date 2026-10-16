export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private isInitialized = false;
  private musicPlaying = false;

  async init() {
    if (this.isInitialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Audio not available');
    }
  }

  playShoot() {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playExplosion() {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.4);
    filter.Q.value = 12;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    
    // Sub-bass layer
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(80, this.ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.3);
    subGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);
    
    source.start();
    subOsc.start();
    subOsc.stop(this.ctx.currentTime + 0.4);
  }

  playHit() {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playPowerUp() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    // Rising sweep
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(2200, t + 0.25);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);

    // Harmonic layer
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, t);
    osc2.frequency.exponentialRampToValueAtTime(3520, t + 0.2);
    gain2.gain.setValueAtTime(0.15, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t);
    osc2.stop(t + 0.3);
  }

  playDash() {
    if (!this.ctx || !this.sfxGain) return;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.ctx.sampleRate;
      data[i] = Math.sin(t * 3000 * Math.exp(-t * 20)) * Math.exp(-t * 15);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.3;
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start();
  }

  playBossLaser() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    // FM synthesis for boss laser
    const carrier = this.ctx.createOscillator();
    const modulator = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const outputGain = this.ctx.createGain();
    
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(100, t);
    carrier.frequency.linearRampToValueAtTime(60, t + 0.5);
    
    modulator.type = 'sine';
    modulator.frequency.value = 40;
    modGain.gain.value = 200;
    
    outputGain.gain.setValueAtTime(0.3, t);
    outputGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    
    modulator.connect(modGain);
    modGain.connect(carrier.frequency);
    carrier.connect(outputGain);
    outputGain.connect(this.sfxGain);
    
    carrier.start(t);
    modulator.start(t);
    carrier.stop(t + 0.6);
    modulator.stop(t + 0.6);
  }

  playStasis() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    // Time-stop effect - descending shimmer
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000 - i * 300, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.8);
      gain.gain.setValueAtTime(0.1, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + i * 0.05);
      osc.stop(t + 0.9);
    }
  }

  startMusic() {
    if (!this.ctx || !this.musicGain || this.musicPlaying) return;
    this.musicPlaying = true;

    const notes = [55, 65.41, 73.42, 82.41, 98, 110];
    
    // Dark pad
    const padOsc = this.ctx.createOscillator();
    const padGain = this.ctx.createGain();
    const padFilter = this.ctx.createBiquadFilter();
    padOsc.type = 'sawtooth';
    padOsc.frequency.value = 55;
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 200;
    padFilter.Q.value = 5;
    padGain.gain.value = 0.3;
    padOsc.connect(padFilter);
    padFilter.connect(padGain);
    padGain.connect(this.musicGain);
    padOsc.start();
    this.musicOscillators.push(padOsc);

    // Second pad for richness
    const pad2 = this.ctx.createOscillator();
    const pad2Gain = this.ctx.createGain();
    const pad2Filter = this.ctx.createBiquadFilter();
    pad2.type = 'sawtooth';
    pad2.frequency.value = 82.41;
    pad2Filter.type = 'lowpass';
    pad2Filter.frequency.value = 300;
    pad2Filter.Q.value = 3;
    pad2Gain.gain.value = 0.15;
    pad2.connect(pad2Filter);
    pad2Filter.connect(pad2Gain);
    pad2Gain.connect(this.musicGain);
    pad2.start();
    this.musicOscillators.push(pad2);

    // LFO for filter modulation
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.1;
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(padFilter.frequency);
    lfo.start();
    this.musicOscillators.push(lfo);

    // Sub bass
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.value = 36.71;
    subGain.gain.value = 0.4;
    subOsc.connect(subGain);
    subGain.connect(this.musicGain);
    subOsc.start();
    this.musicOscillators.push(subOsc);

    // Arpeggio
    this.playArpeggio(notes);
  }

  private playArpeggio(notes: number[]) {
    if (!this.ctx || !this.musicGain || !this.musicPlaying) return;
    const note = notes[Math.floor(Math.random() * notes.length)] * 4;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = note;
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
    setTimeout(() => this.playArpeggio(notes), 200 + Math.random() * 300);
  }

  stopMusic() {
    this.musicPlaying = false;
    this.musicOscillators.forEach(o => { try { o.stop(); } catch(e) {} });
    this.musicOscillators = [];
  }

  dispose() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}
