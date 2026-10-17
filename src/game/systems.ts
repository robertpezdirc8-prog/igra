// Procedural Level Generation System
export interface LevelConfig {
  width: number;
  height: number;
  difficulty: number;
  seed: number;
  theme: 'void' | 'crystal' | 'stellar' | 'dark' | 'quantum';
}

export interface GeneratedRoom {
  x: number;
  y: number;
  width: number;
  height: number;
  enemies: EnemySpawn[];
  hazards: Hazard[];
  powerUps: PowerUpSpawn[];
  exit: { x: number; y: number };
}

export interface EnemySpawn {
  type: string;
  x: number;
  y: number;
  count: number;
  pattern: 'static' | 'patrol' | 'chase' | 'circle';
}

export interface Hazard {
  type: 'laser' | 'spike' | 'blackhole' | 'electric';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  duration?: number;
  interval?: number;
}

export interface PowerUpSpawn {
  type: string;
  x: number;
  y: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }
}

export class ProceduralLevelGenerator {
  private rng: SeededRandom;
  private config: LevelConfig;

  constructor(config: LevelConfig) {
    this.config = config;
    this.rng = new SeededRandom(config.seed);
  }

  generateLevel(): GeneratedRoom[] {
    const rooms: GeneratedRoom[] = [];
    const roomCount = this.rng.nextInt(5, 8);
    
    let currentX = 0;
    let currentY = 0;

    for (let i = 0; i < roomCount; i++) {
      const room = this.generateRoom(currentX, currentY, i === roomCount - 1);
      rooms.push(room);
      
      // Move to next room position
      const direction = this.rng.choice(['right', 'down', 'diagonal']);
      if (direction === 'right') {
        currentX += room.width + this.rng.nextInt(100, 200);
      } else if (direction === 'down') {
        currentY += room.height + this.rng.nextInt(100, 200);
      } else {
        currentX += room.width + this.rng.nextInt(50, 150);
        currentY += room.height + this.rng.nextInt(50, 150);
      }
    }

    return rooms;
  }

  private generateRoom(x: number, y: number, isBossRoom: boolean): GeneratedRoom {
    const width = isBossRoom ? 800 : this.rng.nextInt(400, 600);
    const height = isBossRoom ? 600 : this.rng.nextInt(300, 500);

    const enemies = this.generateEnemies(width, height, isBossRoom);
    const hazards = this.generateHazards(width, height, isBossRoom);
    const powerUps = this.generatePowerUps(width, height);

    return {
      x,
      y,
      width,
      height,
      enemies,
      hazards,
      powerUps,
      exit: isBossRoom ? { x: width / 2, y: height / 2 } : { x: width - 50, y: height / 2 }
    };
  }

  private generateEnemies(roomWidth: number, roomHeight: number, isBossRoom: boolean): EnemySpawn[] {
    const enemies: EnemySpawn[] = [];
    
    if (isBossRoom) {
      enemies.push({
        type: 'boss',
        x: roomWidth / 2,
        y: roomHeight / 2,
        count: 1,
        pattern: 'static'
      });
      return enemies;
    }

    const enemyCount = this.rng.nextInt(3, 6);
    const enemyTypes = ['swarmer', 'sniper', 'titan', 'bomber', 'teleporter'];

    for (let i = 0; i < enemyCount; i++) {
      const type = this.rng.choice(enemyTypes);
      const count = type === 'swarmer' ? this.rng.nextInt(5, 10) : this.rng.nextInt(1, 3);
      
      enemies.push({
        type,
        x: this.rng.nextFloat(100, roomWidth - 100),
        y: this.rng.nextFloat(100, roomHeight - 100),
        count,
        pattern: this.rng.choice(['static', 'patrol', 'chase', 'circle'])
      });
    }

    return enemies;
  }

  private generateHazards(roomWidth: number, roomHeight: number, isBossRoom: boolean): Hazard[] {
    const hazards: Hazard[] = [];
    const hazardCount = isBossRoom ? this.rng.nextInt(2, 4) : this.rng.nextInt(1, 3);
    const hazardTypes: Hazard['type'][] = ['laser', 'spike', 'blackhole', 'electric'];

    for (let i = 0; i < hazardCount; i++) {
      const type = this.rng.choice(hazardTypes);
      const hazard: Hazard = {
        type,
        x: this.rng.nextFloat(100, roomWidth - 100),
        y: this.rng.nextFloat(100, roomHeight - 100)
      };

      if (type === 'laser') {
        hazard.width = this.rng.nextFloat(200, 400);
        hazard.height = 10;
        hazard.duration = this.rng.nextFloat(2, 4);
        hazard.interval = this.rng.nextFloat(3, 6);
      } else if (type === 'spike') {
        hazard.width = this.rng.nextFloat(50, 150);
        hazard.height = this.rng.nextFloat(50, 150);
      } else if (type === 'blackhole') {
        hazard.radius = this.rng.nextFloat(30, 60);
      } else if (type === 'electric') {
        hazard.radius = this.rng.nextFloat(40, 80);
        hazard.interval = this.rng.nextFloat(2, 5);
      }

      hazards.push(hazard);
    }

    return hazards;
  }

  private generatePowerUps(roomWidth: number, roomHeight: number): PowerUpSpawn[] {
    const powerUps: PowerUpSpawn[] = [];
    const count = this.rng.nextInt(2, 4);

    for (let i = 0; i < count; i++) {
      const rarityRoll = this.rng.next();
      let rarity: PowerUpSpawn['rarity'];
      
      if (rarityRoll < 0.6) rarity = 'common';
      else if (rarityRoll < 0.85) rarity = 'rare';
      else if (rarityRoll < 0.95) rarity = 'epic';
      else rarity = 'legendary';

      powerUps.push({
        type: this.getPowerUpType(rarity),
        x: this.rng.nextFloat(50, roomWidth - 50),
        y: this.rng.nextFloat(50, roomHeight - 50),
        rarity
      });
    }

    return powerUps;
  }

  private getPowerUpType(rarity: string): string {
    const types: Record<string, string[]> = {
      common: ['health', 'shield', 'energy'],
      rare: ['damage_boost', 'speed_boost', 'rapid_fire'],
      epic: ['mega_damage', 'piercing_shots', 'score_multiplier'],
      legendary: ['invincibility', 'nuke', 'time_slow']
    };

    return this.rng.choice(types[rarity] || types.common);
  }
}

// Spatial Hashing for Collision Detection
export class SpatialHash {
  private cellSize: number;
  private cells: Map<string, any[]>;

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  private getKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  clear(): void {
    this.cells.clear();
  }

  insert(obj: any): void {
    const key = this.getKey(obj.x, obj.y);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key)!.push(obj);
  }

  query(x: number, y: number, radius: number): any[] {
    const results: any[] = [];
    const minCellX = Math.floor((x - radius) / this.cellSize);
    const maxCellX = Math.floor((x + radius) / this.cellSize);
    const minCellY = Math.floor((y - radius) / this.cellSize);
    const maxCellY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx++) {
      for (let cy = minCellY; cy <= maxCellY; cy++) {
        const key = `${cx},${cy}`;
        const cell = this.cells.get(key);
        if (cell) {
          results.push(...cell);
        }
      }
    }

    return results;
  }
}

// Object Pool for Performance
export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 100) {
    this.factory = factory;
    this.reset = reset;

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    this.reset(obj);
    this.pool.push(obj);
  }

  get size(): number {
    return this.pool.length;
  }
}

// Dynamic Difficulty Adjustment
export class DynamicDifficulty {
  private playerPerformance: number = 0.5; // 0 = very bad, 1 = very good
  private recentDeaths: number[] = [];
  private recentKills: number[] = [];
  private readonly windowSize = 10;

  recordDeath(timeToDeath: number): void {
    this.recentDeaths.push(timeToDeath);
    if (this.recentDeaths.length > this.windowSize) {
      this.recentDeaths.shift();
    }
    this.updatePerformance();
  }

  recordKill(timeToKill: number): void {
    this.recentKills.push(timeToKill);
    if (this.recentKills.length > this.windowSize) {
      this.recentKills.shift();
    }
    this.updatePerformance();
  }

  private updatePerformance(): void {
    const avgDeathTime = this.recentDeaths.length > 0
      ? this.recentDeaths.reduce((a, b) => a + b, 0) / this.recentDeaths.length
      : 30;
    
    const avgKillTime = this.recentKills.length > 0
      ? this.recentKills.reduce((a, b) => a + b, 0) / this.recentKills.length
      : 5;

    // Normalize to 0-1 range
    const deathScore = Math.min(avgDeathTime / 60, 1); // 60 seconds = perfect
    const killScore = Math.max(0, 1 - (avgKillTime / 10)); // 10 seconds = bad

    this.playerPerformance = (deathScore + killScore) / 2;
  }

  getDifficultyMultiplier(): number {
    // Adjust difficulty based on performance
    if (this.playerPerformance < 0.3) return 0.7; // Too hard, ease up
    if (this.playerPerformance > 0.7) return 1.3; // Too easy, make harder
    return 1.0; // Just right
  }

  getEnemyHealthMultiplier(): number {
    return 0.8 + (this.playerPerformance * 0.4); // 0.8 to 1.2
  }

  getEnemyDamageMultiplier(): number {
    return 0.7 + (this.playerPerformance * 0.6); // 0.7 to 1.3
  }

  getEnemySpeedMultiplier(): number {
    return 0.9 + (this.playerPerformance * 0.2); // 0.9 to 1.1
  }
}

// Combo System
export class ComboSystem {
  private currentCombo: number = 0;
  private comboTimer: number = 0;
  private maxCombo: number = 0;
  private readonly comboTimeout: number = 3; // seconds
  private readonly multiplierGrowth: number = 0.1;

  addKill(): { combo: number; multiplier: number } {
    this.currentCombo++;
    this.comboTimer = this.comboTimeout;
    
    if (this.currentCombo > this.maxCombo) {
      this.maxCombo = this.currentCombo;
    }

    return {
      combo: this.currentCombo,
      multiplier: this.getMultiplier()
    };
  }

  update(deltaTime: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.currentCombo = 0;
        this.comboTimer = 0;
      }
    }
  }

  getMultiplier(): number {
    return 1 + (this.currentCombo * this.multiplierGrowth);
  }

  getCurrentCombo(): number {
    return this.currentCombo;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  reset(): void {
    this.currentCombo = 0;
    this.comboTimer = 0;
  }
}

// Screen Shake System
export class ScreenShake {
  private intensity: number = 0;
  private duration: number = 0;
  private timer: number = 0;
  private offsetX: number = 0;
  private offsetY: number = 0;

  shake(intensity: number, duration: number): void {
    this.intensity = Math.max(this.intensity, intensity);
    this.duration = Math.max(this.duration, duration);
    this.timer = this.duration;
  }

  update(deltaTime: number): void {
    if (this.timer > 0) {
      this.timer -= deltaTime;
      const progress = this.timer / this.duration;
      const currentIntensity = this.intensity * progress;
      
      this.offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
      this.offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
      this.intensity = 0;
      this.duration = 0;
    }
  }

  getOffset(): { x: number; y: number } {
    return { x: this.offsetX, y: this.offsetY };
  }

  isActive(): boolean {
    return this.timer > 0;
  }
}
