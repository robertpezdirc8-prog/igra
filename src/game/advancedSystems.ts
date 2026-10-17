import { ComboSystem, ScreenShake } from './systems';

// Advanced Particle System with GPU-like behavior
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'explosion' | 'trail' | 'spark' | 'smoke' | 'energy' | 'bullet';
  gravity?: number;
  friction?: number;
  rotation?: number;
  rotationSpeed?: number;
}

export class AdvancedParticleSystem {
  private particles: Particle[] = [];
  private maxParticles: number = 5000;

  emit(config: {
    x: number;
    y: number;
    count: number;
    type: Particle['type'];
    color?: string;
    speed?: number;
    spread?: number;
    life?: number;
    size?: number;
    gravity?: number;
    friction?: number;
  }): void {
    const {
      x, y, count, type, color = '#ffffff',
      speed = 100, spread = Math.PI * 2,
      life = 1, size = 2, gravity = 0, friction = 0.98
    } = config;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      const angle = (Math.random() - 0.5) * spread;
      const velocity = speed * (0.5 + Math.random() * 0.5);

      this.particles.push({
        x, y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        size: size * (0.5 + Math.random() * 0.5),
        color,
        alpha: 1,
        type,
        gravity,
        friction,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  emitExplosion(x: number, y: number, color: string = '#ffaa00'): void {
    this.emit({
      x, y,
      count: 30,
      type: 'explosion',
      color,
      speed: 200,
      life: 0.8,
      size: 4,
      gravity: 100,
      friction: 0.95
    });

    this.emit({
      x, y,
      count: 20,
      type: 'spark',
      color: '#ffffff',
      speed: 300,
      life: 0.5,
      size: 2
    });

    this.emit({
      x, y,
      count: 15,
      type: 'smoke',
      color: '#666666',
      speed: 50,
      life: 1.5,
      size: 8,
      friction: 0.96
    });
  }

  emitTrail(x: number, y: number, color: string = '#00ffff'): void {
    this.emit({
      x, y,
      count: 2,
      type: 'trail',
      color,
      speed: 20,
      spread: 0.5,
      life: 0.3,
      size: 3,
      friction: 0.9
    });
  }

  emitBulletHit(x: number, y: number, color: string = '#ffff00'): void {
    this.emit({
      x, y,
      count: 8,
      type: 'spark',
      color,
      speed: 150,
      life: 0.3,
      size: 2
    });
  }

  emitEnergy(x: number, y: number, color: string = '#ff00ff'): void {
    this.emit({
      x, y,
      count: 5,
      type: 'energy',
      color,
      speed: 80,
      spread: Math.PI * 2,
      life: 0.6,
      size: 3
    });
  }

  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update position
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      
      // Apply gravity
      if (p.gravity) {
        p.vy += p.gravity * deltaTime;
      }
      
      // Apply friction
      if (p.friction) {
        p.vx *= p.friction;
        p.vy *= p.friction;
      }
      
      // Update rotation
      if (p.rotationSpeed) {
        p.rotation! += p.rotationSpeed;
      }
      
      // Update life
      p.life -= deltaTime;
      p.alpha = Math.max(0, p.life / p.maxLife);
      
      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      
      if (p.rotation) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.translate(-p.x, -p.y);
      }
      
      ctx.fillStyle = p.color;
      
      switch (p.type) {
        case 'explosion':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'trail':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'spark':
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          break;
          
        case 'smoke':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (2 - p.alpha), 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'energy':
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
          
        case 'bullet':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      
      ctx.restore();
    }
  }

  getParticleCount(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
  }
}

// Environmental Hazards System
export interface EnvironmentalHazard {
  type: 'laser' | 'spike' | 'blackhole' | 'electric';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  active: boolean;
  timer: number;
  duration: number;
  interval: number;
  damage: number;
}

export class HazardSystem {
  private hazards: EnvironmentalHazard[] = [];

  addHazard(hazard: Omit<EnvironmentalHazard, 'active' | 'timer'>): void {
    this.hazards.push({
      ...hazard,
      active: false,
      timer: 0
    });
  }

  update(deltaTime: number): void {
    for (const hazard of this.hazards) {
      hazard.timer += deltaTime;
      
      if (!hazard.active && hazard.timer >= hazard.interval) {
        hazard.active = true;
        hazard.timer = 0;
      } else if (hazard.active && hazard.timer >= hazard.duration) {
        hazard.active = false;
        hazard.timer = 0;
      }
    }
  }

  checkCollision(x: number, y: number, radius: number): { hit: boolean; damage: number } {
    for (const hazard of this.hazards) {
      if (!hazard.active) continue;

      switch (hazard.type) {
        case 'laser':
          if (this.checkLaserCollision(hazard, x, y, radius)) {
            return { hit: true, damage: hazard.damage };
          }
          break;
          
        case 'spike':
          if (this.checkRectCollision(hazard, x, y, radius)) {
            return { hit: true, damage: hazard.damage };
          }
          break;
          
        case 'blackhole':
          if (this.checkCircleCollision(hazard, x, y, radius)) {
            return { hit: true, damage: hazard.damage };
          }
          break;
          
        case 'electric':
          if (this.checkCircleCollision(hazard, x, y, radius)) {
            return { hit: true, damage: hazard.damage };
          }
          break;
      }
    }

    return { hit: false, damage: 0 };
  }

  private checkLaserCollision(hazard: EnvironmentalHazard, x: number, y: number, radius: number): boolean {
    if (!hazard.width || !hazard.height) return false;
    
    const laserLeft = hazard.x - hazard.width / 2;
    const laserRight = hazard.x + hazard.width / 2;
    const laserTop = hazard.y - hazard.height / 2;
    const laserBottom = hazard.y + hazard.height / 2;

    const closestX = Math.max(laserLeft, Math.min(x, laserRight));
    const closestY = Math.max(laserTop, Math.min(y, laserBottom));

    const distance = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
    return distance <= radius;
  }

  private checkRectCollision(hazard: EnvironmentalHazard, x: number, y: number, radius: number): boolean {
    if (!hazard.width || !hazard.height) return false;
    
    const left = hazard.x - hazard.width / 2;
    const right = hazard.x + hazard.width / 2;
    const top = hazard.y - hazard.height / 2;
    const bottom = hazard.y + hazard.height / 2;

    const closestX = Math.max(left, Math.min(x, right));
    const closestY = Math.max(top, Math.min(y, bottom));

    const distance = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
    return distance <= radius;
  }

  private checkCircleCollision(hazard: EnvironmentalHazard, x: number, y: number, radius: number): boolean {
    if (!hazard.radius) return false;
    
    const distance = Math.sqrt((x - hazard.x) ** 2 + (y - hazard.y) ** 2);
    return distance <= hazard.radius + radius;
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const hazard of this.hazards) {
      if (!hazard.active) {
        // Render warning indicator
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        
        if (hazard.type === 'laser' && hazard.width && hazard.height) {
          ctx.strokeRect(
            hazard.x - hazard.width / 2,
            hazard.y - hazard.height / 2,
            hazard.width,
            hazard.height
          );
        } else if (hazard.type === 'spike' && hazard.width && hazard.height) {
          ctx.strokeRect(
            hazard.x - hazard.width / 2,
            hazard.y - hazard.height / 2,
            hazard.width,
            hazard.height
          );
        } else if (hazard.radius) {
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        ctx.restore();
        continue;
      }

      ctx.save();
      
      switch (hazard.type) {
        case 'laser':
          if (hazard.width && hazard.height) {
            const gradient = ctx.createLinearGradient(
              hazard.x - hazard.width / 2, hazard.y,
              hazard.x + hazard.width / 2, hazard.y
            );
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
            gradient.addColorStop(0.5, 'rgba(255, 0, 0, 1)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(
              hazard.x - hazard.width / 2,
              hazard.y - hazard.height / 2,
              hazard.width,
              hazard.height
            );
            
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(
              hazard.x - hazard.width / 2,
              hazard.y - 2,
              hazard.width,
              4
            );
          }
          break;
          
        case 'spike':
          if (hazard.width && hazard.height) {
            ctx.fillStyle = '#888888';
            ctx.fillRect(
              hazard.x - hazard.width / 2,
              hazard.y - hazard.height / 2,
              hazard.width,
              hazard.height
            );
            
            ctx.strokeStyle = '#aaaaaa';
            ctx.lineWidth = 2;
            ctx.strokeRect(
              hazard.x - hazard.width / 2,
              hazard.y - hazard.height / 2,
              hazard.width,
              hazard.height
            );
          }
          break;
          
        case 'blackhole':
          if (hazard.radius) {
            const gradient = ctx.createRadialGradient(
              hazard.x, hazard.y, 0,
              hazard.x, hazard.y, hazard.radius
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
            gradient.addColorStop(0.7, 'rgba(50, 0, 100, 0.8)');
            gradient.addColorStop(1, 'rgba(100, 0, 200, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowColor = '#8800ff';
            ctx.shadowBlur = 30;
            ctx.strokeStyle = '#aa00ff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          break;
          
        case 'electric':
          if (hazard.radius) {
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 20;
            
            for (let i = 0; i < 5; i++) {
              const angle = (Math.PI * 2 * i) / 5 + hazard.timer * 2;
              const endX = hazard.x + Math.cos(angle) * hazard.radius;
              const endY = hazard.y + Math.sin(angle) * hazard.radius;
              
              ctx.beginPath();
              ctx.moveTo(hazard.x, hazard.y);
              
              const segments = 5;
              for (let j = 1; j <= segments; j++) {
                const t = j / segments;
                const x = hazard.x + (endX - hazard.x) * t;
                const y = hazard.y + (endY - hazard.y) * t;
                const offset = (Math.random() - 0.5) * 20;
                ctx.lineTo(x + offset, y + offset);
              }
              
              ctx.stroke();
            }
          }
          break;
      }
      
      ctx.restore();
    }
  }

  clear(): void {
    this.hazards = [];
  }
}
