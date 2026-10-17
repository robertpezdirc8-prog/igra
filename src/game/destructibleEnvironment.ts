// Destructible Environment System - Varth Style
// Inspired by Varth: Operation Thunderstorm

export interface DestructibleObject {
  id: string;
  type: 'building' | 'turret' | 'wall' | 'crystal' | 'vehicle' | 'generator';
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  color: string;
  score: number;
  dropsPowerUp: boolean;
  powerUpChance: number;
  isDestroyed: boolean;
  destructionFrame: number;
}

export interface TerrainSegment {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'water' | 'lava' | 'ice' | 'metal';
  color: string;
  isDestructible: boolean;
  hp: number;
  maxHp: number;
}

export class DestructibleEnvironmentSystem {
  private objects: DestructibleObject[] = [];
  private terrain: TerrainSegment[] = [];
  private scrollOffset: number = 0;
  private screenWidth: number;
  private screenHeight: number;

  constructor(screenWidth: number, screenHeight: number) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  // Generate environment for a stage
  generateEnvironment(stageId: number, _scrollSpeed: number) {
    this.objects = [];
    this.terrain = [];

    // Generate terrain segments
    this.generateTerrain(stageId);

    // Generate destructible objects
    this.generateDestructibleObjects(stageId);
  }

  private generateTerrain(stageId: number) {
    const terrainWidth = 200;
    const terrainHeight = 100;
    const segmentsPerRow = Math.ceil(this.screenWidth / terrainWidth) + 2;
    const rows = 10;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < segmentsPerRow; col++) {
        const x = col * terrainWidth;
        const y = row * terrainHeight + this.screenHeight;

        // Different terrain types based on stage
        let type: TerrainSegment['type'];
        let color: string;
        let isDestructible: boolean;
        let hp = 0;

        switch (stageId) {
          case 1:
            type = 'ground';
            color = '#555555';
            isDestructible = Math.random() < 0.3;
            hp = isDestructible ? 50 : 0;
            break;
          case 2:
            if (Math.random() < 0.2) {
              type = 'water';
              color = '#0066ff';
              isDestructible = false;
            } else {
              type = 'metal';
              color = '#666666';
              isDestructible = Math.random() < 0.4;
              hp = isDestructible ? 80 : 0;
            }
            break;
          case 3:
            if (Math.random() < 0.15) {
              type = 'lava';
              color = '#ff4400';
              isDestructible = false;
            } else {
              type = 'ground';
              color = '#664422';
              isDestructible = Math.random() < 0.5;
              hp = isDestructible ? 100 : 0;
            }
            break;
          default:
            type = 'ground';
            color = '#444444';
            isDestructible = Math.random() < 0.3;
            hp = isDestructible ? 60 : 0;
        }

        this.terrain.push({
          id: `terrain_${row}_${col}`,
          x,
          y,
          width: terrainWidth,
          height: terrainHeight,
          type,
          color,
          isDestructible,
          hp,
          maxHp: hp
        });
      }
    }
  }

  private generateDestructibleObjects(stageId: number) {
    const objectCount = 20 + stageId * 5;

    for (let i = 0; i < objectCount; i++) {
      const type = this.getRandomObjectType(stageId);
      const config = this.getObjectConfig(type);

      const x = Math.random() * this.screenWidth;
      const y = this.screenHeight + Math.random() * 2000;

      this.objects.push({
        id: `obj_${i}`,
        type,
        x,
        y,
        width: config.width,
        height: config.height,
        hp: config.hp,
        maxHp: config.hp,
        color: config.color,
        score: config.score,
        dropsPowerUp: config.dropsPowerUp,
        powerUpChance: config.powerUpChance,
        isDestroyed: false,
        destructionFrame: 0
      });
    }
  }

  private getRandomObjectType(stageId: number): DestructibleObject['type'] {
    const types: DestructibleObject['type'][] = ['building', 'turret', 'wall', 'crystal', 'vehicle', 'generator'];
    
    // Different probabilities based on stage
    if (stageId === 1) {
      return types[Math.floor(Math.random() * 3)]; // building, turret, wall
    } else if (stageId === 2) {
      return types[Math.floor(Math.random() * 4)]; // + crystal
    } else {
      return types[Math.floor(Math.random() * types.length)];
    }
  }

  private getObjectConfig(type: DestructibleObject['type']): {
    width: number;
    height: number;
    hp: number;
    color: string;
    score: number;
    dropsPowerUp: boolean;
    powerUpChance: number;
  } {
    const configs: Record<DestructibleObject['type'], any> = {
      building: {
        width: 60,
        height: 80,
        hp: 100,
        color: '#888888',
        score: 200,
        dropsPowerUp: true,
        powerUpChance: 0.3
      },
      turret: {
        width: 40,
        height: 40,
        hp: 60,
        color: '#ff4444',
        score: 150,
        dropsPowerUp: true,
        powerUpChance: 0.4
      },
      wall: {
        width: 80,
        height: 30,
        hp: 80,
        color: '#666666',
        score: 100,
        dropsPowerUp: false,
        powerUpChance: 0
      },
      crystal: {
        width: 30,
        height: 50,
        hp: 40,
        color: '#00ffff',
        score: 300,
        dropsPowerUp: true,
        powerUpChance: 0.6
      },
      vehicle: {
        width: 50,
        height: 40,
        hp: 70,
        color: '#ffaa00',
        score: 250,
        dropsPowerUp: true,
        powerUpChance: 0.35
      },
      generator: {
        width: 45,
        height: 60,
        hp: 120,
        color: '#ff00ff',
        score: 500,
        dropsPowerUp: true,
        powerUpChance: 0.8
      }
    };

    return configs[type];
  }

  update(deltaTime: number, scrollSpeed: number) {
    this.scrollOffset += scrollSpeed * deltaTime;

    // Update terrain positions
    for (const segment of this.terrain) {
      segment.y -= scrollSpeed * deltaTime;
    }

    // Update object positions
    for (const obj of this.objects) {
      obj.y -= scrollSpeed * deltaTime;

      // Update destruction animation
      if (obj.isDestroyed && obj.destructionFrame < 30) {
        obj.destructionFrame++;
      }
    }

    // Remove off-screen objects
    this.terrain = this.terrain.filter(t => t.y + t.height > -100);
    this.objects = this.objects.filter(o => o.y + o.height > -100 && (!o.isDestroyed || o.destructionFrame < 30));
  }

  damageObject(objectId: string, damage: number): { destroyed: boolean; shouldDropPowerUp: boolean } {
    const obj = this.objects.find(o => o.id === objectId);
    if (!obj || obj.isDestroyed) return { destroyed: false, shouldDropPowerUp: false };

    obj.hp -= damage;

    if (obj.hp <= 0) {
      obj.isDestroyed = true;
      obj.destructionFrame = 0;
      
      const shouldDrop = obj.dropsPowerUp && Math.random() < obj.powerUpChance;
      
      return { destroyed: true, shouldDropPowerUp: shouldDrop };
    }

    return { destroyed: false, shouldDropPowerUp: false };
  }

  damageTerrain(terrainId: string, damage: number): boolean {
    const terrain = this.terrain.find(t => t.id === terrainId);
    if (!terrain || !terrain.isDestructible) return false;

    terrain.hp -= damage;
    return terrain.hp <= 0;
  }

  checkCollision(x: number, y: number, width: number, height: number): {
    hitObject: DestructibleObject | null;
    hitTerrain: TerrainSegment | null;
  } {
    // Check objects
    for (const obj of this.objects) {
      if (obj.isDestroyed) continue;

      if (this.checkRectCollision(x, y, width, height, obj.x, obj.y, obj.width, obj.height)) {
        return { hitObject: obj, hitTerrain: null };
      }
    }

    // Check terrain
    for (const terrain of this.terrain) {
      if (this.checkRectCollision(x, y, width, height, terrain.x, terrain.y, terrain.width, terrain.height)) {
        return { hitObject: null, hitTerrain: terrain };
      }
    }

    return { hitObject: null, hitTerrain: null };
  }

  private checkRectCollision(
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  }

  getObjects(): DestructibleObject[] {
    return this.objects;
  }

  getTerrain(): TerrainSegment[] {
    return this.terrain;
  }

  render(ctx: CanvasRenderingContext2D) {
    // Render terrain
    for (const segment of this.terrain) {
      ctx.fillStyle = segment.color;
      ctx.fillRect(segment.x, segment.y, segment.width, segment.height);

      // Show damage
      if (segment.isDestructible && segment.hp < segment.maxHp) {
        const damagePercent = 1 - (segment.hp / segment.maxHp);
        ctx.fillStyle = `rgba(255, 0, 0, ${damagePercent * 0.5})`;
        ctx.fillRect(segment.x, segment.y, segment.width, segment.height);
      }

      // Border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.strokeRect(segment.x, segment.y, segment.width, segment.height);
    }

    // Render objects
    for (const obj of this.objects) {
      if (obj.isDestroyed) {
        // Destruction animation
        this.renderDestruction(ctx, obj);
      } else {
        this.renderObject(ctx, obj);
      }
    }
  }

  private renderObject(ctx: CanvasRenderingContext2D, obj: DestructibleObject) {
    ctx.save();
    ctx.translate(obj.x, obj.y);

    // Main body
    ctx.fillStyle = obj.color;
    ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);

    // Details based on type
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);

    // Type-specific details
    switch (obj.type) {
      case 'turret':
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'crystal':
        ctx.fillStyle = '#88ffff';
        ctx.beginPath();
        ctx.moveTo(0, -obj.height / 2);
        ctx.lineTo(obj.width / 2, 0);
        ctx.lineTo(0, obj.height / 2);
        ctx.lineTo(-obj.width / 2, 0);
        ctx.closePath();
        ctx.fill();
        break;
      case 'generator':
        ctx.fillStyle = '#ff88ff';
        ctx.fillRect(-obj.width / 4, -obj.height / 4, obj.width / 2, obj.height / 2);
        break;
    }

    // Show damage
    if (obj.hp < obj.maxHp) {
      const damagePercent = 1 - (obj.hp / obj.maxHp);
      ctx.fillStyle = `rgba(255, 0, 0, ${damagePercent * 0.5})`;
      ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
    }

    ctx.restore();
  }

  private renderDestruction(ctx: CanvasRenderingContext2D, obj: DestructibleObject) {
    const progress = obj.destructionFrame / 30;
    
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.globalAlpha = 1 - progress;

    // Explosion effect
    const explosionSize = obj.width * (1 + progress);
    
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.arc(0, 0, explosionSize / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(0, 0, explosionSize / 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, explosionSize / 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  clear() {
    this.objects = [];
    this.terrain = [];
    this.scrollOffset = 0;
  }
}
