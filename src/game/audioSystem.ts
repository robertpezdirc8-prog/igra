// Procedural Audio System - Generirani zvočni efekti
export class ProceduralAudioSystem {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;

  constructor() {
    this.init();
  }

  private init(): void {
    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.audioContext.destination);
    } catch {
      console.warn('Audio context not available');
      this.enabled = false;
    }
  }

  playShoot(pitch: number = 1): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    // Classic arcade laser sound
    const osc = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(880 * pitch, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      440 * pitch,
      this.audioContext.currentTime + 0.05
    );
    
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(660 * pitch, this.audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(
      330 * pitch,
      this.audioContext.currentTime + 0.05
    );
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.08
    );
    
    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc2.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.08);
    osc2.stop(this.audioContext.currentTime + 0.08);
  }

  playExplosion(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    // Classic arcade explosion sound
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(
      50,
      this.audioContext.currentTime + 0.4
    );
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.4
    );
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(this.audioContext.currentTime);

    // Add bass thump
    const osc = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.3);
    oscGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.3);
  }

  playHit(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      50,
      this.audioContext.currentTime + 0.1
    );
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.1
    );
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  /** Graze chime — soft high "tink" (kept quiet: dense curtains fire it rapidly). */
  playGraze(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      3600,
      this.audioContext.currentTime + 0.06
    );

    gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.09
    );

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  playPowerUp(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    // Classic arcade power-up sound - ascending arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, this.audioContext!.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(
        0.15,
        this.audioContext!.currentTime + i * 0.08 + 0.02
      );
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext!.currentTime + i * 0.08 + 0.15
      );
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(this.audioContext!.currentTime + i * 0.08);
      osc.stop(this.audioContext!.currentTime + i * 0.08 + 0.15);
    });
  }

  playLevelUp(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    // Classic arcade stage clear fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const osc2 = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      osc2.type = 'triangle';
      osc2.frequency.value = freq * 2;
      
      gain.gain.setValueAtTime(0, this.audioContext!.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(
        0.2,
        this.audioContext!.currentTime + i * 0.12 + 0.05
      );
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext!.currentTime + i * 0.12 + 0.4
      );
      
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(this.audioContext!.currentTime + i * 0.12);
      osc2.start(this.audioContext!.currentTime + i * 0.12);
      osc.stop(this.audioContext!.currentTime + i * 0.12 + 0.4);
      osc2.stop(this.audioContext!.currentTime + i * 0.12 + 0.4);
    });
  }

  playBossAppear(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    // Classic arcade boss warning sound
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(
      100,
      this.audioContext.currentTime + 0.5
    );
    osc.frequency.linearRampToValueAtTime(
      150,
      this.audioContext.currentTime + 1.0
    );
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 1.0
    );
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 1.0);

    // Add warning beeps
    for (let i = 0; i < 3; i++) {
      const beep = this.audioContext.createOscillator();
      const beepGain = this.audioContext.createGain();
      
      beep.type = 'square';
      beep.frequency.value = 880;
      
      beepGain.gain.setValueAtTime(0, this.audioContext.currentTime + i * 0.3);
      beepGain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + i * 0.3 + 0.05);
      beepGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.3 + 0.2);
      
      beep.connect(beepGain);
      beepGain.connect(this.masterGain);
      
      beep.start(this.audioContext.currentTime + i * 0.3);
      beep.stop(this.audioContext.currentTime + i * 0.3 + 0.2);
    }
  }

  playGameOver(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    // Classic arcade game over sound - descending notes
    const notes = [783.99, 659.25, 523.25, 392.00, 261.63]; // G5, E5, C5, G4, C4
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'square';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, this.audioContext!.currentTime + i * 0.2);
      gain.gain.linearRampToValueAtTime(
        0.25,
        this.audioContext!.currentTime + i * 0.2 + 0.05
      );
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext!.currentTime + i * 0.2 + 0.4
      );
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(this.audioContext!.currentTime + i * 0.2);
      osc.stop(this.audioContext!.currentTime + i * 0.2 + 0.4);
    });
  }

  playBomb(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    // Classic arcade bomb sound - deep explosion
    const bufferSize = this.audioContext.sampleRate * 1.0;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(
      100,
      this.audioContext.currentTime + 0.8
    );
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.6, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.8
    );
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(this.audioContext.currentTime);

    // Add deep bass
    const osc = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.audioContext.currentTime + 0.6);
    oscGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.6);
  }

  playCombo(comboLevel: number): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const baseFreq = 440 + (comboLevel * 50);
    
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      baseFreq * 1.5,
      this.audioContext.currentTime + 0.15
    );
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.15
    );
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.15);
  }

  playHazardWarning(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(
      200,
      this.audioContext.currentTime + 0.5
    );
    
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(
      0.2,
      this.audioContext.currentTime + 0.25
    );
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.5
    );
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.5);
  }



  playDeath(): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      50,
      this.audioContext.currentTime + 0.5
    );
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.5
    );
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.5);
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  playWeatherChange(weatherType: string): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    switch (weatherType) {
      case 'rain':
        this.playRainStart();
        break;
      case 'storm':
        this.playStormStart();
        break;
      case 'snow':
        this.playSnowStart();
        break;
      case 'fog':
        this.playFogStart();
        break;
      case 'sandstorm':
        this.playSandstormStart();
        break;
      case 'meteor':
        this.playMeteorShower();
        break;
      case 'clear':
        this.playWeatherClear();
        break;
    }
  }

  private playRainStart(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Gentle rain sound - filtered noise
    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start();
    noise.stop(this.audioContext.currentTime + 2);
  }

  private playStormStart(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Thunder rumble
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(50, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      20,
      this.audioContext.currentTime + 1.5
    );
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 1.5
    );
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 1.5);

    // Wind noise
    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 2;
    
    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    noiseGain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 1);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    
    noise.start();
    noise.stop(this.audioContext.currentTime + 2);
  }

  private playSnowStart(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Soft wind
    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 1.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start();
    noise.stop(this.audioContext.currentTime + 2);
  }

  private playFogStart(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Eerie fog horn
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(
      80,
      this.audioContext.currentTime + 2
    );
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.5);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 2);
  }

  private playSandstormStart(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Harsh wind
    const bufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 1;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.25, this.audioContext.currentTime + 1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start();
    noise.stop(this.audioContext.currentTime + 2);
  }

  private playMeteorShower(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Whooshing meteors
    for (let i = 0; i < 5; i++) {
      const delay = i * 0.3;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, this.audioContext.currentTime + delay);
      osc.frequency.exponentialRampToValueAtTime(
        100,
        this.audioContext.currentTime + delay + 0.5
      );
      
      gain.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
      gain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + delay + 0.1);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + delay + 0.5
      );
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(this.audioContext.currentTime + delay);
      osc.stop(this.audioContext.currentTime + delay + 0.5);
    }
  }

  private playWeatherClear(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Peaceful chime
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    
    notes.forEach((freq, i) => {
      const osc = this.audioContext!.createOscillator();
      const gain = this.audioContext!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      gain.gain.setValueAtTime(0, this.audioContext!.currentTime + i * 0.15);
      gain.gain.linearRampToValueAtTime(
        0.1,
        this.audioContext!.currentTime + i * 0.15 + 0.05
      );
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext!.currentTime + i * 0.15 + 0.5
      );
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(this.audioContext!.currentTime + i * 0.15);
      osc.stop(this.audioContext!.currentTime + i * 0.15 + 0.5);
    });
  }

  playHazardSpawn(hazardType: string): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    switch (hazardType) {
      case 'toxic_cloud':
        this.playToxicCloud();
        break;
      case 'electric_field':
        this.playElectricField();
        break;
      case 'fire_zone':
        this.playFireZone();
        break;
      case 'ice_zone':
        this.playIceZone();
        break;
      case 'gravity_well':
        this.playGravityWell();
        break;
    }
  }

  private playToxicCloud(): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(
      100,
      this.audioContext.currentTime + 0.5
    );
    
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.5
    );
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.5);
  }

  private playElectricField(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Electric zap
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      500,
      this.audioContext.currentTime + 0.2
    );
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.2
    );
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.2);
  }

  private playFireZone(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Fire roar
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 3;
    
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.5
    );
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noise.start(this.audioContext.currentTime);
  }

  private playIceZone(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Ice crackle
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(3000, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      1000,
      this.audioContext.currentTime + 0.3
    );
    
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 0.3
    );
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 0.3);
  }

  private playGravityWell(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Deep rumble
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(
      40,
      this.audioContext.currentTime + 1
    );
    
    gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + 1
    );
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.audioContext.currentTime);
    osc.stop(this.audioContext.currentTime + 1);
  }
}

// Procedural Background Music Generator
export class ProceduralMusicGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private oscillators: OscillatorNode[] = [];
  private intervalId: number | null = null;

  constructor() {
    try {
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.1;
      this.masterGain.connect(this.audioContext.destination);
    } catch {
      console.warn('Audio context not available for music');
    }
  }

  start(intensity: number = 1): void {
    if (!this.audioContext || !this.masterGain || this.isPlaying) return;
    
    this.isPlaying = true;
    
    // Base drone
    const drone = this.audioContext.createOscillator();
    const droneGain = this.audioContext.createGain();
    
    drone.type = 'sine';
    drone.frequency.value = 110 * intensity;
    droneGain.gain.value = 0.15;
    
    drone.connect(droneGain);
    droneGain.connect(this.masterGain);
    drone.start();
    
    this.oscillators.push(drone);
    
    // Arpeggio pattern
    const notes = [220, 277.18, 329.63, 440, 554.37, 659.25];
    let noteIndex = 0;
    
    this.intervalId = window.setInterval(() => {
      if (!this.audioContext || !this.masterGain) return;
      
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = notes[noteIndex % notes.length] * intensity;
      
      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(
        0.1,
        this.audioContext.currentTime + 0.05
      );
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.3
      );
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(this.audioContext.currentTime);
      osc.stop(this.audioContext.currentTime + 0.3);
      
      noteIndex++;
    }, 200);
  }

  stop(): void {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // Already stopped
      }
    });
    
    this.oscillators = [];
  }

  setIntensity(intensity: number): void {
    // Adjust music intensity based on game state
    if (this.masterGain) {
      this.masterGain.gain.value = 0.1 * intensity;
    }
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(0.3, volume));
    }
  }

  resume(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}
