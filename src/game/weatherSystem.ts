// Advanced Weather and Environmental Effects System

export type WeatherType = 'clear' | 'rain' | 'snow' | 'storm' | 'fog' | 'sandstorm' | 'meteor';

export interface WeatherEffect {
  type: WeatherType;
  intensity: number; // 0-1
  duration: number; // seconds
  particles: WeatherParticle[];
  ambientColor: string;
  ambientOpacity: number;
}

export interface WeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export class WeatherSystem {
  private currentWeather: WeatherEffect | null = null;
  private weatherTimer: number = 0;
  private transitionTimer: number = 0;
  private targetWeather: WeatherType = 'clear';
  private particles: WeatherParticle[] = [];
  private maxParticles: number = 500;

  constructor() {
    this.setWeather('clear', 1.0, -1); // -1 = infinite duration
  }

  setWeather(type: WeatherType, intensity: number = 1.0, duration: number = 60): void {
    this.targetWeather = type;
    this.transitionTimer = 2; // 2 second transition

    const config = this.getWeatherConfig(type, intensity);
    this.currentWeather = {
      type,
      intensity,
      duration,
      particles: [],
      ambientColor: config.ambientColor,
      ambientOpacity: config.ambientOpacity
    };

    this.weatherTimer = duration;
  }

  private getWeatherConfig(type: WeatherType, intensity: number) {
    switch (type) {
      case 'rain':
        return {
          ambientColor: '#4488aa',
          ambientOpacity: 0.2 * intensity,
          particleSpeed: 800,
          particleSize: 2,
          particleCount: Math.floor(200 * intensity)
        };
      
      case 'snow':
        return {
          ambientColor: '#aaccff',
          ambientOpacity: 0.15 * intensity,
          particleSpeed: 100,
          particleSize: 3,
          particleCount: Math.floor(150 * intensity)
        };
      
      case 'storm':
        return {
          ambientColor: '#222244',
          ambientOpacity: 0.4 * intensity,
          particleSpeed: 1200,
          particleSize: 3,
          particleCount: Math.floor(300 * intensity)
        };
      
      case 'fog':
        return {
          ambientColor: '#888888',
          ambientOpacity: 0.5 * intensity,
          particleSpeed: 20,
          particleSize: 50,
          particleCount: Math.floor(50 * intensity)
        };
      
      case 'sandstorm':
        return {
          ambientColor: '#aa8844',
          ambientOpacity: 0.3 * intensity,
          particleSpeed: 600,
          particleSize: 4,
          particleCount: Math.floor(250 * intensity)
        };
      
      case 'meteor':
        return {
          ambientColor: '#ff4400',
          ambientOpacity: 0.2 * intensity,
          particleSpeed: 1000,
          particleSize: 5,
          particleCount: Math.floor(30 * intensity)
        };
      
      default: // clear
        return {
          ambientColor: '#000000',
          ambientOpacity: 0,
          particleSpeed: 0,
          particleSize: 0,
          particleCount: 0
        };
    }
  }

  update(deltaTime: number, screenWidth: number, screenHeight: number): void {
    // Update weather timer
    if (this.weatherTimer > 0) {
      this.weatherTimer -= deltaTime;
      if (this.weatherTimer <= 0) {
        this.setWeather('clear', 1.0, -1);
      }
    }

    // Update transition
    if (this.transitionTimer > 0) {
      this.transitionTimer -= deltaTime;
    }

    if (!this.currentWeather) return;

    const config = this.getWeatherConfig(this.currentWeather.type, this.currentWeather.intensity);

    // Spawn new particles
    while (this.particles.length < config.particleCount) {
      this.particles.push(this.createParticle(config, screenWidth, screenHeight));
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.life -= deltaTime;

      // Remove dead particles or particles out of bounds
      if (particle.life <= 0 || particle.y > screenHeight + 50 || particle.x < -50 || particle.x > screenWidth + 50) {
        this.particles.splice(i, 1);
      }
    }
  }

  private createParticle(config: any, screenWidth: number, screenHeight: number): WeatherParticle {
    const particle: WeatherParticle = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: config.particleSize * (0.5 + Math.random() * 0.5),
      opacity: 0.3 + Math.random() * 0.7,
      life: 0,
      maxLife: 0
    };

    switch (this.currentWeather?.type) {
      case 'rain':
      case 'storm':
        particle.x = Math.random() * screenWidth;
        particle.y = -10;
        particle.vx = (Math.random() - 0.5) * 100;
        particle.vy = config.particleSpeed * (0.8 + Math.random() * 0.4);
        particle.maxLife = 2;
        particle.life = particle.maxLife;
        break;
      
      case 'snow':
        particle.x = Math.random() * screenWidth;
        particle.y = -10;
        particle.vx = (Math.random() - 0.5) * 50;
        particle.vy = config.particleSpeed * (0.5 + Math.random() * 0.5);
        particle.maxLife = 10;
        particle.life = particle.maxLife;
        break;
      
      case 'fog':
        particle.x = Math.random() * screenWidth;
        particle.y = Math.random() * screenHeight;
        particle.vx = config.particleSpeed * (Math.random() - 0.5);
        particle.vy = config.particleSpeed * (Math.random() - 0.5);
        particle.maxLife = 5;
        particle.life = particle.maxLife;
        break;
      
      case 'sandstorm':
        particle.x = -10;
        particle.y = Math.random() * screenHeight;
        particle.vx = config.particleSpeed * (0.8 + Math.random() * 0.4);
        particle.vy = (Math.random() - 0.5) * 200;
        particle.maxLife = 3;
        particle.life = particle.maxLife;
        break;
      
      case 'meteor':
        particle.x = Math.random() * screenWidth;
        particle.y = -50;
        particle.vx = (Math.random() - 0.5) * 200;
        particle.vy = config.particleSpeed * (0.8 + Math.random() * 0.4);
        particle.maxLife = 2;
        particle.life = particle.maxLife;
        break;
    }

    return particle;
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.currentWeather) return;

    // Render ambient overlay
    if (this.currentWeather.ambientOpacity > 0) {
      ctx.fillStyle = this.currentWeather.ambientColor;
      ctx.globalAlpha = this.currentWeather.ambientOpacity;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.globalAlpha = 1;
    }

    // Render particles
    this.particles.forEach(particle => {
      const lifeRatio = particle.life / particle.maxLife;
      
      switch (this.currentWeather?.type) {
        case 'rain':
        case 'storm':
          ctx.strokeStyle = this.currentWeather.type === 'storm' ? '#aaccff' : '#88aacc';
          ctx.lineWidth = particle.size;
          ctx.globalAlpha = particle.opacity * lifeRatio;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - particle.vx * 0.02, particle.y - particle.vy * 0.02);
          ctx.stroke();
          break;
        
        case 'snow':
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = particle.opacity * lifeRatio;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        
        case 'fog':
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
          );
          gradient.addColorStop(0, 'rgba(136, 136, 136, 0.3)');
          gradient.addColorStop(1, 'rgba(136, 136, 136, 0)');
          ctx.fillStyle = gradient;
          ctx.globalAlpha = particle.opacity * lifeRatio;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        
        case 'sandstorm':
          ctx.fillStyle = '#aa8844';
          ctx.globalAlpha = particle.opacity * lifeRatio;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        
        case 'meteor':
          // Meteor trail
          ctx.strokeStyle = '#ff8800';
          ctx.lineWidth = particle.size;
          ctx.globalAlpha = particle.opacity * lifeRatio;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - particle.vx * 0.05, particle.y - particle.vy * 0.05);
          ctx.stroke();
          
          // Meteor head
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
          break;
      }
      
      ctx.globalAlpha = 1;
    });

    // Lightning effect for storms
    if (this.currentWeather.type === 'storm' && Math.random() < 0.005) {
      this.renderLightning(ctx);
    }
  }

  private renderLightning(ctx: CanvasRenderingContext2D): void {
    const startX = Math.random() * ctx.canvas.width;
    const startY = 0;
    const endX = startX + (Math.random() - 0.5) * 200;
    const endY = ctx.canvas.height * (0.3 + Math.random() * 0.4);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Create jagged lightning path
    const segments = 10;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const x = startX + (endX - startX) * t + (Math.random() - 0.5) * 50;
      const y = startY + (endY - startY) * t;
      ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Flash effect
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalAlpha = 1;
  }

  getCurrentWeather(): WeatherType {
    return this.currentWeather?.type || 'clear';
  }

  getWeatherIntensity(): number {
    return this.currentWeather?.intensity || 0;
  }

  getWeatherTimeRemaining(): number {
    return Math.max(0, this.weatherTimer);
  }
}

// Environmental hazards system
export interface EnvironmentalHazard {
  id: string;
  type: 'toxic_cloud' | 'electric_field' | 'fire_zone' | 'ice_zone' | 'gravity_well';
  x: number;
  y: number;
  radius: number;
  damage: number;
  duration: number;
  timer: number;
}

export class EnvironmentalHazardsSystem {
  private hazards: EnvironmentalHazard[] = [];
  private nextId: number = 0;

  addHazard(
    type: EnvironmentalHazard['type'],
    x: number,
    y: number,
    radius: number,
    damage: number,
    duration: number
  ): string {
    const id = `hazard_${this.nextId++}`;
    this.hazards.push({
      id,
      type,
      x,
      y,
      radius,
      damage,
      duration,
      timer: duration
    });
    return id;
  }

  removeHazard(id: string): void {
    this.hazards = this.hazards.filter(h => h.id !== id);
  }

  update(deltaTime: number): void {
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const hazard = this.hazards[i];
      hazard.timer -= deltaTime;

      if (hazard.timer <= 0) {
        this.hazards.splice(i, 1);
      }
    }
  }

  checkCollision(x: number, y: number, radius: number): { hazard: EnvironmentalHazard | null; damage: number } {
    for (const hazard of this.hazards) {
      const dx = x - hazard.x;
      const dy = y - hazard.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < hazard.radius + radius) {
        return { hazard, damage: hazard.damage };
      }
    }

    return { hazard: null, damage: 0 };
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.hazards.forEach(hazard => {
      const lifeRatio = hazard.timer / hazard.duration;

      switch (hazard.type) {
        case 'toxic_cloud':
          const toxicGradient = ctx.createRadialGradient(
            hazard.x, hazard.y, 0,
            hazard.x, hazard.y, hazard.radius
          );
          toxicGradient.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
          toxicGradient.addColorStop(0.5, 'rgba(0, 200, 0, 0.2)');
          toxicGradient.addColorStop(1, 'rgba(0, 150, 0, 0)');
          ctx.fillStyle = toxicGradient;
          ctx.globalAlpha = lifeRatio;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'electric_field':
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 2;
          ctx.globalAlpha = lifeRatio * 0.6;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
          ctx.stroke();

          // Electric arcs
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + Date.now() * 0.001;
            const endX = hazard.x + Math.cos(angle) * hazard.radius;
            const endY = hazard.y + Math.sin(angle) * hazard.radius;
            
            ctx.beginPath();
            ctx.moveTo(hazard.x, hazard.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
          break;

        case 'fire_zone':
          const fireGradient = ctx.createRadialGradient(
            hazard.x, hazard.y, 0,
            hazard.x, hazard.y, hazard.radius
          );
          fireGradient.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
          fireGradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.3)');
          fireGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
          ctx.fillStyle = fireGradient;
          ctx.globalAlpha = lifeRatio;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'ice_zone':
          const iceGradient = ctx.createRadialGradient(
            hazard.x, hazard.y, 0,
            hazard.x, hazard.y, hazard.radius
          );
          iceGradient.addColorStop(0, 'rgba(100, 200, 255, 0.3)');
          iceGradient.addColorStop(0.5, 'rgba(150, 220, 255, 0.2)');
          iceGradient.addColorStop(1, 'rgba(200, 240, 255, 0)');
          ctx.fillStyle = iceGradient;
          ctx.globalAlpha = lifeRatio;
          ctx.beginPath();
          ctx.arc(hazard.x, hazard.y, hazard.radius, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'gravity_well':
          ctx.strokeStyle = '#8800ff';
          ctx.lineWidth = 3;
          ctx.globalAlpha = lifeRatio * 0.5;
          
          // Spiral effect
          for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(
              hazard.x,
              hazard.y,
              hazard.radius * (0.3 + i * 0.3),
              Date.now() * 0.001 + i,
              Date.now() * 0.001 + i + Math.PI
            );
            ctx.stroke();
          }
          break;
      }

      ctx.globalAlpha = 1;
    });
  }

  getHazards(): EnvironmentalHazard[] {
    return [...this.hazards];
  }

  clear(): void {
    this.hazards = [];
  }
}
