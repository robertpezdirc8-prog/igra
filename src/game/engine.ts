import { AudioEngine } from './audio';

// ============= TYPES =============
interface Vec2 { x: number; y: number; }
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; size: number;
  color: string; type: 'spark' | 'trail' | 'debris' | 'energy';
}
interface Bullet {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; damage: number;
  life: number; type: 'player' | 'enemy';
}
interface Enemy {
  x: number; y: number; vx: number; vy: number;
  hp: number; maxHp: number; size: number;
  type: 'swarmer' | 'sniper' | 'titan' | 'boss';
  color: string; phase: number; pattern: number;
  shootTimer: number; moveTimer: number;
  targetX: number; targetY: number;
}
interface Player {
  x: number; y: number; vx: number; vy: number;
  hp: number; maxHp: number; shield: number; maxShield: number;
  energy: number; maxEnergy: number;
  speed: number; dashCooldown: number; dashTimer: number;
  invincible: number; shootTimer: number;
  weaponLevel: number; critRate: number; critDmg: number;
  score: number; combo: number; comboTimer: number;
}
interface Upgrade {
  name: string; description: string; icon: string;
  apply: (player: Player) => void;
}
type GameState = 'menu' | 'playing' | 'paused' | 'levelup' | 'gameover';

interface WaveAnnouncement {
  text: string;
  subtext: string;
  timer: number;
  color: string;
}

// ============= GAME ENGINE =============
export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private audio: AudioEngine;
  private state: GameState = 'menu';
  private player: Player;
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private keys: Set<string> = new Set();
  private mouse: Vec2 = { x: 0, y: 0 };
  private mouseDown = false;
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
  private upgrades: Upgrade[] = [];
  private selectedUpgrade = -1;
  private highScore = 0;
  private animFrame = 0;
  private stars: { x: number; y: number; z: number; brightness: number }[] = [];
  private webgpuSupported = false;
  private onStateChange: (state: GameState) => void;
  private waveAnnouncement: WaveAnnouncement | null = null;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: GameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.audio = new AudioEngine();
    this.onStateChange = onStateChange;
    this.player = this.createPlayer();
    this.checkWebGPU();
    this.initStars();
    this.loadHighScore();
    this.generateUpgrades();
  }

  private async checkWebGPU() {
    try {
      const nav = navigator as any;
      if (nav.gpu) {
        const adapter = await nav.gpu.requestAdapter();
        this.webgpuSupported = !!adapter;
      }
    } catch (e) {
      this.webgpuSupported = false;
    }
  }

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
    } catch (e) { this.highScore = 0; }
  }

  private saveHighScore() {
    try {
      if (this.player.score > this.highScore) {
        this.highScore = this.player.score;
        localStorage.setItem('atheria_highscore', this.highScore.toString());
      }
    } catch (e) {}
  }

  private createPlayer(): Player {
    return {
      x: 0, y: 0, vx: 0, vy: 0,
      hp: 100, maxHp: 100, shield: 50, maxShield: 50,
      energy: 100, maxEnergy: 100,
      speed: 5, dashCooldown: 0, dashTimer: 0,
      invincible: 0, shootTimer: 0,
      weaponLevel: 1, critRate: 0.05, critDmg: 2,
      score: 0, combo: 1, comboTimer: 0
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
      { name: 'Entropy Field', description: 'Enemies move 20% slower', icon: '🌀', apply: () => {} },
    ];
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    this.player.x = w / 2;
    this.player.y = h / 2;
  }

  async start() {
    await this.audio.init();
    this.audio.startMusic();
  }

  handleKeyDown(key: string) {
    this.keys.add(key.toLowerCase());
    if (key === 'Escape') {
      if (this.state === 'playing') { this.state = 'paused'; this.onStateChange(this.state); }
      else if (this.state === 'paused') { this.state = 'playing'; this.onStateChange(this.state); }
    }
    if (key === ' ' && this.state === 'playing') {
      this.tryDash();
    }
  }

  handleKeyUp(key: string) {
    this.keys.delete(key.toLowerCase());
  }

  handleMouseMove(x: number, y: number) {
    this.mouse.x = x;
    this.mouse.y = y;
  }

  handleMouseDown() { this.mouseDown = true; }
  handleMouseUp() { this.mouseDown = false; }

  handleClick(x: number, y: number) {
    if (this.state === 'menu') {
      this.startGame();
    } else if (this.state === 'gameover') {
      this.startGame();
    } else if (this.state === 'levelup') {
      this.selectUpgrade(x, y);
    }
  }

  private startGame() {
    this.player = this.createPlayer();
    this.player.x = this.width / 2;
    this.player.y = this.height / 2;
    this.enemies = [];
    this.bullets = [];
    this.particles = [];
    this.wave = 1;
    this.waveTimer = 0;
    this.bossActive = false;
    this.time = 0;
    this.state = 'playing';
    this.onStateChange(this.state);
    this.audio.startMusic();
  }

  private tryDash() {
    if (this.player.dashCooldown <= 0 && this.player.energy >= 20) {
      this.player.dashTimer = 0.15;
      this.player.dashCooldown = 1;
      this.player.invincible = 0.2;
      this.player.energy -= 20;
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

  private selectUpgrade(x: number, y: number) {
    const cardWidth = 180;
    const cardHeight = 220;
    const startX = this.width / 2 - (cardWidth * 1.5 + 20);
    const startY = this.height / 2 - cardHeight / 2;

    for (let i = 0; i < 3; i++) {
      const cx = startX + i * (cardWidth + 20);
      if (x >= cx && x <= cx + cardWidth && y >= startY && y <= startY + cardHeight) {
        this.upgrades[this.selectedUpgrade + i]?.apply(this.player);
        this.audio.playPowerUp();
        this.state = 'playing';
        this.onStateChange(this.state);
        return;
      }
    }
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

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const dist = 400 + Math.random() * 200;
      const type = Math.random() < 0.6 ? 'swarmer' : (Math.random() < 0.7 ? 'sniper' : 'titan');
      this.enemies.push({
        x: this.player.x + Math.cos(angle) * dist,
        y: this.player.y + Math.sin(angle) * dist,
        vx: 0, vy: 0,
        hp: type === 'swarmer' ? 20 : type === 'sniper' ? 40 : 100,
        maxHp: type === 'swarmer' ? 20 : type === 'sniper' ? 40 : 100,
        size: type === 'swarmer' ? 15 : type === 'sniper' ? 20 : 35,
        type,
        color: type === 'swarmer' ? '#ff4444' : type === 'sniper' ? '#ff8800' : '#aa00ff',
        phase: Math.random() * Math.PI * 2,
        pattern: Math.floor(Math.random() * 3),
        shootTimer: Math.random() * 2,
        moveTimer: 0,
        targetX: this.player.x, targetY: this.player.y
      });
    }

    if (this.wave % 5 === 0) {
      this.spawnBoss();
    }
  }

  private spawnBoss() {
    this.bossActive = true;
    this.enemies.push({
      x: this.player.x, y: this.player.y - 350,
      vx: 0, vy: 0,
      hp: 500 + this.wave * 100,
      maxHp: 500 + this.wave * 100,
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
    this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;
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

    this.updatePlayer();
    this.updateEnemies();
    this.updateBullets();
    this.updateParticles();
    this.updateWave();
    this.render();
    this.animFrame = requestAnimationFrame((t) => this.update(t));
  }

  private updatePlayer() {
    const p = this.player;
    const friction = 0.88;
    const accel = 0.8;

    // Movement
    if (this.keys.has('w') || this.keys.has('arrowup')) p.vy -= accel;
    if (this.keys.has('s') || this.keys.has('arrowdown')) p.vy += accel;
    if (this.keys.has('a') || this.keys.has('arrowleft')) p.vx -= accel;
    if (this.keys.has('d') || this.keys.has('arrowright')) p.vx += accel;

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
    if (p.invincible > 0) p.invincible -= this.deltaTime;
    if (p.comboTimer > 0) {
      p.comboTimer -= this.deltaTime;
      if (p.comboTimer <= 0) p.combo = 1;
    }

    // Energy regen
    p.energy = Math.min(p.maxEnergy, p.energy + 8 * this.deltaTime);
    // Shield regen
    p.shield = Math.min(p.maxShield, p.shield + 3 * this.deltaTime);

    // Shooting
    if (this.mouseDown || this.keys.has(' ')) {
      p.shootTimer -= this.deltaTime;
      if (p.shootTimer <= 0) {
        this.playerShoot();
        p.shootTimer = 0.12 / p.weaponLevel;
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

    for (let i = 0; i < Math.min(p.weaponLevel, 5); i++) {
      const spread = (i - (Math.min(p.weaponLevel, 5) - 1) / 2) * 0.15;
      const cos = Math.cos(spread);
      const sin = Math.sin(spread);
      const bvx = (dirX * cos - dirY * sin) * speed;
      const bvy = (dirX * sin + dirY * cos) * speed;
      this.bullets.push({
        x: p.x, y: p.y, vx: bvx, vy: bvy,
        size: isCrit ? 6 : 4, color: isCrit ? '#ffff00' : '#00ffff',
        damage: (10 + p.weaponLevel * 3) * (isCrit ? p.critDmg : 1),
        life: 2, type: 'player'
      });
    }
    this.audio.playShoot();
  }

  private updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.phase += this.deltaTime * 2;
      e.shootTimer -= this.deltaTime;
      e.moveTimer -= this.deltaTime;

      if (e.type === 'boss') {
        this.updateBoss(e);
      } else {
        // Move toward player
        const dx = this.player.x - e.x;
        const dy = this.player.y - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const speed = e.type === 'swarmer' ? 2.5 : e.type === 'sniper' ? 1 : 0.8;
        
        if (e.type === 'swarmer') {
          e.vx += (dx / dist) * speed * 0.1;
          e.vy += (dy / dist) * speed * 0.1;
          e.vx += Math.sin(e.phase * 3) * 0.3;
          e.vy += Math.cos(e.phase * 3) * 0.3;
        } else if (e.type === 'sniper') {
          if (dist > 250) {
            e.vx += (dx / dist) * speed * 0.05;
            e.vy += (dy / dist) * speed * 0.05;
          } else if (dist < 180) {
            e.vx -= (dx / dist) * speed * 0.05;
            e.vy -= (dy / dist) * speed * 0.05;
          }
        } else {
          e.vx += (dx / dist) * speed * 0.03;
          e.vy += (dy / dist) * speed * 0.03;
        }

        e.vx *= 0.95;
        e.vy *= 0.95;
        e.x += e.vx;
        e.y += e.vy;

        // Shooting
        if (e.shootTimer <= 0) {
          const shootInterval = e.type === 'swarmer' ? 1.5 : e.type === 'sniper' ? 2.5 : 3;
          e.shootTimer = shootInterval;
          this.enemyShoot(e);
        }
      }

      // Check death
      if (e.hp <= 0) {
        this.onEnemyDeath(e);
        this.enemies.splice(i, 1);
      }
    }
  }

  private updateBoss(boss: Enemy) {
    const dx = this.player.x - boss.x;
    const dy = this.player.y - boss.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    
    // Boss movement - orbit and approach
    boss.x += Math.sin(boss.phase * 0.5) * 2;
    boss.y += Math.cos(boss.phase * 0.3) * 1;
    if (dist > 300) {
      boss.x += (dx / dist) * 1.5;
      boss.y += (dy / dist) * 1.5;
    }

    // Boss attack patterns
    if (boss.shootTimer <= 0) {
      boss.shootTimer = 0.3;
      const pattern = boss.pattern;
      
      if (pattern === 0) {
        // Spiral pattern
        const angle = boss.phase * 3;
        for (let i = 0; i < 8; i++) {
          const a = angle + (Math.PI * 2 * i) / 8;
          this.bullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(a) * 4, vy: Math.sin(a) * 4,
            size: 5, color: '#ff00ff', damage: 15,
            life: 4, type: 'enemy'
          });
        }
      } else if (pattern === 1) {
        // Aimed burst
        const baseAngle = Math.atan2(dy, dx);
        for (let i = -2; i <= 2; i++) {
          const a = baseAngle + i * 0.2;
          this.bullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(a) * 6, vy: Math.sin(a) * 6,
            size: 6, color: '#ff44ff', damage: 20,
            life: 3, type: 'enemy'
          });
        }
      } else if (pattern === 2) {
        // Lissajous pattern
        const t = boss.phase;
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 * i) / 12;
          const r = 3 + Math.sin(t * 2 + i) * 2;
          this.bullets.push({
            x: boss.x, y: boss.y,
            vx: Math.cos(a) * r, vy: Math.sin(a) * r,
            size: 4, color: '#ff88ff', damage: 12,
            life: 4, type: 'enemy'
          });
        }
      } else {
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
      }
    }
  }

  private enemyShoot(e: Enemy) {
    const dx = this.player.x - e.x;
    const dy = this.player.y - e.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    if (e.type === 'swarmer') {
      this.bullets.push({
        x: e.x, y: e.y,
        vx: (dx / dist) * 4, vy: (dy / dist) * 4,
        size: 3, color: '#ff6644', damage: 8,
        life: 3, type: 'enemy'
      });
    } else if (e.type === 'sniper') {
      for (let i = -1; i <= 1; i++) {
        const angle = Math.atan2(dy, dx) + i * 0.1;
        this.bullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * 7, vy: Math.sin(angle) * 7,
          size: 4, color: '#ffaa00', damage: 12,
          life: 2.5, type: 'enemy'
        });
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6 + e.phase;
        this.bullets.push({
          x: e.x, y: e.y,
          vx: Math.cos(angle) * 3, vy: Math.sin(angle) * 3,
          size: 5, color: '#aa44ff', damage: 10,
          life: 3, type: 'enemy'
        });
      }
    }
  }

  private onEnemyDeath(e: Enemy) {
    this.player.score += (e.type === 'boss' ? 1000 : e.type === 'titan' ? 100 : 25) * this.player.combo;
    this.player.combo = Math.min(10, this.player.combo + 1);
    this.player.comboTimer = 5;
    this.screenShake = e.type === 'boss' ? 20 : 5;
    this.audio.playExplosion();

    // Death particles
    for (let i = 0; i < (e.type === 'boss' ? 80 : 20); i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.particles.push({
        x: e.x, y: e.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1 + Math.random(), maxLife: 1.5, size: Math.random() * 4 + 2,
        color: e.color, type: 'debris'
      });
    }

    if (e.type === 'boss') {
      this.bossActive = false;
    }
  }

  private updateBullets() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx;
      b.y += b.vy;
      b.life -= this.deltaTime;

      if (b.life <= 0 || b.x < -50 || b.x > this.width + 50 || b.y < -50 || b.y > this.height + 50) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.type === 'player') {
        // Check enemy hits
        for (const e of this.enemies) {
          const dx = b.x - e.x;
          const dy = b.y - e.y;
          if (dx * dx + dy * dy < (e.size + b.size) * (e.size + b.size)) {
            e.hp -= b.damage;
            this.bullets.splice(i, 1);
            // Hit particles
            for (let j = 0; j < 5; j++) {
              this.particles.push({
                x: b.x, y: b.y,
                vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                life: 0.3, maxLife: 0.3, size: 2,
                color: b.color, type: 'spark'
              });
            }
            break;
          }
        }
      } else {
        // Check player hit
        if (this.player.invincible <= 0) {
          const dx = b.x - this.player.x;
          const dy = b.y - this.player.y;
          if (dx * dx + dy * dy < (12 + b.size) * (12 + b.size)) {
            this.damagePlayer(b.damage);
            this.bullets.splice(i, 1);
          }
        }
      }
    }
  }

  private damagePlayer(amount: number) {
    const p = this.player;
    if (p.shield > 0) {
      const shieldDmg = Math.min(p.shield, amount);
      p.shield -= shieldDmg;
      amount -= shieldDmg;
    }
    p.hp -= amount;
    p.invincible = 0.5;
    this.screenShake = 8;
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
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= this.deltaTime;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    // Limit particles
    if (this.particles.length > 2000) {
      this.particles.splice(0, this.particles.length - 2000);
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
          this.state = 'levelup';
          this.onStateChange(this.state);
          this.selectedUpgrade = Math.floor(Math.random() * (this.upgrades.length - 2));
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

    // Post-processing: edge glow effect
    if (this.state === 'playing' || this.state === 'levelup') {
      // Subtle vignette pulse on damage
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
      this.renderGame(ctx, w, h);
      this.renderLevelUp(ctx, w, h);
    } else {
      this.renderGame(ctx, w, h);
    }

    ctx.restore();
  }

  private renderBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Deep space gradient
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
    grad.addColorStop(0, '#0a0015');
    grad.addColorStop(0.5, '#050010');
    grad.addColorStop(1, '#000005');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars with parallax
    for (const star of this.stars) {
      const sx = ((star.x + this.time * 10 * star.z) % w + w) % w;
      const sy = ((star.y + this.time * 5 * star.z) % h + h) % h;
      const brightness = (Math.sin(this.time * 2 + star.brightness * 10) + 1) * 0.5;
      const size = star.z * (0.5 + brightness * 0.5);
      ctx.fillStyle = `rgba(200, 200, 255, ${0.3 + brightness * 0.7})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nebula clouds
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 5; i++) {
      const nx = w / 2 + Math.sin(this.time * 0.1 + i * 1.5) * 300;
      const ny = h / 2 + Math.cos(this.time * 0.08 + i * 2.1) * 200;
      const radius = 200 + Math.sin(this.time * 0.3 + i) * 50;
      const nGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius);
      const colors = ['#4400aa', '#aa0044', '#004488', '#004422', '#440022'];
      nGrad.addColorStop(0, colors[i % colors.length]);
      nGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nGrad;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalAlpha = 1;

    // Animated cosmic grid with perspective
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSize = 80;
    const offsetX = (this.time * 15) % gridSize;
    const offsetY = (this.time * 10) % gridSize;
    for (let x = -gridSize + offsetX; x < w + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = -gridSize + offsetY; y < h + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Floating cosmic debris (large dim circles)
    ctx.globalAlpha = 0.015;
    for (let i = 0; i < 8; i++) {
      const dx = (w * 0.3 + Math.sin(this.time * 0.05 + i * 0.8) * w * 0.4);
      const dy = (h * 0.3 + Math.cos(this.time * 0.04 + i * 1.1) * h * 0.4);
      const dr = 40 + Math.sin(this.time * 0.2 + i) * 20;
      const dGrad = ctx.createRadialGradient(dx, dy, 0, dx, dy, dr);
      dGrad.addColorStop(0, '#ff00ff');
      dGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = dGrad;
      ctx.beginPath();
      ctx.arc(dx, dy, dr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private renderGame(ctx: CanvasRenderingContext2D, w: number, h: number) {
    this.renderParticles(ctx);
    this.renderBullets(ctx);
    this.renderEnemies(ctx);
    this.renderPlayer(ctx);
    this.renderHUD(ctx, w, h);
  }

  private renderPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.player;
    ctx.save();
    ctx.translate(p.x, p.y);

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

    // Ship body - angular design
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

    // Engine glow - multiple thrusters
    const engineFlicker = Math.random() * 8;
    ctx.beginPath();
    ctx.moveTo(-6, -3);
    ctx.lineTo(-16 - engineFlicker, -2);
    ctx.lineTo(-16 - engineFlicker, 2);
    ctx.lineTo(-6, 3);
    ctx.closePath();
    ctx.fillStyle = `rgba(0, 150, 255, ${0.6 + Math.random() * 0.4})`;
    ctx.fill();
    
    // Secondary engine glow
    ctx.beginPath();
    ctx.moveTo(-6, -2);
    ctx.lineTo(-12 - engineFlicker * 0.5, 0);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fillStyle = `rgba(200, 240, 255, ${0.7 + Math.random() * 0.3})`;
    ctx.fill();

    ctx.restore();

    // Shield visual - animated arc
    if (p.shield > 0) {
      const shieldAngle = Math.PI * 2 * (p.shield / p.maxShield);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 22, this.time * 2, this.time * 2 + shieldAngle);
      ctx.strokeStyle = `rgba(0, 200, 255, ${0.4 + Math.sin(this.time * 3) * 0.2})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      
      // Shield sparkles
      if (Math.random() < 0.1) {
        const sparkAngle = this.time * 2 + Math.random() * shieldAngle;
        this.particles.push({
          x: p.x + Math.cos(sparkAngle) * 22,
          y: p.y + Math.sin(sparkAngle) * 22,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 0.3, maxLife: 0.3, size: 1.5,
          color: '#00ccff', type: 'spark'
        });
      }
    }
  }

  private renderEnemies(ctx: CanvasRenderingContext2D) {
    for (const e of this.enemies) {
      ctx.save();
      ctx.translate(e.x, e.y);

      // Glow
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, e.size * 2);
      glow.addColorStop(0, e.color + '44');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.fillRect(-e.size * 2, -e.size * 2, e.size * 4, e.size * 4);

      if (e.type === 'boss') {
        // Boss - cosmic horror entity
        // Outer tendrils
        ctx.rotate(e.phase * 0.3);
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
        const sides = 8;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const a = (Math.PI * 2 * i) / sides;
          const r = e.size + Math.sin(a * 3 + e.phase * 2) * 12 + Math.cos(a * 5 + e.phase) * 6;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
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

        // Inner rings
        ctx.beginPath();
        ctx.arc(0, 0, e.size * 0.6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 100, 255, 0.5)';
        ctx.lineWidth = 1;
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

        // Pupil that tracks player
        const toPlayerX = this.player.x - e.x;
        const toPlayerY = this.player.y - e.y;
        const toPlayerDist = Math.sqrt(toPlayerX * toPlayerX + toPlayerY * toPlayerY) || 1;
        ctx.beginPath();
        ctx.arc((toPlayerX / toPlayerDist) * 4, (toPlayerY / toPlayerDist) * 4, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
      } else if (e.type === 'titan') {
        // Titan - heavy armored
        ctx.rotate(e.phase * 0.2);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 * i) / 8;
          const r = e.size * (i % 2 === 0 ? 1 : 0.7);
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fillStyle = e.color;
        ctx.fill();
        ctx.strokeStyle = '#ff88ff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (e.type === 'sniper') {
        // Sniper - elongated
        const angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(e.size, 0);
        ctx.lineTo(-e.size * 0.5, -e.size * 0.4);
        ctx.lineTo(-e.size * 0.3, 0);
        ctx.lineTo(-e.size * 0.5, e.size * 0.4);
        ctx.closePath();
        ctx.fillStyle = e.color;
        ctx.fill();
        ctx.strokeStyle = '#ffcc00';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        // Swarmer - small triangle
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

      // HP bar for non-boss (drawn outside rotation)
      if (e.type !== 'boss' && e.hp < e.maxHp) {
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
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
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
    ctx.fillStyle = '#fff';
    ctx.font = '9px monospace';
    ctx.fillText(`SHIELD ${Math.ceil(p.shield)}`, padding + 4, h - 31);

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

    // FPS
    ctx.fillStyle = this.fps >= 50 ? '#00ff00' : this.fps >= 30 ? '#ffff00' : '#ff0000';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${this.fps}`, padding, 20);
    ctx.fillText(`ENTITIES: ${this.enemies.length + this.bullets.length + this.particles.length}`, padding, 32);
    if (this.webgpuSupported) {
      ctx.fillStyle = '#00ffaa';
      ctx.fillText('WebGPU ✓', padding, 44);
    }

    // Dash cooldown indicator
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
        const scale = 1 + (1 - alpha) * 0.3;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.translate(w / 2, h * 0.2);
        ctx.scale(scale, scale);
        
        // Glow
        ctx.shadowColor = this.waveAnnouncement.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = this.waveAnnouncement.color;
        ctx.font = 'bold 32px monospace';
        ctx.fillText(this.waveAnnouncement.text, 0, 0);
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '14px monospace';
        ctx.fillText(this.waveAnnouncement.subtext, 0, 30);
        
        ctx.restore();
      }
    }
  }

  private renderMenu(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Vortex particles in background
    this.renderParticles(ctx);

    // Title
    ctx.save();
    ctx.textAlign = 'center';

    // Title glow
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

    // Subtitle
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
    ctx.fillText('ESC - Pause', w / 2, h * 0.7 + 60);

    // High score
    if (this.highScore > 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = '14px monospace';
      ctx.fillText(`HIGH SCORE: ${this.highScore.toLocaleString()}`, w / 2, h * 0.88);
    }

    // WebGPU status
    ctx.fillStyle = this.webgpuSupported ? '#00ff88' : '#ff8800';
    ctx.font = '10px monospace';
    ctx.fillText(this.webgpuSupported ? '● WebGPU Available' : '● Canvas2D Fallback Mode', w / 2, h * 0.95);

    ctx.restore();

    // Spawn menu particles
    if (Math.random() < 0.3) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 200 + Math.random() * 100;
      this.particles.push({
        x: w / 2 + Math.cos(angle) * dist,
        y: h / 2 + Math.sin(angle) * dist,
        vx: -Math.cos(angle) * 2, vy: -Math.sin(angle) * 2,
        life: 2, maxLife: 2, size: 2,
        color: Math.random() < 0.5 ? '#00ffff' : '#ff00ff',
        type: 'energy'
      });
    }
  }

  private renderLevelUp(ctx: CanvasRenderingContext2D, w: number, h: number) {
    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 28px monospace';
    ctx.fillText('CHOOSE AN UPGRADE', w / 2, h * 0.25);

    const cardWidth = 180;
    const cardHeight = 220;
    const startX = w / 2 - (cardWidth * 1.5 + 20);
    const startY = h / 2 - cardHeight / 2;

    for (let i = 0; i < 3; i++) {
      const upgrade = this.upgrades[this.selectedUpgrade + i];
      if (!upgrade) continue;
      const cx = startX + i * (cardWidth + 20);
      const cy = startY;

      // Card background
      const isHover = this.mouse.x >= cx && this.mouse.x <= cx + cardWidth &&
                      this.mouse.y >= cy && this.mouse.y <= cy + cardHeight;
      
      ctx.fillStyle = isHover ? 'rgba(0, 255, 255, 0.2)' : 'rgba(20, 20, 40, 0.9)';
      ctx.fillRect(cx, cy, cardWidth, cardHeight);
      ctx.strokeStyle = isHover ? '#00ffff' : '#444488';
      ctx.lineWidth = isHover ? 3 : 1;
      ctx.strokeRect(cx, cy, cardWidth, cardHeight);

      // Icon
      ctx.font = '36px serif';
      ctx.fillText(upgrade.icon, cx + cardWidth / 2, cy + 50);

      // Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px monospace';
      ctx.fillText(upgrade.name, cx + cardWidth / 2, cy + 90);

      // Description
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '11px monospace';
      const words = upgrade.description.split(' ');
      let line = '';
      let lineY = cy + 115;
      for (const word of words) {
        const test = line + word + ' ';
        if (ctx.measureText(test).width > cardWidth - 20) {
          ctx.fillText(line.trim(), cx + cardWidth / 2, lineY);
          line = word + ' ';
          lineY += 15;
        } else {
          line = test;
        }
      }
      ctx.fillText(line.trim(), cx + cardWidth / 2, lineY);
    }
  }

  private renderGameOver(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff0044';
    ctx.font = 'bold 42px monospace';
    ctx.shadowColor = '#ff0044';
    ctx.shadowBlur = 20;
    ctx.fillText('VOID CONSUMED', w / 2, h * 0.3);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px monospace';
    ctx.fillText(`Final Score: ${this.player.score.toLocaleString()}`, w / 2, h * 0.45);
    ctx.fillText(`Wave Reached: ${this.wave}`, w / 2, h * 0.5);
    ctx.fillText(`Max Combo: ${this.player.combo}x`, w / 2, h * 0.55);

    if (this.player.score >= this.highScore && this.player.score > 0) {
      ctx.fillStyle = '#ffaa00';
      ctx.font = 'bold 16px monospace';
      ctx.fillText('★ NEW HIGH SCORE ★', w / 2, h * 0.62);
    }

    const pulse = Math.sin(this.time * 3) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`;
    ctx.font = 'bold 18px monospace';
    ctx.fillText('[ CLICK TO RETRY ]', w / 2, h * 0.75);
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

  destroy() {
    this.stopLoop();
    this.audio.dispose();
  }
}
