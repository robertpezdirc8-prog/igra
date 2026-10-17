// Vertical Scrolling System - Classic Arcade Style
// Inspired by Alpha Mission II, Image Fight, and Varth

export interface ScrollConfig {
  speed: number; // pixels per second
  direction: 'up' | 'down';
  backgroundLayers: BackgroundLayer[];
}

export interface BackgroundLayer {
  id: string;
  imageUrl?: string;
  color: string;
  speed: number; // parallax speed multiplier
  pattern: 'stars' | 'grid' | 'clouds' | 'city' | 'space';
  opacity: number;
}

export interface WaveEnemy {
  type: string;
  count: number;
  spawnDelay: number; // seconds
  spawnPattern: 'line' | 'circle' | 'vshape' | 'random' | 'sine';
  behavior: 'straight' | 'chase' | 'circle' | 'zigzag' | 'kamikaze';
  hp: number;
  speed: number;
  score: number;
  dropsPowerUp: boolean;
  powerUpChance: number;
}

export interface Wave {
  id: number;
  name: string;
  enemies: WaveEnemy[];
  duration: number; // seconds
  isBossWave: boolean;
  bossType?: string;
  backgroundMusic: string;
}

export interface Stage {
  id: number;
  name: string;
  description: string;
  waves: Wave[];
  background: BackgroundLayer[];
  bossId: string;
  unlockLevel: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

export class VerticalScrollingSystem {
  private scrollOffset: number = 0;
  private scrollSpeed: number = 100; // pixels per second
  private backgroundLayers: BackgroundLayer[] = [];
  private stars: Array<{ x: number; y: number; size: number; brightness: number }> = [];
  private isPaused: boolean = false;

  constructor() {
    this.initBackgroundLayers();
    this.initStars();
  }

  private initBackgroundLayers() {
    this.backgroundLayers = [
      {
        id: 'deep-space',
        color: '#000011',
        speed: 0.2,
        pattern: 'stars',
        opacity: 1
      },
      {
        id: 'nebula',
        color: '#220044',
        speed: 0.4,
        pattern: 'clouds',
        opacity: 0.3
      },
      {
        id: 'grid',
        color: '#00ffff',
        speed: 0.6,
        pattern: 'grid',
        opacity: 0.1
      }
    ];
  }

  private initStars() {
    // Generate random stars for background
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x: Math.random() * 1000,
        y: Math.random() * 2000,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random()
      });
    }
  }

  update(deltaTime: number, screenHeight: number) {
    if (this.isPaused) return;

    this.scrollOffset += this.scrollSpeed * deltaTime;

    // Wrap stars
    for (const star of this.stars) {
      star.y += this.scrollSpeed * deltaTime * 0.5;
      if (star.y > screenHeight + 100) {
        star.y = -100;
        star.x = Math.random() * 1000;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    // Render background layers
    for (const layer of this.backgroundLayers) {
      ctx.save();
      ctx.globalAlpha = layer.opacity;

      switch (layer.pattern) {
        case 'stars':
          this.renderStars(ctx, width, height, layer);
          break;
        case 'grid':
          this.renderGrid(ctx, width, height, layer);
          break;
        case 'clouds':
          this.renderNebula(ctx, width, height, layer);
          break;
      }

      ctx.restore();
    }
  }

  private renderStars(ctx: CanvasRenderingContext2D, width: number, height: number, layer: BackgroundLayer) {
    // Classic arcade starfield
    for (const star of this.stars) {
      const y = (star.y + this.scrollOffset * layer.speed) % (height + 200) - 100;
      const x = star.x % width;
      
      // Pixel art stars
      const size = Math.ceil(star.size);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
      
      // Twinkling effect
      if (star.brightness > 0.7) {
        const twinkle = Math.sin(Date.now() * 0.005 + star.x) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * star.brightness})`;
        ctx.fillRect(Math.floor(x) - 1, Math.floor(y), size + 2, size);
        ctx.fillRect(Math.floor(x), Math.floor(y) - 1, size, size + 2);
      }
    }
  }

  private renderGrid(ctx: CanvasRenderingContext2D, width: number, height: number, layer: BackgroundLayer) {
    const gridSize = 50;
    const offset = (this.scrollOffset * layer.speed) % gridSize;

    ctx.strokeStyle = layer.color;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = -gridSize + offset; y < height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  private renderNebula(ctx: CanvasRenderingContext2D, width: number, height: number, layer: BackgroundLayer) {
    const gradient = ctx.createRadialGradient(
      width / 2,
      (height / 2 + this.scrollOffset * layer.speed * 0.1) % height,
      0,
      width / 2,
      (height / 2 + this.scrollOffset * layer.speed * 0.1) % height,
      width * 0.6
    );

    gradient.addColorStop(0, layer.color);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  setScrollSpeed(speed: number) {
    this.scrollSpeed = speed;
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  getScrollOffset(): number {
    return this.scrollOffset;
  }
}

// Wave System
export class WaveSystem {
  private currentWave: number = 0;
  private waves: Wave[] = [];
  private enemiesSpawned: number = 0;
  private waveTimer: number = 0;
  private isWaveComplete: boolean = false;

  constructor() {
    this.generateWaves();
  }

  private generateWaves() {
    // Generate 10 waves with increasing difficulty
    for (let i = 0; i < 10; i++) {
      const wave: Wave = {
        id: i + 1,
        name: `Wave ${i + 1}`,
        enemies: this.generateWaveEnemies(i + 1),
        duration: 30 + i * 5,
        isBossWave: i === 9,
        bossType: i === 9 ? 'final_boss' : undefined,
        backgroundMusic: `wave_${i + 1}`
      };
      this.waves.push(wave);
    }
  }

  private generateWaveEnemies(waveNumber: number): WaveEnemy[] {
    const enemies: WaveEnemy[] = [];
    const baseCount = 5 + waveNumber * 2;

    // Add basic enemies
    enemies.push({
      type: 'fighter',
      count: baseCount,
      spawnDelay: 0,
      spawnPattern: 'line',
      behavior: 'straight',
      hp: 1 + Math.floor(waveNumber / 2),
      speed: 2 + waveNumber * 0.2,
      score: 100,
      dropsPowerUp: Math.random() < 0.3,
      powerUpChance: 0.3
    });

    // Add more enemy types as waves progress
    if (waveNumber >= 2) {
      enemies.push({
        type: 'bomber',
        count: Math.floor(baseCount / 2),
        spawnDelay: 2,
        spawnPattern: 'vshape',
        behavior: 'zigzag',
        hp: 2 + Math.floor(waveNumber / 3),
        speed: 1.5 + waveNumber * 0.1,
        score: 200,
        dropsPowerUp: Math.random() < 0.4,
        powerUpChance: 0.4
      });
    }

    if (waveNumber >= 4) {
      enemies.push({
        type: 'elite',
        count: Math.floor(baseCount / 3),
        spawnDelay: 4,
        spawnPattern: 'circle',
        behavior: 'chase',
        hp: 3 + Math.floor(waveNumber / 2),
        speed: 2.5 + waveNumber * 0.15,
        score: 300,
        dropsPowerUp: Math.random() < 0.5,
        powerUpChance: 0.5
      });
    }

    if (waveNumber >= 6) {
      enemies.push({
        type: 'kamikaze',
        count: Math.floor(baseCount / 4),
        spawnDelay: 6,
        spawnPattern: 'random',
        behavior: 'kamikaze',
        hp: 1,
        speed: 4 + waveNumber * 0.2,
        score: 150,
        dropsPowerUp: false,
        powerUpChance: 0
      });
    }

    return enemies;
  }

  getCurrentWave(): Wave | null {
    return this.waves[this.currentWave] || null;
  }

  getCurrentWaveNumber(): number {
    return this.currentWave + 1;
  }

  getTotalWaves(): number {
    return this.waves.length;
  }

  update(deltaTime: number) {
    if (this.currentWave >= this.waves.length) return;

    this.waveTimer += deltaTime;
    const wave = this.waves[this.currentWave];

    // Check if wave is complete
    if (this.waveTimer >= wave.duration && this.enemiesSpawned >= wave.enemies.reduce((sum, e) => sum + e.count, 0)) {
      this.isWaveComplete = true;
    }
  }

  shouldSpawnEnemy(): { shouldSpawn: boolean; enemyType?: WaveEnemy } {
    if (this.currentWave >= this.waves.length) {
      return { shouldSpawn: false };
    }

    const wave = this.waves[this.currentWave];
    
    for (const enemyType of wave.enemies) {
      if (this.waveTimer >= enemyType.spawnDelay && this.enemiesSpawned < enemyType.count) {
        if (Math.random() < 0.02) { // 2% chance per frame to spawn
          this.enemiesSpawned++;
          return { shouldSpawn: true, enemyType };
        }
      }
    }

    return { shouldSpawn: false };
  }

  nextWave(): boolean {
    if (this.currentWave < this.waves.length - 1) {
      this.currentWave++;
      this.enemiesSpawned = 0;
      this.waveTimer = 0;
      this.isWaveComplete = false;
      return true;
    }
    return false;
  }

  isComplete(): boolean {
    return this.currentWave >= this.waves.length;
  }

  isCurrentWaveComplete(): boolean {
    return this.isWaveComplete;
  }

  reset() {
    this.currentWave = 0;
    this.enemiesSpawned = 0;
    this.waveTimer = 0;
    this.isWaveComplete = false;
  }
}
