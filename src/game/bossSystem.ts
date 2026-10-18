// Boss System - Classic Arcade Style
// Inspired by Alpha Mission II, Image Fight, and Varth

import { t } from '../i18n';

export interface BossPhase {
  id: number;
  hpThreshold: number; // percentage (0-100)
  attackPatterns: BossAttackPattern[];
  movementPattern: BossMovementPattern;
  duration: number; // seconds
}

export interface BossAttackPattern {
  type: 'spiral' | 'burst' | 'laser' | 'missile' | 'beam' | 'circle' | 'wave';
  damage: number;
  projectileCount: number;
  projectileSpeed: number;
  projectileSize: number;
  projectileColor: string;
  fireRate: number; // shots per second
  duration: number; // seconds
  spread?: number;
  homing?: boolean;
}

export interface BossMovementPattern {
  type: 'hover' | 'circle' | 'figure8' | 'chase' | 'sine' | 'random';
  speed: number;
  radius?: number;
  amplitude?: number;
  frequency?: number;
}

export interface Boss {
  id: string;
  /** i18n dictionary key (e.g. 'classicboss.spider') — localized at render time. */
  nameKey: string;
  hp: number;
  maxHp: number;
  phases: BossPhase[];
  currentPhase: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  score: number;
  isDestructible: boolean;
  weakPoints?: Array<{ x: number; y: number; hp: number; maxHp: number }>;
}

export class BossSystem {
  private currentBoss: Boss | null = null;
  private bossTimer: number = 0;
  private attackTimer: number = 0;
  private phaseTimer: number = 0;

  constructor() {}

  // Boss definitions
  private getBossDefinition(bossId: string): Boss {
    const bosses: Record<string, Omit<Boss, 'currentPhase' | 'x' | 'y'>> = {
      'stage_1_boss': {
        id: 'stage_1_boss',
        nameKey: 'classicboss.spider',
        hp: 500,
        maxHp: 500,
        phases: [
          {
            id: 1,
            hpThreshold: 100,
            attackPatterns: [
              {
                type: 'spiral',
                damage: 10,
                projectileCount: 8,
                projectileSpeed: 4,
                projectileSize: 5,
                projectileColor: '#ff0000',
                fireRate: 2,
                duration: 5
              }
            ],
            movementPattern: {
              type: 'hover',
              speed: 1
            },
            duration: 30
          },
          {
            id: 2,
            hpThreshold: 50,
            attackPatterns: [
              {
                type: 'burst',
                damage: 15,
                projectileCount: 12,
                projectileSpeed: 5,
                projectileSize: 6,
                projectileColor: '#ff4400',
                fireRate: 3,
                duration: 4
              }
            ],
            movementPattern: {
              type: 'circle',
              speed: 2,
              radius: 100
            },
            duration: 30
          }
        ],
        width: 120,
        height: 100,
        color: '#ff0000',
        score: 5000,
        isDestructible: true,
        weakPoints: [
          { x: -30, y: 0, hp: 50, maxHp: 50 },
          { x: 30, y: 0, hp: 50, maxHp: 50 }
        ]
      },
      'stage_2_boss': {
        id: 'stage_2_boss',
        nameKey: 'classicboss.fortress',
        hp: 800,
        maxHp: 800,
        phases: [
          {
            id: 1,
            hpThreshold: 100,
            attackPatterns: [
              {
                type: 'missile',
                damage: 20,
                projectileCount: 6,
                projectileSpeed: 3,
                projectileSize: 8,
                projectileColor: '#ff8800',
                fireRate: 1.5,
                duration: 6,
                homing: true
              }
            ],
            movementPattern: {
              type: 'sine',
              speed: 1.5,
              amplitude: 150,
              frequency: 0.5
            },
            duration: 40
          },
          {
            id: 2,
            hpThreshold: 60,
            attackPatterns: [
              {
                type: 'laser',
                damage: 30,
                projectileCount: 1,
                projectileSpeed: 15,
                projectileSize: 20,
                projectileColor: '#ff00ff',
                fireRate: 0.5,
                duration: 8
              }
            ],
            movementPattern: {
              type: 'hover',
              speed: 0.5
            },
            duration: 40
          },
          {
            id: 3,
            hpThreshold: 30,
            attackPatterns: [
              {
                type: 'circle',
                damage: 25,
                projectileCount: 20,
                projectileSpeed: 4,
                projectileSize: 7,
                projectileColor: '#ffff00',
                fireRate: 2,
                duration: 5
              }
            ],
            movementPattern: {
              type: 'figure8',
              speed: 2,
              radius: 120
            },
            duration: 40
          }
        ],
        width: 150,
        height: 120,
        color: '#ff8800',
        score: 10000,
        isDestructible: true,
        weakPoints: [
          { x: -50, y: -30, hp: 80, maxHp: 80 },
          { x: 50, y: -30, hp: 80, maxHp: 80 },
          { x: 0, y: 30, hp: 100, maxHp: 100 }
        ]
      },
      'final_boss': {
        id: 'final_boss',
        nameKey: 'classicboss.emperor',
        hp: 1500,
        maxHp: 1500,
        phases: [
          {
            id: 1,
            hpThreshold: 100,
            attackPatterns: [
              {
                type: 'spiral',
                damage: 15,
                projectileCount: 12,
                projectileSpeed: 5,
                projectileSize: 6,
                projectileColor: '#ff00ff',
                fireRate: 2,
                duration: 6
              }
            ],
            movementPattern: {
              type: 'circle',
              speed: 1.5,
              radius: 150
            },
            duration: 60
          },
          {
            id: 2,
            hpThreshold: 75,
            attackPatterns: [
              {
                type: 'beam',
                damage: 40,
                projectileCount: 1,
                projectileSpeed: 20,
                projectileSize: 30,
                projectileColor: '#ff0000',
                fireRate: 0.3,
                duration: 10
              },
              {
                type: 'missile',
                damage: 25,
                projectileCount: 8,
                projectileSpeed: 4,
                projectileSize: 8,
                projectileColor: '#ff8800',
                fireRate: 1,
                duration: 8,
                homing: true
              }
            ],
            movementPattern: {
              type: 'figure8',
              speed: 2,
              radius: 180
            },
            duration: 60
          },
          {
            id: 3,
            hpThreshold: 50,
            attackPatterns: [
              {
                type: 'wave',
                damage: 20,
                projectileCount: 16,
                projectileSpeed: 6,
                projectileSize: 7,
                projectileColor: '#ffff00',
                fireRate: 2.5,
                duration: 7,
                spread: 0.5
              }
            ],
            movementPattern: {
              type: 'chase',
              speed: 2.5
            },
            duration: 60
          },
          {
            id: 4,
            hpThreshold: 25,
            attackPatterns: [
              {
                type: 'circle',
                damage: 30,
                projectileCount: 24,
                projectileSpeed: 7,
                projectileSize: 8,
                projectileColor: '#ff00ff',
                fireRate: 3,
                duration: 5
              },
              {
                type: 'laser',
                damage: 50,
                projectileCount: 1,
                projectileSpeed: 25,
                projectileSize: 40,
                projectileColor: '#ff0000',
                fireRate: 0.2,
                duration: 12
              }
            ],
            movementPattern: {
              type: 'random',
              speed: 3
            },
            duration: 60
          }
        ],
        width: 200,
        height: 180,
        color: '#ff00ff',
        score: 50000,
        isDestructible: true,
        weakPoints: [
          { x: -60, y: -40, hp: 150, maxHp: 150 },
          { x: 60, y: -40, hp: 150, maxHp: 150 },
          { x: -60, y: 40, hp: 150, maxHp: 150 },
          { x: 60, y: 40, hp: 150, maxHp: 150 },
          { x: 0, y: 0, hp: 200, maxHp: 200 }
        ]
      }
    };

    const bossDef = bosses[bossId] || bosses['stage_1_boss'];
    return {
      ...bossDef,
      currentPhase: 0,
      x: 400,
      y: -100
    };
  }

  spawnBoss(bossId: string, screenWidth: number) {
    this.currentBoss = this.getBossDefinition(bossId);
    this.currentBoss.x = screenWidth / 2;
    this.currentBoss.y = -this.currentBoss.height;
    this.bossTimer = 0;
    this.attackTimer = 0;
    this.phaseTimer = 0;
  }

  getCurrentBoss(): Boss | null {
    return this.currentBoss;
  }

  update(deltaTime: number, playerX: number, playerY: number, screenWidth: number, screenHeight: number) {
    if (!this.currentBoss) return;

    this.bossTimer += deltaTime;
    this.attackTimer += deltaTime;
    this.phaseTimer += deltaTime;

    const boss = this.currentBoss;
    const phase = boss.phases[boss.currentPhase];

    // Check for phase transition
    const hpPercent = (boss.hp / boss.maxHp) * 100;
    if (boss.currentPhase < boss.phases.length - 1) {
      const nextPhase = boss.phases[boss.currentPhase + 1];
      if (hpPercent <= nextPhase.hpThreshold) {
        boss.currentPhase++;
        this.phaseTimer = 0;
      }
    }

    // Update boss movement
    this.updateBossMovement(boss, phase.movementPattern, deltaTime, playerX, playerY, screenWidth, screenHeight);

    // Entry animation
    if (boss.y < 100) {
      boss.y += 2;
    }
  }

  private updateBossMovement(
    boss: Boss,
    pattern: BossMovementPattern,
    deltaTime: number,
    playerX: number,
    playerY: number,
    screenWidth: number,
    screenHeight: number
  ) {
    const speed = pattern.speed;

    switch (pattern.type) {
      case 'hover':
        // Slight hovering motion
        boss.x += Math.sin(this.bossTimer * 2) * speed;
        boss.y += Math.cos(this.bossTimer * 1.5) * speed * 0.5;
        break;

      case 'circle': {
        const radius = pattern.radius || 100;
        boss.x = screenWidth / 2 + Math.cos(this.bossTimer * speed) * radius;
        boss.y = 150 + Math.sin(this.bossTimer * speed) * radius * 0.5;
        break;
      }

      case 'figure8': {
        const fig8Radius = pattern.radius || 120;
        boss.x = screenWidth / 2 + Math.sin(this.bossTimer * speed) * fig8Radius;
        boss.y = 150 + Math.sin(this.bossTimer * speed * 2) * fig8Radius * 0.4;
        break;
      }

      case 'chase': {
        const dx = playerX - boss.x;
        const dy = playerY - 100 - boss.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
          boss.x += (dx / dist) * speed;
          boss.y += (dy / dist) * speed;
        }
        break;
      }

      case 'sine': {
        const amplitude = pattern.amplitude || 100;
        const frequency = pattern.frequency || 1;
        boss.x = screenWidth / 2 + Math.sin(this.bossTimer * frequency) * amplitude;
        boss.y = 150 + Math.cos(this.bossTimer * frequency * 0.5) * 50;
        break;
      }

      case 'random':
        if (Math.random() < 0.02) {
          boss.x += (Math.random() - 0.5) * speed * 10;
          boss.y += (Math.random() - 0.5) * speed * 5;
        }
        break;
    }

    // Keep boss within bounds
    boss.x = Math.max(boss.width / 2, Math.min(screenWidth - boss.width / 2, boss.x));
    boss.y = Math.max(50, Math.min(screenHeight / 2, boss.y));
  }

  shouldAttack(): { shouldAttack: boolean; pattern?: BossAttackPattern } {
    if (!this.currentBoss) return { shouldAttack: false };

    const phase = this.currentBoss.phases[this.currentBoss.currentPhase];
    
    for (const pattern of phase.attackPatterns) {
      if (this.attackTimer >= 1 / pattern.fireRate) {
        this.attackTimer = 0;
        return { shouldAttack: true, pattern };
      }
    }

    return { shouldAttack: false };
  }

  damageBoss(damage: number, weakPointIndex?: number): boolean {
    if (!this.currentBoss) return false;

    if (weakPointIndex !== undefined && this.currentBoss.weakPoints) {
      const weakPoint = this.currentBoss.weakPoints[weakPointIndex];
      if (weakPoint && weakPoint.hp > 0) {
        weakPoint.hp -= damage;
        if (weakPoint.hp <= 0) {
          // Weak point destroyed - extra damage to boss
          this.currentBoss.hp -= damage * 2;
        }
      }
    } else {
      this.currentBoss.hp -= damage;
    }

    return this.currentBoss.hp <= 0;
  }

  isBossDefeated(): boolean {
    return this.currentBoss ? this.currentBoss.hp <= 0 : false;
  }

  clearBoss() {
    this.currentBoss = null;
    this.bossTimer = 0;
    this.attackTimer = 0;
    this.phaseTimer = 0;
  }

  renderBoss(ctx: CanvasRenderingContext2D) {
    if (!this.currentBoss) return;

    const boss = this.currentBoss;

    // Render boss body - pixel art style
    ctx.save();
    ctx.translate(boss.x, boss.y);

    const pixelSize = 6;

    // Main body
    ctx.fillStyle = boss.color;
    ctx.fillRect(-boss.width / 2, -boss.height / 2, boss.width, boss.height);

    // Pixel art details
    ctx.fillStyle = '#000000';
    ctx.fillRect(-boss.width / 2 + pixelSize, -boss.height / 2 + pixelSize, boss.width - pixelSize * 2, boss.height - pixelSize * 2);
    
    ctx.fillStyle = boss.color;
    ctx.fillRect(-boss.width / 2 + pixelSize * 2, -boss.height / 2 + pixelSize * 2, boss.width - pixelSize * 4, boss.height - pixelSize * 4);

    // Boss-specific details
    if (boss.id === 'stage_1_boss') {
      // Spider legs
      ctx.fillStyle = boss.color;
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI - Math.PI / 2;
        const legLength = 40;
        ctx.fillRect(
          Math.cos(angle) * legLength - 5,
          Math.sin(angle) * legLength - 5,
          10,
          10
        );
      }
      // Eyes
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-20, -10, 10, 10);
      ctx.fillRect(10, -10, 10, 10);
    } else if (boss.id === 'stage_2_boss') {
      // Satellite dishes
      ctx.fillStyle = '#888888';
      ctx.fillRect(-boss.width / 3, -boss.height / 3, 20, 20);
      ctx.fillRect(boss.width / 3 - 20, -boss.height / 3, 20, 20);
      // Antenna
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -boss.height / 2 - 20, 6, 20);
    } else if (boss.id === 'final_boss') {
      // Emperor crown
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(-30, -boss.height / 2 - 15, 60, 15);
      ctx.fillRect(-20, -boss.height / 2 - 25, 10, 10);
      ctx.fillRect(10, -boss.height / 2 - 25, 10, 10);
      // Emperor face
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-25, -15, 15, 15);
      ctx.fillRect(10, -15, 15, 15);
    }

    // Render weak points
    if (boss.weakPoints) {
      for (let i = 0; i < boss.weakPoints.length; i++) {
        const wp = boss.weakPoints[i];
        const hpPercent = wp.hp / wp.maxHp;
        
        // Pixel art weak point
        ctx.fillStyle = hpPercent > 0 ? '#00ff00' : '#ff0000';
        ctx.fillRect(wp.x - 12, wp.y - 12, 24, 24);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(wp.x - 8, wp.y - 8, 16, 16);
        
        ctx.fillStyle = hpPercent > 0 ? '#00ff00' : '#ff0000';
        ctx.fillRect(wp.x - 4, wp.y - 4, 8, 8);
        
        // HP indicator
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(wp.x - 12, wp.y + 15, 24 * hpPercent, 3);
      }
    }

    ctx.restore();

    // Render HP bar
    this.renderBossHPBar(ctx, boss);
  }

  private renderBossHPBar(ctx: CanvasRenderingContext2D, boss: Boss) {
    const barWidth = 400;
    const barHeight = 20;
    const x = (ctx.canvas.width - barWidth) / 2;
    const y = 50;

    // Background
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, barWidth, barHeight);

    // HP bar
    const hpPercent = boss.hp / boss.maxHp;
    const hpColor = hpPercent > 0.5 ? '#00ff00' : hpPercent > 0.25 ? '#ffff00' : '#ff0000';
    ctx.fillStyle = hpColor;
    ctx.fillRect(x, y, barWidth * hpPercent, barHeight);

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Boss name (localized at render time)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t(boss.nameKey), ctx.canvas.width / 2, y - 10);

    // Phase indicator
    ctx.font = '12px monospace';
    ctx.fillText(t('boss.phase', { n: boss.currentPhase + 1, total: boss.phases.length }), ctx.canvas.width / 2, y + barHeight + 15);
  }
}
