import { AudioEngine } from './audio';
import { ProceduralAudioSystem, ProceduralMusicGenerator } from './audioSystem';
import { WebGPURenderer } from './webgpu-renderer';
import { getLevelForPlayer } from './levels';
import { getEnvironmentForLevel, renderEnvironment } from './environment';
import { DifficultyMode } from './difficulty';
import { SkillBonuses, defaultSkillBonuses } from './skillTree';
import { WeatherSystem, EnvironmentalHazardsSystem, WeatherType } from './weatherSystem';
import { AdvancedEnemyAI, BossAI, FormationSystem } from './enemyAI';
import { PowerUpManager, ADVANCED_POWERUPS, POWERUP_COMBOS } from './advancedPowerups';

// ============= TYPES =============
interface Vec2 { x: number; y: number; }
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  color: string; type: 'spark' | 'trail' | 'debris' | 'energy' | 'orb' | 'ring';
}
interface Bullet {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; damage: number;
  life: number; type: 'player' | 'enemy';
  chainLeft?: number; chainDamage?: number;
  grazed?: boolean;
  // Danmaku sine-wave motion (optional): the bullet oscillates around its
  // base trajectory, producing the flowing "wave wall" look.
  waveAmp?: number; waveFreq?: number; wavePhase?: number;
  baseVx?: number; baseVy?: number; baseSpeed?: number;
}
interface Enemy {
  x: number; y: number; vx: number; vy: number;
  hp: number; maxHp: number; size: number;
  type: 'swarmer' | 'sniper' | 'titan' | 'boss';
  color: string; phase: number; pattern: number;
  shootTimer: number; moveTimer: number;
  targetX: number; targetY: number;
  playerPattern?: { left: number; right: number; up: number; down: number };
  hitFlash?: number;    // white flash timer when damaged
  desperate?: boolean;  // titan one-shot desperation barrage flag
}
interface Player {
  x: number; y: number; vx: number; vy: number;
  hp: number; maxHp: number; shield: number; maxShield: number;
  energy: number; maxEnergy: number;
  speed: number; dashCooldown: number; dashTimer: number;
  invincible: number; shootTimer: number;
  weaponLevel: number; critRate: number; critDmg: number;
  score: number; combo: number; comboTimer: number;
  secondaryWeapon: 'none' | 'gravity' | 'chain' | 'temporal';
  secondaryCooldown: number;
  stasisActive: boolean; stasisTimer: number;
  // Classic arcade stock (Raiden/Gradius style)
  bombs: number; maxBombs: number;
  options: number; // companion drones, max 2
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXp: number;
}
interface Upgrade {
  name: string; description: string; icon: string;
  apply: (player: Player) => void;
}
interface PowerOrb {
  x: number; y: number; vx: number; vy: number;
  type: 'hp' | 'energy' | 'shield' | 'score' | 'advanced_powerup' | 'power' | 'speed' | 'bomb' | 'option';
  life: number; size: number;
  powerUpId?: string;
}
interface Crystal {
  x: number; y: number; size: number; hp: number;
  rotation: number; rotSpeed: number; color: string;
}
type GameState = 'menu' | 'playing' | 'paused' | 'levelup' | 'levelchoice' | 'gameover';

interface WaveAnnouncement {
  text: string;
  subtext: string;
  timer: number;
  color: string;
}
interface FloatingText {
  x: number; y: number; text: string; color: string;
  life: number; maxLife: number; vy: number;
}

export interface GameStats {
  score: number; wave: number;
  enemiesKilled: number; bossKills: number;
  totalDamage: number; survivalTime: number;
  maxCombo: number; combo: number;
  enemiesRemaining: number; totalWaveEnemies: number;
  isBossWave: boolean; bossPresent: boolean;
  gold: number; fps: number; seed: string;
  gameStartTime: number;
  shotsFired: number; hitsLanded: number;
  damageTaken: number; itemsCollected: number;
  webgpuSupported: boolean;
  playerLevel: number; playerXp: number; xpToNext: number;
}

export interface MinimapData {
  playerX: number; playerY: number;
  enemies: Array<{ x: number; y: number; type: string }>;
  worldWidth: number; worldHeight: number;
}

// ============= GAME ENGINE =============
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private webgpuRenderer: WebGPURenderer | null = null;
  private width = 0;
  private height = 0;
  private audio: AudioEngine;
  private proceduralAudio: ProceduralAudioSystem;
  private proceduralMusic: ProceduralMusicGenerator;
  private state: GameState = 'menu';
  private player: Player;
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private powerOrbs: PowerOrb[] = [];
  private crystals: Crystal[] = [];
  private keys: Set<string> = new Set();
  private mouse: Vec2 = { x: 0, y: 0 };
  private mouseDown = false;
  private rightMouseDown = false;
  private time = 0;
  private deltaTime = 0;
  private lastTime = 0;
  private frameCount = 0;
  private fps = 60;
  private fpsTimer = 0;
  private wave = 1;
  private waveTimer = 0;
  private bossActive = false;
  private screenShake = 0;
  // Hit-stop freeze-frame timer (seconds of REAL time remaining; the world
  // crawls at 12% speed while it counts down — classic impact juice).
  private hitStop = 0;
  // Uniform spatial hash grid for enemy broadphase (rebuilt every frame).
  private enemyGrid: Map<number, Enemy[]> = new Map();
  // Classic arcade timers
  private bombCooldown = 0;
  private optionTimer = 0;
  private upgrades: Upgrade[] = [];
  private highScore = 0;
  private animFrame = 0;
  private stars: { x: number; y: number; z: number; brightness: number }[] = [];
  private webgpuSupported = false;
  private onStateChange: (state: GameState) => void;
  private waveAnnouncement: WaveAnnouncement | null = null;
  private seed: string = '';
  private gameTime = 0;
  private totalDamageDealt = 0;
  private enemiesKilled = 0;
  private floatingTexts: FloatingText[] = [];
  // Persistent meta earned during a run
  private gold = 0;
  private maxCombo = 1;
  private bossKills = 0;
  private shotsFired = 0;
  private hitsLanded = 0;
  private damageTaken = 0;
  private itemsCollected = 0;
  private waveTotalEnemies = 0;
  private gameStartTime = 0;
  // Level-up upgrade choices (used by both 'levelup' and 'levelchoice')
  private levelChoices: Upgrade[] = [];
  // Difficulty & persistent bonuses applied on startGame()
  private difficulty: DifficultyMode | null = null;
  private skillBonuses: SkillBonuses = defaultSkillBonuses();
  private startingXp = 0;
  // Mobile input state
  private mobileMove: Vec2 = { x: 0, y: 0 };
  private mobileShooting = false;
  private isMobile = false;
  private autoAimEnabled = true;
  // Particle budget scale from settings (0..1)
  private particleScale = 1;

  // Advanced systems (merged from webgpu-online-games-51d72)
  private weatherSystem: WeatherSystem;
  private hazardsSystem: EnvironmentalHazardsSystem;
  private powerUpManager: PowerUpManager;
  private enemyAIs: Map<string, AdvancedEnemyAI> = new Map();
  private bossAI: BossAI | null = null;
  private formationSystem: FormationSystem | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    overlayCanvas: HTMLCanvasElement | null,
    onStateChange: (state: GameState) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.audio = new AudioEngine();
    this.proceduralAudio = new ProceduralAudioSystem();
    this.proceduralMusic = new ProceduralMusicGenerator();
    this.onStateChange = onStateChange;
    this.player = this.createPlayer();
    // Initialize advanced systems
    this.weatherSystem = new WeatherSystem();
    this.hazardsSystem = new EnvironmentalHazardsSystem();
    this.powerUpManager = new PowerUpManager();
    // WebGPU renders on a dedicated overlay canvas. A canvas can only host a
    // single context type, so the 2D context above must never be requested on
    // the overlay canvas (and vice versa).
    this.initWebGPU(overlayCanvas);
    this.initStars();
    this.loadHighScore();
    this.generateUpgrades();
    this.generateSeed();
  }

  private async initWebGPU(overlayCanvas: HTMLCanvasElement | null) {
    if (!overlayCanvas) {
      this.webgpuSupported = false;
      return;
    }
    this.webgpuRenderer = new WebGPURenderer(overlayCanvas);
    this.webgpuSupported = await this.webgpuRenderer.initialize();
    if (this.webgpuSupported) {
      console.log('WebGPU rendering enabled');
    } else {
      console.log('Falling back to Canvas2D');
      this.webgpuRenderer = null;
    }
  }

  private generateSeed() {
    this.seed = Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  // checkWebGPU moved to initWebGPU

  private initStars() {
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        z: Math.random() * 3 + 0.5,
        brightness: Math.random()
      });
    }
  }

  private loadHighScore() {
    try {
      this.highScore = parseInt(localStorage.getItem('atheria_highscore') || '0');
    } catch { this.highScore = 0; }
  }

  private saveHighScore() {
    try {
      if (this.player.score > this.highScore) {
        this.highScore = this.player.score;
        localStorage.setItem('atheria_highscore', this.highScore.toString());
      }
    } catch { /* ignore */ }
  }

  private createPlayer(): Player {
    const b = this.skillBonuses;
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      hp: 100 + b.maxHp, maxHp: 100 + b.maxHp,
      shield: 50 + b.maxShield, maxShield: 50 + b.maxShield,
      energy: 100 + b.maxEnergy, maxEnergy: 100 + b.maxEnergy,
      speed: 5 * b.speedMul, dashCooldown: 0, dashTimer: 0,
      invincible: 0, shootTimer: 0,
      weaponLevel: 1, critRate: 0.05 + b.critRateBonus, critDmg: 2 * b.critDmgMul,
      score: 0, combo: 1, comboTimer: 0,
      secondaryWeapon: 'none',
      secondaryCooldown: 0,
      stasisActive: false, stasisTimer: 0,
      bombs: 2, maxBombs: 5,
      options: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      totalXp: 0
    };
  }

  private generateUpgrades() {
    this.upgrades = [
      { name: 'Plasma Overcharge', description: '+25% damage, +1 weapon level', icon: '⚡', apply: (p) => { p.weaponLevel++; } },
      { name: 'Neural Reflexes', description: '+15% movement speed', icon: '🧠', apply: (p) => { p.speed *= 1.15; } },
      { name: 'Void Shield', description: '+30 max shield, full restore', icon: '🛡️', apply: (p) => { p.maxShield += 30; p.shield = p.maxShield; } },
      { name: 'Temporal Core', description: '+25 max energy, faster regen', icon: '⏱️', apply: (p) => { p.maxEnergy += 25; } },
      { name: 'Critical Matrix', description: '+10% crit rate, +50% crit damage', icon: '💀', apply: (p) => { p.critRate += 0.1; p.critDmg += 0.5; } },
      { name: 'Bio-Reconstruction', description: '+30 max HP, full heal', icon: '❤️', apply: (p) => { p.maxHp += 30; p.hp = p.maxHp; } },
      { name: 'Split Plasma', description: 'Projectiles split into 3', icon: '🔱', apply: (p) => { p.weaponLevel += 2; } },
      { name: 'Gravity Well', description: 'Unlock Gravity secondary weapon', icon: '🌀', apply: (p) => { p.secondaryWeapon = 'gravity'; } },
      { name: 'Chain Lightning', description: 'Unlock Chain secondary weapon', icon: '⚡', apply: (p) => { p.secondaryWeapon = 'chain'; } },
      { name: 'Temporal Stasis', description: 'Unlock Time Stop ability', icon: '⏸️', apply: (p) => { p.secondaryWeapon = 'temporal'; } },
    ];
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.webgpuRenderer?.resize(w, h);
    this.player.x = w / 2;
    this.player.y = h / 2;
  }

  async start() {
    await this.audio.init();
    this.audio.startMusic();
  }

  // ============= PUBLIC CONTROL API =============
  // The engine is the single source of truth for game state. The React UI
  // calls these methods instead of maintaining a parallel game state.

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.onStateChange(this.state);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.onStateChange(this.state);
  }

  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  restart() {
    this.startGame();
  }

  goToMenu() {
    this.state = 'menu';
    this.onStateChange(this.state);
    this.audio.startMusic();
  }

  /** Apply the upgrade at the given index of the current level-up choices. */
  chooseUpgrade(index: number) {
    if (this.state !== 'levelup' && this.state !== 'levelchoice') return;
    const upgrade = this.levelChoices[index];
    if (!upgrade) return;
    upgrade.apply(this.player);
    this.levelChoices = [];
    this.state = 'playing';
    this.onStateChange(this.state);
  }

  /** Apply difficulty modifiers (takes effect on the next startGame). */
  setDifficulty(mode: DifficultyMode | null) {
    this.difficulty = mode;
  }

  /** Apply persistent skill-tree bonuses (takes effect on the next startGame). */
  setSkillBonuses(bonuses: SkillBonuses) {
    this.skillBonuses = { ...defaultSkillBonuses(), ...bonuses };
  }

  /** XP granted automatically at the start of the next run (daily reward). */
  setStartingXp(amount: number) {
    this.startingXp = Math.max(0, Math.floor(amount));
  }

  /** Apply user settings (audio volumes, particle budget). */
  applySettings(settings: { musicVolume: number; sfxVolume: number; particles: 'low' | 'medium' | 'high' }) {
    this.audio.setVolumes(settings.musicVolume, settings.sfxVolume);
    this.particleScale = settings.particles === 'low' ? 0.25 : settings.particles === 'medium' ? 0.6 : 1;
    // Bloom is a full-screen post pass — skip it at low particle quality.
    this.webgpuRenderer?.setBloomEnabled(settings.particles !== 'low');
  }

  // ============= MOBILE INPUT =============
  setMobileMove(x: number, y: number) {
    this.mobileMove.x = Math.max(-1, Math.min(1, x));
    this.mobileMove.y = Math.max(-1, Math.min(1, y));
  }

  setMobileShooting(active: boolean) {
    this.mobileShooting = active;
    if (active) this.isMobile = true;
  }

  mobileDash() {
    if (this.state === 'playing') this.tryDash();
  }

  /** Mobile bomb trigger (Raiden-style panic button). */
  mobileBomb() {
    if (this.state === 'playing') this.useBomb();
  }

  /**
   * Classic screen-clearing bomb (Raiden). Pressed while an enemy bullet is
   * dangerously close it becomes a COUNTER BOMB (Strikers 1945): bigger
   * blast, score bonus and every cleared bullet pays out.
   */
  useBomb() {
    if (this.state !== 'playing') return;
    const p = this.player;
    if (p.bombs <= 0 || this.bombCooldown > 0) return;
    p.bombs--;
    this.bombCooldown = 1.2;

    // Counter-bomb check: any enemy bullet within 80px of the ship
    let counter = false;
    for (const b of this.bullets) {
      if (b.type !== 'enemy') continue;
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      if (dx * dx + dy * dy < 6400) { counter = true; break; }
    }

    const dmg = counter ? 260 : 130;
    // Wipe every enemy bullet into a burst of light
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (b.type !== 'enemy') continue;
      this.particles.push({
        x: b.x, y: b.y, vx: 0, vy: -1.5,
        life: 0.4, maxLife: 0.4, size: 3,
        color: counter ? '#ffdd66' : '#ffffff', type: 'energy'
      });
      this.bullets[i] = this.bullets[this.bullets.length - 1];
      this.bullets.pop();
    }
    // Blast damage to every enemy on screen
    for (const e of this.enemies) {
      e.hp -= dmg;
      e.hitFlash = 0.15;
      this.totalDamageDealt += dmg;
    }

    // Triple shockwave rings + flash + shake + freeze
    this.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.5, maxLife: 0.5, size: 240, color: '#ffffff', type: 'ring' });
    this.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.8, maxLife: 0.8, size: 420, color: counter ? '#ffdd66' : '#ff66ff', type: 'ring' });
    this.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 1.1, maxLife: 1.1, size: 560, color: '#66ffff', type: 'ring' });
    this.screenShake = 22;
    this.hitStop = Math.max(this.hitStop, 0.1);
    p.invincible = Math.max(p.invincible, 1.0);
    if (counter) {
      p.score += 500;
      this.floatingTexts.push({ x: p.x, y: p.y - 40, text: 'COUNTER BOMB!', color: '#ffdd66', life: 1.4, maxLife: 1.4, vy: -1.2 });
    } else {
      this.floatingTexts.push({ x: p.x, y: p.y - 40, text: 'BOMBA!', color: '#ff8866', life: 1, maxLife: 1, vy: -1.2 });
    }
    this.audio.playExplosion();
    this.proceduralAudio.playExplosion();
  }

  mobileSecondary() {
    if (this.state === 'playing') this.useSecondaryWeapon();
  }

  handleKeyDown(key: string) {
    this.keys.add(key.toLowerCase());
    if (key === 'Escape') {
      this.togglePause();
    }
    if (key === ' ' && this.state === 'playing') {
      this.tryDash();
    }
    // Classic bomb (Raiden style) — X or B clears the screen in a pinch
    if ((key.toLowerCase() === 'x' || key.toLowerCase() === 'b') && this.state === 'playing') {
      this.useBomb();
    }
    // Temporal Stasis
    if (key.toLowerCase() === 'q' && this.state === 'playing' && this.player.secondaryWeapon === 'temporal') {
      this.activateStasis();
    }
  }

  handleKeyUp(key: string) {
    this.keys.delete(key.toLowerCase());
  }

  handleMouseMove(x: number, y: number) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  handleMouseDown(button: number = 0) {
    if (button === 0) {
      this.mouseDown = true;
    } else if (button === 2) {
      this.rightMouseDown = true;
      this.useSecondaryWeapon();
    }
  }

  handleMouseUp(button: number = 0) {
    if (button === 0) {
      this.mouseDown = false;
    } else if (button === 2) {
      this.rightMouseDown = false;
    }
  }

  /** Auto-aim assist for mobile: aim at nearest enemy while shooting (merged from webgpu-online-games-51d72). */
  private updateAutoAim() {
    if (!this.isMobile || !this.autoAimEnabled || (!this.mouseDown && !this.mobileShooting)) return;

    // Find nearest enemy
    let nearestEnemy: Enemy | null = null;
    let nearestDist = Infinity;

    for (const enemy of this.enemies) {
      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < nearestDist) {
        nearestDist = dist;
        nearestEnemy = enemy;
      }
    }

    // Aim at nearest enemy
    if (nearestEnemy) {
      this.mouse.x = nearestEnemy.x;
      this.mouse.y = nearestEnemy.y;
    }
  }

  private startGame() {
    this.player = this.createPlayer();
    this.player.x = this.width / 2;
    this.player.y = this.height / 2;
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.powerOrbs = [];
    this.crystals = [];
    this.wave = 1;
    this.waveTimer = 0;
    this.waveTotalEnemies = 0;
    this.bossActive = false;
    this.time = 0;
    this.gameTime = 0;
    this.gameStartTime = Date.now();
    this.totalDamageDealt = 0;
    this.enemiesKilled = 0;
    this.bombCooldown = 0;
    this.optionTimer = 0;
    this.bossKills = 0;
    this.gold = 0;
    this.maxCombo = 1;
    this.shotsFired = 0;
    this.hitsLanded = 0;
    this.damageTaken = 0;
    this.itemsCollected = 0;
    this.levelChoices = [];
    this.state = 'playing';
    this.onStateChange(this.state);
    this.audio.startMusic();
    this.proceduralMusic.start(1);
    this.generateSeed();
    this.spawnCrystals();
    // Apply starting XP from persistent rewards (may trigger a level-up)
    if (this.startingXp > 0) {
      const xp = this.startingXp;
      this.startingXp = 0;
      this.awardXP(xp, this.player.x, this.player.y - 30);
    }
  }

  private spawnCrystals() {
    for (let i = 0; i < 15; i++) {
      this.crystals.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 20 + Math.random() * 30,
        hp: 30 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        color: Math.random() < 0.5 ? '#4400aa' : '#aa0044'
      });
    }
  }

  private tryDash() {
    const dashCost = 20 * this.skillBonuses.energyCostMul;
    if (this.player.dashCooldown <= 0 && this.player.energy >= dashCost) {
      this.player.dashTimer = 0.15;
      this.player.dashCooldown = 1 * this.skillBonuses.dashCooldownMul;
      this.player.invincible = 0.2;
      this.player.energy -= dashCost;
      const dx = this.mouse.x - this.player.x;
      const dy = this.mouse.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      this.player.vx += (dx / dist) * 25;
      this.player.vy += (dy / dist) * 25;
      this.audio.playDash();
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: this.player.x, y: this.player.y,
          vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8,
          life: 0.5, maxLife: 0.5, size: 3,
          color: '#00ffff', type: 'energy'
        });
      }
    }
  }

  private activateStasis() {
    const stasisCost = 30 * this.skillBonuses.energyCostMul;
    if (this.player.energy >= stasisCost && !this.player.stasisActive) {
      this.player.stasisActive = true;
      this.player.stasisTimer = 2 * this.skillBonuses.stasisDurationMul;
      this.player.energy -= stasisCost;
      this.audio.playStasis();
    }
  }

  private useSecondaryWeapon() {
    const p = this.player;
    const cost = 25 * this.skillBonuses.energyCostMul;
    if (p.secondaryCooldown > 0 || p.energy < cost) return;

    if (p.secondaryWeapon === 'gravity') {
      p.secondaryCooldown = 3;
      p.energy -= cost;
      // Create gravity well
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30;
        this.particles.push({
          x: this.mouse.x + Math.cos(angle) * 50,
          y: this.mouse.y + Math.sin(angle) * 50,
          vx: -Math.cos(angle) * 3, vy: -Math.sin(angle) * 3,
          life: 1.5, maxLife: 1.5, size: 4,
          color: '#8800ff', type: 'energy'
        });
      }
      // Pull enemies
      for (const e of this.enemies) {
        const dx = this.mouse.x - e.x;
        const dy = this.mouse.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          e.vx += (dx / dist) * 10;
          e.vy += (dy / dist) * 10;
        }
      }
      this.audio.playExplosion();
    } else if (p.secondaryWeapon === 'chain') {
      p.secondaryCooldown = 2;
      p.energy -= cost;
      // Chain lightning to nearest enemies
      const targets = this.enemies
        .map(e => ({ e, dist: Math.sqrt((e.x - p.x) ** 2 + (e.y - p.y) ** 2) }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 5);
      
      for (const { e } of targets) {
        e.hp -= 30;
        this.totalDamageDealt += 30;
        // Lightning effect
        for (let i = 0; i < 10; i++) {
          const t = i / 10;
          this.particles.push({
            x: p.x + (e.x - p.x) * t + (Math.random() - 0.5) * 20,
            y: p.y + (e.y - p.y) * t + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
            life: 0.3, maxLife: 0.3, size: 3,
            color: '#ffff00', type: 'spark'
          });
        }
      }
      this.audio.playShoot();
    }
  }

  /** Pick 3 distinct random upgrades for the level-up screens. */
  private generateLevelChoices() {
    const pool = [...this.upgrades];
    const choices: Upgrade[] = [];
    while (choices.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      choices.push(pool.splice(idx, 1)[0]);
    }
    this.levelChoices = choices;
  }

  private spawnWave() {
    const count = 3 + this.wave * 2;
    
    // Wave announcement
    if (this.wave % 5 === 0) {
      this.waveAnnouncement = {
        text: `VOID BREACH — WAVE ${this.wave}`,
        subtext: '⚠ BOSS INCOMING ⚠',
        timer: 3,
        color: '#ff00ff'
      };
    } else {
      this.waveAnnouncement = {
        text: `WAVE ${this.wave}`,
        subtext: `${count} hostiles detected`,
        timer: 2,
        color: '#00ffff'
      };
    }

    this.waveTotalEnemies = count + (this.wave % 5 === 0 ? 1 : 0);
    const hpMul = this.difficulty?.enemyHpMultiplier ?? 1;

    // Choose formation based on wave (merged from webgpu-online-games-51d72)
    const formationTypes: Array<'line' | 'circle' | 'vshape' | 'random' | 'spiral'> =
      ['line', 'circle', 'vshape', 'random', 'spiral'];
    const formationType = formationTypes[this.wave % formationTypes.length] ?? 'line';

    // Create formation
    this.formationSystem = new FormationSystem(formationType);
    const centerX = this.player.x;
    const centerY = this.player.y - 400; // Start above player
    this.formationSystem.setCenter(centerX, centerY);
    this.formationSystem.setRotation(Math.random() * Math.PI * 2);
    this.formationSystem.setScale(1 + this.wave * 0.1);

    for (let i = 0; i < count; i++) {
      // Get position from formation
      const pos = this.formationSystem.getPosition(i, count);
      const type = Math.random() < 0.6 ? 'swarmer' : (Math.random() < 0.7 ? 'sniper' : 'titan');
      const baseHp = type === 'swarmer' ? 20 : type === 'sniper' ? 40 : 100;

      this.enemies.push({
        x: pos.x,
        y: pos.y,
        vx: 0, vy: 0,
        hp: baseHp * hpMul,
        maxHp: baseHp * hpMul,
        size: type === 'swarmer' ? 15 : type === 'sniper' ? 20 : 35,
        type,
        color: type === 'swarmer' ? '#ff4444' : type === 'sniper' ? '#ff8800' : '#aa00ff',
        phase: Math.random() * Math.PI * 2,
        pattern: Math.floor(Math.random() * 3),
        shootTimer: Math.random() * 2,
        moveTimer: 0,
        targetX: this.player.x, targetY: this.player.y,
        playerPattern: { left: 0, right: 0, up: 0, down: 0 }
      });
    }

    if (this.wave % 5 === 0) {
      this.spawnBoss();
    }
    
    // Spawn environmental hazards on certain waves
    if (this.wave >= 3 && this.wave % 2 === 0) {
      this.spawnEnvironmentalHazards();
    }
    
    // Change weather on certain waves
    if (this.wave >= 5 && this.wave % 4 === 0) {
      this.changeWeatherForWave();
    }
    
    // Spawn power-ups occasionally
    if (Math.random() < 0.3) {
      this.spawnAdvancedPowerUp();
    }
  }
  
  private spawnAdvancedPowerUp() {
    // Choose random power-up based on rarity
    const roll = Math.random();
    let powerUp;
    
    if (roll < 0.6) {
      // Common
      const commons = ADVANCED_POWERUPS.filter(p => p.rarity === 'common');
      powerUp = commons[Math.floor(Math.random() * commons.length)];
    } else if (roll < 0.85) {
      // Rare
      const rares = ADVANCED_POWERUPS.filter(p => p.rarity === 'rare');
      powerUp = rares[Math.floor(Math.random() * rares.length)];
    } else if (roll < 0.95) {
      // Epic
      const epics = ADVANCED_POWERUPS.filter(p => p.rarity === 'epic');
      powerUp = epics[Math.floor(Math.random() * epics.length)];
    } else {
      // Legendary
      const legendaries = ADVANCED_POWERUPS.filter(p => p.rarity === 'legendary');
      powerUp = legendaries[Math.floor(Math.random() * legendaries.length)];
    }
    
    if (powerUp) {
      // Spawn power-up orb
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 200;
      const x = this.player.x + Math.cos(angle) * dist;
      const y = this.player.y + Math.sin(angle) * dist;
      
      this.powerOrbs.push({
        x, y,
        vx: 0, vy: 0,
        type: 'advanced_powerup',
        powerUpId: powerUp.id,
        life: 15,
        size: 12
      });
      
      // Show notification
      this.floatingTexts.push({
        x, y: y - 20,
        text: `${powerUp.icon} ${powerUp.name}`,
        color: powerUp.color,
        life: 2,
        maxLife: 2,
        vy: -1
      });
    }
  }
  
  private dropAdvancedPowerUp(x: number, y: number, isBoss: boolean) {
    // Choose random power-up based on rarity (bosses drop better loot)
    const roll = Math.random();
    let powerUp;
    
    if (isBoss) {
      // Bosses drop epic or legendary
      if (roll < 0.7) {
        const epics = ADVANCED_POWERUPS.filter(p => p.rarity === 'epic');
        powerUp = epics[Math.floor(Math.random() * epics.length)];
      } else {
        const legendaries = ADVANCED_POWERUPS.filter(p => p.rarity === 'legendary');
        powerUp = legendaries[Math.floor(Math.random() * legendaries.length)];
      }
    } else {
      // Regular enemies drop common or rare
      if (roll < 0.7) {
        const commons = ADVANCED_POWERUPS.filter(p => p.rarity === 'common');
        powerUp = commons[Math.floor(Math.random() * commons.length)];
      } else {
        const rares = ADVANCED_POWERUPS.filter(p => p.rarity === 'rare');
        powerUp = rares[Math.floor(Math.random() * rares.length)];
      }
    }
    
    if (powerUp) {
      // Spawn power-up orb at enemy location
      this.powerOrbs.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        type: 'advanced_powerup',
        powerUpId: powerUp.id,
        life: 15,
        size: isBoss ? 15 : 10
      });
      
      // Show notification
      this.floatingTexts.push({
        x: x, y: y - 30,
        text: `${powerUp.icon} ${powerUp.name}`,
        color: powerUp.color,
        life: 2,
        maxLife: 2,
        vy: -1
      });
      
      // Play sound effect
      this.proceduralAudio.playPowerUp();
    }
  }
  
  private spawnEnvironmentalHazards() {
    const hazardTypes: Array<'toxic_cloud' | 'electric_field' | 'fire_zone' | 'ice_zone' | 'gravity_well'> = 
      ['toxic_cloud', 'electric_field', 'fire_zone', 'ice_zone', 'gravity_well'];
    
    const hazardCount = Math.min(3, Math.floor(this.wave / 3));
    
    for (let i = 0; i < hazardCount; i++) {
      const type = hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 300;
      const x = this.player.x + Math.cos(angle) * dist;
      const y = this.player.y + Math.sin(angle) * dist;
      const radius = 80 + Math.random() * 60;
      const damage = 10 + this.wave * 2;
      const duration = 15 + Math.random() * 10;
      
      this.hazardsSystem.addHazard(type, x, y, radius, damage, duration);
      this.proceduralAudio.playHazardSpawn(type);
    }
  }
  
  private changeWeatherForWave() {
    const weathers: Array<'rain' | 'snow' | 'storm' | 'fog' | 'sandstorm' | 'meteor'> = 
      ['rain', 'snow', 'storm', 'fog', 'sandstorm', 'meteor'];
    
    const weather = weathers[Math.floor(Math.random() * weathers.length)];
    const intensity = 0.5 + Math.random() * 0.5;
    const duration = 20 + Math.random() * 20;
    
    this.weatherSystem.setWeather(weather, intensity, duration);
    this.proceduralAudio.playWeatherChange(weather);
  }

  private spawnBoss() {
    this.bossActive = true;
    const hpMul = this.difficulty?.enemyHpMultiplier ?? 1;

    // Create Boss AI based on wave (merged from webgpu-online-games-51d72)
    const maxPhases = Math.min(5, Math.floor(this.wave / 5) + 2);
    this.bossAI = new BossAI(maxPhases);

    this.enemies.push({
      x: this.player.x, y: this.player.y - 350,
      vx: 0, vy: 0,
      hp: (500 + this.wave * 100) * hpMul,
      maxHp: (500 + this.wave * 100) * hpMul,
      size: 60,
      type: 'boss',
      color: '#ff00ff',
      phase: 0,
      pattern: Math.floor(Math.random() * 4),
      shootTimer: 0,
      moveTimer: 0,
      targetX: this.player.x, targetY: this.player.y
    });
  }

  update(timestamp: number) {
    const rawDt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
    // Hit-stop: brief dramatic slow-motion on big impacts. The raw clock
    // keeps running, but every world update below uses a scaled dt.
    if (this.hitStop > 0) {
      this.hitStop -= rawDt;
      this.deltaTime = rawDt * 0.12;
    } else {
      this.deltaTime = rawDt;
    }
    this.time += this.deltaTime;
    this.frameCount++;
    this.fpsTimer += this.deltaTime;
    if (this.fpsTimer >= 1) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    if (this.state !== 'playing') {
      this.render();
      this.animFrame = requestAnimationFrame((t) => this.update(t));
      return;
    }

    this.gameTime += this.deltaTime;
    this.updateAutoAim();
    this.updatePlayer();
    this.updateEnemies();
    this.updateBullets();
    this.updateOptions();
    this.updateParticles();
    this.updatePowerOrbs();
    this.updateCrystals();
    this.updateWeather();
    this.updateHazards();
    this.updatePowerUps();
    this.updateFloatingTexts();
    this.updateWave();
    this.render();
    this.animFrame = requestAnimationFrame((t) => this.update(t));
  }

  private updatePlayer() {
    const p = this.player;
    // Frame-rate independent movement: scale per-frame constants by dt*60
    const dtScale = this.deltaTime * 60;
    const friction = Math.pow(0.88, dtScale);
    const accel = 0.8 * dtScale;

    // Track player movement patterns for adaptive AI
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      for (const e of this.enemies) {
        if (e.playerPattern) e.playerPattern.left++;
      }
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      for (const e of this.enemies) {
        if (e.playerPattern) e.playerPattern.right++;
      }
    }

    // Movement
    if (this.keys.has('w') || this.keys.has('arrowup')) p.vy -= accel;
    if (this.keys.has('s') || this.keys.has('arrowdown')) p.vy += accel;
    if (this.keys.has('a') || this.keys.has('arrowleft')) p.vx -= accel;
    if (this.keys.has('d') || this.keys.has('arrowright')) p.vx += accel;

    // Mobile joystick input
    if (this.mobileMove.x !== 0) p.vx += this.mobileMove.x * accel;
    if (this.mobileMove.y !== 0) p.vy += this.mobileMove.y * accel;

    p.vx *= friction;
    p.vy *= friction;
    p.x += p.vx;
    p.y += p.vy;

    // Bounds
    p.x = Math.max(20, Math.min(this.width - 20, p.x));
    p.y = Math.max(20, Math.min(this.height - 20, p.y));

    // Timers
    if (p.dashCooldown > 0) p.dashCooldown -= this.deltaTime;
    if (p.dashTimer > 0) p.dashTimer -= this.deltaTime;
    if (this.bombCooldown > 0) this.bombCooldown -= this.deltaTime;
    if (p.invincible > 0) p.invincible -= this.deltaTime;
    if (p.secondaryCooldown > 0) p.secondaryCooldown -= this.deltaTime;
    if (p.comboTimer > 0) {
      p.comboTimer -= this.deltaTime;
      if (p.comboTimer <= 0) p.combo = 1;
    }

    // Stasis
    if (p.stasisActive) {
      p.stasisTimer -= this.deltaTime;
      p.energy -= 15 * this.deltaTime;
      if (p.stasisTimer <= 0 || p.energy <= 0) {
        p.stasisActive = false;
      }
    }

    // Energy regen
    p.energy = Math.min(p.maxEnergy, p.energy + 8 * this.deltaTime);
    // Shield regen (boosted by skill tree)
    p.shield = Math.min(p.maxShield, p.shield + 3 * this.skillBonuses.shieldRegenMul * this.deltaTime);
    // HP regen (from skill tree)
    if (this.skillBonuses.hpRegen > 0) {
      p.hp = Math.min(p.maxHp, p.hp + this.skillBonuses.hpRegen * this.deltaTime);
    }

    // Shooting
    if (this.mouseDown || this.mobileShooting || this.keys.has(' ')) {
      p.shootTimer -= this.deltaTime;
      if (p.shootTimer <= 0) {
        this.playerShoot();
        // Rapid Fire skill increases fire rate
        p.shootTimer = 0.12 / (p.weaponLevel * this.skillBonuses.fireRateMul);
      }
    }

    // Trail particles
    if (Math.abs(p.vx) > 1 || Math.abs(p.vy) > 1) {
      if (Math.random() < 0.3) {
        this.particles.push({
          x: p.x + (Math.random() - 0.5) * 10,
          y: p.y + (Math.random() - 0.5) * 10,
          vx: -p.vx * 0.3, vy: -p.vy * 0.3,
          life: 0.4, maxLife: 0.4, size: 2,
          color: '#00aaff', type: 'trail'
        });
      }
    }
  }

  private playerShoot() {
    const p = this.player;
    const dx = this.mouse.x - p.x;
    const dy = this.mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;
    const speed = 12;
    const isCrit = Math.random() < p.critRate;
    this.shotsFired++;
    const dmgMul = this.skillBonuses.damageMul * (this.difficulty?.playerDamageMultiplier ?? 1);

    // Overcharge skill: chance for an extra volley
    const volleys = Math.random() < this.skillBonuses.doubleShotChance ? 2 : 1;

    for (let v = 0; v < volleys; v++) {
      this.fireVolley(p, dirX, dirY, speed, isCrit, dmgMul, v * 0.18);
    }
    
    // Muzzle flash effect
    const muzzleX = p.x + dirX * 20;
    const muzzleY = p.y + dirY * 20;
    for (let i = 0; i < 5; i++) {
      const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 3 + 2;
      this.particles.push({
        x: muzzleX, y: muzzleY,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0.2, maxLife: 0.2, size: 3,
        color: isCrit ? '#ffff00' : '#00ffff', type: 'spark'
      });
    }
    
    this.audio.playShoot();
    this.proceduralAudio.playShoot(1 + Math.random() * 0.2);
  }

  private fireVolley(
    p: Player, dirX: number, dirY: number, speed: number,
    isCrit: boolean, dmgMul: number, spreadOffset: number
  ) {
    const count = Math.min(p.weaponLevel, 5);
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.15 + spreadOffset;
      const cos = Math.cos(spread);
      const sin = Math.sin(spread);
      const bvx = (dirX * cos - dirY * sin) * speed;
      const bvy = (dirX * sin + dirY * cos) * speed;
      this.bullets.push({
        x: p.x, y: p.y, vx: bvx, vy: bvy,
        size: isCrit ? 6 : 4, color: isCrit ? '#ffff00' : '#00ffff',
        damage: (10 + p.weaponLevel * 3) * dmgMul * (isCrit ? p.critDmg : 1),
        life: 2, type: 'player',
        chainLeft: this.skillBonuses.chainCount,
        chainDamage: this.skillBonuses.chainDamageMul
      });
    }
  }

  private updateEnemies() {
    const timeScale = this.player.stasisActive ? 0.1 : 1;
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.phase += this.deltaTime * 2 * timeScale;
      e.shootTimer -= this.deltaTime * timeScale;
      e.moveTimer -= this.deltaTime * timeScale;
      if (e.hitFlash && e.hitFlash > 0) e.hitFlash -= this.deltaTime;

      if (e.type === 'boss') {
        this.updateBoss(e, timeScale);
      } else {
        // Get or create AI for this enemy (merged from webgpu-online-games-51d72)
        const enemyId = `enemy_${i}`;
        if (!this.enemyAIs.has(enemyId)) {
          // Create AI with personality based on enemy type
          const personality = this.getEnemyPersonality(e.type);
          this.enemyAIs.set(enemyId, new AdvancedEnemyAI(personality));
        }

        
        const ai = this.enemyAIs.get(enemyId)!;

        // Titan desperation: a single readable spiral barrage once it drops
        // below 35% HP (telegraphed with a flash of floating text + shake).
        if (
          e.type === 'titan' && !e.desperate &&
          e.maxHp > 0 && e.hp / e.maxHp < 0.35
        ) {
          e.desperate = true;
          const spiralBase = e.phase;
          const dmgMul = this.difficulty?.enemyDamageMultiplier ?? 1;
          for (let k = 0; k < 16; k++) {
            const angle = spiralBase + (Math.PI * 2 * k) / 16;
            this.bullets.push({
              x: e.x, y: e.y,
              vx: Math.cos(angle) * 3.4, vy: Math.sin(angle) * 3.4,
              size: 5, color: '#cc66ff', damage: 10 * dmgMul,
              life: 3, type: 'enemy'
            });
          }
          this.screenShake = Math.max(this.screenShake, 6);
          this.floatingTexts.push({
            x: e.x, y: e.y - e.size,
            text: '\u26A0 RAGE', color: '#ff66ff',
            life: 1, maxLife: 1, vy: -1.5
          });
        }

        // Update AI with current state
        const aiResult = ai.update(
          e.x, e.y,
          this.player.x, this.player.y,
          this.player.vx, this.player.vy,
          this.deltaTime * timeScale
        );
        
        // Apply AI movement (with difficulty speed multiplier from main)
        const speed = (e.type === 'swarmer' ? 2.5 : e.type === 'sniper' ? 1 : 0.8) * (this.difficulty?.enemySpeedMultiplier ?? 1);
        e.vx += aiResult.moveX * speed * 0.1 * timeScale;
        e.vy += aiResult.moveY * speed * 0.1 * timeScale;
        
        // Add some randomness to movement
        if (e.type === 'swarmer') {
          e.vx += Math.sin(e.phase * 3) * 0.3 * timeScale;
          e.vy += Math.cos(e.phase * 3) * 0.3 * timeScale;
        }

        e.vx *= 0.95;
        e.vy *= 0.95;
        e.x += e.vx * timeScale;
        e.y += e.vy * timeScale;

        // Anatomy of a Shmup rule: off-screen enemies must not shoot, so
        // every incoming volley is telegraphed by a visible attacker.
        const onScreen = e.x > 10 && e.x < this.width - 10 && e.y > 20 && e.y < this.height - 10;
        // Shooting based on AI decision
        if (aiResult.shouldAttack && e.shootTimer <= 0) {
          const shootInterval = e.type === 'swarmer' ? 1.5 : e.type === 'sniper' ? 2.5 : 3;
          e.shootTimer = shootInterval;
          if (onScreen) this.enemyShoot(e, aiResult.attackAngle);
        } else if (e.shootTimer <= 0) {
          // Fallback to regular shooting if AI doesn't want to attack
          const shootInterval = e.type === 'swarmer' ? 1.5 : e.type === 'sniper' ? 2.5 : 3;
          e.shootTimer = shootInterval;
          if (onScreen) this.enemyShoot(e);
        }
        
        // Update AI state based on health
        const healthPercent = e.hp / e.maxHp;
        ai.setLowHealth(healthPercent);
      }

      // Check death
      if (e.hp <= 0) {
        this.onEnemyDeath(e);
        // Remove AI when enemy dies
        const enemyId = `enemy_${i}`;
        this.enemyAIs.delete(enemyId);
        this.enemies.splice(i, 1);
      }
    }
  }
  
  private getEnemyPersonality(type: string): { aggression: number; intelligence: number; reactionTime: number; accuracy: number } {
    switch (type) {
      case 'swarmer':
        return { aggression: 0.8, intelligence: 0.3, reactionTime: 0.7, accuracy: 0.5 };
      case 'sniper':
        return { aggression: 0.4, intelligence: 0.8, reactionTime: 0.5, accuracy: 0.9 };
      case 'titan':
        return { aggression: 0.6, intelligence: 0.6, reactionTime: 0.3, accuracy: 0.7 };
      default:
        return { aggression: 0.5, intelligence: 0.5, reactionTime: 0.5, accuracy: 0.5 };
    }
  }

  private updateBoss(boss: Enemy, timeScale: number) {
    const dx = this.player.x - boss.x;
    const dy = this.player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const healthPercent = boss.hp / boss.maxHp;
    
    // Use BossAI if available
    if (this.bossAI) {
      const aiResult = this.bossAI.update(
        boss.x, boss.y,
        this.player.x, this.player.y,
        healthPercent,
        this.deltaTime * timeScale
      );
      
      // Apply AI movement
      boss.x += aiResult.moveX * 2 * timeScale;
      boss.y += aiResult.moveY * 2 * timeScale;
      
      // Apply AI attack pattern
      if (aiResult.shouldAttack && aiResult.attackPattern) {
        this.executeBossAttackPattern(boss, aiResult.attackPattern);
      }
    } else {
      // Fallback to original behavior if no AI
      // Boss movement - orbit and approach
      boss.x += Math.sin(boss.phase * 0.5) * 2 * timeScale;
      boss.y += Math.cos(boss.phase * 0.3) * 1 * timeScale;
      if (dist > 300) {
        boss.x += (dx / dist) * 1.5 * timeScale;
        boss.y += (dy / dist) * 1.5 * timeScale;
      }

      // Adaptive pattern based on player movement
      if (boss.playerPattern) {
        const total = boss.playerPattern.left + boss.playerPattern.right + boss.playerPattern.up + boss.playerPattern.down;
        if (total > 50) {
          const leftRatio = boss.playerPattern.left / total;
          const rightRatio = boss.playerPattern.right / total;
          boss.pattern = leftRatio > rightRatio ? 1 : 0;
        }
      }

      // Boss attack patterns
      if (boss.shootTimer <= 0) {
        boss.shootTimer = 0.3;
        const pattern = boss.pattern;
        
        if (pattern === 0) {
          this.executeBossAttackPattern(boss, 'spiral');
        } else if (pattern === 1) {
          this.executeBossAttackPattern(boss, 'burst');
        } else if (pattern === 2) {
          this.executeBossAttackPattern(boss, 'laser');
        } else {
          this.executeBossAttackPattern(boss, 'ring');
        }
      }
    }
  }
  
  private executeBossAttackPattern(boss: Enemy, pattern: string) {
    switch (pattern) {
      case 'spiral': {
        const spiralAngle = boss.phase * 3;
        for (let i = 0; i < 8; i++) {
          const a = spiralAngle + (Math.PI * 2 * i) / 8;
          this.bullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
            size: 5, color: '#ff00ff', damage: 15,
            life: 4, type: 'enemy'
          });
        }
        break;
      }
        
      case 'burst': {
        // Lissajous curve pattern
        const t = boss.phase;
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 * i) / 12;
          const r = 3 + Math.sin(t * 2 + i * 0.5) * 2;
          this.bullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(a) * r, vy: Math.sin(a * 2 + t) * r,
            size: 4, color: '#ff88ff', damage: 12,
            life: 4, type: 'enemy'
          });
        }
        break;
      }
        
      case 'laser': {
        // Logarithmic spiral
        const baseAngle = boss.phase;
        for (let i = 0; i < 20; i++) {
          const a = baseAngle + i * 0.3;
          const r = 2 + i * 0.2;
          this.bullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(a) * r, vy: Math.sin(a) * r,
            size: 3, color: '#cc00ff', damage: 10,
            life: 3.5, type: 'enemy'
          });
        }
        break;
      }
        
      case 'homing':
        // Homing missiles
        for (let i = 0; i < 3; i++) {
          const angle = Math.atan2(this.player.y - boss.y, this.player.x - boss.x) + (i - 1) * 0.3;
          this.bullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
            size: 6, color: '#ff4444', damage: 20,
            life: 5, type: 'enemy'
          });
        }
        break;
        
      case 'ring':
        // Ring pattern
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 * i) / 16 + boss.phase;
          this.bullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(a) * 3, vy: Math.sin(a) * 3,
            size: 4, color: '#cc00ff', damage: 10,
            life: 3.5, type: 'enemy'
          });
        }
        break;

      case 'wave': {
        // Flowing curtain: a wall of sine-wave bullets that weaves as it
        // descends (per danmaku pattern research — sine walls read as
        // waves of light and reward rhythm-based dodging).
        const waveDmg = 12 * (this.difficulty?.enemyDamageMultiplier ?? 1);
        const n = 14;
        const speed = 3.2;
        for (let i = 0; i < n; i++) {
          const angle = Math.PI / 2 + (i - (n - 1) / 2) * 0.12;
          this.bullets.push({
            x: boss.x + (i - (n - 1) / 2) * 24, y: boss.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            size: 4.5, color: '#66ffff', damage: waveDmg,
            life: 4, type: 'enemy',
            waveAmp: 0.5, waveFreq: 4, wavePhase: i * 0.55,
            baseVx: Math.cos(angle) * speed, baseVy: Math.sin(angle) * speed, baseSpeed: speed
          });
        }
        break;
      }
        
      default:
        // Cross pattern
        for (let i = 0; i < 4; i++) {
          const a = boss.phase + (Math.PI / 2) * i;
          for (let j = 1; j <= 3; j++) {
            this.bullets.push({
              x: boss.x, y: boss.y,
              vx: Math.cos(a) * (2 + j), vy: Math.sin(a) * (2 + j),
              size: 4, color: '#cc00ff', damage: 10,
              life: 3.5, type: 'enemy'
            });
          }
        }
        break;
    }
  }

  private enemyShoot(e: Enemy, attackAngle?: number) {
    const dx = this.player.x - e.x;
    const dy = this.player.y - e.y;
    const dmgMul = this.difficulty?.enemyDamageMultiplier ?? 1;

    // Use AI-provided attack angle if available
    let baseAngle = Math.atan2(dy, dx);
    if (attackAngle !== undefined) {
      baseAngle = attackAngle;
    }

    // Adaptive aiming based on player patterns
    let aimOffset = 0;
    if (e.playerPattern) {
      const total = e.playerPattern.left + e.playerPattern.right;
      if (total > 20) {
        const leftRatio = e.playerPattern.left / total;
        aimOffset = (leftRatio - 0.5) * 0.3; // Bias toward player's dodge direction
      }
    }

    if (e.type === 'swarmer') {
      this.bullets.push({
        x: e.x, y: e.y,
        vx: Math.cos(baseAngle + aimOffset) * 4, vy: Math.sin(baseAngle + aimOffset) * 4,
        size: 3, color: '#ff6644', damage: 8 * dmgMul,
        life: 3, type: 'enemy'
      });
      // Muzzle flash
      this.particles.push({
        x: e.x, y: e.y,
        vx: 0, vy: 0,
        life: 0.15, maxLife: 0.15, size: 6,
        color: '#ff6644', type: 'spark'
      });
    } else if (e.type === 'sniper') {
      // 30% of sniper volleys: a flowing sine-wave fan (danmaku variety —
      // three shots weave sideways instead of flying straight).
      if (Math.random() < 0.3) {
        const speed = 5.5;
        for (let i = -1; i <= 1; i++) {
          const angle = baseAngle + i * 0.22 + aimOffset;
          this.bullets.push({
            x: e.x, y: e.y,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            size: 4, color: '#ffcc44', damage: 11 * dmgMul,
            life: 3, type: 'enemy',
            waveAmp: 0.35, waveFreq: 6, wavePhase: e.phase + i * 0.8,
            baseVx: Math.cos(angle) * speed, baseVy: Math.sin(angle) * speed, baseSpeed: speed
          });
        }
        return;
      }
      for (let i = -1; i <= 1; i++) {
        const angle = baseAngle + i * 0.1 + aimOffset;
        this.bullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * 7, vy: Math.sin(angle) * 7,
          size: 4, color: '#ffaa00', damage: 12 * dmgMul,
          life: 2.5, type: 'enemy'
        });
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const angle = baseAngle + (Math.PI * 2 * i) / 6 + e.phase + aimOffset;
        this.bullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
          size: 5, color: '#aa44ff', damage: 10 * dmgMul,
          life: 3, type: 'enemy'
        });
      }
    }
  }

  /** Chain Reaction skill: zap the nearest enemy from the hit position. */
  private applyChain(source: Bullet, fromX: number, fromY: number) {
    let nearest: Enemy | null = null;
    let nearestDist = 250 * 250; // squared range
    for (const e of this.enemies) {
      const dx = e.x - fromX;
      const dy = e.y - fromY;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearestDist) {
        nearestDist = d2;
        nearest = e;
      }
    }
    if (!nearest) return;

    const dmg = source.damage * source.chainDamage!;
    nearest.hp -= dmg;
    this.totalDamageDealt += dmg;
    this.hitsLanded++;

    // Lightning arc visual
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      this.particles.push({
        x: fromX + (nearest.x - fromX) * t + (Math.random() - 0.5) * 12,
        y: fromY + (nearest.y - fromY) * t + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
        life: 0.25, maxLife: 0.25, size: 2.5,
        color: '#ffff00', type: 'spark'
      });
    }
  }

  private onEnemyDeath(e: Enemy) {
    const scoreMul = this.difficulty?.scoreMultiplier ?? 1;
    const baseScore = (e.type === 'boss' ? 1000 : e.type === 'titan' ? 100 : 25) * scoreMul;
    this.player.score += baseScore * this.player.combo;
    this.player.combo = Math.min(10, this.player.combo + 1);
    this.player.comboTimer = 5;
    this.maxCombo = Math.max(this.maxCombo, this.player.combo);
    this.screenShake = e.type === 'boss' ? 20 : 5;
    // Kill juice: bosses get a long freeze-frame, titans a short one.
    if (e.type === 'boss') this.hitStop = Math.max(this.hitStop, 0.14);
    else if (e.type === 'titan') this.hitStop = Math.max(this.hitStop, 0.06);
    this.audio.playExplosion();
    this.proceduralAudio.playExplosion();
    this.enemiesKilled++;
    if (e.type === 'boss') this.bossKills++;

    // Gold reward (scaled by difficulty)
    const goldMul = this.difficulty?.goldMultiplier ?? 1;
    this.gold += Math.round((e.type === 'boss' ? 250 : e.type === 'titan' ? 25 : 10) * goldMul);

    // Award XP based on enemy type (scaled by difficulty)
    const xpGained = Math.round((e.type === 'boss' ? 500 : e.type === 'titan' ? 50 : 15) * (this.difficulty?.xpMultiplier ?? 1));
    this.awardXP(xpGained, e.x, e.y);

    // Expanding shockwave ring — one readable pulse marking the blast
    this.particles.push({
      x: e.x, y: e.y, vx: 0, vy: 0,
      life: 0.55, maxLife: 0.55,
      size: e.type === 'boss' ? 220 : e.type === 'titan' ? 90 : 55,
      color: e.type === 'boss' ? '#ff66ff' : '#ffffff',
      type: 'ring'
    });

    // Death particles - more when WebGPU is active
    const particleCount = Math.floor((this.webgpuSupported ? (e.type === 'boss' ? 200 : 50) : (e.type === 'boss' ? 80 : 20)) * this.particleScale);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.particles.push({
        x: e.x, y: e.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1 + Math.random(), maxLife: 1.5, size: Math.random() * 4 + 2,
        color: e.color, type: 'debris'
      });
    }

    // Drop power orbs
    if (Math.random() < 0.3 || e.type === 'boss') {
      const orbCount = e.type === 'boss' ? 5 : 1;
      for (let i = 0; i < orbCount; i++) {
        const types: PowerOrb['type'][] = ['hp', 'energy', 'shield', 'score'];
        this.powerOrbs.push({
          x: e.x + (Math.random() - 0.5) * 30,
          y: e.y + (Math.random() - 0.5) * 30,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          type: types[Math.floor(Math.random() * types.length)],
          life: 10,
          size: 8
        });
      }
    }
    
    // Drop advanced power-ups (rare drop from regular enemies, guaranteed from bosses)
    const powerUpDropChance = e.type === 'boss' ? 1.0 : e.type === 'titan' ? 0.3 : 0.05;
    if (Math.random() < powerUpDropChance) {
      this.dropAdvancedPowerUp(e.x, e.y, e.type === 'boss');
    }

    // Classic letter drops (Raiden/Truxton style): P = power, S = speed,
    // B = bomb, O = option. Rare from grunts, meaningful from titans,
    // guaranteed from bosses (Option first while drones are missing).
    const letterDrop = (type: PowerOrb['type'], lx: number, ly: number) => {
      this.powerOrbs.push({
        x: lx, y: ly,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -1 - Math.random(),
        type, life: 14, size: 10
      });
    };
    if (e.type === 'boss') {
      letterDrop(this.player.options < 2 ? 'option' : 'bomb', e.x, e.y);
    } else if (e.type === 'titan' && Math.random() < 0.55) {
      letterDrop(Math.random() < 0.5 ? 'power' : 'bomb', e.x, e.y);
    } else {
      const roll = Math.random();
      if (roll < 0.035) letterDrop('power', e.x, e.y);
      else if (roll < 0.06) letterDrop('speed', e.x, e.y);
      else if (roll < 0.075) letterDrop('bomb', e.x, e.y);
    }

    if (e.type === 'boss') {
      this.bossActive = false;
      // Boss death: huge double shockwave ring
      this.particles.push({
        x: e.x, y: e.y, vx: 0, vy: 0,
        life: 0.9, maxLife: 0.9,
        size: 340, color: '#ffffff', type: 'ring'
      });
      this.particles.push({
        x: e.x, y: e.y, vx: 0, vy: 0,
        life: 1.2, maxLife: 1.2,
        size: 420, color: '#ff66ff', type: 'ring'
      });
      // Boss death shockwave
      for (let i = 0; i < 50; i++) {
        const angle = (Math.PI * 2 * i) / 50;
        const speed = 8 + Math.random() * 4;
        this.particles.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 1.5, maxLife: 1.5, size: 5 + Math.random() * 3,
          color: '#ff00ff', type: 'debris'
        });
      }
      // Extra explosion particles
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 6 + 3;
        this.particles.push({
          x: e.x + (Math.random() - 0.5) * 40,
          y: e.y + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          life: 2, maxLife: 2, size: 4 + Math.random() * 4,
          color: Math.random() < 0.5 ? '#ff00ff' : '#ffffff',
          type: 'energy'
        });
      }
    }
  }

  private awardXP(amount: number, x: number, y: number) {
    this.player.xp += amount;
    this.player.totalXp += amount;

    // Show floating XP text
    if (amount > 0) {
      this.floatingTexts.push({
        x: x,
        y: y - 20,
        text: `+${amount} XP`,
        color: '#ffaa00',
        life: 1.5,
        maxLife: 1.5,
        vy: -1.5
      });
    }

    // Check for level up
    while (this.player.xp >= this.player.xpToNextLevel) {
      this.levelUp();
    }
  }

  private levelUp() {
    this.player.level++;
    this.player.xp -= this.player.xpToNextLevel;
    
    // Exponential XP curve
    this.player.xpToNextLevel = Math.floor(100 * Math.pow(1.5, this.player.level - 1));

    // Level up rewards
    this.player.maxHp += 10;
    this.player.hp = Math.min(this.player.hp + 20, this.player.maxHp);
    this.player.maxShield += 5;
    this.player.shield = Math.min(this.player.shield + 10, this.player.maxShield);
    this.player.maxEnergy += 5;
    this.player.energy = Math.min(this.player.energy + 15, this.player.maxEnergy);
    this.player.speed *= 1.02;
    this.player.critRate = Math.min(0.5, this.player.critRate + 0.01);

    // Visual effects
    this.screenShake = 15;
    this.audio.playPowerUp();
    this.proceduralAudio.playLevelUp();

    // Level up particle explosion - golden spiral
    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 * i) / 80;
      const spiralOffset = i * 0.1;
      const speed = 4 + Math.random() * 6;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle + spiralOffset) * speed,
        vy: Math.sin(angle + spiralOffset) * speed,
        life: 2,
        maxLife: 2,
        size: 2 + Math.random() * 4,
        color: i % 3 === 0 ? '#ffaa00' : i % 3 === 1 ? '#ffffff' : '#ffff00',
        type: 'energy'
      });
    }

    // Level up ring effect
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40;
      const speed = 8;
      this.particles.push({
        x: this.player.x,
        y: this.player.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 5,
        color: '#ffaa00',
        type: 'spark'
      });
    }

    // Level up announcement
    this.waveAnnouncement = {
      text: `LEVEL ${this.player.level}`,
      subtext: 'Izberi nadgradnjo!',
      timer: 2,
      color: '#ffaa00'
    };

    // Trigger level choice screen with real random upgrade choices
    this.generateLevelChoices();
    this.state = 'levelchoice';
    this.onStateChange(this.state);
  }

  private updateBullets() {
    // Broadphase: rebuild the uniform spatial hash grid of enemies every
    // frame so player-bullet collision only tests enemies in the 3x3 cell
    // neighborhood (per collision research — spatial hashing beats the
    // O(n*m) brute-force scan as bullet/enemy counts grow).
    const cell = 80;
    const grid = this.enemyGrid;
    grid.clear();
    for (const e of this.enemies) {
      const key = (Math.floor(e.x / cell) + 512) * 4096 + (Math.floor(e.y / cell) + 512);
      const bucket = grid.get(key);
      if (bucket) bucket.push(e);
      else grid.set(key, [e]);
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];

      // Danmaku sine-wave bullets steer around their base trajectory.
      if (b.waveAmp !== undefined && b.baseVx !== undefined && b.baseVy !== undefined) {
        const baseAngle = Math.atan2(b.baseVy, b.baseVx);
        const speed = b.baseSpeed ?? Math.sqrt(b.baseVx * b.baseVx + b.baseVy * b.baseVy);
        const a = baseAngle + Math.sin(this.time * (b.waveFreq ?? 4) + (b.wavePhase ?? 0)) * b.waveAmp;
        b.vx = Math.cos(a) * speed;
        b.vy = Math.sin(a) * speed;
      }

      b.x += b.vx;
      b.y += b.vy;
      b.life -= this.deltaTime;

      let removeBullet: boolean;

      if (b.life <= 0 || b.x < -50 || b.x > this.width + 50 || b.y < -50 || b.y > this.height + 50) {
        removeBullet = true;
      } else if (b.type === 'player') {
        removeBullet = this.checkPlayerBulletHit(b, cell, grid);
      } else {
        removeBullet = this.checkEnemyBulletHit(b);
      }

      if (removeBullet) {
        // Swap-pop removal: O(1) instead of splice's O(n) shift. The
        // element moved into slot i comes from the tail (already processed
        // this frame), so nothing is skipped or handled twice. This also
        // fixes a latent bug where the crystal check ran on the WRONG
        // bullet after an enemy hit removed the current one via splice.
        this.bullets[i] = this.bullets[this.bullets.length - 1];
        this.bullets.pop();
      }
    }
  }

  /** Player-bullet collisions: spatial-hash enemy query, then crystals. */
  private checkPlayerBulletHit(b: Bullet, cell: number, grid: Map<number, Enemy[]>): boolean {
    // Check enemy hits via the 3x3 grid neighborhood
    const cx = Math.floor(b.x / cell);
    const cy = Math.floor(b.y / cell);
    for (let gx = cx - 1; gx <= cx + 1; gx++) {
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        const bucket = grid.get((gx + 512) * 4096 + (gy + 512));
        if (!bucket) continue;
        for (const e of bucket) {
          if (e.hp <= 0) continue;
          const dx = b.x - e.x;
          const dy = b.y - e.y;
          if (dx * dx + dy * dy < (e.size + b.size) * (e.size + b.size)) {
            e.hp -= b.damage;
            e.hitFlash = 0.09; // white hit flash for instant damage feedback
            this.totalDamageDealt += b.damage;
            this.hitsLanded++;
            // Chain Reaction skill: bullet arcs to the nearest other enemy
            if (b.chainLeft && b.chainLeft > 0 && b.chainDamage) {
              this.applyChain(b, e.x, e.y);
            }
            // Floating damage number
            this.floatingTexts.push({
              x: b.x, y: b.y,
              text: Math.floor(b.damage).toString(),
              color: b.color === '#ffff00' ? '#ffff00' : '#ffffff',
              life: 0.8, maxLife: 0.8, vy: -2
            });
            // Hit particles
            for (let j = 0; j < 5; j++) {
              this.particles.push({
                x: b.x, y: b.y,
                vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                life: 0.3, maxLife: 0.3, size: 2,
                color: b.color, type: 'spark'
              });
            }
            return true;
          }
        }
      }
    }

    // Check crystal hits (few crystals on screen — linear scan is fine)
    for (let c = this.crystals.length - 1; c >= 0; c--) {
      const crystal = this.crystals[c];
      const dx = b.x - crystal.x;
      const dy = b.y - crystal.y;
      if (dx * dx + dy * dy < (crystal.size + b.size) * (crystal.size + b.size)) {
        crystal.hp -= b.damage;
        if (crystal.hp <= 0) {
          // Crystal destruction with shards
          for (let j = 0; j < 25; j++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 7 + 3;
            this.particles.push({
              x: crystal.x + (Math.random() - 0.5) * crystal.size,
              y: crystal.y + (Math.random() - 0.5) * crystal.size,
              vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
              life: 1.2, maxLife: 1.2, size: 2 + Math.random() * 3,
              color: crystal.color, type: 'debris'
            });
          }
          // Energy burst
          for (let j = 0; j < 10; j++) {
            const angle = (Math.PI * 2 * j) / 10;
            this.particles.push({
              x: crystal.x, y: crystal.y,
              vx: Math.cos(angle) * 4, vy: Math.sin(angle) * 4,
              life: 0.8, maxLife: 0.8, size: 4,
              color: '#ffffff', type: 'energy'
            });
          }
          this.crystals.splice(c, 1);
          this.audio.playExplosion();
          this.screenShake = 5;
        }
        return true;
      }
    }
    return false;
  }

  /** Enemy-bullet vs player: hit damage, or a graze reward for near-misses. */
  private checkEnemyBulletHit(b: Bullet): boolean {
    const p = this.player;
    const dx = b.x - p.x;
    const dy = b.y - p.y;
    const d2 = dx * dx + dy * dy;
    const hitR = 12 + b.size;

    if (p.invincible <= 0 && d2 < hitR * hitR) {
      this.damagePlayer(b.damage);
      return true;
    }

    // Graze: classic shmup risk/reward — threading past a bullet pays a
    // small score + energy bonus (one graze per bullet, i-frames excluded).
    if (!b.grazed && p.invincible <= 0) {
      const grazeR = hitR + 16;
      if (d2 < grazeR * grazeR) {
        b.grazed = true;
        p.score += Math.round(20 * (this.difficulty?.scoreMultiplier ?? 1));
        p.energy = Math.min(p.maxEnergy, p.energy + 2);
        for (let j = 0; j < 2; j++) {
          this.particles.push({
            x: b.x, y: b.y,
            vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
            life: 0.25, maxLife: 0.25, size: 1.8,
            color: '#ffffff', type: 'spark'
          });
        }
      }
    }
    return false;
  }

  private damagePlayer(amount: number) {
    const p = this.player;
    // Skill tree damage reduction (capped at 75%)
    amount *= Math.max(0.25, 1 - this.skillBonuses.damageReduction);
    this.damageTaken += amount;
    if (p.shield > 0) {
      const shieldDmg = Math.min(p.shield, amount);
      p.shield -= shieldDmg;
      amount -= shieldDmg;
    }
    p.hp -= amount;
    p.invincible = 0.5;
    this.screenShake = 8;
    this.hitStop = Math.max(this.hitStop, 0.05); // brief impact freeze
    this.audio.playHit();

    if (p.hp <= 0) {
      this.gameOver();
    }
  }

  private gameOver() {
    this.state = 'gameover';
    this.onStateChange(this.state);
    this.saveHighScore();
    this.audio.stopMusic();
    this.proceduralMusic.stop();
    this.proceduralAudio.playDeath();
    // Death explosion
    for (let i = 0; i < 100; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 2;
      this.particles.push({
        x: this.player.x, y: this.player.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 2, maxLife: 2, size: Math.random() * 5 + 2,
        color: '#00ffff', type: 'debris'
      });
    }
  }

  private updateParticles() {
    // Physics always integrates on the CPU (single source of truth for
    // positions). With WebGPU enabled the GPU only accelerates RENDERING
    // of the particles on the overlay canvas.
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= this.deltaTime;
      if (p.life <= 0) {
        // Swap-pop removal (O(1)) — particles churn every frame.
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
      }
    }
    
    // Limit particles (respect the user's particle quality setting)
    const maxParticles = Math.floor((this.webgpuSupported ? 10000 : 2000) * this.particleScale);
    if (this.particles.length > maxParticles) {
      this.particles.splice(0, this.particles.length - maxParticles);
    }
  }

  /**
   * Gradius-style Options: up to 2 drones orbit the ship and auto-fire at
   * the nearest enemy (position is a pure function of time, so rendering
   * and firing stay in perfect sync without storing state).
   */
  private updateOptions() {
    const p = this.player;
    if (p.options <= 0) return;
    this.optionTimer -= this.deltaTime;
    const fire = this.optionTimer <= 0;
    if (fire) this.optionTimer = 0.28;
    const dmgMul = this.skillBonuses.damageMul * (this.difficulty?.playerDamageMultiplier ?? 1);

    for (let i = 0; i < p.options; i++) {
      const ang = this.time * 1.6 + (Math.PI * 2 * i) / p.options;
      const ox = p.x + Math.cos(ang) * 38;
      const oy = p.y + Math.sin(ang) * 38;
      if (!fire) continue;
      // Auto-aim at the nearest enemy (Raiden option behaviour)
      let bx = 0, by = -1, found = false;
      let best = 340 * 340;
      for (const e of this.enemies) {
        const dx = e.x - ox;
        const dy = e.y - oy;
        const d2 = dx * dx + dy * dy;
        if (d2 < best) { best = d2; bx = dx; by = dy; found = true; }
      }
      if (!found) continue;
      const d = Math.sqrt(best) || 1;
      this.bullets.push({
        x: ox, y: oy,
        vx: (bx / d) * 10, vy: (by / d) * 10,
        size: 3, color: '#66ffff', damage: 8 * dmgMul,
        life: 1.6, type: 'player'
      });
    }
  }

  /** Draw the orbiting option drones (same orbit equation as firing). */
  private renderOptions(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    for (let i = 0; i < p.options; i++) {
      const ang = this.time * 1.6 + (Math.PI * 2 * i) / p.options;
      const ox = p.x + Math.cos(ang) * 38;
      const oy = p.y + Math.sin(ang) * 38;
      const pulse = 1 + Math.sin(this.time * 8 + i * 2) * 0.15;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const glow = ctx.createRadialGradient(ox, oy, 0, ox, oy, 12 * pulse);
      glow.addColorStop(0, '#66ffffff');
      glow.addColorStop(0.5, '#66ffaaaa');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ox, oy, 12 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.arc(ox, oy, 5 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#66ffff';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ox, oy, 2.2 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
  }

  /** Bottom-right bomb stock + option counter (classic arcade HUD row). */
  private renderRunIndicators(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const p = this.player;
    ctx.textAlign = 'right';
    // Bomb stock (Raiden): filled ◉ for available, hollow ○ for spent
    let bombStr = '';
    for (let i = 0; i < p.maxBombs; i++) bombStr += i < p.bombs ? '\u25C9' : '\u25CB';
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#ff6644';
    ctx.fillText(bombStr, w - 20, h - 22);
    ctx.font = '9px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('BOMBA [X]', w - 20, h - 10);
    if (p.options > 0) {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#66ffff';
      let optStr = 'OPTION ';
      for (let i = 0; i < p.options; i++) optStr += '\u25CF';
      ctx.fillText(optStr, w - 20, h - 40);
    }
  }

  /** Galaxy-Force-style warp streaks while a wave announcement is active. */
  private renderWarpStreaks(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const a = this.waveAnnouncement;
    if (!a || a.timer <= 0) return;
    const fade = Math.max(0, Math.min(1, a.timer));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const seed = i * 137.508;
      const x = (seed * 97.31) % w;
      const speed = 900 + ((seed * 53.7) % 600);
      const len = 60 + ((seed * 31.7) % 90);
      const y = h - ((this.time * speed + seed * 211) % (h + len));
      ctx.globalAlpha = 0.3 * fade;
      const grad = ctx.createLinearGradient(x, y, x, y + len);
      grad.addColorStop(0, 'rgba(120,220,255,0)');
      grad.addColorStop(0.5, 'rgba(210,245,255,0.9)');
      grad.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, 2, len);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private updatePowerOrbs() {
    for (let i = this.powerOrbs.length - 1; i >= 0; i--) {
      const orb = this.powerOrbs[i];
      orb.x += orb.vx;
      orb.y += orb.vy;
      orb.vx *= 0.95;
      orb.vy *= 0.95;
      orb.life -= this.deltaTime;

      // Raiden-style magnet: orbs and letters drift toward the ship when
      // close (letters get the strongest pull — they matter most).
      {
        const pdx = this.player.x - orb.x;
        const pdy = this.player.y - orb.y;
        const pd2 = pdx * pdx + pdy * pdy;
        const isLetter = orb.type === 'power' || orb.type === 'speed' ||
          orb.type === 'bomb' || orb.type === 'option';
        const magnetR = isLetter ? 150 : 90;
        if (pd2 < magnetR * magnetR && pd2 > 1) {
          const pd = Math.sqrt(pd2);
          orb.vx += (pdx / pd) * 0.9;
          orb.vy += (pdy / pd) * 0.9;
        }
      }

      // Check player pickup
      const dx = orb.x - this.player.x;
      const dy = orb.y - this.player.y;
      if (dx * dx + dy * dy < 400) {
        // Pickup
        this.itemsCollected++;
        switch (orb.type) {
          case 'hp': 
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 10); 
            break;
          case 'energy': 
            this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 15); 
            break;
          case 'shield': 
            this.player.shield = Math.min(this.player.maxShield, this.player.shield + 10); 
            break;
          case 'score': 
            this.player.score += 50; 
            break;
          case 'power':
            // Letter P (Raiden/Truxton): instant weapon level
            this.player.weaponLevel = Math.min(10, this.player.weaponLevel + 1);
            this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: 'POWER UP!', color: '#ffcc00', life: 1.2, maxLife: 1.2, vy: -1.5 });
            break;
          case 'speed':
            // Letter S: movement speed boost (capped)
            this.player.speed = Math.min(11, this.player.speed * 1.1);
            this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: 'SPEED UP!', color: '#00ffcc', life: 1.2, maxLife: 1.2, vy: -1.5 });
            break;
          case 'bomb':
            // Letter B: +1 bomb stock
            this.player.bombs = Math.min(this.player.maxBombs, this.player.bombs + 1);
            this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: '+1 BOMBA', color: '#ff6644', life: 1.2, maxLife: 1.2, vy: -1.5 });
            break;
          case 'option':
            // Letter O (Gradius): companion drone, max 2
            if (this.player.options < 2) {
              this.player.options++;
              this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: 'OPTION!', color: '#66ffff', life: 1.4, maxLife: 1.4, vy: -1.5 });
            } else {
              this.player.score += 200;
            }
            break;
          case 'advanced_powerup':
            if (orb.powerUpId) {
              this.powerUpManager.addPowerUp(orb.powerUpId);
              const powerUp = ADVANCED_POWERUPS.find(p => p.id === orb.powerUpId);
              if (powerUp) {
                this.floatingTexts.push({
                  x: orb.x, y: orb.y - 20,
                  text: `${powerUp.icon} ${powerUp.name}`,
                  color: powerUp.color,
                  life: 2,
                  maxLife: 2,
                  vy: -1
                });
              }
            }
            break;
        }
        this.audio.playPowerUp();
        this.proceduralAudio.playPowerUp();
        this.powerOrbs.splice(i, 1);
        continue;
      }

      if (orb.life <= 0) {
        this.powerOrbs.splice(i, 1);
      }
    }
  }

  private updateCrystals() {
    for (const crystal of this.crystals) {
      crystal.rotation += crystal.rotSpeed;
    }
  }

  private updateWeather() {
    this.weatherSystem.update(this.deltaTime, this.width, this.height);
  }

  private updateHazards() {
    this.hazardsSystem.update(this.deltaTime);
    
    // Check player collision with hazards
    const collision = this.hazardsSystem.checkCollision(
      this.player.x,
      this.player.y,
      20 // player radius
    );
    
    if (collision.hazard && collision.damage > 0) {
      this.damagePlayer(collision.damage * this.deltaTime);
    }
  }

  private updatePowerUps() {
    // Apply active power-up effects to player
    const effects = this.powerUpManager.getTotalEffects();
    
    // Reset player stats to base values first
    // (In a real implementation, you'd store base stats separately)
    
    // Apply effects
    for (const effect of effects) {
      switch (effect.type) {
        case 'damage':
          // Apply damage multiplier (would need to modify playerShoot method)
          break;
        case 'speed': {
          // Apply speed multiplier
          const speedBonus = effect.isPercentage ? (effect.value / 100) : effect.value;
          this.player.speed = 5 * (1 + speedBonus);
          break;
        }
        case 'fireRate':
          // Apply fire rate multiplier (would need to modify shootTimer)
          break;
        case 'shield': {
          // Apply shield bonus
          const shieldBonus = effect.isPercentage ? (this.player.maxShield * effect.value / 100) : effect.value;
          this.player.shield = Math.min(this.player.maxShield + shieldBonus, this.player.shield + shieldBonus * this.deltaTime);
          break;
        }
        case 'health': {
          // Apply health regeneration
          const healthBonus = effect.isPercentage ? (this.player.maxHp * effect.value / 100) : effect.value;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + healthBonus * this.deltaTime);
          break;
        }
        case 'energy': {
          // Apply energy regeneration
          const energyBonus = effect.isPercentage ? (this.player.maxEnergy * effect.value / 100) : effect.value;
          this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + energyBonus * this.deltaTime);
          break;
        }
        case 'critChance': {
          // Apply crit chance bonus
          const critBonus = effect.isPercentage ? (effect.value / 100) : effect.value;
          this.player.critRate = 0.05 + critBonus;
          break;
        }
        case 'critDamage': {
          // Apply crit damage bonus
          const critDmgBonus = effect.isPercentage ? (effect.value / 100) : effect.value;
          this.player.critDmg = 2 + critDmgBonus;
          break;
        }
      }
    }
    
    // Check for combos
    const combos = POWERUP_COMBOS.filter(combo => 
      combo.requiredPowerUps.every(id => 
        this.powerUpManager.getActivePowerUps().some(p => p.id === id)
      )
    );
    
    // Apply combo effects (simplified - in real implementation would track active combos)
    for (const combo of combos) {
      for (const _effect of combo.bonusEffects) {
        // Apply combo effects similar to regular power-up effects
      }
    }
  }

  private updateFloatingTexts() {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= this.deltaTime;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  private updateWave() {
    this.waveTimer += this.deltaTime;
    if (this.enemies.length === 0 && !this.bossActive) {
      if (this.waveTimer > 2) {
        this.wave++;
        this.waveTimer = 0;
        this.spawnWave();
        
        // Level up every 3 waves
        if (this.wave % 3 === 0) {
          this.generateLevelChoices();
          this.state = 'levelup';
          this.onStateChange(this.state);
        }
      }
    }
  }

  // ============= RENDERING =============
  private render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Screen shake
    ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
      this.screenShake *= 0.9;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    // Background
    this.renderBackground(ctx, w, h);

    // Warp streaks while a wave announcement is on screen (Galaxy Force feel)
    if (this.state === 'playing') {
      this.renderWarpStreaks(ctx, w, h);
    }

    // Post-processing: edge glow effect
    if (this.state === 'playing' || this.state === 'levelup') {
      if (this.player.invincible > 0) {
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(255, 100, 100, ${0.8 + this.player.invincible * 0.5})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    if (this.state === 'menu') {
      this.renderMenu(ctx, w, h);
    } else if (this.state === 'gameover') {
      this.renderParticles(ctx);
      this.renderGameOver(ctx, w, h);
    } else if (this.state === 'levelup') {
      this.renderGame(ctx);
      this.renderLevelUp(ctx, w, h);
    } else {
      this.renderGame(ctx);
    }

    // Wave / level announcements (drawn on top of the game)
    this.renderAnnouncement(ctx, w, h);

    ctx.restore();
  }

  private renderBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Get current level and environment configuration
    const currentLevel = getLevelForPlayer(this.player.level);
    const envConfig = getEnvironmentForLevel(currentLevel);
    
    // Render environment using the new system
    renderEnvironment(ctx, w, h, envConfig, this.time);
  }

  private renderGame(ctx: CanvasRenderingContext2D) {
    this.renderCrystals(ctx);
    this.renderHazards(ctx);
    this.renderPowerOrbs(ctx);
    
    // Use WebGPU for particle rendering if available (overlay canvas)
    if (this.webgpuSupported && this.webgpuRenderer) {
      this.webgpuRenderer.render(this.particles, this.time);
    } else {
      this.renderParticles(ctx);
    }
    
    this.renderBullets(ctx);
    this.renderEnemies(ctx);
    this.renderPlayer(ctx);
    this.renderOptions(ctx);
    this.renderFloatingTexts(ctx);
    this.renderWeather(ctx);
    // Classic arcade run indicators + warp streaks (drawn under the React UI)
    this.renderRunIndicators(ctx, this.width, this.height);
    // NOTE: HUD and minimap are rendered by the React UI layer (App.tsx),
    // fed with real data via getGameStats() / getMinimapData().
  }

  private renderAnnouncement(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.waveAnnouncement) return;
    this.waveAnnouncement.timer -= this.deltaTime;
    if (this.waveAnnouncement.timer <= 0) {
      this.waveAnnouncement = null;
      return;
    }
    const alpha = Math.min(1, this.waveAnnouncement.timer);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.shadowColor = this.waveAnnouncement.color;
    ctx.shadowBlur = 20;
    ctx.fillStyle = this.waveAnnouncement.color;
    ctx.font = 'bold 32px monospace';
    ctx.fillText(this.waveAnnouncement.text, w / 2, h * 0.2);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '14px monospace';
    ctx.fillText(this.waveAnnouncement.subtext, w / 2, h * 0.2 + 30);
    ctx.restore();
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const ft of this.floatingTexts) {
      const alpha = ft.life / ft.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
  }

  private renderMinimap(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const mapSize = 100;
    const mapX = w - mapSize - 15;
    const mapY = h - mapSize - 15;
    const scale = mapSize / Math.max(w, h);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(mapX, mapY, mapSize, mapSize);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mapX, mapY, mapSize, mapSize);

    // Player dot
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(mapX + this.player.x * scale, mapY + this.player.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();

    // Enemy dots
    for (const e of this.enemies) {
      ctx.fillStyle = e.type === 'boss' ? '#ff00ff' : e.color;
      const size = e.type === 'boss' ? 4 : 2;
      ctx.beginPath();
      ctx.arc(mapX + e.x * scale, mapY + e.y * scale, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crystal dots
    for (const c of this.crystals) {
      ctx.fillStyle = c.color + '88';
      ctx.beginPath();
      ctx.arc(mapX + c.x * scale, mapY + c.y * scale, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Power orb dots
    for (const orb of this.powerOrbs) {
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(mapX + orb.x * scale, mapY + orb.y * scale, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderCrystals(ctx: CanvasRenderingContext2D) {
    for (const crystal of this.crystals) {
      ctx.save();
      ctx.translate(crystal.x, crystal.y);
      ctx.rotate(crystal.rotation);

      // Crystal glow
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, crystal.size * 1.5);
      glow.addColorStop(0, crystal.color + '44');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, crystal.size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Crystal body
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;
        const r = crystal.size * (i % 2 === 0 ? 1 : 0.7);
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fillStyle = crystal.color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff44';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }
  }

  private renderHazards(ctx: CanvasRenderingContext2D) {
    this.hazardsSystem.render(ctx);
  }

  private renderWeather(ctx: CanvasRenderingContext2D) {
    this.weatherSystem.render(ctx);
  }

  private renderPowerOrbs(ctx: CanvasRenderingContext2D) {
    for (const orb of this.powerOrbs) {
      const colors: { [key: string]: string } = {
        hp: '#00ff44',
        energy: '#ffaa00',
        shield: '#0088ff',
        score: '#ffff00',
        advanced_powerup: '#ff00ff',
        power: '#ffcc00',
        speed: '#00ffcc',
        bomb: '#ff4444',
        option: '#66ffff'
      };
      const color = colors[orb.type] || '#ffffff';
      const pulse = 1 + Math.sin(this.time * 6 + orb.x) * 0.3;

      // Magnetic pull visual when near player
      const dx = this.player.x - orb.x;
      const dy = this.player.y - orb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx.strokeStyle = color + '44';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(orb.x, orb.y);
        ctx.lineTo(this.player.x, this.player.y);
        ctx.stroke();
        ctx.setLineDash([]);
        // Accelerate toward player
        orb.vx += (dx / dist) * 0.5;
        orb.vy += (dy / dist) * 0.5;
      }

      // Outer glow with pulse
      const glowSize = orb.size * 2.5 * pulse;
      const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, glowSize);
      glow.addColorStop(0, color + 'aa');
      glow.addColorStop(0.5, color + '44');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.size * pulse, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Rotating ring
      ctx.strokeStyle = color + '88';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.size * 1.5, this.time * 3, this.time * 3 + Math.PI);
      ctx.stroke();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(orb.x - 2, orb.y - 2, orb.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Type icon
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      const icons: { [key: string]: string } = { 
        hp: '+', 
        energy: 'E', 
        shield: 'S', 
        score: '$',
        advanced_powerup: '★',
        power: 'P',
        speed: 'S',
        bomb: 'B',
        option: 'O'
      };
      ctx.fillText(icons[orb.type] || '?', orb.x, orb.y + 3);
    }
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Stasis effect - temporal distortion rings
    if (p.stasisActive) {
      for (let i = 0; i < 5; i++) {
        const radius = 25 + i * 12 + Math.sin(this.time * 4 + i) * 5;
        const alpha = 0.4 - i * 0.07;
        ctx.strokeStyle = `rgba(100, 200, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, this.time * 2 + i, this.time * 2 + i + Math.PI * 1.5);
        ctx.stroke();
      }
      // Clock-like ticks
      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 * i) / 12 + this.time;
        ctx.strokeStyle = 'rgba(150, 220, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 35, Math.sin(a) * 35);
        ctx.lineTo(Math.cos(a) * 45, Math.sin(a) * 45);
        ctx.stroke();
      }
    }

    // Outer glow
    const glowSize = 30 + Math.sin(this.time * 5) * 8;
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
    glow.addColorStop(0, 'rgba(0, 255, 255, 0.25)');
    glow.addColorStop(0.5, 'rgba(0, 100, 255, 0.1)');
    glow.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Invincibility flash
    if (p.invincible > 0 && Math.sin(this.time * 30) > 0) {
      ctx.globalAlpha = 0.5;
    }

    // Ship body
    const angle = Math.atan2(this.mouse.y - p.y, this.mouse.x - p.x);
    ctx.rotate(angle);

    // Ship wings
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-8, -14);
    ctx.lineTo(-4, -6);
    ctx.lineTo(-10, -4);
    ctx.lineTo(-6, 0);
    ctx.lineTo(-10, 4);
    ctx.lineTo(-4, 6);
    ctx.lineTo(-8, 14);
    ctx.closePath();
    
    const shipGrad = ctx.createLinearGradient(-10, -14, 20, 14);
    shipGrad.addColorStop(0, '#004488');
    shipGrad.addColorStop(0.5, '#00bbff');
    shipGrad.addColorStop(1, '#00ffff');
    ctx.fillStyle = shipGrad;
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Cockpit
    ctx.beginPath();
    ctx.ellipse(6, 0, 5, 3, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#88eeff';
    ctx.fill();

    // Engine glow
    const engineFlicker = Math.random() * 8;
    ctx.beginPath();
    ctx.moveTo(-6, -3);
    ctx.lineTo(-16 - engineFlicker, -2);
    ctx.lineTo(-16 - engineFlicker, 2);
    ctx.lineTo(-6, 3);
    ctx.closePath();
    ctx.fillStyle = `rgba(0, 150, 255, ${0.6 + Math.random() * 0.4})`;
    ctx.fill();

    ctx.restore();

    // Shield visual
    if (p.shield > 0) {
      const shieldAngle = Math.PI * 2 * (p.shield / p.maxShield);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22, this.time * 2, this.time * 2 + shieldAngle);
      ctx.strokeStyle = `rgba(0, 200, 255, ${0.4 + Math.sin(this.time * 3) * 0.2})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Auto-aim indicator for mobile
    if (this.isMobile && this.autoAimEnabled && this.mouseDown) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(this.mouse.x, this.mouse.y);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Target circle
      ctx.strokeStyle = 'rgba(255, 100, 100, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.mouse.x, this.mouse.y, 15, 0, Math.PI * 2);
      ctx.stroke();
      
      // Crosshair
      ctx.beginPath();
      ctx.moveTo(this.mouse.x - 20, this.mouse.y);
      ctx.lineTo(this.mouse.x + 20, this.mouse.y);
      ctx.moveTo(this.mouse.x, this.mouse.y - 20);
      ctx.lineTo(this.mouse.x, this.mouse.y + 20);
      ctx.stroke();
      
      ctx.restore();
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);

      // White hit flash — instant, readable damage feedback
      if (e.hitFlash && e.hitFlash > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, e.hitFlash / 0.09) * 0.85;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, e.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Glow
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, e.size * 2);
      glow.addColorStop(0, e.color + '44');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(-e.size * 2, -e.size * 2, e.size * 4, e.size * 4);

      if (e.type === 'boss') {
        // Cosmic horror boss with tendrils
        ctx.rotate(e.phase * 0.3);
        
        // Outer tendrils
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8 + e.phase * 0.2;
          const len = e.size * 1.3 + Math.sin(e.phase * 2 + i) * 15;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const cx1 = Math.cos(a + 0.3) * len * 0.6;
          const cy1 = Math.sin(a + 0.3) * len * 0.6;
          ctx.quadraticCurveTo(cx1, cy1, Math.cos(a) * len, Math.sin(a) * len);
          ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(e.phase + i) * 0.2})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Main body - morphing polygon
        ctx.rotate(e.phase * 0.2);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          const r = e.size + Math.sin(a * 3 + e.phase * 2) * 12 + Math.cos(a * 5 + e.phase) * 6;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        
        const bossGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, e.size);
        bossGrad.addColorStop(0, '#440066');
        bossGrad.addColorStop(0.6, '#220033');
        bossGrad.addColorStop(1, '#ff00ff');
        ctx.fillStyle = bossGrad;
        ctx.fill();
        ctx.strokeStyle = '#ff44ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Central eye
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        const eyeGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
        eyeGrad.addColorStop(0, '#ffffff');
        eyeGrad.addColorStop(0.3, '#ff00ff');
        eyeGrad.addColorStop(1, '#440044');
        ctx.fillStyle = eyeGrad;
        ctx.fill();

        // Pupil tracking player
        const toPlayerX = this.player.x - e.x;
        const toPlayerY = this.player.y - e.y;
        const toPlayerDist = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY) || 1;
        ctx.beginPath();
        ctx.arc((toPlayerX / toPlayerDist) * 4, (toPlayerY / toPlayerDist) * 4, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
      } else {
        ctx.rotate(e.phase);
        ctx.beginPath();
        ctx.moveTo(e.size, 0);
        ctx.lineTo(-e.size * 0.7, -e.size * 0.7);
        ctx.lineTo(-e.size * 0.7, e.size * 0.7);
        ctx.closePath();
        ctx.fillStyle = e.color;
        ctx.fill();
      }

      ctx.restore();

      // HP bar
      if (e.hp < e.maxHp) {
        ctx.fillStyle = '#333';
        ctx.fillRect(e.x - e.size, e.y - e.size - 10, e.size * 2, 4);
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x - e.size, e.y - e.size - 10, e.size * 2 * (e.hp / e.maxHp), 4);
      }
    }

    // Boss HP bar
    const boss = this.enemies.find(e => e.type === 'boss');
    if (boss) {
      const barWidth = this.width * 0.4;
      const barX = (this.width - barWidth) / 2;
      const barY = 60;
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, barY, barWidth, 12);
      const hpRatio = boss.hp / boss.maxHp;
      const hpGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
      hpGrad.addColorStop(0, '#ff00ff');
      hpGrad.addColorStop(1, '#ff0066');
      ctx.fillStyle = hpGrad;
      ctx.fillRect(barX, barY, barWidth * hpRatio, 12);
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, 12);
      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('VOID TITAN', this.width / 2, barY - 4);
    }
  }

  private renderBullets(ctx: CanvasRenderingContext2D) {
    for (const b of this.bullets) {
      ctx.save();
      ctx.translate(b.x, b.y);

      // Enemy bullets must ALWAYS stay visible (Anatomy of a Shmup rule):
      // a pulsing white outline keeps colored shots readable against any
      // background, explosion or nebula.
      if (b.type === 'enemy') {
        const pulse = 0.45 + 0.3 * Math.sin(this.time * 9 + b.x * 0.08 + b.y * 0.05);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(0, 0, b.size + 2.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Glow
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, b.size * 3);
      glow.addColorStop(0, b.color + 'aa');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(-b.size * 3, -b.size * 3, b.size * 6, b.size * 6);

      // Core
      ctx.beginPath();
      ctx.arc(0, 0, b.size, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();

      // Bright center
      ctx.beginPath();
      ctx.arc(0, 0, b.size * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const ratio = Math.max(0, Math.min(1, p.life / (p.maxLife || 1)));

      // Expanding shockwave ring (Canvas2D fallback for the GPU ring mode)
      if (p.type === 'ring') {
        const progress = 1 - ratio;
        const radius = Math.max(1, p.size * (0.15 + 0.85 * progress));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = ratio * 0.9;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1 + 4 * ratio;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        continue;
      }

      // Sparks/energy/trails: additive blending so light accumulates and the
      // playfield (bullets, ships) stays readable through dense explosions.
      const additive =
        p.type === 'spark' || p.type === 'energy' || p.type === 'trail';

      if (additive) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(1, ratio * 1.4);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * (0.4 + 0.6 * ratio)), 0, Math.PI * 2);
        ctx.fill();
        // Bright core
        ctx.globalAlpha = Math.min(1, ratio);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.3, p.size * 0.35 * ratio), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.globalAlpha = ratio;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.size * ratio), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private renderHUD(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const p = this.player;
    const padding = 20;

    // HP Bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(padding, h - 60, 200, 16);
    const hpGrad = ctx.createLinearGradient(padding, 0, padding + 200, 0);
    hpGrad.addColorStop(0, '#00ff44');
    hpGrad.addColorStop(1, '#00aa22');
    ctx.fillStyle = hpGrad;
    ctx.fillRect(padding, h - 60, 200 * (p.hp / p.maxHp), 16);
    ctx.strokeStyle = '#00ff44';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, h - 60, 200, 16);
    ctx.fillStyle = '#fff';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP ${Math.ceil(p.hp)}/${p.maxHp}`, padding + 4, h - 49);

    // Shield Bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(padding, h - 40, 200, 12);
    ctx.fillStyle = '#0088ff';
    ctx.fillRect(padding, h - 40, 200 * (p.shield / p.maxShield), 12);
    ctx.strokeStyle = '#0088ff';
    ctx.strokeRect(padding, h - 40, 200, 12);

    // Energy Bar
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(padding, h - 24, 200, 10);
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(padding, h - 24, 200 * (p.energy / p.maxEnergy), 10);
    ctx.strokeStyle = '#ffaa00';
    ctx.strokeRect(padding, h - 24, 200, 10);

    // Score & Wave
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`SCORE: ${p.score.toLocaleString()}`, w - padding, 30);
    ctx.font = '14px monospace';
    ctx.fillText(`WAVE ${this.wave}`, w - padding, 50);

    // Combo
    if (p.combo > 1) {
      ctx.fillStyle = `rgba(255, 200, 0, ${0.5 + Math.sin(this.time * 5) * 0.5})`;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${p.combo}x COMBO`, w / 2, 30);
    }

    // FPS & Stats
    ctx.fillStyle = this.fps >= 50 ? '#00ff00' : this.fps >= 30 ? '#ffff00' : '#ff0000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${this.fps}`, padding, 20);
    ctx.fillText(`SEED: ${this.seed}`, padding, 32);
    ctx.fillText(`ENTITIES: ${this.enemies.length + this.bullets.length + this.particles.length}`, padding, 44);
    
    // WebGPU indicator
    if (this.webgpuSupported) {
      ctx.fillStyle = '#00ff88';
      ctx.fillText('WebGPU ACTIVE', padding, 56);
      ctx.fillText(`Particles: ${this.particles.length}`, padding, 68);
    } else {
      ctx.fillStyle = '#ffaa00';
      ctx.fillText('Canvas2D Fallback', padding, 56);
    }

    // Secondary weapon indicator
    if (p.secondaryWeapon !== 'none') {
      ctx.fillStyle = p.secondaryCooldown > 0 ? '#666' : '#00ffff';
      ctx.font = '12px monospace';
      ctx.textAlign = 'right';
      const weaponName = p.secondaryWeapon === 'gravity' ? '🌀 GRAVITY' : p.secondaryWeapon === 'chain' ? '⚡ CHAIN' : '⏸️ STASIS [Q]';
      ctx.fillText(weaponName, w - padding, h - 40);
      if (p.secondaryCooldown > 0) {
        ctx.fillText(`${p.secondaryCooldown.toFixed(1)}s`, w - padding, h - 25);
      }
    }

    // Speed gauge
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    const maxSpeed = 15;
    const speedRatio = Math.min(speed / maxSpeed, 1);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(w - 150, h - 60, 120, 8);
    const speedGrad = ctx.createLinearGradient(w - 150, 0, w - 30, 0);
    speedGrad.addColorStop(0, '#00ff88');
    speedGrad.addColorStop(0.5, '#ffff00');
    speedGrad.addColorStop(1, '#ff4400');
    ctx.fillStyle = speedGrad;
    ctx.fillRect(w - 150, h - 60, 120 * speedRatio, 8);
    ctx.strokeStyle = '#00ff88';
    ctx.strokeRect(w - 150, h - 60, 120, 8);
    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('SPEED', w - 35, h - 50);

    // Dash cooldown
    if (p.dashCooldown > 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`DASH: ${p.dashCooldown.toFixed(1)}s`, w / 2, h - 20);
    } else {
      ctx.fillStyle = 'rgba(0,255,255,0.8)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('DASH READY [SPACE]', w / 2, h - 20);
    }

    // Wave announcement
    if (this.waveAnnouncement) {
      this.waveAnnouncement.timer -= this.deltaTime;
      if (this.waveAnnouncement.timer <= 0) {
        this.waveAnnouncement = null;
      } else {
        const alpha = Math.min(1, this.waveAnnouncement.timer);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.shadowColor = this.waveAnnouncement.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.waveAnnouncement.color;
        ctx.font = 'bold 32px monospace';
        ctx.fillText(this.waveAnnouncement.text, w / 2, h * 0.2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '14px monospace';
        ctx.fillText(this.waveAnnouncement.subtext, w / 2, h * 0.2 + 30);
        ctx.restore();
      }
    }
  }

  private renderMenu(ctx: CanvasRenderingContext2D, w: number, h: number) {
    this.renderParticles(ctx);

    ctx.save();
    ctx.textAlign = 'center';

    // Title
    const titleY = h * 0.3;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 48px monospace';
    ctx.fillText('ATHERIA', w / 2, titleY);
    ctx.shadowBlur = 15;
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#ff00ff';
    ctx.fillText('VOID BREAKER', w / 2, titleY + 40);
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '14px monospace';
    ctx.fillText('A WebGPU Cosmic-Horror Rogue-Lite', w / 2, titleY + 70);

    // Start button
    const btnY = h * 0.55;
    const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('[ CLICK TO BEGIN ]', w / 2, btnY);

    // Controls
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px monospace';
    ctx.fillText('WASD / Arrows - Move', w / 2, h * 0.7);
    ctx.fillText('Mouse - Aim & Shoot', w / 2, h * 0.7 + 20);
    ctx.fillText('Space - Dash (i-frames)', w / 2, h * 0.7 + 40);
    ctx.fillText('Right Click - Secondary Weapon', w / 2, h * 0.7 + 60);
    ctx.fillText('Q - Temporal Stasis', w / 2, h * 0.7 + 80);

    // High score
    if (this.highScore > 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '14px monospace';
      ctx.fillText(`HIGH SCORE: ${this.highScore.toLocaleString()}`, w / 2, h * 0.88);
    }

    // WebGPU status
    ctx.fillStyle = this.webgpuSupported ? '#00ff88' : '#ff8800';
    ctx.font = '12px monospace';
    ctx.fillText(this.webgpuSupported ? '● WebGPU ACTIVE - GPU Accelerated' : '● Canvas2D Mode', w / 2, h * 0.95);

    ctx.restore();

    // Animated vortex in background
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
      const radius = 100 + i * 40 + Math.sin(this.time + i) * 20;
      const startAngle = this.time * 0.5 + i * 0.5;
      ctx.strokeStyle = i % 2 === 0 ? '#00ffff' : '#ff00ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, radius, startAngle, startAngle + Math.PI * 1.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Menu particles - vortex effect
    if (Math.random() < 0.5) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 150;
      this.particles.push({
        x: w / 2 + Math.cos(angle) * dist,
        y: h / 2 + Math.sin(angle) * dist,
        vx: -Math.cos(angle) * 3, vy: -Math.sin(angle) * 3,
        life: 2.5, maxLife: 2.5, size: 2 + Math.random() * 2,
        color: Math.random() < 0.5 ? '#00ffff' : '#ff00ff',
        type: 'energy'
      });
    }
  }

  private renderLevelUp(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Animated background overlay. The upgrade cards themselves are rendered
    // by the React LevelUpScreen / LevelUpChoiceScreen components.
    const overlay = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    overlay.addColorStop(0, 'rgba(0, 20, 40, 0.85)');
    overlay.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, w, h);

    // Animated rings
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 3; i++) {
      const radius = 150 + i * 50 + Math.sin(this.time * 2 + i) * 20;
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, radius, this.time + i, this.time + i + Math.PI * 1.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 32px monospace';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillText('IZBERI NADGRADNJO', w / 2, h * 0.2);
    ctx.shadowBlur = 0;
  }

  private renderGameOver(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Dark overlay backdrop. Full stats are rendered by the React GameOverScreen.
    const overlay = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    overlay.addColorStop(0, 'rgba(20, 0, 0, 0.85)');
    overlay.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    
    // Title with glitch effect
    ctx.fillStyle = '#ff0044';
    ctx.font = 'bold 42px monospace';
    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 20;
    ctx.fillText('VOID CONSUMED', w / 2, h * 0.25);
    ctx.shadowBlur = 0;
  }

  startLoop() {
    this.lastTime = performance.now();
    this.animFrame = requestAnimationFrame((t) => this.update(t));
  }

  stopLoop() {
    cancelAnimationFrame(this.animFrame);
  }

  getState(): GameState { return this.state; }
  getPlayer(): Player { return this.player; }
  getWave(): number { return this.wave; }
  getFPS(): number { return this.fps; }
  getPlayerLevel(): number { return this.player.level; }
  getPlayerXP(): number { return this.player.xp; }
  getPlayerXPToNext(): number { return this.player.xpToNextLevel; }
  getHighScore(): number { return this.highScore; }
  getSeed(): string { return this.seed; }
  getGameStartTime(): number { return this.gameStartTime; }
  isWebGPUSupported(): boolean { return this.webgpuSupported; }

  /** Current level-up upgrade choices (for 'levelup' and 'levelchoice' states). */
  getLevelChoices(): Upgrade[] { return this.levelChoices; }

  /** Aggregated, real run statistics for the React UI. */
  getGameStats(): GameStats {
    const boss = this.enemies.find(e => e.type === 'boss');
    return {
      score: this.player.score,
      wave: this.wave,
      enemiesKilled: this.enemiesKilled,
      bossKills: this.bossKills,
      totalDamage: Math.floor(this.totalDamageDealt),
      survivalTime: Math.floor(this.gameTime),
      maxCombo: this.maxCombo,
      combo: this.player.combo,
      enemiesRemaining: this.enemies.length,
      totalWaveEnemies: this.waveTotalEnemies,
      isBossWave: this.wave % 5 === 0,
      bossPresent: !!boss,
      gold: this.gold,
      fps: this.fps,
      seed: this.seed,
      gameStartTime: this.gameStartTime,
      shotsFired: this.shotsFired,
      hitsLanded: this.hitsLanded,
      damageTaken: Math.floor(this.damageTaken),
      itemsCollected: this.itemsCollected,
      webgpuSupported: this.webgpuSupported,
      playerLevel: this.player.level,
      playerXp: this.player.xp,
      xpToNext: this.player.xpToNextLevel
    };
  }

  /** Live data for the minimap. */
  getMinimapData(): MinimapData {
    return {
      playerX: this.player.x,
      playerY: this.player.y,
      enemies: this.enemies.map(e => ({ x: e.x, y: e.y, type: e.type })),
      worldWidth: this.width,
      worldHeight: this.height
    };
  }

  // Advanced system getters (merged from webgpu-online-games-51d72)
  getWeatherSystem(): WeatherSystem { return this.weatherSystem; }
  getHazardsSystem(): EnvironmentalHazardsSystem { return this.hazardsSystem; }
  getPowerUpManager(): PowerUpManager { return this.powerUpManager; }

  setWeather(type: WeatherType, intensity: number = 1.0, duration: number = 60): void {
    this.weatherSystem.setWeather(type, intensity, duration);
  }

  addHazard(
    type: 'toxic_cloud' | 'electric_field' | 'fire_zone' | 'ice_zone' | 'gravity_well',
    x: number,
    y: number,
    radius: number,
    damage: number,
    duration: number
  ): string {
    return this.hazardsSystem.addHazard(type, x, y, radius, damage, duration);
  }

  addPowerUp(powerUpId: string): void {
    this.powerUpManager.addPowerUp(powerUpId);
  }

  destroy() {
    this.stopLoop();
    this.audio.dispose();
    if (this.webgpuRenderer) {
      this.webgpuRenderer.dispose();
    }
  }
}
