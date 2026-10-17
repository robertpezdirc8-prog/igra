// Classic Arcade Game Engine - Integration of all systems
// Inspired by Alpha Mission II, Image Fight, and Varth: Operation Thunderstorm

import { ClassicShooterSystem, WeaponType, ArmorType, PodType } from './classicShooter';
import { VerticalScrollingSystem, WaveSystem } from './verticalScroller';
import { BossSystem } from './bossSystem';
import { DestructibleEnvironmentSystem } from './destructibleEnvironment';
import { ClassicEnemySystem, EnemyType } from './classicEnemySystem';
import { ProceduralAudioSystem } from './audioSystem';

export interface ClassicPlayer {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  hp: number;
  maxHp: number;
  invincible: number;
  fireTimer: number;
}

export interface ClassicBullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  size: number;
  color: string;
  isPlayerBullet: boolean;
  life: number;
}

export interface ClassicPowerUp {
  id: string;
  type: 'weapon' | 'armor' | 'pod' | 'speed' | 'bomb' | 'score';
  weaponType?: WeaponType;
  armorType?: ArmorType;
  podType?: PodType;
  x: number;
  y: number;
  vy: number;
  life: number;
  value: number;
}

export type ClassicGameState = 'loading' | 'menu' | 'playing' | 'paused' | 'gameover' | 'stageclear' | 'bossfight' | 'levelup' | 'levelchoice';

export class ClassicArcadeEngine {
  // Canvas
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  // Systems
  private shooterSystem: ClassicShooterSystem;
  private scrollingSystem: VerticalScrollingSystem;
  private waveSystem: WaveSystem;
  private bossSystem: BossSystem;
  private environmentSystem: DestructibleEnvironmentSystem;
  private enemySystem: ClassicEnemySystem;
  private audio: ProceduralAudioSystem;

  // Game state
  private state: ClassicGameState = 'menu';
  private player: ClassicPlayer;
  private bullets: ClassicBullet[] = [];
  private powerUps: ClassicPowerUp[] = [];
  private score: number = 0;
  private lives: number = 3;
  private stage: number = 1;
  private bulletIdCounter: number = 0;
  private powerUpIdCounter: number = 0;

  // Input
  private keys: Set<string> = new Set();
  private mouseDown: boolean = false;
  // Bound input handlers (kept so destroy() can remove the listeners)
  private handleKeyDown!: (e: KeyboardEvent) => void;
  private handleKeyUp!: (e: KeyboardEvent) => void;
  private handleMouseDown!: (e: MouseEvent) => void;
  private handleMouseUp!: (e: MouseEvent) => void;
  private handleMouseMove!: (e: MouseEvent) => void;

  // Callbacks
  private onStateChange: (state: ClassicGameState) => void;

  constructor(canvas: HTMLCanvasElement, onStateChange: (state: ClassicGameState) => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onStateChange = onStateChange;

    // Initialize systems
    this.shooterSystem = new ClassicShooterSystem();
    this.scrollingSystem = new VerticalScrollingSystem();
    this.waveSystem = new WaveSystem();
    this.bossSystem = new BossSystem();
    this.environmentSystem = new DestructibleEnvironmentSystem(800, 600);
    this.enemySystem = new ClassicEnemySystem();
    this.audio = new ProceduralAudioSystem();

    // Initialize player
    this.player = {
      x: 400,
      y: 500,
      width: 40,
      height: 40,
      speed: 5,
      hp: 1,
      maxHp: 1,
      invincible: 0,
      fireTimer: 0
    };

    this.setupInput();
  }

  private setupInput() {
    this.handleKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase());
      
      if (e.key === 'Escape') {
        if (this.state === 'playing') {
          this.state = 'paused';
          this.onStateChange(this.state);
        } else if (this.state === 'paused') {
          this.state = 'playing';
          this.onStateChange(this.state);
        }
      }

      // Bomb
      if (e.key === 'b' || e.key === 'B') {
        this.useBomb();
      }
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase());
    };

    this.handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        this.mouseDown = true;
      }
    };

    this.handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        this.mouseDown = false;
      }
    };

    this.handleMouseMove = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update player position based on mouse
      if (this.state === 'playing') {
        this.player.x = Math.max(this.player.width / 2, Math.min(this.width - this.player.width / 2, x));
        this.player.y = Math.max(this.player.height / 2, Math.min(this.height - this.player.height / 2, y));
      }
    };

    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
  }

  /** Remove all event listeners — must be called when the mode unmounts. */
  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
  }

  resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.environmentSystem = new DestructibleEnvironmentSystem(width, height);
  }

  startGame() {
    this.state = 'playing';
    this.score = 0;
    this.lives = 3;
    this.stage = 1;
    this.shooterSystem.reset();
    this.waveSystem.reset();
    this.bullets = [];
    this.powerUps = [];
    this.enemySystem.clear();
    this.bossSystem.clearBoss();
    this.environmentSystem.generateEnvironment(this.stage, 100);
    this.onStateChange(this.state);
  }

  update(deltaTime: number) {
    if (this.state !== 'playing') return;

    // Update player movement
    this.updatePlayer(deltaTime);

    // Update shooting
    this.updateShooting(deltaTime);

    // Update systems
    this.scrollingSystem.update(deltaTime, this.height);
    this.waveSystem.update(deltaTime);
    this.environmentSystem.update(deltaTime, 100);
    this.enemySystem.update(deltaTime, this.player.x, this.player.y, this.width, this.height);

    // Spawn enemies from waves
    const spawnResult = this.waveSystem.shouldSpawnEnemy();
    if (spawnResult.shouldSpawn && spawnResult.enemyType) {
      const x = Math.random() * this.width;
      const y = -50;
      this.enemySystem.spawnEnemy(spawnResult.enemyType.type as EnemyType, x, y, this.stage);
    }

    // Check for wave completion
    if (this.waveSystem.isCurrentWaveComplete()) {
      if (this.waveSystem.getCurrentWave()?.isBossWave) {
        this.startBossFight();
      } else {
        this.nextWave();
      }
    }

    // Update boss
    if (this.bossSystem.getCurrentBoss()) {
      this.bossSystem.update(deltaTime, this.player.x, this.player.y, this.width, this.height);
      
      // Boss attacks
      const attackResult = this.bossSystem.shouldAttack();
      if (attackResult.shouldAttack && attackResult.pattern) {
        this.bossAttack(attackResult.pattern);
      }

      // Check if boss is defeated
      if (this.bossSystem.isBossDefeated()) {
        this.stageComplete();
      }
    }

    // Update bullets
    this.updateBullets(deltaTime);

    // Update power-ups
    this.updatePowerUps(deltaTime);

    // Check collisions
    this.checkCollisions();

    // Update player invincibility
    if (this.player.invincible > 0) {
      this.player.invincible -= deltaTime;
    }
  }

  private updatePlayer(deltaTime: number) {
    const speed = this.shooterSystem.getSpeed();
    const moveSpeed = speed * 60 * deltaTime;

    // Keyboard movement
    if (this.keys.has('arrowleft') || this.keys.has('a')) {
      this.player.x -= moveSpeed;
    }
    if (this.keys.has('arrowright') || this.keys.has('d')) {
      this.player.x += moveSpeed;
    }
    if (this.keys.has('arrowup') || this.keys.has('w')) {
      this.player.y -= moveSpeed;
    }
    if (this.keys.has('arrowdown') || this.keys.has('s')) {
      this.player.y += moveSpeed;
    }

    // Keep player in bounds
    this.player.x = Math.max(this.player.width / 2, Math.min(this.width - this.player.width / 2, this.player.x));
    this.player.y = Math.max(this.player.height / 2, Math.min(this.height - this.player.height / 2, this.player.y));
  }

  private updateShooting(deltaTime: number) {
    this.player.fireTimer += deltaTime;

    const weapon = this.shooterSystem.getWeapon();
    const fireInterval = 1 / weapon.fireRate;

    if ((this.mouseDown || this.keys.has(' ')) && this.player.fireTimer >= fireInterval) {
      this.player.fireTimer = 0;
      this.playerShoot();
    }
  }

  private playerShoot() {
    const weapon = this.shooterSystem.getWeapon();

    // Play shoot sound
    this.audio.playShoot(1 + Math.random() * 0.2);

    // Main weapon
    for (let i = 0; i < weapon.projectileCount; i++) {
      const angle = -Math.PI / 2 + (i - (weapon.projectileCount - 1) / 2) * weapon.spread;
      const vx = Math.cos(angle) * weapon.projectileSpeed;
      const vy = Math.sin(angle) * weapon.projectileSpeed;

      this.bullets.push({
        id: `bullet_${this.bulletIdCounter++}`,
        x: this.player.x,
        y: this.player.y - this.player.height / 2,
        vx,
        vy,
        damage: weapon.damage,
        size: weapon.projectileSize,
        color: weapon.projectileColor,
        isPlayerBullet: true,
        life: 3
      });
    }

    // Pod weapons
    const leftPod = this.shooterSystem.getLeftPod();
    const rightPod = this.shooterSystem.getRightPod();

    if (leftPod && leftPod.type !== 'none') {
      this.bullets.push({
        id: `bullet_${this.bulletIdCounter++}`,
        x: this.player.x + leftPod.offset.x,
        y: this.player.y + leftPod.offset.y - 20,
        vx: 0,
        vy: -10,
        damage: leftPod.damage,
        size: 4,
        color: '#00ffff',
        isPlayerBullet: true,
        life: 3
      });
    }

    if (rightPod && rightPod.type !== 'none') {
      this.bullets.push({
        id: `bullet_${this.bulletIdCounter++}`,
        x: this.player.x + rightPod.offset.x,
        y: this.player.y + rightPod.offset.y - 20,
        vx: 0,
        vy: -10,
        damage: rightPod.damage,
        size: 4,
        color: '#00ffff',
        isPlayerBullet: true,
        life: 3
      });
    }
  }

  private updateBullets(deltaTime: number) {
    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * 60 * deltaTime;
      bullet.y += bullet.vy * 60 * deltaTime;
      bullet.life -= deltaTime;
    }

    // Remove off-screen or expired bullets
    this.bullets = this.bullets.filter(b => 
      b.life > 0 && 
      b.x > -50 && b.x < this.width + 50 && 
      b.y > -50 && b.y < this.height + 50
    );
  }

  private updatePowerUps(deltaTime: number) {
    for (const powerUp of this.powerUps) {
      powerUp.y += powerUp.vy * 60 * deltaTime;
      powerUp.life -= deltaTime;
    }

    // Remove off-screen or expired power-ups
    this.powerUps = this.powerUps.filter(p => p.life > 0 && p.y < this.height + 50);
  }

  private checkCollisions() {
    // Player bullets vs enemies
    for (const bullet of this.bullets) {
      if (!bullet.isPlayerBullet) continue;

      const enemy = this.enemySystem.checkCollision(
        bullet.x - bullet.size / 2,
        bullet.y - bullet.size / 2,
        bullet.size,
        bullet.size
      );

      if (enemy) {
        const result = this.enemySystem.damageEnemy(enemy.id, bullet.damage);
        bullet.life = 0;

        if (result.destroyed && result.enemy) {
          this.score += result.enemy.score;
          
          // Play explosion sound
          this.audio.playExplosion();
          
          // Drop power-up
          if (result.enemy.dropsPowerUp && Math.random() < result.enemy.powerUpChance) {
            this.spawnPowerUp(result.enemy.x, result.enemy.y);
          }
        }
      }

      // Player bullets vs boss
      const boss = this.bossSystem.getCurrentBoss();
      if (boss) {
        if (this.checkBulletBossCollision(bullet, boss)) {
          const defeated = this.bossSystem.damageBoss(bullet.damage);
          bullet.life = 0;

          if (defeated) {
            this.score += boss.score;
          }
        }
      }

      // Player bullets vs destructible environment
      const envCollision = this.environmentSystem.checkCollision(
        bullet.x - bullet.size / 2,
        bullet.y - bullet.size / 2,
        bullet.size,
        bullet.size
      );

      if (envCollision.hitObject) {
        const result = this.environmentSystem.damageObject(envCollision.hitObject.id, bullet.damage);
        bullet.life = 0;

        if (result.destroyed) {
          this.score += envCollision.hitObject.score;
          
          if (result.shouldDropPowerUp) {
            this.spawnPowerUp(envCollision.hitObject.x, envCollision.hitObject.y);
          }
        }
      }
    }

    // Enemy bullets vs player
    if (this.player.invincible <= 0) {
      for (const bullet of this.bullets) {
        if (bullet.isPlayerBullet) continue;

        if (this.checkBulletPlayerCollision(bullet)) {
          bullet.life = 0;
          this.playerHit();
          break;
        }
      }

      // Enemy collision with player
      const enemy = this.enemySystem.checkCollision(
        this.player.x - this.player.width / 2,
        this.player.y - this.player.height / 2,
        this.player.width,
        this.player.height
      );

      if (enemy) {
        this.playerHit();
        this.enemySystem.damageEnemy(enemy.id, 999);
      }
    }

    // Power-up collection
    for (const powerUp of this.powerUps) {
      if (this.checkPowerUpPlayerCollision(powerUp)) {
        this.collectPowerUp(powerUp);
        powerUp.life = 0;
      }
    }
  }

  private checkBulletBossCollision(bullet: ClassicBullet, boss: any): boolean {
    return (
      bullet.x > boss.x - boss.width / 2 &&
      bullet.x < boss.x + boss.width / 2 &&
      bullet.y > boss.y - boss.height / 2 &&
      bullet.y < boss.y + boss.height / 2
    );
  }

  private checkBulletPlayerCollision(bullet: ClassicBullet): boolean {
    return (
      bullet.x > this.player.x - this.player.width / 2 &&
      bullet.x < this.player.x + this.player.width / 2 &&
      bullet.y > this.player.y - this.player.height / 2 &&
      bullet.y < this.player.y + this.player.height / 2
    );
  }

  private checkPowerUpPlayerCollision(powerUp: ClassicPowerUp): boolean {
    const dx = powerUp.x - this.player.x;
    const dy = powerUp.y - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < 30;
  }

  private playerHit() {
    const destroyed = this.shooterSystem.takeDamage();
    
    if (destroyed) {
      this.lives--;
      
      if (this.lives <= 0) {
        this.gameOver();
      } else {
        // Respawn
        this.player.invincible = 3;
        this.shooterSystem.reset();
      }
    }
  }

  private spawnPowerUp(x: number, y: number) {
    const powerUp = this.shooterSystem.generatePowerUp(x, y);
    if (powerUp) {
      this.powerUps.push({
        id: `powerup_${this.powerUpIdCounter++}`,
        ...powerUp
      });
    }
  }

  private collectPowerUp(powerUp: ClassicPowerUp) {
    // Play power-up sound
    this.audio.playPowerUp();
    
    switch (powerUp.type) {
      case 'weapon':
        if (powerUp.weaponType) {
          this.shooterSystem.collectWeapon(powerUp.weaponType);
        }
        break;
      case 'armor':
        if (powerUp.armorType) {
          this.shooterSystem.collectArmor(powerUp.armorType);
          this.player.maxHp = this.shooterSystem.getArmor().hp;
          this.player.hp = this.player.maxHp;
        }
        break;
      case 'pod':
        if (powerUp.podType) {
          // Alternate between left and right pod
          const hasLeft = this.shooterSystem.getLeftPod() !== null;
          const hasRight = this.shooterSystem.getRightPod() !== null;
          
          if (!hasLeft) {
            this.shooterSystem.collectPod(powerUp.podType, 'left');
          } else if (!hasRight) {
            this.shooterSystem.collectPod(powerUp.podType, 'right');
          } else {
            // Upgrade existing pod
            this.shooterSystem.collectPod(powerUp.podType, 'left');
          }
        }
        break;
      case 'speed':
        this.shooterSystem.collectSpeed();
        break;
      case 'bomb':
        this.shooterSystem.collectBomb();
        break;
      case 'score':
        this.score += powerUp.value;
        break;
    }
  }

  private useBomb() {
    if (this.shooterSystem.useBomb()) {
      // Play bomb sound
      this.audio.playBomb();
      
      // Destroy all enemies on screen
      const enemies = this.enemySystem.getEnemies();
      for (const enemy of enemies) {
        this.enemySystem.damageEnemy(enemy.id, 999);
        this.score += enemy.score;
      }

      // Damage boss
      const boss = this.bossSystem.getCurrentBoss();
      if (boss) {
        this.bossSystem.damageBoss(100);
      }

      // Clear enemy bullets
      this.bullets = this.bullets.filter(b => b.isPlayerBullet);
    }
  }

  private bossAttack(pattern: any) {
    const boss = this.bossSystem.getCurrentBoss();
    if (!boss) return;

    // Create bullets based on attack pattern
    for (let i = 0; i < pattern.projectileCount; i++) {
      const angle = (i / pattern.projectileCount) * Math.PI * 2;
      const vx = Math.cos(angle) * pattern.projectileSpeed;
      const vy = Math.sin(angle) * pattern.projectileSpeed;

      this.bullets.push({
        id: `bullet_${this.bulletIdCounter++}`,
        x: boss.x,
        y: boss.y + boss.height / 2,
        vx,
        vy,
        damage: pattern.damage,
        size: pattern.projectileSize,
        color: pattern.projectileColor,
        isPlayerBullet: false,
        life: 5
      });
    }
  }

  private startBossFight() {
    this.state = 'bossfight';
    const bossId = this.stage === 1 ? 'stage_1_boss' : this.stage === 2 ? 'stage_2_boss' : 'final_boss';
    this.bossSystem.spawnBoss(bossId, this.width);
    this.onStateChange(this.state);
    
    // Play boss appearance sound
    this.audio.playBossAppear();
  }

  private nextWave() {
    this.waveSystem.nextWave();
  }

  private stageComplete() {
    this.state = 'stageclear';
    this.bossSystem.clearBoss();
    this.onStateChange(this.state);
    
    // Play stage clear sound
    this.audio.playLevelUp();

    // Next stage after delay
    setTimeout(() => {
      this.stage++;
      this.waveSystem.reset();
      this.environmentSystem.generateEnvironment(this.stage, 100);
      this.state = 'playing';
      this.onStateChange(this.state);
    }, 3000);
  }

  private gameOver() {
    this.state = 'gameover';
    this.onStateChange(this.state);
    
    // Play game over sound
    this.audio.playGameOver();
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.width, this.height);

    if (this.state === 'playing' || this.state === 'bossfight') {
      // Render background
      this.scrollingSystem.render(this.ctx, this.width, this.height);

      // Render environment
      this.environmentSystem.render(this.ctx);

      // Render enemies
      this.enemySystem.render(this.ctx);

      // Render boss
      this.bossSystem.renderBoss(this.ctx);

      // Render bullets
      this.renderBullets();

      // Render power-ups
      this.renderPowerUps();

      // Render player
      this.renderPlayer();

      // Render HUD
      this.renderHUD();
    }
  }

  private renderBullets() {
    for (const bullet of this.bullets) {
      this.ctx.fillStyle = bullet.color;
      this.ctx.beginPath();
      this.ctx.arc(bullet.x, bullet.y, bullet.size / 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Glow effect
      this.ctx.shadowColor = bullet.color;
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  private renderPowerUps() {
    for (const powerUp of this.powerUps) {
      let color = '#ffffff';
      let symbol = '?';
      let bgColor = '#000000';

      switch (powerUp.type) {
        case 'weapon':
          color = '#ff0000';
          bgColor = '#440000';
          symbol = 'W';
          break;
        case 'armor':
          color = '#00ff00';
          bgColor = '#004400';
          symbol = 'A';
          break;
        case 'pod':
          color = '#00ffff';
          bgColor = '#004444';
          symbol = 'P';
          break;
        case 'speed':
          color = '#ffff00';
          bgColor = '#444400';
          symbol = 'S';
          break;
        case 'bomb':
          color = '#ff8800';
          bgColor = '#442200';
          symbol = 'B';
          break;
        case 'score':
          color = '#ff00ff';
          bgColor = '#440044';
          symbol = '$';
          break;
      }

      // Pixel art style power-up
      const size = 30;
      const x = powerUp.x - size / 2;
      const y = powerUp.y - size / 2;

      // Background
      this.ctx.fillStyle = bgColor;
      this.ctx.fillRect(x, y, size, size);

      // Border
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(x, y, size, size);

      // Inner glow
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x + 4, y + 4, size - 8, size - 8);

      // Symbol
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 20px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(symbol, powerUp.x, powerUp.y);

      // Pulsing effect
      const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
      this.ctx.globalAlpha = pulse;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(x - 2, y - 2, size + 4, size + 4);
      this.ctx.globalAlpha = 1;
    }
  }

  private renderPlayer() {
    this.ctx.save();
    this.ctx.translate(this.player.x, this.player.y);

    // Invincibility flash
    if (this.player.invincible > 0 && Math.floor(this.player.invincible * 10) % 2 === 0) {
      this.ctx.globalAlpha = 0.5;
    }

    // Ship body - Classic arcade style
    const armor = this.shooterSystem.getArmor();
    
    // Engine glow
    this.ctx.fillStyle = '#ff8800';
    this.ctx.fillRect(-8, this.player.height / 2 - 5, 16, 10);
    
    // Main body - pixel art style
    this.ctx.fillStyle = armor.color;
    this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height);
    
    // Wings
    this.ctx.fillStyle = armor.color;
    this.ctx.fillRect(-this.player.width / 2 - 10, 0, 10, this.player.height / 2);
    this.ctx.fillRect(this.player.width / 2, 0, 10, this.player.height / 2);
    
    // Cockpit
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-6, -10, 12, 12);
    
    // Details
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(-this.player.width / 2, -this.player.height / 2, this.player.width, 2);
    this.ctx.fillRect(-this.player.width / 2, this.player.height / 2 - 2, this.player.width, 2);

    // Pods - classic style
    const leftPod = this.shooterSystem.getLeftPod();
    const rightPod = this.shooterSystem.getRightPod();

    if (leftPod) {
      this.ctx.fillStyle = '#00ffff';
      this.ctx.fillRect(leftPod.offset.x - 12, leftPod.offset.y - 12, 24, 24);
      this.ctx.fillStyle = '#008888';
      this.ctx.fillRect(leftPod.offset.x - 8, leftPod.offset.y - 8, 16, 16);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(leftPod.offset.x - 4, leftPod.offset.y - 4, 8, 8);
    }

    if (rightPod) {
      this.ctx.fillStyle = '#00ffff';
      this.ctx.fillRect(rightPod.offset.x - 12, rightPod.offset.y - 12, 24, 24);
      this.ctx.fillStyle = '#008888';
      this.ctx.fillRect(rightPod.offset.x - 8, rightPod.offset.y - 8, 16, 16);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(rightPod.offset.x - 4, rightPod.offset.y - 4, 8, 8);
    }

    this.ctx.restore();
  }

  private renderHUD() {
    // Score
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`REZULTAT: ${this.score}`, 20, 30);

    // Lives
    this.ctx.fillText(`ŽIVLJENJA: ${this.lives}`, 20, 60);

    // Stage
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`STOPNJA: ${this.stage}`, this.width - 20, 30);

    // Wave
    const wave = this.waveSystem.getCurrentWaveNumber();
    const totalWaves = this.waveSystem.getTotalWaves();
    this.ctx.fillText(`VAL: ${wave}/${totalWaves}`, this.width - 20, 60);

    // Weapon
    const weapon = this.shooterSystem.getWeapon();
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`OROŽJE: ${weapon.type.toUpperCase()} LV${weapon.level}`, 20, this.height - 60);

    // Armor
    const armor = this.shooterSystem.getArmor();
    this.ctx.fillText(`OKLEP: ${armor.type.toUpperCase()}`, 20, this.height - 30);

    // Bombs
    const bombs = this.shooterSystem.getBombs();
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`BOMBE: ${bombs}`, this.width - 20, this.height - 30);
  }

  // Public getters
  getState(): ClassicGameState {
    return this.state;
  }

  getScore(): number {
    return this.score;
  }

  getLives(): number {
    return this.lives;
  }

  getStage(): number {
    return this.stage;
  }

  getPlayer(): ClassicPlayer {
    return this.player;
  }

  getShooterSystem(): ClassicShooterSystem {
    return this.shooterSystem;
  }
}
