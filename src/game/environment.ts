import { Level } from './levels';

export interface EnvironmentConfig {
  backgroundColor1: string;
  backgroundColor2: string;
  nebulaColors: string[];
  starDensity: number;
  particleType: 'cosmic' | 'crystal' | 'stellar' | 'dark' | 'quantum';
  ambientParticles: number;
  gridColor: string;
  gridOpacity: number;
}

export function getEnvironmentForLevel(level: Level): EnvironmentConfig {
  switch (level.background) {
    case 'cosmic':
      return {
        backgroundColor1: '#0a0015',
        backgroundColor2: '#000005',
        nebulaColors: ['#4400aa', '#aa0044', '#004488'],
        starDensity: 1.0,
        particleType: 'cosmic',
        ambientParticles: 50,
        gridColor: '#00ffff',
        gridOpacity: 0.03
      };
    
    case 'crystal':
      return {
        backgroundColor1: '#1a0033',
        backgroundColor2: '#0a001a',
        nebulaColors: ['#ff00ff', '#aa00ff', '#6600cc'],
        starDensity: 0.5,
        particleType: 'crystal',
        ambientParticles: 80,
        gridColor: '#ff00ff',
        gridOpacity: 0.05
      };
    
    case 'stellar':
      return {
        backgroundColor1: '#1a0a00',
        backgroundColor2: '#0a0500',
        nebulaColors: ['#ff8800', '#ffaa00', '#ff4400'],
        starDensity: 1.5,
        particleType: 'stellar',
        ambientParticles: 100,
        gridColor: '#ffaa00',
        gridOpacity: 0.04
      };
    
    case 'dark':
      return {
        backgroundColor1: '#000000',
        backgroundColor2: '#0a001a',
        nebulaColors: ['#6400c8', '#320064', '#1a0032'],
        starDensity: 0.3,
        particleType: 'dark',
        ambientParticles: 30,
        gridColor: '#6400c8',
        gridOpacity: 0.02
      };
    
    case 'singularity':
      return {
        backgroundColor1: '#1a0000',
        backgroundColor2: '#0a0000',
        nebulaColors: ['#ff0044', '#ff0000', '#880000'],
        starDensity: 0.8,
        particleType: 'cosmic',
        ambientParticles: 60,
        gridColor: '#ff0044',
        gridOpacity: 0.06
      };
    
    case 'quantum':
      return {
        backgroundColor1: '#001a0a',
        backgroundColor2: '#000a05',
        nebulaColors: ['#00ff88', '#00aa44', '#006622'],
        starDensity: 1.2,
        particleType: 'quantum',
        ambientParticles: 90,
        gridColor: '#00ff88',
        gridOpacity: 0.04
      };
    
    case 'abyss':
      return {
        backgroundColor1: '#0a001a',
        backgroundColor2: '#05000a',
        nebulaColors: ['#8800ff', '#6600cc', '#440088'],
        starDensity: 0.4,
        particleType: 'dark',
        ambientParticles: 40,
        gridColor: '#8800ff',
        gridOpacity: 0.03
      };
    
    case 'supernova':
      return {
        backgroundColor1: '#1a0a00',
        backgroundColor2: '#0a0500',
        nebulaColors: ['#ff8800', '#ffaa00', '#ffff00'],
        starDensity: 2.0,
        particleType: 'stellar',
        ambientParticles: 120,
        gridColor: '#ff8800',
        gridOpacity: 0.05
      };
    
    case 'horizon':
      return {
        backgroundColor1: '#0a0a0a',
        backgroundColor2: '#000000',
        nebulaColors: ['#ffffff', '#cccccc', '#888888'],
        starDensity: 1.8,
        particleType: 'cosmic',
        ambientParticles: 70,
        gridColor: '#ffffff',
        gridOpacity: 0.04
      };
    
    case 'void':
      return {
        backgroundColor1: '#0a000a',
        backgroundColor2: '#050005',
        nebulaColors: ['#ff00ff', '#ff00aa', '#aa00ff'],
        starDensity: 0.6,
        particleType: 'quantum',
        ambientParticles: 100,
        gridColor: '#ff00ff',
        gridOpacity: 0.07
      };
    
    default:
      return {
        backgroundColor1: '#0a0015',
        backgroundColor2: '#000005',
        nebulaColors: ['#4400aa', '#aa0044', '#004488'],
        starDensity: 1.0,
        particleType: 'cosmic',
        ambientParticles: 50,
        gridColor: '#00ffff',
        gridOpacity: 0.03
      };
  }
}

export function renderEnvironment(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: EnvironmentConfig,
  time: number
) {
  // Background gradient
  const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
  grad.addColorStop(0, config.backgroundColor1);
  grad.addColorStop(1, config.backgroundColor2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Nebula clouds
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < config.nebulaColors.length; i++) {
    const nx = width / 2 + Math.sin(time * 0.1 + i * 1.5) * 300;
    const ny = height / 2 + Math.cos(time * 0.08 + i * 2.1) * 200;
    const radius = 200 + Math.sin(time * 0.3 + i) * 50;
    const nGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, radius);
    nGrad.addColorStop(0, config.nebulaColors[i]);
    nGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = nGrad;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.globalAlpha = 1;

  // Grid
  ctx.strokeStyle = config.gridColor + Math.floor(config.gridOpacity * 255).toString(16).padStart(2, '0');
  ctx.lineWidth = 1;
  const gridSize = 80;
  const offsetX = (time * 15) % gridSize;
  const offsetY = (time * 10) % gridSize;
  
  for (let x = -gridSize + offsetX; x < width + gridSize; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = -gridSize + offsetY; y < height + gridSize; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Ambient particles based on type
  renderAmbientParticles(ctx, width, height, config, time);
}

function renderAmbientParticles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: EnvironmentConfig,
  time: number
) {
  const particleCount = config.ambientParticles;
  
  for (let i = 0; i < particleCount; i++) {
    const seed = i * 12345.6789;
    const x = ((seed * 0.1 + time * 20) % width + width) % width;
    const y = ((seed * 0.2 + time * 10) % height + height) % height;
    const size = 1 + (seed % 3);
    const brightness = 0.3 + Math.sin(time * 2 + seed) * 0.3;
    
    ctx.fillStyle = config.gridColor;
    ctx.globalAlpha = brightness;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
