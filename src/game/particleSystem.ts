// Particle System for explosions and visual effects

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'explosion' | 'spark' | 'smoke' | 'debris' | 'trail';
  gravity?: number;
  friction?: number;
  rotation?: number;
  rotationSpeed?: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private particleIdCounter: number = 0;

  constructor() {}

  createExplosion(x: number, y: number, color: string = '#ff8800', count: number = 20) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      
      this.particles.push({
        id: `particle_${this.particleIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5 + Math.random() * 0.5,
        maxLife: 1,
        size: 3 + Math.random() * 4,
        color,
        type: 'explosion',
        gravity: 0.1,
        friction: 0.98
      });
    }

    // Add sparks
    for (let i = 0; i < count / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 5 + Math.random() * 8;
      
      this.particles.push({
        id: `particle_${this.particleIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3 + Math.random() * 0.3,
        maxLife: 0.6,
        size: 2,
        color: '#ffff00',
        type: 'spark',
        friction: 0.95
      });
    }

    // Add smoke
    for (let i = 0; i < count / 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      
      this.particles.push({
        id: `particle_${this.particleIdCounter++}`,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1 + Math.random() * 1,
        maxLife: 2,
        size: 8 + Math.random() * 8,
        color: '#444444',
        type: 'smoke',
        friction: 0.96
      });
    }
  }

  createTrail(x: number, y: number, color: string = '#00ffff') {
    this.particles.push({
      id: `particle_${this.particleIdCounter++}`,
      x,
      y,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 1 + Math.random() * 2,
      life: 0.3,
      maxLife: 0.3,
      size: 2 + Math.random() * 2,
      color,
      type: 'trail',
      friction: 0.95
    });
  }

  createDebris(x: number, y: number, color: string = '#888888', count: number = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      
      this.particles.push({
        id: `particle_${this.particleIdCounter++}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1 + Math.random() * 1,
        maxLife: 2,
        size: 4 + Math.random() * 4,
        color,
        type: 'debris',
        gravity: 0.2,
        friction: 0.98,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
  }

  update(deltaTime: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update position
      p.x += p.vx * 60 * deltaTime;
      p.y += p.vy * 60 * deltaTime;
      
      // Apply gravity
      if (p.gravity) {
        p.vy += p.gravity * 60 * deltaTime;
      }
      
      // Apply friction
      if (p.friction) {
        p.vx *= p.friction;
        p.vy *= p.friction;
      }
      
      // Update rotation
      if (p.rotationSpeed) {
        p.rotation = (p.rotation || 0) + p.rotationSpeed;
      }
      
      // Update life
      p.life -= deltaTime;
      
      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      
      if (p.type === 'explosion') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        
        // Glow effect
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        
        // Bright glow
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        const size = p.size * (1 + (1 - alpha) * 0.5);
        ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      } else if (p.type === 'debris') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation || 0);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.type === 'trail') {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      
      ctx.restore();
    }
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  clear() {
    this.particles = [];
  }
}
