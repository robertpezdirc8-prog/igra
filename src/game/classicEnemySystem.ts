// Classic Enemy System - Arcade Style
// Inspired by Alpha Mission II, Image Fight, and Varth

export type EnemyType = 'fighter' | 'bomber' | 'elite' | 'kamikaze' | 'turret' | 'tank' | 'drone' | ' interceptor';

export interface EnemyConfig {
  type: EnemyType;
  width: number;
  height: number;
  hp: number;
  speed: number;
  score: number;
  color: string;
  fireRate: number;
  damage: number;
  projectileSpeed: number;
  projectileColor: string;
  behavior: 'straight' | 'chase' | 'circle' | 'zigzag' | 'kamikaze' | 'hover';
  dropsPowerUp: boolean;
  powerUpChance: number;
}

export interface ClassicEnemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  width: number;
  height: number;
  color: string;
  score: number;
  behavior: string;
  fireTimer: number;
  fireRate: number;
  damage: number;
  projectileSpeed: number;
  projectileColor: string;
  dropsPowerUp: boolean;
  powerUpChance: number;
  phase: number;
  isDestroyed: boolean;
}

export class ClassicEnemySystem {
  private enemies: ClassicEnemy[] = [];
  private enemyIdCounter: number = 0;

  constructor() {}

  // Enemy configurations
  private getEnemyConfig(type: EnemyType, difficulty: number): EnemyConfig {
    const configs: Record<EnemyType, Omit<EnemyConfig, 'type'>> = {
      fighter: {
        width: 30,
        height: 30,
        hp: 1 + Math.floor(difficulty / 2),
        speed: 2 + difficulty * 0.2,
        score: 100,
        color: '#ff4444',
        fireRate: 2,
        damage: 10,
        projectileSpeed: 5,
        projectileColor: '#ff0000',
        behavior: 'straight',
        dropsPowerUp: true,
        powerUpChance: 0.2
      },
      bomber: {
        width: 40,
        height: 35,
        hp: 2 + Math.floor(difficulty / 2),
        speed: 1.5 + difficulty * 0.15,
        score: 200,
        color: '#ff8800',
        fireRate: 1.5,
        damage: 15,
        projectileSpeed: 4,
        projectileColor: '#ff8800',
        behavior: 'zigzag',
        dropsPowerUp: true,
        powerUpChance: 0.3
      },
      elite: {
        width: 35,
        height: 35,
        hp: 3 + Math.floor(difficulty / 2),
        speed: 2.5 + difficulty * 0.2,
        score: 300,
        color: '#ff00ff',
        fireRate: 2.5,
        damage: 20,
        projectileSpeed: 6,
        projectileColor: '#ff00ff',
        behavior: 'chase',
        dropsPowerUp: true,
        powerUpChance: 0.4
      },
      kamikaze: {
        width: 25,
        height: 25,
        hp: 1,
        speed: 4 + difficulty * 0.3,
        score: 150,
        color: '#ffff00',
        fireRate: 0,
        damage: 30,
        projectileSpeed: 0,
        projectileColor: '#ffff00',
        behavior: 'kamikaze',
        dropsPowerUp: false,
        powerUpChance: 0
      },
      turret: {
        width: 35,
        height: 35,
        hp: 4 + Math.floor(difficulty / 2),
        speed: 0,
        score: 250,
        color: '#888888',
        fireRate: 1,
        damage: 25,
        projectileSpeed: 7,
        projectileColor: '#ffffff',
        behavior: 'hover',
        dropsPowerUp: true,
        powerUpChance: 0.5
      },
      tank: {
        width: 50,
        height: 40,
        hp: 5 + difficulty,
        speed: 1 + difficulty * 0.1,
        score: 400,
        color: '#4488ff',
        fireRate: 0.8,
        damage: 30,
        projectileSpeed: 5,
        projectileColor: '#4488ff',
        behavior: 'straight',
        dropsPowerUp: true,
        powerUpChance: 0.6
      },
      drone: {
        width: 20,
        height: 20,
        hp: 1,
        speed: 3 + difficulty * 0.25,
        score: 80,
        color: '#00ff00',
        fireRate: 3,
        damage: 8,
        projectileSpeed: 6,
        projectileColor: '#00ff00',
        behavior: 'circle',
        dropsPowerUp: false,
        powerUpChance: 0
      },
      ' interceptor': {
        width: 32,
        height: 32,
        hp: 2 + Math.floor(difficulty / 3),
        speed: 3.5 + difficulty * 0.2,
        score: 220,
        color: '#00ffff',
        fireRate: 2,
        damage: 12,
        projectileSpeed: 8,
        projectileColor: '#00ffff',
        behavior: 'chase',
        dropsPowerUp: true,
        powerUpChance: 0.35
      }
    };

    return { ...configs[type], type };
  }

  spawnEnemy(type: EnemyType, x: number, y: number, difficulty: number): ClassicEnemy {
    const config = this.getEnemyConfig(type, difficulty);
    
    const enemy: ClassicEnemy = {
      id: `enemy_${this.enemyIdCounter++}`,
      type: config.type,
      x,
      y,
      vx: 0,
      vy: config.speed,
      hp: config.hp,
      maxHp: config.hp,
      width: config.width,
      height: config.height,
      color: config.color,
      score: config.score,
      behavior: config.behavior,
      fireTimer: 0,
      fireRate: config.fireRate,
      damage: config.damage,
      projectileSpeed: config.projectileSpeed,
      projectileColor: config.projectileColor,
      dropsPowerUp: config.dropsPowerUp,
      powerUpChance: config.powerUpChance,
      phase: Math.random() * Math.PI * 2,
      isDestroyed: false
    };

    this.enemies.push(enemy);
    return enemy;
  }

  spawnWave(pattern: string, count: number, screenWidth: number, difficulty: number) {
    const types: EnemyType[] = ['fighter', 'bomber', 'elite', 'kamikaze', 'drone', ' interceptor'];
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      let x: number;
      let y: number;

      switch (pattern) {
        case 'line':
          x = (screenWidth / (count + 1)) * (i + 1);
          y = -50 - i * 30;
          break;
        case 'vshape':
          x = screenWidth / 2 + (i - count / 2) * 40;
          y = -50 - Math.abs(i - count / 2) * 30;
          break;
        case 'circle':
          const angle = (i / count) * Math.PI * 2;
          x = screenWidth / 2 + Math.cos(angle) * 150;
          y = -100 + Math.sin(angle) * 100;
          break;
        case 'random':
          x = Math.random() * screenWidth;
          y = -50 - Math.random() * 200;
          break;
        default:
          x = Math.random() * screenWidth;
          y = -50 - i * 40;
      }

      this.spawnEnemy(type, x, y, difficulty);
    }
  }

  update(deltaTime: number, playerX: number, playerY: number, screenWidth: number, screenHeight: number) {
    for (const enemy of this.enemies) {
      if (enemy.isDestroyed) continue;

      enemy.phase += deltaTime;
      enemy.fireTimer += deltaTime;

      // Update movement based on behavior
      switch (enemy.behavior) {
        case 'straight':
          enemy.y += enemy.vy;
          break;

        case 'chase':
          const dx = playerX - enemy.x;
          const dy = playerY - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            enemy.vx = (dx / dist) * Math.abs(enemy.vy) * 0.5;
            enemy.vy = (dy / dist) * Math.abs(enemy.vy) * 0.5 + 1;
          }
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;
          break;

        case 'circle':
          enemy.x += Math.cos(enemy.phase * 2) * 2;
          enemy.y += enemy.vy;
          break;

        case 'zigzag':
          enemy.x += Math.sin(enemy.phase * 3) * 3;
          enemy.y += enemy.vy;
          break;

        case 'kamikaze':
          const kdx = playerX - enemy.x;
          const kdy = playerY - enemy.y;
          const kdist = Math.sqrt(kdx * kdx + kdy * kdy);
          if (kdist > 0) {
            enemy.vx = (kdx / kdist) * enemy.vy;
            enemy.vy = (kdy / kdist) * enemy.vy;
          }
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;
          break;

        case 'hover':
          // Stay in place, slight movement
          enemy.x += Math.sin(enemy.phase) * 0.5;
          enemy.y += Math.cos(enemy.phase * 0.7) * 0.3;
          break;
      }

      // Keep within screen bounds
      enemy.x = Math.max(enemy.width / 2, Math.min(screenWidth - enemy.width / 2, enemy.x));
    }

    // Remove off-screen enemies
    this.enemies = this.enemies.filter(e => !e.isDestroyed && e.y < screenHeight + 100);
  }

  shouldFire(enemy: ClassicEnemy): boolean {
    if (enemy.fireRate === 0) return false;
    return enemy.fireTimer >= 1 / enemy.fireRate;
  }

  resetFireTimer(enemy: ClassicEnemy) {
    enemy.fireTimer = 0;
  }

  damageEnemy(enemyId: string, damage: number): { destroyed: boolean; enemy?: ClassicEnemy } {
    const enemy = this.enemies.find(e => e.id === enemyId);
    if (!enemy || enemy.isDestroyed) return { destroyed: false };

    enemy.hp -= damage;

    if (enemy.hp <= 0) {
      enemy.isDestroyed = true;
      return { destroyed: true, enemy };
    }

    return { destroyed: false };
  }

  checkCollision(x: number, y: number, width: number, height: number): ClassicEnemy | null {
    for (const enemy of this.enemies) {
      if (enemy.isDestroyed) continue;

      if (this.checkRectCollision(x, y, width, height, enemy.x - enemy.width / 2, enemy.y - enemy.height / 2, enemy.width, enemy.height)) {
        return enemy;
      }
    }

    return null;
  }

  private checkRectCollision(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  getEnemies(): ClassicEnemy[] {
    return this.enemies;
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const enemy of this.enemies) {
      if (enemy.isDestroyed) continue;

      this.renderEnemy(ctx, enemy);
    }
  }

  private renderEnemy(ctx: CanvasRenderingContext2D, enemy: ClassicEnemy) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    // Pixel art style rendering
    const pixelSize = 4;
    
    // Main body
    ctx.fillStyle = enemy.color;
    
    switch (enemy.type) {
      case 'fighter':
        // Pixel art triangle
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-enemy.width / 2 + pixelSize, -enemy.height / 2 + pixelSize, enemy.width - pixelSize * 2, enemy.height - pixelSize * 2);
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-enemy.width / 2 + pixelSize * 2, -enemy.height / 2 + pixelSize * 2, enemy.width - pixelSize * 4, enemy.height - pixelSize * 4);
        // Cockpit
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-pixelSize, -pixelSize, pixelSize * 2, pixelSize * 2);
        break;

      case 'bomber':
        // Pixel art rectangle with details
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-enemy.width / 2 + pixelSize, -enemy.height / 2 + pixelSize, enemy.width - pixelSize * 2, enemy.height - pixelSize * 2);
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(-enemy.width / 4, -enemy.height / 4, enemy.width / 2, enemy.height / 2);
        // Bombs
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-enemy.width / 3, enemy.height / 4, pixelSize * 2, pixelSize * 2);
        ctx.fillRect(enemy.width / 3 - pixelSize * 2, enemy.height / 4, pixelSize * 2, pixelSize * 2);
        break;

      case 'elite':
        // Pixel art diamond
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-enemy.width / 2 + pixelSize, -enemy.height / 2 + pixelSize, enemy.width - pixelSize * 2, enemy.height - pixelSize * 2);
        ctx.fillStyle = enemy.color;
        // Diamond pattern
        ctx.fillRect(-pixelSize * 2, -enemy.height / 2, pixelSize * 4, enemy.height);
        ctx.fillRect(-enemy.width / 2, -pixelSize * 2, enemy.width, pixelSize * 4);
        break;

      case 'kamikaze':
        // Pixel art star
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-enemy.width / 2 + pixelSize, -enemy.height / 2 + pixelSize, enemy.width - pixelSize * 2, enemy.height - pixelSize * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(-pixelSize, -enemy.height / 2, pixelSize * 2, enemy.height);
        ctx.fillRect(-enemy.width / 2, -pixelSize, enemy.width, pixelSize * 2);
        break;

      case 'turret':
        // Pixel art circle with cannon
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-enemy.width / 2 + pixelSize, -enemy.height / 2 + pixelSize, enemy.width - pixelSize * 2, enemy.height - pixelSize * 2);
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-enemy.width / 4, -enemy.height / 4, enemy.width / 2, enemy.height / 2);
        // Cannon
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-pixelSize, -enemy.height / 2, pixelSize * 2, enemy.height / 2);
        break;

      case 'tank':
        // Pixel art tank
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-enemy.width / 2 + pixelSize, -enemy.height / 2 + pixelSize, enemy.width - pixelSize * 2, enemy.height - pixelSize * 2);
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-enemy.width / 3, -enemy.height / 3, enemy.width * 2 / 3, enemy.height * 2 / 3);
        // Treads
        ctx.fillStyle = '#222222';
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, pixelSize * 2, enemy.height);
        ctx.fillRect(enemy.width / 2 - pixelSize * 2, -enemy.height / 2, pixelSize * 2, enemy.height);
        break;

      case 'drone':
        // Pixel art small circle
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-enemy.width / 2 + pixelSize, -enemy.height / 2 + pixelSize, enemy.width - pixelSize * 2, enemy.height - pixelSize * 2);
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-pixelSize, -pixelSize, pixelSize * 2, pixelSize * 2);
        break;

      case ' interceptor':
        // Pixel art arrow
        ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        ctx.fillStyle = '#000000';
        ctx.fillRect(-enemy.width / 2 + pixelSize, -enemy.height / 2 + pixelSize, enemy.width - pixelSize * 2, enemy.height - pixelSize * 2);
        ctx.fillStyle = enemy.color;
        ctx.fillRect(-pixelSize * 2, -enemy.height / 2, pixelSize * 4, enemy.height);
        break;
    }

    // Show damage
    if (enemy.hp < enemy.maxHp) {
      const damagePercent = 1 - (enemy.hp / enemy.maxHp);
      ctx.fillStyle = `rgba(255, 0, 0, ${damagePercent * 0.5})`;
      ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
    }

    ctx.restore();
  }

  clear() {
    this.enemies = [];
  }
}
