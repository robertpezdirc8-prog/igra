import { AudioEngine } from './audio';
import { ProceduralAudioSystem } from './audioSystem';
import { MusicEngine } from './musicEngine';
import { WebGPURenderer } from './webgpu-renderer';
import { getLevelForPlayer } from './levels';
import { getEnvironmentForLevel, renderEnvironment } from './environment';
import { DifficultyMode } from './difficulty';
import { SkillBonuses, defaultSkillBonuses } from './skillTree';
import { WeatherSystem, EnvironmentalHazardsSystem, WeatherType } from './weatherSystem';
import { AdvancedEnemyAI, BossAI, FormationSystem } from './enemyAI';
import { PowerUpManager, ADVANCED_POWERUPS, POWERUP_COMBOS } from './advancedPowerups';
import { getWavePlan, pickEnemyType, WavePlan } from './levelCurve';

// ============= TYPES =============
interface Vec2 { x: number; y: number; }
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  color: string; type: 'spark' | 'trail' | 'debris' | 'energy' | 'orb' | 'ring' | 'smoke';
}
interface Bullet {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; damage: number;
  life: number; type: 'player' | 'enemy';
  chainLeft?: number; chainDamage?: number;
  grazed?: boolean;
  // Homing steering strength (Raiden II plasma, Gradius missiles): the
  // velocity bends toward the nearest living enemy every frame.
  homing?: number;
  // Piercing shots keep flying through enemies (Gradius LASER, wave cannon)
  pierceLeft?: number; pierceHits?: Set<Enemy>;
  // Elongated beam/missile rendering aligned to the travel direction
  capsule?: boolean; wave?: boolean;
  // Solid-fuel rocket: metallic body art + smoke trail (Gradius RAKETA)
  missile?: boolean; trailT?: number; lastAng?: number;
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
  // Vertical-scroller fly-bys (Raiden/Strikers attacking waves): a diving
  // enemy commits to a downward strafing run and re-enters from the top.
  diving?: boolean; diveCd?: number;
  // Boss visual identity (cycles horror → skull → station; mid-boss = carrier)
  variant?: 'horror' | 'skull' | 'station' | 'carrier';
  // Core-breach death choreography: while dying is defined the boss stops
  // fighting and burns through a chain of explosions before the final blast.
  dying?: number;
  deathTick?: number;
  // Elite affix (Vampire Survivors style): a few non-boss enemies spawn
  // modified — bigger, meaner and far more rewarding.
  elite?: EliteAffix;
  // Mid-boss (sector vanguard): a carrier-class mini-boss guarding the
  // middle of each sector; withdraws after 15 s if not destroyed.
  midBoss?: boolean;
  retreat?: boolean;
}

type EliteAffix = 'armored' | 'swift' | 'menace' | 'gilded' | 'elder';
interface EliteAffixDef {
  tag: string;      // displayed spawn tag (icon + Slovenian name)
  color: string;    // aura + tag color
  hpMul: number; speedMul: number; fireMul: number; goldMul: number;
  minSector: number; // gated by sector for a fair ramp
}
interface Player {
  x: number; y: number; vx: number; vy: number;
  hp: number; maxHp: number; shield: number; maxShield: number;
  energy: number; maxEnergy: number;
  speed: number; dashCooldown: number; dashTimer: number;
  invincible: number; shootTimer: number;
  weaponLevel: number; critRate: number; critDmg: number;
  // Weapon evolution: at level 8+ the primary weapon once transforms into
  // its VOID RIFT form (extra barrels, hotter damage, magenta profile).
  weaponEvolved: boolean;
  score: number; combo: number; comboTimer: number;
  secondaryWeapon: 'none' | 'gravity' | 'chain' | 'temporal';
  secondaryCooldown: number;
  stasisActive: boolean; stasisTimer: number;
  // Classic arcade stock (Raiden/Gradius style)
  bombs: number; maxBombs: number;
  options: number; // companion drones, max 3
  // System 16 arcade systems: Gradius power meter (0..6 capsules) and the
  // Gradius shield that fully absorbs 3 discrete hits.
  gradiusMeter: number; arcadeShield: number;
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
  type: 'hp' | 'energy' | 'shield' | 'score' | 'advanced_powerup' | 'power' | 'speed' | 'bomb' | 'option' | 'capsule' | 'plasma' | 'medal';
  life: number; size: number;
  powerUpId?: string;
}
interface LeaderboardEntry {
  score: number; wave: number; seed: string; date: string;
}
interface Crystal {
  x: number; y: number; size: number; hp: number; maxHp: number;
  rotation: number; rotSpeed: number; color: string; dark: string;
  driftX: number;   // personal horizontal drift (px/s)
  speedMul: number; // personal scroll multiplier — rocks arrive at mixed speeds
  shape: number[];  // per-vertex radius jitter → irregular rocky silhouette
  frag?: boolean;   // split child — burns up on exit, never re-enters the stream
}

// Real space-rock palette (light face / dark side) — gray-brown, not neon.
const ASTEROID_PALETTE: ReadonlyArray<{ light: string; dark: string }> = [
  { light: '#9a8d7c', dark: '#463c33' },
  { light: '#7d7469', dark: '#38312a' },
  { light: '#8b7463', dark: '#41312a' },
  { light: '#6e6a66', dark: '#302c29' },
  { light: '#a09183', dark: '#50453a' }
];
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
  private music = new MusicEngine();
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
  // Forward-flight world scroll (px/s): rocks, stars and enemies stream
  // downward past the ship so the run feels like flying into the void.
  private worldScroll = 0;
  // Classic arcade timers
  private bombCooldown = 0;
  private optionTimer = 0;
  // System 16 arcade legends II: R-Type wave cannon, Raiden II plasma,
  // Gradius temporary slots, DoDonPachi medal chain.
  private waveCharging = false;
  private waveCharge = 0;
  private plasmaTimer = 0;
  private doubleTimer = 0;
  private laserTimer = 0;
  private missileTimer = 0;
  private missileVolleyTimer = 0;
  private medalChain = 0;
  private medalChainTimer = 0;
  // Sector system: every 5 waves = one named sector with a boss finale,
  // a fair difficulty budget and a Raiden-DX-style clear tally.
  private sectorTally: { lines: Array<{ label: string; value: number }>; timer: number; shown: number } | null = null;
  private sectorDamage = 0;
  private sectorMedals = 0;
  private waveDamage = 0;
  private medalStreak = 0;
  // Invisible adaptive assist: bullet pressure eases off when the player is
  // getting hammered and cruises when they are untouched (rubber-banding).
  private damageLog: number[] = [];
  private assistMul = 1;
  private static readonly MEDAL_VALUES = [100, 200, 400, 800, 1600, 3200, 6400, 10000];
  // Sector identity — Gradius stage names with a mood tint per sector.
  private static readonly SECTORS: ReadonlyArray<{ name: string; subtitle: string; tint: string }> = [
    { name: 'PREDSTRAŽA', subtitle: 'mejni nadzor', tint: 'rgba(64,255,255,0.045)' },
    { name: 'ASTEROIDNA POLJA', subtitle: 'gost skalnat pas', tint: 'rgba(255,170,80,0.05)' },
    { name: 'ZAVESA MEGLENICE', subtitle: 'pas ionskih neviht', tint: 'rgba(180,100,255,0.055)' },
    { name: 'OLUPKOVNA FLOTA', subtitle: 'opuščena armada', tint: 'rgba(255,110,110,0.05)' },
    { name: 'CITADELA PRAZNINE', subtitle: 'sovražnikova trdnjava', tint: 'rgba(255,60,130,0.055)' },
  ];
  // Elite affix table (Vampire Survivors / 10 Minutes Till Dawn lesson:
  // rare modified enemies create spike moments and jackpot rewards).
  private static readonly MID_BOSS_LETTERS = ['ALFA', 'BETA', 'GAMA'] as const;

  private static readonly ELITE_AFFIXES: Readonly<Record<EliteAffix, EliteAffixDef>> = {
    armored: { tag: '🛡 OKLEPEN',  color: '#d8e8ff', hpMul: 1.8, speedMul: 0.85, fireMul: 1.0, goldMul: 3, minSector: 1 },
    swift:   { tag: '⚡ HITRI',    color: '#66ffff', hpMul: 1.2, speedMul: 1.35, fireMul: 1.0, goldMul: 2.5, minSector: 1 },
    menace:  { tag: '💀 NEVAREN', color: '#ff5566', hpMul: 1.3, speedMul: 1.0,  fireMul: 1.6, goldMul: 2.5, minSector: 2 },
    gilded:  { tag: '💎 ZLATEN',  color: '#ffd700', hpMul: 1.15, speedMul: 1.0, fireMul: 1.0, goldMul: 6, minSector: 2 },
    elder:   { tag: '👁 STAREŠINA', color: '#cc66ff', hpMul: 2.2, speedMul: 0.95, fireMul: 1.2, goldMul: 4, minSector: 3 },
  };
  private elitesThisWave = 0;
  private static readonly GRADIUS_SLOTS: readonly string[] = ['HITRO', 'RAKETA', 'DVOJNIK', 'LASER', 'OPCIJA', 'ŠČIT'];
  private upgrades: Upgrade[] = [];
  private highScore = 0;
  // Offline hall of fame: top-10 runs
  private leaderboard: LeaderboardEntry[] = [];
  private animFrame = 0;
  private stars: {
    x: number; y: number; z: number; brightness: number;
    color: string; tw: number; twFreq: number;
  }[] = [];
  // Accumulated starfield scroll (px): stars stream faster than the world
  // for parallax and accelerate with the wave ramp — the "warp" feel.
  private starScroll = 0;
  private webgpuSupported = false;
  private onStateChange: (state: GameState) => void;
  private waveAnnouncement: WaveAnnouncement | null = null;
  // Gradius-style WARNING phase: the klaxon takes the stage BEFORE the
  // boss spawns (the boss enters only once the siren dies down).
  private bossPending = false;
  private bossWarningTimer = 0;
  private klaxonTimer = 0;
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
  /** Relative drag (Phoenix 2 standard): ship anchor at touchstart + the
   *  finger's total delta — no acceleration, no deadzone, no snap. */
  private mobileDragBase: Vec2 | null = null;
  private mobileDragTarget: Vec2 | null = null;
  private static readonly MOBILE_DRAG_SENSITIVITY = 1.2;
  // Gamepad (Bullet-Heaven-2 lesson: more control schemes = more players)
  private gamepadPrev: boolean[] = [];
  private gamepadFire = false;
  private gamepadMove: Vec2 = { x: 0, y: 0 };
  // Boss identity: horror → skull → station cycle
  private bossVariant: 'horror' | 'skull' | 'station' = 'horror';
  // Greek suffix of the sector's mid-boss (PREDSTRAŽA-ALFA/BETA/GAMA)
  private midBossLetter = 'ALFA';
  // Damaged-ship FX throttle (smoke/fire trail cadence)
  private damageFxT = 0;
  private isMobile = false;
  // Master mute + the last applied user volumes (so unmute restores them).
  private muted = false;
  private lastAudio = { music: 0.5, sfx: 0.6 };
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
    // ── Auto-pause when the tab/app goes hidden ──
    // Incoming call, app switch, lock screen: the fight pauses itself
    // instead of letting the player die off-screen. (rAF already stops
    // while hidden; this guarantees a clean PAUSED menu on return.)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = () => {
    if (document.hidden && this.state === 'playing') this.pause();
  };

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
    // Realistic stellar palette: most stars white, a few warm (K/M class)
    // and a few blue-white (hot O/B class) — a night sky, not a snowstorm.
    const palette = ['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffe9c8', '#cfe0ff', '#ffd9b0'];
    for (let i = 0; i < 260; i++) {
      this.stars.push({
        x: Math.random() * 2200 - 1100,
        y: Math.random() * 2200 - 1100,
        z: Math.random() * 3 + 0.5,
        brightness: Math.random(),
        color: palette[Math.floor(Math.random() * palette.length)],
        tw: Math.random() * Math.PI * 2,
        twFreq: 2 + Math.random() * 5
      });
    }
  }

  private loadHighScore() {
    try {
      this.highScore = parseInt(localStorage.getItem('atheria_highscore') || '0');
      const raw = localStorage.getItem('atheria_leaderboard');
      if (raw) this.leaderboard = JSON.parse(raw) as LeaderboardEntry[];
    } catch { this.highScore = 0; }
  }

  /** Record the finished run in the offline top-10 hall of fame. */
  private recordLeaderboard() {
    try {
      this.leaderboard.push({
        score: this.player.score,
        wave: this.wave,
        seed: this.seed,
        date: new Date().toLocaleDateString('sl-SI')
      });
      this.leaderboard.sort((a, b) => b.score - a.score);
      this.leaderboard = this.leaderboard.slice(0, 10);
      localStorage.setItem('atheria_leaderboard', JSON.stringify(this.leaderboard));
    } catch { /* storage unavailable */ }
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
      weaponEvolved: false,
      score: 0, combo: 1, comboTimer: 0,
      secondaryWeapon: 'none',
      secondaryCooldown: 0,
      stasisActive: false, stasisTimer: 0,
      bombs: 2, maxBombs: 5,
      options: 0,
      gradiusMeter: 0, arcadeShield: 0,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      totalXp: 0
    };
  }

  private generateUpgrades() {
    this.upgrades = [
      { name: 'Napolnjena plazma', description: '+25% škode, +1 nivo orožja', icon: '⚡', apply: (p) => { p.weaponLevel++; } },
      { name: 'Nevronski refleksi', description: '+15% hitrosti premikanja', icon: '🧠', apply: (p) => { p.speed *= 1.15; } },
      { name: 'Ščit praznine', description: '+30 max ščita, polna obnova', icon: '🛡️', apply: (p) => { p.maxShield += 30; p.shield = p.maxShield; } },
      { name: 'Temporalno jedro', description: '+25 max energije, hitrejša regeneracija', icon: '⏱️', apply: (p) => { p.maxEnergy += 25; } },
      { name: 'Kritična matrika', description: '+10% kritičnosti, +50% kritične škode', icon: '💀', apply: (p) => { p.critRate += 0.1; p.critDmg += 0.5; } },
      { name: 'Bio-rekonstrukcija', description: '+30 max HP, polno zdravljenje', icon: '❤️', apply: (p) => { p.maxHp += 30; p.hp = p.maxHp; } },
      { name: 'Razcepljena plazma', description: 'Izstrelki se razcepijo na 3', icon: '🔱', apply: (p) => { p.weaponLevel += 2; } },
      { name: 'Gravitacijski vrtinec', description: 'Odkleni gravitacijsko sekundarno orožje', icon: '🌀', apply: (p) => { p.secondaryWeapon = 'gravity'; } },
      { name: 'Verižna molnja', description: 'Odkleni verižno sekundarno orožje', icon: '⚡', apply: (p) => { p.secondaryWeapon = 'chain'; } },
      { name: 'Temporalna staza', description: 'Odkleni zaustavitev časa', icon: '⏸️', apply: (p) => { p.secondaryWeapon = 'temporal'; } },
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
    this.music.start();
  }

  // ============= PUBLIC CONTROL API =============
  // The engine is the single source of truth for game state. The React UI
  // calls these methods instead of maintaining a parallel game state.

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.onStateChange(this.state);
    this.music.stop();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.onStateChange(this.state);
    this.music.start();
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
    this.music.setBossMode(false);
    this.music.start();
  }

  /** Apply the upgrade at the given index of the current level-up choices. */
  /** Weapon evolution (rogue-lite milestone): the moment the primary
   *  weapon reaches level 8 it once transforms into its VOID RIFT form —
   *  permanent extra barrels + hotter damage, with a proper reveal. */
  private checkWeaponEvolution() {
    const p = this.player;
    if (p.weaponEvolved || p.weaponLevel < 8) return;
    p.weaponEvolved = true;
    this.floatingTexts.push({
      x: p.x, y: p.y - 64,
      text: '\u26A1 EVOLUCIJA: VOID RIFT \u26A1', color: '#ff66ff',
      life: 2.4, maxLife: 2.4, vy: -0.7
    });
    this.particles.push({
      x: p.x, y: p.y, vx: 0, vy: 0,
      life: 0.8, maxLife: 0.8, size: 160, color: '#ff66ff', type: 'ring'
    });
    this.screenShake = Math.max(this.screenShake, 10);
    this.audio.playPowerUp();
  }

  chooseUpgrade(index: number) {
    if (this.state !== 'levelup' && this.state !== 'levelchoice') return;
    const upgrade = this.levelChoices[index];
    if (!upgrade) return;
    upgrade.apply(this.player);
    this.checkWeaponEvolution();
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
  applySettings(settings: { musicVolume: number; sfxVolume: number; particles: 'low' | 'medium' | 'high'; touchSensitivity?: number }) {
    this.lastAudio = { music: settings.musicVolume, sfx: settings.sfxVolume };
    if (!this.muted) {
      this.audio.setVolumes(settings.musicVolume, settings.sfxVolume);
      this.music.setVolume(settings.musicVolume);
      // Procedural SFX carry most game sounds (shots, explosions, pickups)
      // but were never wired to the SFX slider — fixed: map 0..1 → 0..0.3.
      this.proceduralAudio.setVolume(settings.sfxVolume * 0.3);
    }
    this.particleScale = settings.particles === 'low' ? 0.25 : settings.particles === 'medium' ? 0.6 : 1;
    // Bloom is a full-screen post pass — skip it at low particle quality.
    this.webgpuRenderer?.setBloomEnabled(settings.particles !== 'low');
    if (typeof settings.touchSensitivity === 'number') {
      this.setMobileDragSensitivity(settings.touchSensitivity);
    }
  }

  /** Unlock all three audio systems after the first user gesture.
   *  iOS/Safari create suspended contexts at page load and ignore
   *  resumes outside gestures, so this must be called from one. */
  resumeAudio() {
    this.audio.resume();
    this.proceduralAudio.resume();
    // MusicEngine.start() is idempotent: re-kicks the scheduler AND
    // resumes a suspended context (menu music started before the gesture).
    this.music.start();
  }

  /** Master mute — silences all three audio systems while keeping the
   *  user's volume sliders intact for unmute. */
  setMuted(m: boolean) {
    this.muted = m;
    if (m) {
      this.audio.setVolumes(0, 0);
      this.music.setVolume(0);
      this.proceduralAudio.setVolume(0);
    } else {
      this.audio.setVolumes(this.lastAudio.music, this.lastAudio.sfx);
      this.music.setVolume(this.lastAudio.music);
      this.proceduralAudio.setVolume(this.lastAudio.sfx * 0.3);
    }
  }

  getMuted(): boolean {
    return this.muted;
  }

  // ============= MOBILE INPUT =============
  // Player-tunable drag gain (settings slider) on top of the 1.2 base.
  private mobileDragSensitivity = GameEngine.MOBILE_DRAG_SENSITIVITY;

  /** Drag sensitivity multiplier from the settings slider (clamped ×0.5–×2.5). */
  setMobileDragSensitivity(mul: number) {
    this.mobileDragSensitivity = Math.max(0.5, Math.min(2.5, mul));
  }

  setMobileMove(x: number, y: number) {
    this.mobileMove.x = Math.max(-1, Math.min(1, x));
    this.mobileMove.y = Math.max(-1, Math.min(1, y));
  }

  setMobileShooting(active: boolean) {
    this.mobileShooting = active;
    if (active) this.isMobile = true;
  }

  /** Touch-capable device → canvas HUD switches to the touch dialect
   *  (no keyboard key hints, bomb stock moved off the button stack).
   *  Also lets auto-aim engage from frame one, not just after the
   *  first shoot(true) call set isMobile incidentally. */
  setMobileMode(active: boolean) {
    this.isMobile = active;
  }

  /** Relative drag — touchstart: remember where the ship is now.
   *  The ship never jumps to the finger; it keeps its offset. */
  beginMobileDrag() {
    this.mobileDragBase = { x: this.player.x, y: this.player.y };
    this.mobileDragTarget = { x: this.player.x, y: this.player.y };
    this.mobileMove.x = 0;
    this.mobileMove.y = 0;
  }

  /** Relative drag — touchmove: ship = anchor + finger delta (scaled).
   *  Direct target-follow each frame ⇒ zero perceived latency. */
  updateMobileDrag(dxPx: number, dyPx: number) {
    if (!this.mobileDragBase) return;
    const s = this.mobileDragSensitivity;
    this.mobileDragTarget = {
      x: Math.max(20, Math.min(this.width - 20, this.mobileDragBase.x + dxPx * s)),
      y: Math.max(20, Math.min(this.height - 20, this.mobileDragBase.y + dyPx * s)),
    };
  }

  /** Relative drag — touchend: hand control back to physics cleanly. */
  endMobileDrag() {
    this.mobileDragBase = null;
    this.mobileDragTarget = null;
    this.mobileMove.x = 0;
    this.mobileMove.y = 0;
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
      this.floatingTexts.push({ x: p.x, y: p.y - 40, text: 'PROTIBOMBA!', color: '#ffdd66', life: 1.4, maxLife: 1.4, vy: -1.2 });
    } else {
      this.floatingTexts.push({ x: p.x, y: p.y - 40, text: 'BOMBA!', color: '#ff8866', life: 1, maxLife: 1, vy: -1.2 });
    }
    this.audio.playExplosion();
    this.proceduralAudio.playExplosion();
  }

  mobileSecondary() {
    if (this.state === 'playing') this.useSecondaryWeapon();
  }

  // ============= SYSTEM 16 ARCADE LEGENDS II =============

  /** R-Type wave cannon: hold to charge (V key / VALOVEC button). */
  mobileWaveStart() {
    if (this.state === 'playing') this.waveCharging = true;
  }

  /** Release fires the charged wave cannon shot. */
  mobileWaveEnd() {
    this.releaseWaveCharge();
  }

  /** Gradius power meter: spend the lit slot (C key / GRAD button). */
  mobileGradius() {
    this.activateGradiusUpgrade();
  }

  private releaseWaveCharge() {
    if (!this.waveCharging) return;
    this.waveCharging = false;
    const c = this.waveCharge;
    this.waveCharge = 0;
    if (c >= 0.2) {
      this.fireWaveCannon(c);
    } else if (this.state === 'playing') {
      // Released too early: the charge fizzles out
      this.floatingTexts.push({ x: this.player.x, y: this.player.y - 30, text: 'PREMALO NABOJA', color: '#8899aa', life: 0.7, maxLife: 0.7, vy: -1 });
    }
  }

  /** R-Type wave cannon blast: piercing capsule beam that grows with charge. */
  private fireWaveCannon(charge: number) {
    const p = this.player;
    // Wave cannon fires straight up, same fixed battery as the main gun.
    const dx = 0;
    const dy = -1;
    const d = 1;
    const dmgMul = this.skillBonuses.damageMul * (this.difficulty?.playerDamageMultiplier ?? 1);
    this.bullets.push({
      x: p.x + (dx / d) * 24, y: p.y + (dy / d) * 24,
      vx: (dx / d) * 15, vy: (dy / d) * 15,
      size: 9 + 17 * charge, color: '#ffaa33',
      damage: (40 + 130 * charge) * dmgMul,
      life: 1.4, type: 'player',
      pierceLeft: Math.round(2 + 6 * charge), pierceHits: new Set<Enemy>(),
      wave: true, capsule: true
    });
    // Recoil sparks + shock ring + impact juice
    for (let i = 0; i < 14; i++) {
      const a = Math.atan2(dy, dx) + Math.PI + (Math.random() - 0.5) * 1.2;
      const s = 3 + Math.random() * 5 * charge;
      this.particles.push({
        x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0.35, maxLife: 0.35, size: 3, color: '#ffaa33', type: 'spark'
      });
    }
    this.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.4, maxLife: 0.4, size: 60 + 90 * charge, color: '#ffaa33', type: 'ring' });
    this.screenShake = 4 + 9 * charge;
    this.hitStop = Math.max(this.hitStop, 0.03 + 0.05 * charge);
    if (charge >= 0.98) {
      this.floatingTexts.push({ x: p.x, y: p.y - 44, text: 'VALOVNI TOP!', color: '#ffdd66', life: 1.2, maxLife: 1.2, vy: -1.2 });
      this.audio.playExplosion();
      this.proceduralAudio.playExplosion();
    }
    this.audio.playShoot();
    this.proceduralAudio.playShoot(0.5);
  }

  /** Gradius meter: activate the lit slot and reset the meter. */
  private activateGradiusUpgrade() {
    if (this.state !== 'playing') return;
    const p = this.player;
    if (p.gradiusMeter <= 0) {
      this.floatingTexts.push({ x: p.x, y: p.y - 30, text: 'NI KAPSUL', color: '#8899aa', life: 0.8, maxLife: 0.8, vy: -1 });
      return;
    }
    const slot = p.gradiusMeter - 1;
    const name = GameEngine.GRADIUS_SLOTS[slot];
    let color = '#ffcc22';
    switch (slot) {
      case 0: // HITRO
        p.speed = Math.min(11, p.speed * 1.15);
        color = '#00ffcc';
        break;
      case 1: // RAKETA
        this.missileTimer = 15;
        this.missileVolleyTimer = 0;
        color = '#ff8844';
        break;
      case 2: // DVOJNIK
        this.doubleTimer = 15;
        color = '#ffff44';
        break;
      case 3: // LASER
        this.laserTimer = 15;
        color = '#ff44cc';
        break;
      case 4: // OPCIJA
        if (p.options < 3) p.options++; else p.score += 300;
        color = '#66ffff';
        break;
      case 5: // ŠČIT
        p.arcadeShield = 3;
        color = '#66ffcc';
        break;
    }
    p.gradiusMeter = 0;
    this.floatingTexts.push({ x: p.x, y: p.y - 40, text: name + '!', color, life: 1.3, maxLife: 1.3, vy: -1.3 });
    this.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.45, maxLife: 0.45, size: 70, color, type: 'ring' });
    this.audio.playPowerUp();
    this.proceduralAudio.playPowerUp();
  }

  /** Homing missile volley (Gradius RAKETA slot). */
  private spawnMissileVolley() {
    const p = this.player;
    const dmgMul = this.skillBonuses.damageMul * (this.difficulty?.playerDamageMultiplier ?? 1);
    for (const side of [-1, 1]) {
      this.bullets.push({
        x: p.x + side * 14, y: p.y + 6,
        vx: 0, vy: -7,
        size: 4.5, color: '#ffb060',
        damage: 15 * dmgMul,
        life: 2.4, type: 'player',
        homing: 0.14, capsule: true, missile: true
      });
    }
    // Launch flare: a bright pop + sparks where the boosters ignite.
    this.particles.push({
      x: p.x, y: p.y - 4, vx: 0, vy: 0,
      life: 0.32, maxLife: 0.32, size: 30,
      color: '#ffbb66', type: 'ring'
    });
    for (let j = 0; j < 8; j++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const s2 = 2 + Math.random() * 3;
      this.particles.push({
        x: p.x, y: p.y - 4,
        vx: Math.cos(a) * s2, vy: Math.sin(a) * s2 + 1,
        life: 0.3, maxLife: 0.3, size: 2,
        color: Math.random() < 0.5 ? '#ffcc66' : '#ff8833', type: 'spark'
      });
    }
    this.audio.playShoot();
  }

  /** Per-frame timers for the System 16 arcade systems. */
  private updateArcadeSystems() {
    const p = this.player;
    if (this.plasmaTimer > 0) this.plasmaTimer -= this.deltaTime;
    if (this.doubleTimer > 0) this.doubleTimer -= this.deltaTime;
    if (this.laserTimer > 0) this.laserTimer -= this.deltaTime;
    if (this.missileTimer > 0) {
      this.missileTimer -= this.deltaTime;
      this.missileVolleyTimer -= this.deltaTime;
      if (this.missileVolleyTimer <= 0) {
        this.missileVolleyTimer = 1.1;
        this.spawnMissileVolley();
      }
    }
    // DoDonPachi medal chain decay
    if (this.medalChainTimer > 0) {
      this.medalChainTimer -= this.deltaTime;
      if (this.medalChainTimer <= 0) this.medalChain = 0;
    }
    // R-Type wave cannon charge build-up
    if (this.waveCharging) {
      this.waveCharge = Math.min(1, this.waveCharge + this.deltaTime / 1.15);
      // Charge glow builds at the nose, straight above the cockpit.
      const nx = p.x;
      const ny = p.y - 24;
      this.particles.push({
        x: nx + (Math.random() - 0.5) * 26, y: ny + (Math.random() - 0.5) * 26,
        vx: 0, vy: 0, life: 0.16, maxLife: 0.16,
        size: 2 + 5 * this.waveCharge,
        color: this.waveCharge >= 1 ? '#ffffff' : '#ffaa33', type: 'energy'
      });
    }
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
    // R-Type wave cannon: hold V to charge (released on key-up)
    if (key.toLowerCase() === 'v' && this.state === 'playing') {
      this.mobileWaveStart();
    }
    // Gradius power meter: spend capsules with C
    if (key.toLowerCase() === 'c' && this.state === 'playing') {
      this.activateGradiusUpgrade();
    }
  }

  handleKeyUp(key: string) {
    this.keys.delete(key.toLowerCase());
    if (key.toLowerCase() === 'v') this.releaseWaveCharge();
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

  /** Gamepad polling (Xbox/PS layout): stick 1 moves, stick 2 aims,
   * A/RT fire, B/LT dash, X/RB bomb, Y gradius, LB secondary, Start pause. */
  private pollGamepad() {
    if (typeof navigator.getGamepads !== 'function') return;
    const pads = navigator.getGamepads();
    let gp: Gamepad | null = null;
    for (const g of pads) {
      if (g && g.connected) { gp = g; break; }
    }
    if (!gp) {
      this.gamepadFire = false;
      this.gamepadMove.x = 0;
      this.gamepadMove.y = 0;
      return;
    }
    const b = gp.buttons;
    const pressed = (i: number) => !!b[i]?.pressed;
    const edge = (i: number) => pressed(i) && !this.gamepadPrev[i];
    const dz = (v: number) => (Math.abs(v) > 0.22 ? v : 0);

    // Left stick / D-pad → movement
    let mx = dz(gp.axes[0] ?? 0);
    let my = dz(gp.axes[1] ?? 0);
    if (pressed(12)) my = -1;
    if (pressed(13)) my = 1;
    if (pressed(14)) mx = -1;
    if (pressed(15)) mx = 1;
    this.gamepadMove.x = Math.max(-1, Math.min(1, mx));
    this.gamepadMove.y = Math.max(-1, Math.min(1, my));

    // Right stick → aim reticle (falls back to the last mouse position)
    const rx = dz(gp.axes[2] ?? 0);
    const ry = dz(gp.axes[3] ?? 0);
    if (rx !== 0 || ry !== 0) {
      this.mouse.x = this.player.x + rx * 170;
      this.mouse.y = this.player.y + ry * 170;
    }

    this.gamepadFire = pressed(0) || pressed(7);
    if (edge(1) || edge(6)) this.tryDash();
    if (edge(2) || edge(5)) this.useBomb();
    if (edge(3)) this.activateGradiusUpgrade();
    if (edge(4)) this.useSecondaryWeapon();
    if (edge(9)) this.togglePause();
    this.gamepadPrev = b.map(x => x.pressed);
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
    this.waveCharging = false;
    this.waveCharge = 0;
    this.plasmaTimer = 0;
    this.doubleTimer = 0;
    this.laserTimer = 0;
    this.missileTimer = 0;
    this.missileVolleyTimer = 0;
    this.medalChain = 0;
    this.medalChainTimer = 0;
    this.medalStreak = 0;
    this.waveDamage = 0;
    this.sectorDamage = 0;
    this.sectorMedals = 0;
    this.sectorTally = null;
    this.damageLog = [];
    this.assistMul = 1;
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
    this.bossPending = false;
    this.bossWarningTimer = 0;
    this.klaxonTimer = 0;
    this.music.setBossMode(false);
    this.music.start();
    this.generateSeed();
    this.spawnCrystals();
    // Apply starting XP from persistent rewards (may trigger a level-up)
    if (this.startingXp > 0) {
      const xp = this.startingXp;
      this.startingXp = 0;
      this.awardXP(xp, this.player.x, this.player.y - 30);
    }
  }

  /** Asteroid field density from the level curve (scales by sector). */
  private asteroidTarget(): number {
    return this.wavePlan().asteroidCap;
  }

  /** Build one irregular rocky asteroid (speed scales with the stage). */
  private makeAsteroid(y?: number): Crystal {
    const size = 16 + Math.random() * 30;
    const pal = ASTEROID_PALETTE[Math.floor(Math.random() * ASTEROID_PALETTE.length)];
    const verts = 9 + Math.floor(Math.random() * 3);
    const shape: number[] = [];
    for (let i = 0; i < verts; i++) shape.push(0.72 + Math.random() * 0.42);
    return {
      x: Math.random() * this.width,
      y: y ?? Math.random() * (this.height + 300) - 300,
      size,
      hp: Math.round(14 + size * 1.1),
      maxHp: Math.round(14 + size * 1.1),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.018,
      color: pal.light, dark: pal.dark,
      driftX: (Math.random() - 0.5) * 26,
      speedMul: (0.55 + Math.random() * 0.9) * Math.min(2.2, 1 + (this.wave - 1) * 0.07),
      shape
    };
  }

  private spawnCrystals() {
    // Oncoming asteroid stream: rocks enter from the top edge and tumble
    // down past the ship instead of sitting on the screen.
    for (let i = 0; i < this.asteroidTarget(); i++) {
      // Fair start: no rock spawns right on top of the ship.
      let a = this.makeAsteroid();
      for (let t = 0; t < 8 && Math.hypot(a.x - this.player.x, a.y - this.player.y) < 200; t++) {
        a = this.makeAsteroid();
      }
      this.crystals.push(a);
    }
  }

  /** Shatter an asteroid into debris; keeps the incoming stream flowing.
   *  Large shot-down rocks split into two tumbling fragments (Asteroids-
   *  style) that burn up when they exit the field. */
  private shatterAsteroid(index: number, byCrash: boolean) {
    const crystal = this.crystals[index];
    if (!crystal) return;
    for (let j = 0; j < 22; j++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 3;
      this.particles.push({
        x: crystal.x + (Math.random() - 0.5) * crystal.size,
        y: crystal.y + (Math.random() - 0.5) * crystal.size,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1.1, maxLife: 1.1, size: 2 + Math.random() * 3,
        color: crystal.color, type: 'debris'
      });
    }
    this.crystals.splice(index, 1);
    this.audio.playExplosion();
    if (byCrash) {
      // Ramming a rock hurts more than it pays — no score, bigger shake.
      this.screenShake = 7;
    } else {
      this.screenShake = 5;
      this.player.score += 25;
      this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 3);
      // Big rocks split into two smaller children (one generation only).
      if (!crystal.frag && crystal.size >= 22) this.splitAsteroid(crystal);
    }
    this.crystals.push(this.makeAsteroid(-60 - Math.random() * 160));
  }

  /** Two child rocks inherit the parent's palette and tumble apart with
   *  faster spin and opposing drift — a readable, physical split. */
  private splitAsteroid(parent: Crystal) {
    for (const side of [-1, 1]) {
      const size = parent.size * (0.42 + Math.random() * 0.14);
      const verts = 8 + Math.floor(Math.random() * 3);
      const shape: number[] = [];
      for (let i = 0; i < verts; i++) shape.push(0.72 + Math.random() * 0.42);
      const hp = Math.round(10 + size * 1.1);
      this.crystals.push({
        x: parent.x + side * parent.size * 0.45,
        y: parent.y + (Math.random() - 0.5) * parent.size * 0.4,
        size,
        hp, maxHp: hp,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
        color: parent.color, dark: parent.dark,
        driftX: parent.driftX * 0.5 + side * (14 + Math.random() * 22),
        speedMul: Math.min(2.4, parent.speedMul * 1.1),
        shape,
        frag: true
      });
      this.player.score += 10;
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

  // ===== Sector logic (Gradius stage structure, Raiden pacing) =====

  /** Sector number: waves 1–5 = sector 1, 6–10 = sector 2, ... */
  private sector(): number {
    return Math.floor((this.wave - 1) / 5) + 1;
  }

  /** Current wave's authored plan from the level curve 1–50 (cached). */
  private wavePlan(): WavePlan {
    return getWavePlan(this.wave);
  }

  /** Fair per-wave HP ramp from the level curve, on top of the difficulty mode. */
  private sectorHpMul(): number {
    return this.wavePlan().hpMul;
  }

  /** Bullet-speed budget from the level curve — patterns stay readable —
   *  times the invisible adaptive assist. */
  private bulletSpeedMul(): number {
    return this.wavePlan().bulletSpeedMul * this.assistMul;
  }

  /** Enemy fire-rate aggression from the level curve (Gradius rank lesson). */
  private fireRateMul(): number {
    return this.wavePlan().fireMul;
  }

  /** Enemy bullet damage: difficulty mode × level-curve ramp. */
  private enemyDmgMul(): number {
    return (this.difficulty?.enemyDamageMultiplier ?? 1) * this.wavePlan().dmgMul;
  }

  /** Line-by-line sector tally payout (Raiden DX result-screen feel). */
  private updateSectorTally() {
    if (!this.sectorTally) return;
    this.sectorTally.timer += this.deltaTime;
    const targetShown = Math.min(
      this.sectorTally.lines.length,
      Math.floor(this.sectorTally.timer / 0.7) + 1
    );
    while (this.sectorTally.shown < targetShown) {
      const line = this.sectorTally.lines[this.sectorTally.shown];
      if (!line) break;
      this.player.score += line.value;
      this.sectorTally.shown++;
    }
    const end = 1 + this.sectorTally.lines.length * 0.7 + 2;
    if (this.sectorTally.timer > end) this.sectorTally = null;
  }

  private spawnWave() {
    // The authored level curve (1–50) drives everything: density, HP,
    // aggression, composition, elites — multi-dial scaling, never HP-only.
    const plan = this.wavePlan();
    const count = plan.count;
    this.elitesThisWave = 0;
    
    // Wave announcement
    if (this.wave % 5 === 0) {
      // Gradius/Raiden flow: the WARNING klaxon takes the stage first —
      // the boss itself spawns only after the siren dies down.
      this.waveAnnouncement = null;
      this.bossPending = true;
      this.bossWarningTimer = 3.6;
      this.klaxonTimer = 0.05;
      this.music.setBossMode(true);
    } else if ((this.wave - 1) % 5 === 0) {
      // First wave of a sector: a proper stage intro (Gradius stage card)
      // with the sector's milestone — the player always KNOWS what's new.
      const sec = this.sector();
      const info = GameEngine.SECTORS[(sec - 1) % GameEngine.SECTORS.length];
      this.sectorDamage = 0;
      this.sectorMedals = 0;
      this.waveAnnouncement = {
        text: `SEKTOR ${sec}${sec <= 10 ? '/10' : ''} — ${info?.name ?? 'PRAZNINA'}`,
        subtext: `${plan.milestone} · ${count} sovražnikov`,
        timer: 2.8,
        color: '#66ffe0'
      };
    } else if ((this.wave - 1) % 5 === 2) {
      // Mid-boss wave: a carrier vanguard guards the middle of every
      // sector — classic shmup pacing between the stage card and WARNING.
      const letter = GameEngine.MID_BOSS_LETTERS[(this.sector() - 1) % 3] ?? 'ALFA';
      this.waveAnnouncement = {
        text: `\u26A0 MID BOSS — PREDSTRAŽA-${letter}`,
        subtext: 'predstraža blokira pot',
        timer: 2.4,
        color: '#ffaa33'
      };
      this.spawnMidBoss();
    } else {
      this.waveAnnouncement = {
        text: `VAL ${this.wave}`,
        subtext: `Zaznanih sovražnikov: ${count}`,
        timer: 2,
        color: '#00ffff'
      };
    }

    // Boss and mid-boss waves have one extra roster entry for the HUD.
    const extraBoss = this.wave % 5 === 0 ? 1 : (this.wave - 1) % 5 === 2 ? 1 : 0;
    this.waveTotalEnemies = count + extraBoss;
    // Fair per-wave HP ramp on top of the chosen difficulty mode.
    const hpMul = (this.difficulty?.enemyHpMultiplier ?? 1) * plan.hpMul;

    // Authored formation from the level curve — every wave of a sector has
    // a deliberate SHAPE (line → sine snake → V escort → pincer → boss
    // circle, rotated per sector). 'random' noise is gone: pattern, not
    // confetti (Gradius/Raiden composition lesson).
    this.formationSystem = new FormationSystem(plan.formation);
    const centerX = this.player.x;
    // Spawn fully above the screen: the formation streams in from the top
    // like a classic vertical-scroller attacking wave.
    const centerY = Math.min(this.player.y - 400, -140);
    this.formationSystem.setCenter(centerX, centerY);
    // Directional shapes (line/sine/pincer) only read near-upright — give
    // them a small tilt; free-spin shapes keep the full random rotation.
    const upright = plan.formation === 'line' || plan.formation === 'sine' || plan.formation === 'pincer';
    this.formationSystem.setRotation(upright ? (Math.random() - 0.5) * 0.3 : Math.random() * Math.PI * 2);
    this.formationSystem.setScale(plan.formationScale);

    for (let i = 0; i < count; i++) {
      // Get position from formation
      const pos = this.formationSystem.getPosition(i, count);
      // Authored composition: the sector's mix decides, not a coin flip —
      // S1 teaches with swarmers, Titans arrive in S3, dominate by S8.
      const type = pickEnemyType(plan.comp);
      const baseHp = type === 'swarmer' ? 20 : type === 'sniper' ? 40 : 100;

      // Elite roll (rare modified enemies — spike moments, jackpot loot).
      let elite: EliteAffix | null = null;
      if (this.wave >= plan.eliteMinWave && this.elitesThisWave < plan.eliteCap) {
        if (Math.random() < plan.eliteChance) {
          const pool = (Object.keys(GameEngine.ELITE_AFFIXES) as EliteAffix[])
            .filter((a) => GameEngine.ELITE_AFFIXES[a].minSector <= this.sector());
          elite = pool[Math.floor(Math.random() * pool.length)] ?? null;
          if (elite) this.elitesThisWave++;
        }
      }
      const affix = elite ? GameEngine.ELITE_AFFIXES[elite] : null;

      this.enemies.push({
        x: pos.x,
        y: pos.y,
        vx: 0, vy: 0,
        hp: baseHp * hpMul * (affix?.hpMul ?? 1),
        maxHp: baseHp * hpMul * (affix?.hpMul ?? 1),
        size: (type === 'swarmer' ? 15 : type === 'sniper' ? 20 : 35) * (affix ? 1.25 : 1),
        type,
        color: type === 'swarmer' ? '#ff4444' : type === 'sniper' ? '#ff8800' : '#aa00ff',
        phase: Math.random() * Math.PI * 2,
        pattern: Math.floor(Math.random() * 3),
        shootTimer: Math.random() * 2,
        moveTimer: 0,
        targetX: this.player.x, targetY: this.player.y,
        playerPattern: { left: 0, right: 0, up: 0, down: 0 },
        elite: elite ?? undefined
      });

      // Elite spawn tag — the player should KNOW this one is special.
      if (affix) {
        this.floatingTexts.push({
          x: pos.x, y: pos.y - 30,
          text: affix.tag, color: affix.color,
          life: 1.8, maxLife: 1.8, vy: -0.6
        });
      }
    }

    // The asteroid field thickens with every stage: top the stream back up.
    while (this.crystals.length < this.asteroidTarget()) {
      this.crystals.push(this.makeAsteroid(-60 - Math.random() * 200));
    }

    // The boss spawns after the WARNING klaxon expires (updateBossWarning).

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

  /** Spawns the sector's mid-boss: a carrier-class vanguard that sinks in
   *  from the top of the screen and guards the middle of the sector. */
  private spawnMidBoss() {
    const hpMul = (this.difficulty?.enemyHpMultiplier ?? 1) * this.sectorHpMul();
    const hp = (160 + this.wave * 55) * hpMul;
    this.midBossLetter = GameEngine.MID_BOSS_LETTERS[(this.sector() - 1) % 3] ?? 'ALFA';
    this.enemies.push({
      x: this.width / 2, y: -100,
      vx: 0, vy: 0,
      hp, maxHp: hp,
      size: 42, type: 'boss',
      color: '#ffbb22',
      phase: Math.random() * Math.PI * 2,
      pattern: 0,
      shootTimer: 1.4,
      moveTimer: 0,
      targetX: this.width / 2, targetY: 150,
      playerPattern: { left: 0, right: 0, up: 0, down: 0 },
      variant: 'carrier',
      midBoss: true
    });
    // One short horn — smaller ceremony than the full WARNING klaxon.
    this.audio.playKlaxon();
  }

  private spawnBoss() {
    this.bossActive = true;
    // Boss HP rides the full level curve too (it previously skipped the
    // sector ramp entirely — sector 10 bosses were farm-easy).
    const hpMul = (this.difficulty?.enemyHpMultiplier ?? 1) * this.wavePlan().hpMul;

    // Create Boss AI based on wave (merged from webgpu-online-games-51d72)
    const maxPhases = Math.min(5, Math.floor(this.wave / 5) + 2);
    this.bossAI = new BossAI(maxPhases);

    // Boss roster cycles: cosmic horror → mechanical skull (Truxton
    // homage) → void station (fortress style).
    const roster: Array<'horror' | 'skull' | 'station'> = ['horror', 'skull', 'station'];
    this.bossVariant = roster[Math.floor((this.wave / 5 - 1) % 3)] ?? 'horror';
    const bossColor = this.bossVariant === 'skull' ? '#ffaa33'
      : this.bossVariant === 'station' ? '#66ffcc' : '#ff00ff';

    this.enemies.push({
      x: this.player.x, y: this.player.y - 350,
      vx: 0, vy: 0,
      hp: (500 + this.wave * 100) * hpMul,
      maxHp: (500 + this.wave * 100) * hpMul,
      size: 60,
      type: 'boss',
      color: bossColor,
      phase: 0,
      pattern: Math.floor(Math.random() * 4),
      shootTimer: 0,
      moveTimer: 0,
      targetX: this.player.x, targetY: this.player.y,
      variant: this.bossVariant
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
    // Star parallax accumulator: the sky keeps drifting in the menu
    // (attract mode) and accelerates with the world scroll in play.
    this.starScroll += (this.worldScroll * 1.35 + 46) * this.deltaTime;
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
    // Scroll speed comes from the authored level curve (70 → 160 px/s).
    this.worldScroll = this.wavePlan().scroll;
    // Adaptive soundtrack: boss mode spans the klaxon + the fight; the
    // layered intensity tracks danger (boss, low hull, late sectors).
    this.music.setBossMode(this.bossActive || this.bossPending);
    const hpFrac = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 1;
    // A mid-boss fight bumps the intensity layer too — it's boss-class music.
    const midBossFight = this.enemies.some((e) => e.midBoss && !e.retreat);
    this.music.setIntensity(
      this.bossActive || this.bossPending || midBossFight || hpFrac < 0.4 || this.wave >= 5 ? 2 : 1
    );
    this.updateSectorTally();
    // Adaptive assist: hits in the last 15 s of game time ease the bullet
    // pressure off (invisible rubber band — the player just feels "fair").
    this.damageLog = this.damageLog.filter((t) => this.gameTime - t < 15);
    const recentHits = this.damageLog.length;
    const targetAssist = recentHits >= 4 ? 0.88 : recentHits >= 2 ? 0.94 : 1.0;
    this.assistMul += (targetAssist - this.assistMul) * Math.min(1, this.deltaTime * 2);
    this.updateAutoAim();
    this.pollGamepad();
    this.updatePlayer();
    this.updateDamageFx();
    this.updateEnemies();
    this.updateBullets();
    this.updateOptions();
    this.updateArcadeSystems();
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

    // Gamepad stick / d-pad input (same channel as the joystick)
    if (this.gamepadMove.x !== 0) p.vx += this.gamepadMove.x * accel;
    if (this.gamepadMove.y !== 0) p.vy += this.gamepadMove.y * accel;

    p.vx *= friction;
    p.vy *= friction;

    // Relative-touch drag overrides physics: direct 1:1 follow (zero latency).
    // During a dash the impulse wins, and the drag anchor re-syncs each frame
    // so the ship continues from the dash endpoint instead of snapping back.
    if (this.mobileDragTarget && p.dashTimer <= 0) {
      p.x = this.mobileDragTarget.x;
      p.y = this.mobileDragTarget.y;
      p.vx = 0;
      p.vy = 0;
    } else {
      p.x += p.vx;
      p.y += p.vy;
    }
    if (this.mobileDragBase && p.dashTimer > 0) {
      this.mobileDragBase.x = p.x;
      this.mobileDragBase.y = p.y;
      this.mobileDragTarget = null;
    }

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
    if (this.mouseDown || this.mobileShooting || this.gamepadFire || this.keys.has(' ')) {
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
    // Fixed forward battery: every shot travels straight up the screen.
    // No cursor tracking, no left/right angling — classic shmup aim.
    const dirX = 0;
    const dirY = -1;
    const speed = 12;
    const isCrit = Math.random() < p.critRate;
    this.shotsFired++;
    const dmgMul = this.skillBonuses.damageMul * (this.difficulty?.playerDamageMultiplier ?? 1);

    // Raiden II "toothpaste" plasma: three homing segments that bend
    // toward the nearest enemy.
    if (this.plasmaTimer > 0) {
      // Three parallel plasma segments straight ahead (homing still
      // bends them onto targets once they are in flight).
      for (let i = 0; i < 3; i++) {
        this.bullets.push({
          x: p.x + (i - 1) * 9, y: p.y,
          vx: dirX * 8, vy: dirY * 8,
          size: 4.5, color: '#cc66ff',
          damage: 7 * dmgMul,
          life: 1.6, type: 'player',
          homing: 0.09, capsule: true
        });
      }
      for (let i = 0; i < 3; i++) {
        this.particles.push({
          x: p.x + dirX * 20, y: p.y + dirY * 20,
          vx: (Math.random() - 0.5) * 3 + dirX * 2, vy: (Math.random() - 0.5) * 3 + dirY * 2,
          life: 0.25, maxLife: 0.25, size: 3,
          color: '#cc66ff', type: 'energy'
        });
      }
      this.audio.playShoot();
      this.proceduralAudio.playShoot(0.7 + Math.random() * 0.2);
      return;
    }

    // Overcharge skill: chance for an extra volley
    const volleys = Math.random() < this.skillBonuses.doubleShotChance ? 2 : 1;
    const laser = this.laserTimer > 0;

    for (let v = 0; v < volleys; v++) {
      this.fireVolley(p, dirX, dirY, speed, isCrit, dmgMul, v * 5, laser);
    }

    // Gradius DOUBLE: a second parallel stream one lane to the left
    if (this.doubleTimer > 0) {
      this.fireVolley(p, dirX, dirY, speed, isCrit, dmgMul, -13, laser);
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
    isCrit: boolean, dmgMul: number, spreadOffset: number, laser = false
  ) {
    // VOID RIFT evolution: two extra barrels and hotter damage.
    const count = Math.min(p.weaponEvolved ? p.weaponLevel + 2 : p.weaponLevel, 8);
    // Parallel straight streams: lanes side by side, zero angular fan —
    // every bullet flies exactly along (dirX, dirY). spreadOffset acts
    // as a lateral lane shift in pixels, not an angle.
    const spacing = laser ? 12 : 10;
    for (let i = 0; i < count; i++) {
      const lane = (i - (count - 1) / 2) * spacing + spreadOffset;
      this.bullets.push({
        x: p.x - dirY * lane, y: p.y + dirX * lane,
        vx: dirX * speed, vy: dirY * speed,
        size: laser ? 5.5 : isCrit ? 6 : 4,
        color: laser ? '#ff44cc' : isCrit ? '#ffff00' : p.weaponEvolved ? '#ff7bff' : '#00ffff',
        damage: (10 + p.weaponLevel * 3) * dmgMul * (isCrit ? p.critDmg : 1)
          * (laser ? 1.25 : 1) * (p.weaponEvolved ? 1.15 : 1),
        life: 2, type: 'player',
        chainLeft: this.skillBonuses.chainCount,
        chainDamage: this.skillBonuses.chainDamageMul,
        pierceLeft: laser ? 2 : undefined,
        pierceHits: laser ? new Set<Enemy>() : undefined
      });
    }
  }

  private updateEnemies() {
    const timeScale = this.player.stasisActive ? 0.1 : 1;
    // Fly-by cap from the level curve: never a wall of kamikazes —
    // keep dives readable & fair (2 in S1 → 7 in S10).
    const maxDivers = this.wavePlan().diveMax;
    let divers = 0;
    for (const en of this.enemies) if (en.diving) divers++;
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.phase += this.deltaTime * 2 * timeScale;
      e.shootTimer -= this.deltaTime * timeScale;
      e.moveTimer -= this.deltaTime * timeScale;
      if (e.hitFlash && e.hitFlash > 0) e.hitFlash -= this.deltaTime;

      if (e.type === 'boss') {
        if (e.dying !== undefined) {
          this.updateBossDeath(e);
        } else if (e.midBoss) {
          this.updateMidBoss(e, timeScale);
        } else {
          this.updateBoss(e, timeScale);
        }
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
          const dmgMul = this.enemyDmgMul();
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
            text: '\u26A0 BES', color: '#ff66ff',
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
        
        // Apply AI movement (with difficulty speed multiplier from main,
        // plus the level-curve aggression ramp).
        // During a dive the ship ignores hover-steering and commits to the
        // strafing run — but keeps shooting via the AI decision below.
        const speed = (e.type === 'swarmer' ? 2.5 : e.type === 'sniper' ? 1 : 0.8)
          * (this.difficulty?.enemySpeedMultiplier ?? 1)
          * this.wavePlan().speedMul
          * (e.elite ? GameEngine.ELITE_AFFIXES[e.elite].speedMul : 1);
        if (!e.diving) {
          e.vx += aiResult.moveX * speed * 0.1 * timeScale;
          e.vy += aiResult.moveY * speed * 0.1 * timeScale;

          // Add some randomness to movement
          if (e.type === 'swarmer') {
            e.vx += Math.sin(e.phase * 3) * 0.3 * timeScale;
            e.vy += Math.cos(e.phase * 3) * 0.3 * timeScale;
          }
        }

        e.vx *= 0.95;
        e.vy *= 0.95;
        // World scroll: everyone drifts down with the forward flight;
        // diving ships get extra thrust so the strafing run stays fast.
        e.vy += (e.diving ? 0.34 : 0.12) * timeScale;
        e.x += e.vx * timeScale;
        e.y += e.vy * timeScale;

        // Fly-by attacks (Raiden/Strikers attacking waves): ships commit to
        // downward strafing runs, and anyone pushed off the bottom re-enters
        // from the top edge — the wave keeps attacking from above.
        if (!e.diving) {
          e.diveCd = (e.diveCd ?? 1.5 + Math.random() * 3.5) - this.deltaTime * timeScale;
          if ((e.diveCd ?? 0) <= 0 && divers < maxDivers) {
            e.diving = true;
            divers++;
            e.vy = (e.type === 'swarmer' ? 5.5 : 4) * (this.difficulty?.enemySpeedMultiplier ?? 1) * this.wavePlan().speedMul;
            e.vx = Math.max(-2.2, Math.min(2.2, (this.player.x - e.x) * 0.012));
          }
        } else if (e.y > this.height + 70) {
          e.diving = false;
          e.diveCd = 2.5 + Math.random() * 5;
          e.y = -70 - Math.random() * 120;
          e.x = 40 + Math.random() * Math.max(80, this.width - 80);
          e.vx = 0;
          e.vy = 1;
        }

        // Anatomy of a Shmup rule: off-screen enemies must not shoot, so
        // every incoming volley is telegraphed by a visible attacker.
        const onScreen = e.x > 10 && e.x < this.width - 10 && e.y > 20 && e.y < this.height - 10;
        // Shooting based on AI decision
        if (aiResult.shouldAttack && e.shootTimer <= 0) {
          const shootInterval = e.type === 'swarmer' ? 1.5 : e.type === 'sniper' ? 2.5 : 3;
          e.shootTimer = shootInterval / (this.fireRateMul() * (e.elite ? GameEngine.ELITE_AFFIXES[e.elite].fireMul : 1));
          if (onScreen) this.enemyShoot(e, aiResult.attackAngle);
        } else if (e.shootTimer <= 0) {
          // Fallback to regular shooting if AI doesn't want to attack
          const shootInterval = e.type === 'swarmer' ? 1.5 : e.type === 'sniper' ? 2.5 : 3;
          e.shootTimer = shootInterval / (this.fireRateMul() * (e.elite ? GameEngine.ELITE_AFFIXES[e.elite].fireMul : 1));
          if (onScreen) this.enemyShoot(e);
        }
        
        // Update AI state based on health
        const healthPercent = e.hp / e.maxHp;
        ai.setLowHealth(healthPercent);
      }

      // Check death
      if (e.hp <= 0) {
        if (e.type === 'boss' && e.dying === undefined) {
          // Bosses don't die instantly — they burn through a core-breach
          // chain first (startBossDeath), THEN grant the kill rewards.
          if (e.midBoss) this.startMidBossDeath(e);
          else this.startBossDeath(e);
          continue;
        }
        if (e.type !== 'boss') {
          this.onEnemyDeath(e);
          // Remove AI when enemy dies
          const enemyId = `enemy_${i}`;
          this.enemyAIs.delete(enemyId);
          this.enemies.splice(i, 1);
        }
      }
    }
    // Retreating mid-bosses leave the field silently once off-screen —
    // the wave can never soft-lock behind an unkilled vanguard.
    if (this.enemies.some((e) => e.midBoss && e.retreat && e.y < -110)) {
      this.enemies = this.enemies.filter((e) => !(e.midBoss && e.retreat && e.y < -110));
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
    // Every boss pattern rides the level-curve damage ramp.
    const dmg = this.enemyDmgMul();
    switch (pattern) {
      case 'spiral': {
        const spiralAngle = boss.phase * 3;
        for (let i = 0; i < 8; i++) {
          const a = spiralAngle + (Math.PI * 2 * i) / 8;
          this.bullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
            size: 5, color: '#ff00ff', damage: 15 * dmg,
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
            size: 4, color: '#ff88ff', damage: 12 * dmg,
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
            size: 3, color: '#cc00ff', damage: 10 * dmg,
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
            size: 6, color: '#ff4444', damage: 20 * dmg,
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
            size: 4, color: '#cc00ff', damage: 10 * dmg,
            life: 3.5, type: 'enemy'
          });
        }
        break;

      case 'wave': {
        // Flowing curtain: a wall of sine-wave bullets that weaves as it
        // descends (per danmaku pattern research — sine walls read as
        // waves of light and reward rhythm-based dodging).
        const waveDmg = 12 * dmg;
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
              size: 4, color: '#cc00ff', damage: 10 * dmg,
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
    const dmgMul = this.enemyDmgMul();
    const bSpeed = this.bulletSpeedMul();

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
        vx: Math.cos(baseAngle + aimOffset) * 4 * bSpeed, vy: Math.sin(baseAngle + aimOffset) * 4 * bSpeed,
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
        const speed = 5.5 * bSpeed;
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
          vx: Math.cos(angle) * 7 * bSpeed, vy: Math.sin(angle) * 7 * bSpeed,
          size: 4, color: '#ffaa00', damage: 12 * dmgMul,
          life: 2.5, type: 'enemy'
        });
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const angle = baseAngle + (Math.PI * 2 * i) / 6 + e.phase + aimOffset;
        this.bullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * 3 * bSpeed, vy: Math.sin(angle) * 3 * bSpeed,
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

  /** Ticks the WARNING phase down and spawns the boss once it expires. */
  private updateBossWarning() {
    if (!this.bossPending) return;
    this.bossWarningTimer -= this.deltaTime;
    this.klaxonTimer -= this.deltaTime;
    if (this.klaxonTimer <= 0) {
      this.audio.playKlaxon();
      this.klaxonTimer = 1.7;
    }
    if (this.bossWarningTimer <= 0) {
      this.bossPending = false;
      this.spawnBoss();
    }
  }

  /** Core breach: the boss stops fighting and burns for ~1.6s of chained
   *  explosions (slow-motion hit-stop + music duck) before the final blast. */
  private startBossDeath(boss: Enemy) {
    boss.dying = 1.6;
    boss.deathTick = 0;
    boss.vx = 0;
    boss.vy = 0;
    this.bossActive = false;
    this.hitStop = Math.max(this.hitStop, 0.4);
    this.screenShake = Math.max(this.screenShake, 12);
    this.music.setBossMode(false);
    this.music.duck(1.8);
    this.floatingTexts.push({
      x: boss.x, y: boss.y - boss.size - 24,
      text: '\u26A0 PREBITJE JEDRA', color: '#ff5544',
      life: 1.2, maxLife: 1.2, vy: -1.2
    });
    this.audio.playExplosion();
  }

  /** Burns the dying boss down: random explosions across its hull, then
   *  the classic full-death blast (rewards, rings, shockwave, big shake). */
  private updateBossDeath(boss: Enemy) {
    boss.dying = (boss.dying ?? 0) - this.deltaTime;
    boss.deathTick = (boss.deathTick ?? 0) - this.deltaTime;
    // Wobbling death drift — sinking, out of control.
    boss.x += Math.sin(this.time * 22) * 1.4;
    boss.y += 16 * this.deltaTime;
    if (boss.deathTick <= 0) {
      boss.deathTick = 0.16;
      const ox = (Math.random() - 0.5) * boss.size * 1.6;
      const oy = (Math.random() - 0.5) * boss.size * 1.2;
      this.particles.push({
        x: boss.x + ox, y: boss.y + oy, vx: 0, vy: 0,
        life: 0.5, maxLife: 0.5,
        size: 60 + Math.random() * 70,
        color: Math.random() < 0.5 ? '#ffaa44' : '#ffffff',
        type: 'ring'
      });
      const n = Math.floor(14 * this.particleScale);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = Math.random() * 6 + 1.5;
        this.particles.push({
          x: boss.x + ox, y: boss.y + oy,
          vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: 0.7 + Math.random() * 0.5, maxLife: 1.2,
          size: Math.random() * 3.5 + 1.5,
          color: boss.color, type: 'debris'
        });
      }
      this.audio.playBreachPop();
    }
    if (boss.dying <= 0) {
      const idx = this.enemies.indexOf(boss);
      if (idx >= 0) {
        this.onEnemyDeath(boss);
        this.enemies.splice(idx, 1);
      }
    }
  }

  /** Mid-boss breach: a shorter, tighter burn than a full boss death —
   *  same dramatic language, half the ceremony. */
  private startMidBossDeath(boss: Enemy) {
    boss.dying = 0.9;
    boss.deathTick = 0;
    boss.vx = 0;
    boss.vy = 0;
    this.hitStop = Math.max(this.hitStop, 0.2);
    this.screenShake = Math.max(this.screenShake, 9);
    this.music.duck(0.9);
    this.floatingTexts.push({
      x: boss.x, y: boss.y - boss.size - 20,
      text: '\u26A0 PREBITA PREDSTRAŽA', color: '#ffcc44',
      life: 1.1, maxLife: 1.1, vy: -1.1
    });
    this.audio.playExplosion();
  }

  /** Mid-boss (sector vanguard): sinks in from the top, hovers on a sine
   *  band and fires aimed fans. Classic shmup behavior — kill it fast for
   *  the bounty, or stall it out and it withdraws without rewards. */
  private updateMidBoss(m: Enemy, timeScale: number) {
    const dt = this.deltaTime * timeScale;
    const hpFrac = m.maxHp > 0 ? m.hp / m.maxHp : 0;

    // Berserk telegraph: below 40% the carrier overheats and fires faster.
    if (!m.desperate && hpFrac < 0.4) {
      m.desperate = true;
      this.floatingTexts.push({
        x: m.x, y: m.y - m.size,
        text: '\u26A0 BES', color: '#ff8844',
        life: 1, maxLife: 1, vy: -1.5
      });
      this.screenShake = Math.max(this.screenShake, 5);
    }

    // Withdrawal: after 15 s of fight time the vanguard disengages —
    // the wave can never soft-lock behind an unkilled mini-boss.
    m.moveTimer += dt;
    if (!m.retreat && m.moveTimer > 15) {
      m.retreat = true;
      this.floatingTexts.push({
        x: m.x, y: m.y - m.size - 16,
        text: 'PREDSTRAŽA ODHAJA', color: '#ffaa33',
        life: 1.4, maxLife: 1.4, vy: -0.8
      });
    }
    if (m.retreat) {
      m.y -= 150 * dt;
      return;
    }

    // Entry: sink down to the hover band first — no shooting mid-descent.
    if (m.y < 150) {
      m.y += 60 * dt;
      return;
    }

    // Hover: horizontal sine sweep across the upper band.
    m.x = m.targetX + Math.sin(this.time * 0.85 + m.phase) * this.width * 0.3;
    m.x = Math.max(60, Math.min(this.width - 60, m.x));

    // Aimed fan attack (+ interleaved ring once berserk).
    m.shootTimer -= dt;
    if (m.shootTimer <= 0) {
      const dmgMul = this.enemyDmgMul();
      m.shootTimer = (m.desperate ? 1.25 : 2.1) / this.fireRateMul();
      const base = Math.atan2(this.player.y - m.y, this.player.x - m.x);
      for (let k = -2; k <= 2; k++) {
        const a = base + k * 0.16;
        this.bullets.push({
          x: m.x, y: m.y + m.size * 0.6,
          vx: Math.cos(a) * 4.2, vy: Math.sin(a) * 4.2,
          size: 5, color: '#ffcc44', damage: 12 * dmgMul,
          life: 4, type: 'enemy'
        });
      }
      if (m.desperate && Math.random() < 0.5) {
        const ringBase = this.time * 2;
        for (let k = 0; k < 10; k++) {
          const a = ringBase + (Math.PI * 2 * k) / 10;
          this.bullets.push({
            x: m.x, y: m.y,
            vx: Math.cos(a) * 3, vy: Math.sin(a) * 3,
            size: 4, color: '#ff8844', damage: 10 * dmgMul,
            life: 3.5, type: 'enemy'
          });
        }
      }
    }
  }

  private onEnemyDeath(e: Enemy) {
    const scoreMul = this.difficulty?.scoreMultiplier ?? 1;
    const baseScore = (e.type === 'boss' ? (e.midBoss ? 500 : 1000) : e.type === 'titan' ? 100 : 25) * scoreMul;
    this.player.score += baseScore * this.player.combo;
    this.player.combo = Math.min(10, this.player.combo + 1);
    this.player.comboTimer = 5;
    this.maxCombo = Math.max(this.maxCombo, this.player.combo);
    this.screenShake = e.type === 'boss' ? (e.midBoss ? 12 : 20) : 5;
    // Kill juice: bosses get a long freeze-frame, titans a short one.
    if (e.type === 'boss') this.hitStop = Math.max(this.hitStop, e.midBoss ? 0.09 : 0.14);
    else if (e.type === 'titan') this.hitStop = Math.max(this.hitStop, 0.06);
    this.audio.playExplosion();
    this.proceduralAudio.playExplosion();
    this.enemiesKilled++;
    if (e.type === 'boss' && !e.midBoss) this.bossKills++;

    // Gold reward (scaled by difficulty; elites pay a jackpot multiplier)
    const goldMul = this.difficulty?.goldMultiplier ?? 1;
    this.gold += Math.round(
      (e.type === 'boss' ? (e.midBoss ? 120 : 250) : e.type === 'titan' ? 25 : 10)
      * goldMul * (e.elite ? GameEngine.ELITE_AFFIXES[e.elite].goldMul : 1)
    );

    // Award XP based on enemy type (elites are worth double XP)
    const xpGained = Math.round(
      (e.type === 'boss' ? (e.midBoss ? 200 : 500) : e.type === 'titan' ? 50 : 15)
      * (e.elite ? 2 : 1)
      * (this.difficulty?.xpMultiplier ?? 1)
    );
    this.awardXP(xpGained, e.x, e.y);

    // Expanding shockwave ring — one readable pulse marking the blast
    this.particles.push({
      x: e.x, y: e.y, vx: 0, vy: 0,
      life: 0.55, maxLife: 0.55,
      size: e.type === 'boss' ? (e.midBoss ? 150 : 220) : e.type === 'titan' ? 90 : 55,
      color: e.type === 'boss' ? (e.midBoss ? '#ffcc44' : '#ff66ff') : '#ffffff',
      type: 'ring'
    });

    // Death particles - more when WebGPU is active
    const particleCount = Math.floor((this.webgpuSupported ? (e.type === 'boss' ? (e.midBoss ? 120 : 200) : 50) : (e.type === 'boss' ? (e.midBoss ? 50 : 80) : 20)) * this.particleScale);
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

    // Post-blast smoke plume — the burn-off that sells a real explosion.
    const smokeCount = e.type === 'boss' ? (e.midBoss ? 5 : 9) : e.type === 'titan' ? 4 : 0;
    for (let i = 0; i < smokeCount; i++) {
      this.particles.push({
        x: e.x + (Math.random() - 0.5) * e.size,
        y: e.y + (Math.random() - 0.5) * e.size,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.4 - Math.random() * 0.8,
        life: 0.9 + Math.random() * 0.8, maxLife: 1.7,
        size: (8 + Math.random() * 10) * (e.midBoss ? 1 : e.type === 'boss' ? 1.4 : 1),
        color: Math.random() < 0.6 ? '#9a9aa2' : '#6f6f76',
        type: 'smoke'
      });
    }

    // Drop power orbs
    if (Math.random() < 0.3 || e.type === 'boss') {
      const orbCount = e.type === 'boss' ? (e.midBoss ? 3 : 5) : 1;
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
    const powerUpDropChance = e.type === 'boss' ? (e.midBoss ? 0.5 : 1.0) : e.type === 'titan' ? 0.3 : 0.05;
    if (Math.random() < powerUpDropChance) {
      this.dropAdvancedPowerUp(e.x, e.y, e.type === 'boss' && !e.midBoss);
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
    if (e.midBoss) {
      // Mid-boss payoff: guaranteed medal + capsule — juicy, but not a
      // full boss spread (options stay tied to the WARNING bosses).
      letterDrop('medal', e.x, e.y);
      letterDrop('capsule', e.x - 24, e.y);
    } else if (e.type === 'boss') {
      letterDrop(this.player.options < 3 ? 'option' : 'bomb', e.x, e.y);
      letterDrop('capsule', e.x - 26, e.y);
      letterDrop('medal', e.x + 26, e.y);
    } else if (e.elite) {
      // Elites always pay out a medal (the jackpot moment).
      letterDrop('medal', e.x + (Math.random() - 0.5) * 30, e.y);
      if (e.elite === 'gilded') letterDrop('power', e.x, e.y);
    } else if (e.type === 'titan') {
      const roll = Math.random();
      if (roll < 0.35) letterDrop(Math.random() < 0.5 ? 'power' : 'bomb', e.x, e.y);
      else if (roll < 0.55) letterDrop('capsule', e.x, e.y);
      else if (roll < 0.68) letterDrop('plasma', e.x, e.y);
      else if (roll < 0.95) letterDrop('medal', e.x, e.y);
    } else {
      const roll = Math.random();
      if (roll < 0.03) letterDrop('power', e.x, e.y);
      else if (roll < 0.05) letterDrop('speed', e.x, e.y);
      else if (roll < 0.065) letterDrop('bomb', e.x, e.y);
      else if (roll < 0.08) letterDrop('capsule', e.x, e.y);
      else if (roll < 0.095) letterDrop('plasma', e.x, e.y);
      else if (roll < 0.18) letterDrop('medal', e.x, e.y);
    }

    if (e.type === 'boss' && !e.midBoss) {
      this.bossActive = false;
      // Raiden DX style sector tally: base + no-miss + medal bonus, paid
      // out line by line on the result panel (updateSectorTally).
      const s = this.sector();
      const tallyLines: Array<{ label: string; value: number }> = [
        { label: `SEKTOR ${s} JASEN`, value: Math.round(1000 * s * scoreMul) },
      ];
      if (this.sectorDamage === 0) {
        tallyLines.push({ label: 'BREZ ZADETKOV', value: Math.round(5000 * s * scoreMul) });
      }
      if (this.sectorMedals > 0) {
        tallyLines.push({ label: `MEDALJE ×${this.sectorMedals}`, value: Math.round(this.sectorMedals * 100 * s * scoreMul) });
      }
      const tallyTotal = tallyLines.reduce((sum, l) => sum + l.value, 0);
      tallyLines.push({ label: 'SKUPAJ', value: tallyTotal });
      this.sectorTally = { lines: tallyLines, timer: 0, shown: 0 };
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

    if (e.midBoss) {
      // Vanguard bounty: sector-scaled score bonus + one warm ring.
      const s = this.sector();
      const bonus = Math.round(300 * s * scoreMul);
      this.player.score += bonus;
      this.floatingTexts.push({
        x: e.x, y: e.y - e.size - 12,
        text: `PREDSTRAŽA JASEN +${bonus}`,
        color: '#ffcc44', life: 1.6, maxLife: 1.6, vy: -1.2
      });
      this.particles.push({
        x: e.x, y: e.y, vx: 0, vy: 0,
        life: 0.7, maxLife: 0.7,
        size: 260, color: '#ffcc44', type: 'ring'
      });
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
      text: `NIVO ${this.player.level}`,
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

      // Homing steering (Raiden II plasma, Gradius missiles): bend the
      // velocity toward the nearest living enemy.
      if (b.homing !== undefined) {
        let best = Infinity, tx = 0, ty = 0;
        let found = false;
        for (const e of this.enemies) {
          if (e.hp <= 0) continue;
          const ex = e.x - b.x;
          const ey = e.y - b.y;
          const d2 = ex * ex + ey * ey;
          if (d2 < best) { best = d2; tx = ex; ty = ey; found = true; }
        }
        if (found) {
          const d = Math.sqrt(best) || 1;
          const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
          const t = Math.min(1, b.homing * this.deltaTime * 60);
          b.vx += ((tx / d) * sp - b.vx) * t;
          b.vy += ((ty / d) * sp - b.vy) * t;
        }
      }

      b.x += b.vx;
      b.y += b.vy;
      b.life -= this.deltaTime;

      // Rocket exhaust: smoke puffs + flame sparks streaming from the tail.
      // The trail is what sells "real rocket" — fire without smoke looks
      // like a spark; smoke without fire looks like a jet contrail.
      if (b.missile) {
        // Solid-fuel thrust: the rocket accelerates along its heading up
        // to burnout speed — a launch feels like a launch, not a drift.
        const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
        if (spd < 11) {
          const ns = Math.min(11, spd + 9 * this.deltaTime);
          b.vx = (b.vx / spd) * ns;
          b.vy = (b.vy / spd) * ns;
        }
        b.trailT = (b.trailT ?? 0) - this.deltaTime;
        if (b.trailT <= 0) {
          b.trailT = 0.024;
          const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy) || 1;
          const nx = -b.vx / sp, ny = -b.vy / sp; // tail direction
          // Reaction-control thruster: hard homing turns vent a small
          // side puff from the opposite side of the turn.
          const ang = Math.atan2(b.vy, b.vx);
          if (b.lastAng !== undefined) {
            let d = ang - b.lastAng;
            while (d > Math.PI) d -= Math.PI * 2;
            while (d < -Math.PI) d += Math.PI * 2;
            if (Math.abs(d) > 0.06) {
              const side = d > 0 ? -1 : 1;
              const px = Math.cos(ang + side * Math.PI * 0.5);
              const py = Math.sin(ang + side * Math.PI * 0.5);
              this.particles.push({
                x: b.x - Math.cos(ang) * 4 + px * 3,
                y: b.y - Math.sin(ang) * 4 + py * 3,
                vx: px * 1.4, vy: py * 1.4,
                life: 0.16, maxLife: 0.2, size: 2.2,
                color: '#d8d8d8', type: 'smoke'
              });
            }
          }
          b.lastAng = ang;
          this.particles.push({
            x: b.x + nx * 9 + (Math.random() - 0.5) * 3,
            y: b.y + ny * 9 + (Math.random() - 0.5) * 3,
            vx: nx * 0.5 + (Math.random() - 0.5) * 0.4,
            vy: ny * 0.5 - 0.2,
            life: 0.5 + Math.random() * 0.3, maxLife: 0.8,
            size: 3.5 + Math.random() * 2.5,
            color: Math.random() < 0.75 ? '#b9b9b9' : '#8f8f8f',
            type: 'smoke'
          });
          this.particles.push({
            x: b.x + nx * 6, y: b.y + ny * 6,
            vx: nx * 1.5 + (Math.random() - 0.5), vy: ny * 1.5 + (Math.random() - 0.5),
            life: 0.16 + Math.random() * 0.1, maxLife: 0.26,
            size: 2 + Math.random() * 1.5,
            color: Math.random() < 0.5 ? '#ffcc66' : '#ff8833',
            type: 'energy'
          });
        }
      }

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
            // Piercing shots (Gradius LASER, wave cannon) pass through —
            // each enemy is only ever damaged once per bullet.
            if (b.pierceLeft !== undefined && b.pierceLeft > 0) {
              if (b.pierceHits && b.pierceHits.has(e)) continue;
              b.pierceHits?.add(e);
              b.pierceLeft--;
            }
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
            // Piercing: keep flying while charges remain, else remove
            if (b.pierceLeft !== undefined) {
              return b.pierceLeft <= 0;
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
          // Asteroid shattered by gunfire — small reward, stream keeps flowing.
          this.shatterAsteroid(c, false);
        } else {
          // Chip off a few rock splinters — damage feedback on the rock.
          for (let j = 0; j < 3; j++) {
            const a = Math.random() * Math.PI * 2;
            this.particles.push({
              x: b.x, y: b.y,
              vx: Math.cos(a) * 2.5, vy: Math.sin(a) * 2.5 - 0.5,
              life: 0.5, maxLife: 0.5, size: 1.5 + Math.random() * 1.5,
              color: crystal.color, type: 'debris'
            });
          }
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
    // Gradius Shield (meter slot ŠČIT): fully absorbs discrete hits
    if (p.arcadeShield > 0 && amount >= 0.5) {
      p.arcadeShield--;
      p.invincible = 0.8;
      this.particles.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.5, maxLife: 0.5, size: 70, color: '#66ffcc', type: 'ring' });
      this.floatingTexts.push({ x: p.x, y: p.y - 34, text: 'ŠČIT!', color: '#66ffcc', life: 1, maxLife: 1, vy: -1.2 });
      this.screenShake = 6;
      this.audio.playHit();
      return;
    }
    // Skill tree damage reduction (capped at 75%)
    amount *= Math.max(0.25, 1 - this.skillBonuses.damageReduction);
    this.damageTaken += amount;
    // Reward-loop bookkeeping: wave/sector no-miss tracking, medal streak
    // reset and the adaptive-assist pressure log.
    this.waveDamage += amount;
    this.sectorDamage += amount;
    this.medalStreak = 0;
    this.damageLog.push(this.gameTime);
    if (this.damageLog.length > 40) this.damageLog.shift();
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
    this.recordLeaderboard();
    this.audio.stopMusic();
    this.music.stop();
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

  /** Damaged-ship feedback: below 35% hull the ship leaks smoke; below 15%
   *  it also spits engine fire — the classic shmup "you are critical" tell. */
  private updateDamageFx() {
    const frac = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 1;
    if (frac >= 0.35) {
      this.damageFxT = 0;
      return;
    }
    this.damageFxT -= this.deltaTime;
    if (this.damageFxT > 0) return;
    this.damageFxT = frac < 0.15 ? 0.045 : 0.075;
    const p = this.player;
    const hot = frac < 0.15;
    const fire = hot && Math.random() < 0.45;
    this.particles.push({
      x: p.x + (Math.random() - 0.5) * 10,
      y: p.y + 12 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 1.4 + Math.random() * 0.8, // trails back with the forward flight
      life: 0.6 + Math.random() * 0.4, maxLife: 1.0,
      size: 3 + Math.random() * 3,
      color: fire
        ? (Math.random() < 0.5 ? '#ff8833' : '#ffcc55')
        : (Math.random() < 0.5 ? '#777777' : '#555555'),
      type: fire ? 'energy' : 'smoke'
    });
  }

  /** Gradius-style Options: up to 2 drones orbit the ship and fire straight
   * up in sync with the ship's fixed battery (position is a pure function
   * of time, so rendering and firing stay in perfect sync).
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
      // Straight up — same fixed battery as the ship, no auto-aim.
      this.bullets.push({
        x: ox, y: oy,
        vx: 0, vy: -10,
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

  /** Classic arcade HUD row: bomb stock, options, Gradius meter, timers.
   *  TOUCH dialect (isMobile): no keyboard key hints, and the bomb stock
   *  lives bottom-LEFT — the bottom-right corner belongs to the touch
   *  button stack (Dash/BOMBA icons would cover it). */
  private renderRunIndicators(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const p = this.player;
    const touch = this.isMobile;
    // Bomb stock (Raiden): filled ◉ for available, hollow ○ for spent.
    // Desktop anchors sit LEFT of the minimap panel (it occupies the
    // bottom-right ~135px — the old w-20 column was fully hidden).
    let bombStr = '';
    for (let i = 0; i < p.maxBombs; i++) bombStr += i < p.bombs ? '\u25C9' : '\u25CB';
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#ff6644';
    if (touch) {
      ctx.textAlign = 'left';
      ctx.fillText(bombStr, 16, h - 22);
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText('BOMBA', 16, h - 10);
    } else {
      ctx.textAlign = 'right';
      ctx.fillText(bombStr, w - 150, h - 22);
      ctx.font = '9px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillText('BOMBA [X]', w - 150, h - 10);
    }
    if (p.options > 0) {
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#66ffff';
      let optStr = 'OPTION ';
      for (let i = 0; i < p.options; i++) optStr += '\u25CF';
      ctx.textAlign = touch ? 'left' : 'right';
      ctx.fillText(optStr, touch ? 16 : w - 150, h - 40);
    }
    // Temporary arcade weapon timers (Raiden II plasma + Gradius slots)
    const bars: Array<{ label: string; t: number; max: number; color: string }> = [];
    if (this.plasmaTimer > 0) bars.push({ label: 'PLAZMA', t: this.plasmaTimer, max: 12, color: '#cc66ff' });
    if (this.missileTimer > 0) bars.push({ label: 'RAKETA', t: this.missileTimer, max: 15, color: '#ff8844' });
    if (this.doubleTimer > 0) bars.push({ label: 'DVOJNIK', t: this.doubleTimer, max: 15, color: '#ffff44' });
    if (this.laserTimer > 0) bars.push({ label: 'LASER', t: this.laserTimer, max: 15, color: '#ff44cc' });
    bars.forEach((bar, idx) => {
      const y = h - 58 - idx * 16;
      const bx = touch ? 58 : w - 222;
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = bar.color;
      ctx.textAlign = touch ? 'left' : 'right';
      ctx.fillText(bar.label, touch ? 16 : w - 226, y + 8);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(bx, y, 72, 8);
      ctx.fillStyle = bar.color;
      ctx.fillRect(bx, y, 72 * Math.max(0, bar.t / bar.max), 8);
      ctx.strokeStyle = bar.color + 'aa';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, y, 72, 8);
    });
    // Gradius power meter (Konami): bottom-center — the only area that
    // stays clear of the React overlay panels on desktop AND mobile
    const slotCols = ['#00ffcc', '#ff8844', '#ffff44', '#ff44cc', '#66ffff', '#66ffcc'];
    const slotLabels = ['H', 'R', 'D', 'L', 'O', '\u0160'];
    const meterW = 24, meterH = 8, gap = 3;
    const mx = w / 2 - (6 * (meterW + gap) - gap) / 2;
    const my = h - 56;
    for (let i = 0; i < 6; i++) {
      const lit = i < p.gradiusMeter;
      const full = p.gradiusMeter >= 6;
      ctx.fillStyle = lit
        ? (full ? `rgba(255,220,60,${(0.7 + Math.sin(this.time * 10) * 0.3).toFixed(2)})` : slotCols[i])
        : 'rgba(0,0,0,0.5)';
      ctx.fillRect(mx + i * (meterW + gap), my, meterW, meterH);
      ctx.strokeStyle = lit ? slotCols[i] : 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx + i * (meterW + gap), my, meterW, meterH);
      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = lit ? slotCols[i] : 'rgba(255,255,255,0.35)';
      ctx.textAlign = 'center';
      ctx.fillText(slotLabels[i], mx + i * (meterW + gap) + meterW / 2, my + meterH + 9);
    }
    ctx.font = '8px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'left';
    ctx.fillText(touch ? 'GRADIUS' : 'GRADIUS [C]', mx, my - 4);
    // DoDonPachi medal chain (top-right, below the wave number)
    if (this.medalChain > 0 && this.medalChainTimer > 0) {
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = `rgba(255,215,0,${(0.55 + Math.sin(this.time * 8) * 0.35).toFixed(2)})`;
      ctx.textAlign = 'right';
      ctx.fillText(`VERIGA ×${this.medalChain + 1}`, w - 20, 72);
      ctx.fillStyle = 'rgba(255,215,0,0.7)';
      ctx.fillRect(w - 80, 78, 60 * Math.max(0, this.medalChainTimer / 2.4), 3);
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
      orb.y += orb.vy + this.worldScroll * this.deltaTime * 0.4;
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
          orb.type === 'bomb' || orb.type === 'option' ||
          orb.type === 'capsule' || orb.type === 'plasma' || orb.type === 'medal';
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
            this.checkWeaponEvolution();
            this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: 'OROŽJE +1!', color: '#ffcc00', life: 1.2, maxLife: 1.2, vy: -1.5 });
            break;
          case 'speed':
            // Letter S: movement speed boost (capped)
            this.player.speed = Math.min(11, this.player.speed * 1.1);
            this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: 'HITROST +1!', color: '#00ffcc', life: 1.2, maxLife: 1.2, vy: -1.5 });
            break;
          case 'bomb':
            // Letter B: +1 bomb stock
            this.player.bombs = Math.min(this.player.maxBombs, this.player.bombs + 1);
            this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: '+1 BOMBA', color: '#ff6644', life: 1.2, maxLife: 1.2, vy: -1.5 });
            break;
          case 'option':
            // Letter O (Gradius): companion drone, max 3
            if (this.player.options < 3) {
              this.player.options++;
              this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: 'OPTION!', color: '#66ffff', life: 1.4, maxLife: 1.4, vy: -1.5 });
            } else {
              this.player.score += 200;
            }
            break;
          case 'capsule': {
            // Gradius power capsule: fills the meter; C spends the lit slot
            this.player.gradiusMeter = Math.min(6, this.player.gradiusMeter + 1);
            this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: `KAPSULA ${this.player.gradiusMeter}/6`, color: '#ffcc22', life: 1.2, maxLife: 1.2, vy: -1.5 });
            break;
          }
          case 'plasma':
            // Raiden II purple "toothpaste" plasma laser (temporary)
            this.plasmaTimer = 12;
            this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: 'PLAZMA LASER!', color: '#cc66ff', life: 1.4, maxLife: 1.4, vy: -1.5 });
            break;
          case 'medal': {
            // DoDonPachi medal chain: quick pickups multiply the value
            this.medalChain = Math.min(this.medalChain + 1, GameEngine.MEDAL_VALUES.length - 1);
            this.medalChainTimer = 2.4;
            this.sectorMedals++;
            // Raiden medal escalation: consecutive medals without taking a
            // hit are worth up to double.
            this.medalStreak++;
            const streakMul = 1 + Math.min(this.medalStreak, 10) * 0.1;
            const medalValue = Math.round(GameEngine.MEDAL_VALUES[this.medalChain] * streakMul * (this.difficulty?.scoreMultiplier ?? 1));
            this.player.score += medalValue;
            this.floatingTexts.push({ x: orb.x, y: orb.y - 18, text: `+${medalValue}`, color: '#ffd700', life: 1.1, maxLife: 1.1, vy: -1.6 });
            if (this.medalChain >= 2) {
              this.floatingTexts.push({ x: this.player.x, y: this.player.y - 46, text: `VERIGA ×${this.medalChain + 1}`, color: '#ffd700', life: 1, maxLife: 1, vy: -1 });
            } else if (this.medalStreak >= 3) {
              this.floatingTexts.push({ x: this.player.x, y: this.player.y - 46, text: `SERIJA ×${this.medalStreak}`, color: '#ffdd44', life: 1, maxLife: 1, vy: -1 });
            }
            break;
          }
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
    // Rocks ride the world scroll at personal speeds (mixed traffic), wrap
    // back above the screen — and HURT when the ship rams them. Dodge!
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const crystal = this.crystals[i];
      crystal.rotation += crystal.rotSpeed;
      crystal.y += this.worldScroll * crystal.speedMul * this.deltaTime;
      crystal.x += crystal.driftX * this.deltaTime;
      // Tumbling rocks shed the odd dust grain — a tiny life sign that
      // makes the field feel like matter, not sprites.
      if (Math.random() < 0.008) {
        this.particles.push({
          x: crystal.x + (Math.random() - 0.5) * crystal.size * 1.4,
          y: crystal.y + (Math.random() - 0.5) * crystal.size * 1.4,
          vx: crystal.driftX * 0.15 + (Math.random() - 0.5) * 0.6,
          vy: -this.worldScroll * 0.12 * crystal.speedMul,
          life: 0.5 + Math.random() * 0.4, maxLife: 0.9,
          size: 1 + Math.random() * 1.6,
          color: crystal.color, type: 'debris'
        });
      }
      if (crystal.y - crystal.size > this.height) {
        if (crystal.frag) {
          // Split children burn up on exit instead of re-entering the stream.
          this.crystals.splice(i, 1);
          continue;
        }
        crystal.y = -crystal.size - Math.random() * 140;
        crystal.x = Math.random() * this.width;
      }
      if (crystal.x < -crystal.size - 20) crystal.x = this.width + crystal.size;
      else if (crystal.x > this.width + crystal.size + 20) crystal.x = -crystal.size;

      // Crash collision — flying into a rock deals damage scaled by size
      // (dash i-frames or the Gradius shield can save you).
      if (this.player.invincible <= 0) {
        const dx = crystal.x - this.player.x;
        const dy = crystal.y - this.player.y;
        const rr = crystal.size * 0.8 + 12;
        if (dx * dx + dy * dy < rr * rr) {
          this.shatterAsteroid(i, true);
          this.damagePlayer(10 + crystal.size * 0.35);
        }
      }
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
    if (this.enemies.length === 0 && !this.bossActive && !this.bossPending) {
      if (this.waveTimer > 2) {
        this.wave++;
        this.waveTimer = 0;
        // Wave-clear bonus — arcade convention: reward the sweep.
        const bonus = 200 * (this.wave - 1);
        this.player.score += bonus;
        this.floatingTexts.push({
          x: this.player.x, y: this.player.y - 50,
          text: `VAL JASEN +${bonus}`, color: '#ffdd44',
          life: 1.4, maxLife: 1.4, vy: -1.4
        });
        // Perfect wave: untouched through the whole wave — bonus reward.
        if (this.waveDamage === 0) {
          const perfect = Math.round(300 * this.wave * (this.difficulty?.scoreMultiplier ?? 1));
          this.player.score += perfect;
          this.floatingTexts.push({
            x: this.player.x, y: this.player.y - 76,
            text: `BREZ ZADETKOV +${perfect}`, color: '#66ff88',
            life: 1.6, maxLife: 1.6, vy: -1.4
          });
        }
        this.waveDamage = 0;
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

    // Critical-damage vignette: pulsing red frame — the cockpit is burning.
    // Drawn OUTSIDE the shake transform so it reads as cockpit damage, not
    // world damage, and stays rock-steady at the edges.
    if (this.state === 'playing' || this.state === 'levelup') {
      const frac = this.player.maxHp > 0 ? this.player.hp / this.player.maxHp : 1;
      if (frac < 0.35) {
        const pulse = 0.14 + 0.09 * Math.sin(this.time * 6) + (0.35 - frac) * 0.55;
        const vg = ctx.createRadialGradient(w / 2, h / 2, h * 0.34, w / 2, h / 2, h * 0.8);
        vg.addColorStop(0, 'transparent');
        vg.addColorStop(1, `rgba(255,28,18,${Math.min(0.5, pulse).toFixed(3)})`);
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, w, h);
      }
    }
  }

  private renderBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Get current level and environment configuration
    const currentLevel = getLevelForPlayer(this.player.level);
    const envConfig = getEnvironmentForLevel(currentLevel);
    
    // Render environment using the new system
    renderEnvironment(ctx, w, h, envConfig, this.time);

    // Parallax starfield streaming downward — the forward-flight sensation.
    // Depth: near stars are bigger, faster and smear into speed streaks;
    // each star twinkles on its own phase and burns in a real stellar
    // color (white / warm / cool). Streaks lengthen with scroll speed,
    // so ramming the throttle feels like ramming the throttle.
    const range = h + 60;
    const speed = this.starScroll;
    for (const s of this.stars) {
      const y = (((s.y + speed * s.z) % range) + range) % range - 30;
      const x = ((s.x % w) + w) % w;
      const twinkle = 0.72 + 0.28 * Math.sin(this.time * s.twFreq + s.tw);
      ctx.globalAlpha = Math.min(1, (0.22 + s.brightness * 0.55) * twinkle);
      const r = 0.7 + s.z * 0.55;
      const smear = r * (0.9 + s.z * (0.35 + speed * 0.004));
      ctx.fillStyle = s.color;
      ctx.fillRect(x, y, r, smear);
      // The brightest near stars get a subtle four-point flare.
      if (s.z > 3.1 && s.brightness > 0.86) {
        ctx.globalAlpha *= 0.4;
        ctx.fillRect(x - r * 1.6, y + smear * 0.35, r * 4.2, r * 0.4);
        ctx.fillRect(x + r * 0.3, y - r * 1.3, r * 0.4, r * 3.2);
      }
    }
    ctx.globalAlpha = 1;
    // Sector mood wash — every sector carries its own color identity
    // (the classic arcade stage-palette shift).
    const sectorInfo = GameEngine.SECTORS[(this.sector() - 1) % GameEngine.SECTORS.length];
    if (sectorInfo) {
      ctx.fillStyle = sectorInfo.tint;
      ctx.fillRect(0, 0, w, h);
    }
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
        // Auto-fit: long announcements shrink to stay readable on narrow screens.
        let annFont = 32;
        ctx.font = `bold ${annFont}px monospace`;
        const annMaxW = w - 32;
        const annW = ctx.measureText(this.waveAnnouncement.text).width;
        if (annW > annMaxW) {
          annFont = Math.max(16, Math.floor(annFont * annMaxW / annW));
          ctx.font = `bold ${annFont}px monospace`;
        }
        ctx.fillText(this.waveAnnouncement.text, w / 2, h * 0.2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '14px monospace';
        ctx.fillText(this.waveAnnouncement.subtext, w / 2, h * 0.2 + 30);
        ctx.restore();
      }
    }
    this.renderSectorTally(ctx, w, h);
    this.renderBossWarning(ctx, w, h);
  }

  /** Raiden DX-style result panel: SEKTOR JASEN / BREZ ZADETKOV / MEDALJE,
   *  with lines appearing one by one and the total at the bottom. */
  private renderSectorTally(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.sectorTally) return;
    const tally = this.sectorTally;
    const end = 1 + tally.lines.length * 0.7 + 2;
    const alpha = Math.max(0, Math.min(1, (end - tally.timer) / 0.5));
    const panelW = Math.min(400, w - 40);
    const panelH = 64 + tally.lines.length * 32;
    const px = w / 2 - panelW / 2;
    const py = h * 0.34;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(8,10,26,0.85)';
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px, py, panelW, panelH);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('SEKTOR JASEN', w / 2, py + 34);
    ctx.font = 'bold 15px monospace';
    for (let i = 0; i < tally.shown && i < tally.lines.length; i++) {
      const line = tally.lines[i]!;
      const ly = py + 66 + i * 30;
      const last = i === tally.lines.length - 1;
      ctx.textAlign = 'left';
      ctx.fillStyle = last ? '#ffffff' : '#9fd8ff';
      ctx.fillText(line.label, px + 24, ly);
      ctx.textAlign = 'right';
      ctx.fillStyle = last ? '#ffffff' : '#ffd700';
      ctx.fillText(`+${line.value.toLocaleString('en-US')}`, px + panelW - 24, ly);
    }
    ctx.restore();
  }

  /** Gradius homage: full-screen WARNING klaxon while a boss approaches —
   *  pulsing red banner over animated caution stripes, top and bottom. */
  private renderBossWarning(ctx: CanvasRenderingContext2D, w: number, h: number) {
    if (!this.bossPending) return;
    const pulse = 0.55 + 0.45 * Math.sin(this.time * 14);
    const stripeH = 26;
    const offset = (this.time * 120) % 48;
    // Animated caution stripes across the top and bottom of the screen.
    for (const by of [6, h - stripeH - 6]) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, by, w, stripeH);
      ctx.clip();
      ctx.fillStyle = '#111111';
      ctx.fillRect(0, by, w, stripeH);
      ctx.fillStyle = '#ffcc00';
      for (let x = -60 + offset; x < w + 60; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, by + stripeH);
        ctx.lineTo(x + 20, by);
        ctx.lineTo(x + 40, by);
        ctx.lineTo(x + 20, by + stripeH);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    // Pulsing WARNING headline (siren-synced) + static subtext.
    ctx.save();
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.35 + pulse * 0.65;
    ctx.shadowColor = '#ff2233';
    ctx.shadowBlur = 26;
    ctx.fillStyle = '#ff2233';
    // Auto-fit headline: the klaxon must fit narrow (portrait) screens.
    let klaxonFont = Math.round(52 + pulse * 14);
    ctx.font = `bold ${klaxonFont}px monospace`;
    const klaxonMaxW = w - 24;
    const klaxonW = ctx.measureText('\u26A0 POZOR! \u26A0').width;
    if (klaxonW > klaxonMaxW) {
      klaxonFont = Math.max(24, Math.floor(klaxonFont * klaxonMaxW / klaxonW));
      ctx.font = `bold ${klaxonFont}px monospace`;
    }
    ctx.fillText('\u26A0 POZOR! \u26A0', w / 2, h * 0.3);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('VELIKI SOVRAŽNIK SE HITRO BLIŽA', w / 2, h * 0.3 + 44);
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

      // Irregular rocky silhouette (per-asteroid vertex jitter)
      const n = crystal.shape.length;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n;
        const r = crystal.size * (crystal.shape[i] ?? 1);
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();

      // Sun-lit rock: bright face toward the top-left, dark side away
      const g = ctx.createRadialGradient(
        -crystal.size * 0.4, -crystal.size * 0.4, crystal.size * 0.1,
        0, 0, crystal.size * 1.2
      );
      g.addColorStop(0, crystal.color);
      g.addColorStop(1, crystal.dark);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sun-kissed specular highlight: a small hot spot offset toward the
      // key light — sells the rock as a lit 3D body, not a flat blob.
      const spec = ctx.createRadialGradient(
        -crystal.size * 0.42, -crystal.size * 0.46, 0,
        -crystal.size * 0.42, -crystal.size * 0.46, crystal.size * 0.55
      );
      spec.addColorStop(0, 'rgba(255,255,255,0.30)');
      spec.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = spec;
      ctx.beginPath();
      ctx.arc(-crystal.size * 0.42, -crystal.size * 0.46, crystal.size * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Impact craters (deterministic per rock via its shape jitter):
      // each bowl gets a dark floor and a lit rim on the sun-facing edge.
      for (let k = 0; k < 3; k++) {
        const sa = crystal.shape[(k * 3 + 1) % n] ?? 0.8;
        const sb = crystal.shape[(k * 4 + 2) % n] ?? 0.8;
        const ca = sa * Math.PI * 2;
        const cd = crystal.size * (0.15 + sb * 0.45);
        const cr = crystal.size * (0.12 + sb * 0.14);
        const cxp = Math.cos(ca) * cd;
        const cyp = Math.sin(ca) * cd;
        ctx.fillStyle = 'rgba(0,0,0,0.30)';
        ctx.beginPath();
        ctx.arc(cxp, cyp, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = Math.max(0.8, cr * 0.22);
        ctx.beginPath();
        ctx.arc(cxp, cyp, cr * 0.82, Math.PI * 0.7, Math.PI * 1.7);
        ctx.stroke();
      }

      // Battle damage: jagged cracks appear as HP drops (3 stages), derived
      // deterministically from the shape jitter — no per-frame randomness.
      const dmg = 1 - crystal.hp / Math.max(1, crystal.maxHp);
      if (dmg > 0.3) {
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = Math.max(1, crystal.size * 0.06);
        const crackCount = dmg > 0.66 ? 3 : 1;
        for (let k = 0; k < crackCount; k++) {
          const a1 = (crystal.shape[(k * 2 + 1) % n] ?? 0.8) * Math.PI * 2;
          const a2 = a1 + 1.1 + (crystal.shape[(k * 3 + 2) % n] ?? 0.8) * 1.4;
          const midA = (a1 + a2) / 2;
          const midR = crystal.size * 0.3 * (crystal.shape[(k + 3) % n] ?? 0.8);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a1) * crystal.size * 0.85, Math.sin(a1) * crystal.size * 0.85);
          ctx.lineTo(Math.cos(midA) * midR, Math.sin(midA) * midR);
          ctx.lineTo(Math.cos(a2) * crystal.size * 0.7, Math.sin(a2) * crystal.size * 0.7);
          ctx.stroke();
        }
      }

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
        option: '#66ffff',
        capsule: '#ffcc22',
        plasma: '#cc66ff',
        medal: '#ffd700'
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
        option: 'O',
        capsule: 'K',
        plasma: 'L',
        medal: 'Z'
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

    // Gradius shield barrier: segmented ring, one segment per remaining hit
    if (p.arcadeShield > 0) {
      const sa = 0.45 + Math.sin(this.time * 6) * 0.2;
      ctx.strokeStyle = `rgba(102, 255, 204, ${sa.toFixed(2)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < p.arcadeShield; i++) {
        const a = -Math.PI / 2 + (Math.PI * 2 * i) / p.arcadeShield;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 25, Math.sin(a) * 25, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#aaffdd';
        ctx.fill();
      }
    }

    // R-Type wave cannon charge ring around the ship
    if (this.waveCharging) {
      ctx.strokeStyle = this.waveCharge >= 1
        ? `rgba(255,255,255,${(0.7 + Math.sin(this.time * 24) * 0.3).toFixed(2)})`
        : '#ffaa33';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 31, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.waveCharge);
      ctx.stroke();
      if (this.waveCharge >= 1) {
        ctx.strokeStyle = `rgba(255,170,51,${(0.4 + Math.sin(this.time * 20) * 0.3).toFixed(2)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 37, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Invincibility flash
    if (p.invincible > 0 && Math.sin(this.time * 30) > 0) {
      ctx.globalAlpha = 0.5;
    }

    // Ship body — layered fighter (wings → hull → spine → lights → canopy → engines)
    // Nose always points up the screen; slight bank into lateral movement
    // keeps a sense of weight without ever angling the battery.
    const bank = Math.max(-0.35, Math.min(0.35, p.vx * 0.03));
    ctx.rotate(-Math.PI / 2 + bank);

    // Wing spars (rear swept blades)
    ctx.beginPath();
    ctx.moveTo(2, -3);
    ctx.lineTo(-16, -17);
    ctx.lineTo(-7, -5);
    ctx.lineTo(-16, 17);
    ctx.lineTo(2, 3);
    ctx.closePath();
    const wingGrad = ctx.createLinearGradient(0, -17, 0, 17);
    wingGrad.addColorStop(0, '#0077cc');
    wingGrad.addColorStop(0.5, '#00aadd');
    wingGrad.addColorStop(1, '#0077cc');
    ctx.fillStyle = wingGrad;
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Main hull (elongated dart)
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(6, -6.5);
    ctx.lineTo(-10, -5);
    ctx.lineTo(-13, 0);
    ctx.lineTo(-10, 5);
    ctx.lineTo(6, 6.5);
    ctx.closePath();
    const shipGrad = ctx.createLinearGradient(-13, -7, 22, 7);
    shipGrad.addColorStop(0, '#003a66');
    shipGrad.addColorStop(0.45, '#0099dd');
    shipGrad.addColorStop(1, '#ccfaff');
    ctx.fillStyle = shipGrad;
    ctx.fill();
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hull spine stripe
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-9, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Wingtip lights (port red / starboard green — flight convention)
    ctx.beginPath();
    ctx.arc(-13, -12, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4466';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-13, 12, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#44ff88';
    ctx.fill();

    // Cockpit canopy
    ctx.beginPath();
    ctx.ellipse(6, 0, 5.5, 3, 0, 0, Math.PI * 2);
    const cockpit = ctx.createRadialGradient(5, -1, 0.5, 6, 0, 6);
    cockpit.addColorStop(0, '#ffffff');
    cockpit.addColorStop(0.5, '#7fe8ff');
    cockpit.addColorStop(1, '#1177aa');
    ctx.fillStyle = cockpit;
    ctx.fill();

    // Twin engine flames (animated outer cone + white-hot inner core)
    const engineFlicker = 4 + Math.random() * 8;
    for (const side of [-3.2, 3.2]) {
      ctx.beginPath();
      ctx.moveTo(-11, side - 2.2);
      ctx.lineTo(-13 - engineFlicker, side);
      ctx.lineTo(-11, side + 2.2);
      ctx.closePath();
      ctx.fillStyle = `rgba(0, 170, 255, ${0.55 + Math.random() * 0.35})`;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-11, side - 1);
      ctx.lineTo(-12.5 - engineFlicker * 0.55, side);
      ctx.lineTo(-11, side + 1);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fill();
    }

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
    // Straight-fire battery: no aim line or target reticle — shots always
    // travel up the screen, so there is nothing to point at the cursor.
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);

      // Elite aura: pulsing colored ring marks the modified enemy.
      if (e.elite) {
        const affix = GameEngine.ELITE_AFFIXES[e.elite];
        const pulse = 0.55 + 0.45 * Math.sin(this.time * 6 + e.phase);
        ctx.save();
        ctx.globalAlpha = 0.35 + pulse * 0.4;
        ctx.strokeStyle = affix.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 1.5 + pulse * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.16 + pulse * 0.12;
        ctx.fillStyle = affix.color;
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

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

      // Boss roster: skull & station variants have dedicated art
      if (e.type === 'boss' && e.variant === 'skull') {
        this.renderSkullBoss(ctx, e);
        ctx.restore();
        continue;
      }
      if (e.type === 'boss' && e.variant === 'station') {
        this.renderStationBoss(ctx, e);
        ctx.restore();
        continue;
      }
      if (e.type === 'boss' && e.midBoss) {
        this.renderCarrierBoss(ctx, e);
        ctx.restore();
        continue;
      }

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
      } else if (e.type === 'swarmer') {
        // Dart fighter: faces its travel direction, swept wings, engine dot
        const heading = Math.hypot(e.vx, e.vy) > 0.4 ? Math.atan2(e.vy, e.vx) : Math.PI / 2;
        ctx.rotate(heading);
        ctx.beginPath();
        ctx.moveTo(e.size, 0);
        ctx.lineTo(-e.size * 0.55, -e.size * 0.75);
        ctx.lineTo(-e.size * 0.2, 0);
        ctx.lineTo(-e.size * 0.55, e.size * 0.75);
        ctx.closePath();
        ctx.fillStyle = e.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(-e.size * 0.45, 0, e.size * 0.16, 0, Math.PI * 2);
        ctx.fillStyle = '#ffddaa';
        ctx.fill();
      } else if (e.type === 'sniper') {
        // Angular marksman: diamond hull + barrel aimed at the player
        ctx.rotate(Math.atan2(this.player.y - e.y, this.player.x - e.x));
        ctx.beginPath();
        ctx.moveTo(e.size, 0);
        ctx.lineTo(0, -e.size * 0.6);
        ctx.lineTo(-e.size * 0.8, 0);
        ctx.lineTo(0, e.size * 0.6);
        ctx.closePath();
        ctx.fillStyle = e.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.size * 0.5, -e.size * 0.14);
        ctx.lineTo(e.size * 1.35, -e.size * 0.14);
        ctx.lineTo(e.size * 1.35, e.size * 0.14);
        ctx.lineTo(e.size * 0.5, e.size * 0.14);
        ctx.closePath();
        ctx.fillStyle = '#442200';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffdd66';
        ctx.fill();
      } else if (e.type === 'titan') {
        // Heavy gunship: hexagon hull, twin cannons, pulsing core, spinning ring
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI * 2 * i) / 6;
          if (i === 0) ctx.moveTo(Math.cos(a) * e.size, Math.sin(a) * e.size);
          else ctx.lineTo(Math.cos(a) * e.size, Math.sin(a) * e.size);
        }
        ctx.closePath();
        const tg = ctx.createRadialGradient(0, 0, e.size * 0.1, 0, 0, e.size);
        tg.addColorStop(0, '#cc44ff');
        tg.addColorStop(1, '#5500aa');
        ctx.fillStyle = tg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#331144';
        ctx.fillRect(e.size * 0.35, -e.size * 0.55, e.size * 0.7, e.size * 0.22);
        ctx.fillRect(e.size * 0.35, e.size * 0.33, e.size * 0.7, e.size * 0.22);
        const pulse = 0.6 + Math.sin(this.time * 5 + e.phase) * 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,170,255,${pulse.toFixed(2)})`;
        ctx.fill();
        ctx.save();
        ctx.rotate(e.phase);
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 0.5, 0.4, Math.PI - 0.4);
        ctx.strokeStyle = '#ff88ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 0.5, Math.PI + 0.4, Math.PI * 2 - 0.4);
        ctx.stroke();
        ctx.restore();
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

    // Boss / mid-boss HP bar
    const boss = this.enemies.find(e => e.type === 'boss');
    if (boss) {
      const mid = boss.midBoss === true;
      const barWidth = this.width * (mid ? 0.3 : 0.4);
      const barX = (this.width - barWidth) / 2;
      const barY = 60;
      const barH = mid ? 8 : 12;
      ctx.fillStyle = '#222';
      ctx.fillRect(barX, barY, barWidth, barH);
      const hpRatio = Math.max(0, boss.hp / boss.maxHp);
      const isSkull = boss.variant === 'skull';
      const isStation = boss.variant === 'station';
      const hpGrad = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
      if (mid) { hpGrad.addColorStop(0, '#ffdd55'); hpGrad.addColorStop(1, '#ff6600'); }
      else if (isSkull) { hpGrad.addColorStop(0, '#ffaa33'); hpGrad.addColorStop(1, '#ff4400'); }
      else if (isStation) { hpGrad.addColorStop(0, '#66ffcc'); hpGrad.addColorStop(1, '#00aa88'); }
      else { hpGrad.addColorStop(0, '#ff00ff'); hpGrad.addColorStop(1, '#ff0066'); }
      ctx.fillStyle = hpGrad;
      ctx.fillRect(barX, barY, barWidth * hpRatio, barH);
      ctx.strokeStyle = mid ? '#ffaa33' : isSkull ? '#ffaa33' : isStation ? '#66ffcc' : '#ff00ff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barH);
      ctx.fillStyle = '#fff';
      ctx.font = mid ? '9px monospace' : '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        mid ? `PREDSTRAŽA-${this.midBossLetter}` : isSkull ? 'LOBANJA-NIČELA' : isStation ? 'POSTAJA NIČ' : 'VOID TITAN',
        this.width / 2, barY - 4
      );
    }
  }

  /** Mid-boss carrier: hexagonal armored outpost sentinel with orbiting
   *  gun pods and a core eye that burns hotter as it takes damage. */
  private renderCarrierBoss(ctx: CanvasRenderingContext2D, e: Enemy) {
    const s = e.size;
    const t = this.time;
    const hpFrac = e.maxHp > 0 ? e.hp / e.maxHp : 0;
    const bob = Math.sin(t * 2.2) * 3;

    // Pulsing warning aura — boss-class target from the moment it spawns
    const aura = ctx.createRadialGradient(0, bob, 0, 0, bob, s * 2.1);
    aura.addColorStop(0, 'rgba(255,180,60,0.20)');
    aura.addColorStop(0.7, 'rgba(255,120,20,0.08)');
    aura.addColorStop(1, 'transparent');
    ctx.fillStyle = aura;
    ctx.fillRect(-s * 2.1, bob - s * 2.1, s * 4.2, s * 4.2);

    // Orbiting gun pods — the carrier's signature silhouette
    for (const side of [-1, 1]) {
      const pa = t * 1.6 * side;
      const px = Math.cos(pa) * s * 1.05;
      const py = Math.sin(pa) * s * 0.45 + bob;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(pa);
      ctx.fillStyle = '#6a5528';
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffbb22';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#3d2a10';
      ctx.fillRect(-s * 0.06, s * 0.2, s * 0.12, s * 0.3);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(0, bob);

    // Hexagonal armored hull
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      const r = s * (i % 2 === 0 ? 1 : 0.92);
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const hull = ctx.createLinearGradient(0, -s, 0, s);
    hull.addColorStop(0, '#8a6a34');
    hull.addColorStop(0.5, '#5a431e');
    hull.addColorStop(1, '#2e2010');
    ctx.fillStyle = hull;
    ctx.fill();
    ctx.strokeStyle = '#ffbb22';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hull plate seams
    ctx.strokeStyle = 'rgba(255,187,34,0.35)';
    ctx.lineWidth = 1;
    for (const k of [-0.45, 0, 0.45]) {
      ctx.beginPath();
      ctx.moveTo(k * s, -s * 0.75);
      ctx.lineTo(k * s * 0.4, s * 0.75);
      ctx.stroke();
    }

    // Launcher prongs (bottom — where the fans come from)
    ctx.fillStyle = '#8a6a34';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * s * 0.3, s * 0.55);
      ctx.lineTo(side * s * 0.5, s * 1.05);
      ctx.lineTo(side * s * 0.16, s * 0.9);
      ctx.closePath();
      ctx.fill();
    }

    // Core eye — glows hotter the closer it gets to breach
    const corePulse = 0.55 + Math.sin(t * 5) * 0.2 + (1 - hpFrac) * 0.25;
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.42);
    core.addColorStop(0, `rgba(255,240,180,${Math.min(1, corePulse)})`);
    core.addColorStop(0.5, `rgba(255,150,30,${Math.min(1, corePulse * 0.8)})`);
    core.addColorStop(1, 'rgba(120,60,0,0.1)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffbb22';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  /** Mechanical skull boss (Truxton homage): cranium, tracking sockets, jaw. */
  private renderSkullBoss(ctx: CanvasRenderingContext2D, e: Enemy) {
    const s = e.size;
    const bob = Math.sin(this.time * 2) * 4;

    // Side vanes / antennae
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * s * 0.8, -s * 0.1);
      ctx.lineTo(side * s * 1.25, -s * 0.45);
      ctx.lineTo(side * s * 1.05, s * 0.15);
      ctx.closePath();
      ctx.fillStyle = '#8a6a34';
      ctx.fill();
      ctx.strokeStyle = '#3d2a10';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Cranium dome
    ctx.beginPath();
    ctx.arc(0, bob * 0.4, s * 0.85, Math.PI * 0.95, Math.PI * 2.05);
    ctx.closePath();
    const dome = ctx.createRadialGradient(-s * 0.3, -s * 0.3, s * 0.1, 0, 0, s);
    dome.addColorStop(0, '#ffe0b0');
    dome.addColorStop(0.55, '#c89858');
    dome.addColorStop(1, '#6b4a22');
    ctx.fillStyle = dome;
    ctx.fill();
    ctx.strokeStyle = '#3d2a10';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eye sockets — dark pits with tracking glow pupils
    const pdx = this.player.x - e.x, pdy = this.player.y - e.y;
    const pd = Math.hypot(pdx, pdy) || 1;
    for (const side of [-1, 1]) {
      const ex = side * s * 0.34;
      const ey = -s * 0.12 + bob * 0.4;
      ctx.beginPath();
      ctx.ellipse(ex, ey, s * 0.22, s * 0.26, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#1a0e00';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ex + (pdx / pd) * s * 0.09, ey + (pdy / pd) * s * 0.09, s * 0.09, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,170,40,${(0.65 + Math.sin(this.time * 6) * 0.35).toFixed(2)})`;
      ctx.fill();
    }

    // Nasal slit
    ctx.beginPath();
    ctx.moveTo(0, s * 0.12 + bob * 0.4);
    ctx.lineTo(-s * 0.07, s * 0.3 + bob * 0.4);
    ctx.lineTo(s * 0.07, s * 0.3 + bob * 0.4);
    ctx.closePath();
    ctx.fillStyle = '#1a0e00';
    ctx.fill();

    // Jaw with teeth
    const jawY = s * 0.52 + bob * 0.6;
    ctx.beginPath();
    ctx.roundRect(-s * 0.5, jawY, s, s * 0.3, s * 0.08);
    ctx.fillStyle = '#e8c890';
    ctx.fill();
    ctx.strokeStyle = '#3d2a10';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#1a0e00';
    for (let i = 0; i < 7; i++) {
      const tx = -s * 0.42 + (i * s * 0.84) / 6;
      ctx.fillRect(tx - s * 0.045, jawY + s * 0.05, s * 0.09, s * 0.16);
    }
    // Jaw seam glow (about-to-fire feel)
    ctx.strokeStyle = `rgba(255,170,40,${(0.25 + Math.sin(this.time * 4) * 0.2).toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, jawY - s * 0.02);
    ctx.lineTo(s * 0.5, jawY - s * 0.02);
    ctx.stroke();
  }

  /** Void station boss: armored core, rotating defense ring, pods, mast. */
  private renderStationBoss(ctx: CanvasRenderingContext2D, e: Enemy) {
    const s = e.size;

    // Rotating outer defense ring (arc segments + node lights)
    ctx.save();
    ctx.rotate(this.time * 0.7);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, s * 1.15, (Math.PI * 2 * i) / 6, (Math.PI * 2 * i) / 6 + Math.PI / 4.2);
      ctx.strokeStyle = '#3a7a72';
      ctx.lineWidth = s * 0.16;
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6;
      const blink = 0.4 + 0.6 * Math.abs(Math.sin(this.time * 3 + i));
      ctx.beginPath();
      ctx.arc(Math.cos(a) * s * 1.15, Math.sin(a) * s * 1.15, s * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(102,255,204,${blink.toFixed(2)})`; 
      ctx.fill();
    }
    ctx.restore();

    // Four docking pods at 90°
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * 2 * i) / 4 + Math.PI / 4;
      ctx.save();
      ctx.translate(Math.cos(a) * s * 0.72, Math.sin(a) * s * 0.72);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.roundRect(-s * 0.14, -s * 0.22, s * 0.28, s * 0.44, s * 0.06);
      ctx.fillStyle = '#2b6b62';
      ctx.fill();
      ctx.strokeStyle = '#9fe8d8';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }

    // Main hexagonal hull
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI * 2 * i) / 6 + Math.PI / 6;
      const px = Math.cos(a) * s * 0.62, py = Math.sin(a) * s * 0.62;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const hull = ctx.createRadialGradient(-s * 0.2, -s * 0.2, s * 0.08, 0, 0, s * 0.7);
    hull.addColorStop(0, '#8fe8d8');
    hull.addColorStop(0.6, '#2b6b62');
    hull.addColorStop(1, '#12332e');
    ctx.fillStyle = hull;
    ctx.fill();
    ctx.strokeStyle = '#9fe8d8';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Antenna mast with blinking beacon
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(0, -s * 1.0);
    ctx.strokeStyle = '#9fe8d8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -s * 1.02, s * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = Math.sin(this.time * 8) > 0 ? '#ff5577' : '#551122';
    ctx.fill();

    // Reactor core (pulsing)
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.26, 0, Math.PI * 2);
    ctx.fillStyle = '#0a1f1b';
    ctx.fill();
    const corePulse = 0.55 + Math.sin(this.time * 5) * 0.45;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.18);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.4, `rgba(102,255,204,${corePulse.toFixed(2)})`);
    core.addColorStop(1, 'rgba(20,80,70,0)');
    ctx.fillStyle = core;
    ctx.fill();
  }

  private renderBullets(ctx: CanvasRenderingContext2D) {
    for (const b of this.bullets) {
      ctx.save();
      ctx.translate(b.x, b.y);

      const ang = Math.atan2(b.vy, b.vx);

      if (b.type === 'enemy') {
        // ── Enemy plasma orbs ───
        // Anatomy of a Shmup rule: enemy shots must ALWAYS read. Pulsing
        // white outline + motion teardrop + halo + hot core.
        const pulse = 0.45 + 0.3 * Math.sin(this.time * 9 + b.x * 0.08 + b.y * 0.05);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `rgba(255, 255, 255, ${pulse.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(0, 0, b.size + 2.2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.rotate(ang);
        ctx.globalCompositeOperation = 'lighter';
        // Motion teardrop tail — energy smeared opposite the travel
        const tail = ctx.createLinearGradient(-b.size * 3.2, 0, b.size * 0.4, 0);
        tail.addColorStop(0, 'transparent');
        tail.addColorStop(1, b.color + '77');
        ctx.fillStyle = tail;
        ctx.beginPath();
        ctx.ellipse(-b.size * 1.2, 0, b.size * 2.0, b.size * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        // Soft halo
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, b.size * 2.1);
        halo.addColorStop(0, b.color + 'cc');
        halo.addColorStop(0.55, b.color + '44');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, b.size * 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        // Colored core + white-hot center
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(0, 0, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, b.size * 0.52, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      // ── Player shots ───
      ctx.rotate(ang);

      if (b.capsule) {
        if (b.missile) {
          this.renderRocket(ctx, b);
          ctx.restore();
          continue;
        }
        // Energy beam capsule (plasma "toothpaste", wave cannon):
        // additive aura → colored body → white-hot leading filament.
        const len = b.size * 3.4;
        const wid = b.size * 1.6;
        ctx.globalCompositeOperation = 'lighter';
        const aura = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
        aura.addColorStop(0, 'transparent');
        aura.addColorStop(0.45, b.color + '66');
        aura.addColorStop(1, b.color + '22');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.roundRect(-len / 2 - wid * 0.3, -wid * 0.95, len + wid * 0.6, wid * 1.9, wid * 0.95);
        ctx.fill();
        const body = ctx.createLinearGradient(-len / 2, 0, len / 2, 0);
        body.addColorStop(0, 'transparent');
        body.addColorStop(0.4, b.color);
        body.addColorStop(1, b.color + '88');
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.roundRect(-len / 2, -wid / 2, len, wid, wid / 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(len * 0.05, -wid * 0.16, len * 0.42, wid * 0.32, wid * 0.16);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(len * 0.36, 0, b.size * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
        continue;
      }

      // Regular player rounds: tracer streak + additive halo + hot core —
      // shots read as tracer rounds instead of flat dots.
      ctx.globalCompositeOperation = 'lighter';
      const streak = ctx.createLinearGradient(-b.size * 4.5, 0, b.size * 0.6, 0);
      streak.addColorStop(0, 'transparent');
      streak.addColorStop(0.7, b.color + '55');
      streak.addColorStop(1, b.color + 'cc');
      ctx.fillStyle = streak;
      ctx.beginPath();
      ctx.ellipse(-b.size * 1.4, 0, b.size * 2.6, b.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      const halo2 = ctx.createRadialGradient(0, 0, 0, 0, 0, b.size * 2.4);
      halo2.addColorStop(0, b.color + 'aa');
      halo2.addColorStop(1, 'transparent');
      ctx.fillStyle = halo2;
      ctx.beginPath();
      ctx.arc(0, 0, b.size * 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(0, 0, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, b.size * 0.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  /** Realistic rocket: metallic body, warhead nose, swept tail fins and an
   *  animated exhaust flame. Drawn inside a velocity-aligned context so the
   *  airframe banks into every homing turn. */
  private renderRocket(ctx: CanvasRenderingContext2D, b: Bullet) {
    const s = b.size;
    const flicker = 0.75 + Math.sin(this.time * 47 + b.x * 0.7) * 0.25;
    const len = s * 3.4;
    const wid = s * 1.5;

    // ── Exhaust flame (additive, behind the tail) ──
    ctx.globalCompositeOperation = 'lighter';
    const flameLen = len * (0.95 + 0.45 * flicker);
    const flame = ctx.createLinearGradient(-len * 0.5, 0, -len * 0.5 - flameLen, 0);
    flame.addColorStop(0, 'rgba(255,240,190,0.95)');
    flame.addColorStop(0.25, 'rgba(255,170,60,0.75)');
    flame.addColorStop(0.65, 'rgba(255,90,30,0.35)');
    flame.addColorStop(1, 'rgba(120,20,0,0)');
    ctx.fillStyle = flame;
    ctx.beginPath();
    ctx.moveTo(-len * 0.5, -wid * 0.42);
    ctx.quadraticCurveTo(-len * 0.5 - flameLen * 0.55, -wid * 0.1, -len * 0.5 - flameLen, 0);
    ctx.quadraticCurveTo(-len * 0.5 - flameLen * 0.55, wid * 0.1, -len * 0.5, wid * 0.42);
    ctx.closePath();
    ctx.fill();
    // White-hot nozzle dot
    ctx.fillStyle = 'rgba(255,255,230,0.9)';
    ctx.beginPath();
    ctx.arc(-len * 0.46, 0, s * 0.34 * flicker, 0, Math.PI * 2);
    ctx.fill();
    // Shock diamonds: the bright nodes of an over-expanded jet exhaust —
    // the detail that separates a real plume from an orange blob.
    ctx.fillStyle = `rgba(255,255,235,${(0.55 * flicker).toFixed(2)})`;
    for (let i = 1; i <= 2; i++) {
      const dx = -len * 0.5 - flameLen * 0.2 * i;
      const dw = wid * (0.17 - i * 0.045);
      ctx.beginPath();
      ctx.moveTo(dx + dw * 1.7, 0);
      ctx.lineTo(dx, -dw);
      ctx.lineTo(dx - dw * 1.7, 0);
      ctx.lineTo(dx, dw);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // ── Body: metallic gradient cylinder ──
    const body = ctx.createLinearGradient(0, -wid / 2, 0, wid / 2);
    body.addColorStop(0, '#e8e8ee');
    body.addColorStop(0.35, '#b8bcc8');
    body.addColorStop(0.65, '#7c828f');
    body.addColorStop(1, '#4a4e58');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(-len * 0.5, -wid * 0.36, len * 0.72, wid * 0.72, wid * 0.18);
    ctx.fill();
    // Panel line seam
    ctx.strokeStyle = 'rgba(40,44,52,0.5)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-len * 0.18, -wid * 0.36);
    ctx.lineTo(-len * 0.18, wid * 0.36);
    ctx.stroke();

    // ── Warhead nose cone ──
    const nose = ctx.createLinearGradient(0, -wid / 2, 0, wid / 2);
    nose.addColorStop(0, '#ff9a66');
    nose.addColorStop(0.5, '#e04a20');
    nose.addColorStop(1, '#8a2810');
    ctx.fillStyle = nose;
    ctx.beginPath();
    ctx.moveTo(len * 0.66, 0);
    ctx.quadraticCurveTo(len * 0.28, -wid * 0.34, len * 0.2, -wid * 0.34);
    ctx.lineTo(len * 0.2, wid * 0.34);
    ctx.quadraticCurveTo(len * 0.28, wid * 0.34, len * 0.66, 0);
    ctx.closePath();
    ctx.fill();

    // ── Swept tail fins (dark steel, both sides) ──
    ctx.fillStyle = '#5a5e68';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-len * 0.22, side * wid * 0.3);
      ctx.lineTo(-len * 0.52, side * wid * 0.85);
      ctx.lineTo(-len * 0.5, side * wid * 0.3);
      ctx.closePath();
      ctx.fill();
    }

    // ── Leading tip highlight ──
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(len * 0.5, -wid * 0.08, s * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const ratio = Math.max(0, Math.min(1, p.life / (p.maxLife || 1)));

      // Smoke: soft expanding puffs with normal blending — grows and fades
      // like real dissipating exhaust. Never additive: smoke occludes
      // light, it must not emit it.
      if (p.type === 'smoke') {
        const progress = 1 - ratio;
        ctx.save();
        ctx.globalAlpha = ratio * 0.34;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * (0.5 + 0.9 * progress)), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

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
    ctx.fillText('WebGPU vertikalni vesoljski strelec', w / 2, titleY + 70);

    // Start button
    const btnY = h * 0.55;
    const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
    ctx.font = 'bold 20px monospace';
    ctx.fillText('[ KLIKNI ZA ZAČETEK ]', w / 2, btnY);

    // Controls
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px monospace';
    ctx.fillText('WASD / puščice — premikanje', w / 2, h * 0.7);
    ctx.fillText('Miška — ciljanje in streljanje', w / 2, h * 0.7 + 20);
    ctx.fillText('Preslednica — dash (i-frames)', w / 2, h * 0.7 + 40);
    ctx.fillText('Desni klik — sekundarno orožje', w / 2, h * 0.7 + 60);
    ctx.fillText('Q — temporalna staza', w / 2, h * 0.7 + 80);

    // High score
    if (this.highScore > 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '14px monospace';
      ctx.fillText(`NAJBOLJŠI: ${this.highScore.toLocaleString()}`, w / 2, h * 0.88);
    }

    // WebGPU status
    ctx.fillStyle = this.webgpuSupported ? '#00ff88' : '#ff8800';
    ctx.font = '12px monospace';
    ctx.fillText(this.webgpuSupported ? '● WebGPU AKTIVEN — pospešeno na GPU' : '● Canvas2D način', w / 2, h * 0.95);

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
    // Auto-fit: game-over headline must survive very narrow screens.
    const goMaxW = w - 24;
    const goW = ctx.measureText('PRAZNINA ZMAGA').width;
    if (goW > goMaxW) {
      ctx.font = `bold ${Math.max(24, Math.floor(42 * goMaxW / goW))}px monospace`;
    }
    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 20;
    ctx.fillText('PRAZNINA ZMAGA', w / 2, h * 0.25);
    ctx.shadowBlur = 0;

    // Offline hall of fame — top 5 local runs
    if (this.leaderboard.length > 0) {
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#ffcc66';
      ctx.fillText('— TOP 5 TEKI —', w / 2, h * 0.25 + 46);
      ctx.font = '12px monospace';
      for (let i = 0; i < Math.min(5, this.leaderboard.length); i++) {
        const entry = this.leaderboard[i];
        const y = h * 0.25 + 72 + i * 20;
        ctx.fillStyle = i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#8899aa';
        ctx.fillText(
          `${i + 1}. ${entry.score.toLocaleString('sl-SI')} · val ${entry.wave} · ${entry.seed} · ${entry.date}`,
          w / 2, y
        );
      }
    }
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
  getLeaderboard(): LeaderboardEntry[] { return this.leaderboard; }
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
