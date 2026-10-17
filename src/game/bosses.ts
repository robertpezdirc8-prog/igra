import { Level } from './levels';

export interface BossPattern {
  name: string;
  description: string;
  phases: BossPhase[];
}

export interface BossPhase {
  hpThreshold: number; // 0-1, phase starts when HP drops below this
  attackPatterns: AttackPattern[];
  movementPattern: MovementPattern;
  speed: number;
  color: string;
}

export interface AttackPattern {
  type: 'spiral' | 'burst' | 'laser' | 'homing' | 'wave' | 'cross' | 'ring' | 'random';
  damage: number;
  projectileCount: number;
  projectileSpeed: number;
  projectileSize: number;
  projectileColor: string;
  interval: number; // seconds between attacks
  duration: number; // how long this pattern lasts
}

export interface MovementPattern {
  type: 'circle' | 'figure8' | 'zigzag' | 'chase' | 'random' | 'hover';
  radius: number;
  speed: number;
}

export function generateBossForLevel(level: Level): BossPattern {
  switch (level.id) {
    case 1: // Void Nexus
      return {
        name: 'Void Sentinel',
        description: 'Čuvar praznine',
        phases: [
          {
            hpThreshold: 1.0,
            attackPatterns: [
              {
                type: 'spiral',
                damage: 10,
                projectileCount: 8,
                projectileSpeed: 3,
                projectileSize: 8,
                projectileColor: '#00ffff',
                interval: 2,
                duration: 10
              }
            ],
            movementPattern: { type: 'circle', radius: 200, speed: 1 },
            speed: 1,
            color: '#00ffff'
          },
          {
            hpThreshold: 0.5,
            attackPatterns: [
              {
                type: 'spiral',
                damage: 15,
                projectileCount: 12,
                projectileSpeed: 4,
                projectileSize: 10,
                projectileColor: '#00ffff',
                interval: 1.5,
                duration: 8
              },
              {
                type: 'burst',
                damage: 20,
                projectileCount: 16,
                projectileSpeed: 5,
                projectileSize: 12,
                projectileColor: '#ff00ff',
                interval: 3,
                duration: 5
              }
            ],
            movementPattern: { type: 'figure8', radius: 250, speed: 1.5 },
            speed: 1.5,
            color: '#ff00ff'
          }
        ]
      };

    case 2: // Crystal Wastes
      return {
        name: 'Crystal Guardian',
        description: 'Kristalni varuh',
        phases: [
          {
            hpThreshold: 1.0,
            attackPatterns: [
              {
                type: 'ring',
                damage: 12,
                projectileCount: 20,
                projectileSpeed: 3,
                projectileSize: 10,
                projectileColor: '#ff00ff',
                interval: 2.5,
                duration: 10
              }
            ],
            movementPattern: { type: 'hover', radius: 150, speed: 0.8 },
            speed: 0.8,
            color: '#ff00ff'
          },
          {
            hpThreshold: 0.6,
            attackPatterns: [
              {
                type: 'ring',
                damage: 15,
                projectileCount: 24,
                projectileSpeed: 4,
                projectileSize: 12,
                projectileColor: '#ff00ff',
                interval: 2,
                duration: 8
              },
              {
                type: 'laser',
                damage: 30,
                projectileCount: 1,
                projectileSpeed: 8,
                projectileSize: 20,
                projectileColor: '#ffffff',
                interval: 4,
                duration: 3
              }
            ],
            movementPattern: { type: 'zigzag', radius: 300, speed: 1.2 },
            speed: 1.2,
            color: '#aa00ff'
          },
          {
            hpThreshold: 0.3,
            attackPatterns: [
              {
                type: 'burst',
                damage: 20,
                projectileCount: 32,
                projectileSpeed: 5,
                projectileSize: 14,
                projectileColor: '#ff00ff',
                interval: 1.5,
                duration: 6
              }
            ],
            movementPattern: { type: 'chase', radius: 100, speed: 2 },
            speed: 2,
            color: '#ff00aa'
          }
        ]
      };

    case 3: // Stellar Graveyard
      return {
        name: 'Stellar Reaper',
        description: 'Žanjec zvezd',
        phases: [
          {
            hpThreshold: 1.0,
            attackPatterns: [
              {
                type: 'wave',
                damage: 15,
                projectileCount: 10,
                projectileSpeed: 4,
                projectileSize: 12,
                projectileColor: '#ffaa00',
                interval: 2,
                duration: 10
              }
            ],
            movementPattern: { type: 'circle', radius: 250, speed: 1.2 },
            speed: 1.2,
            color: '#ffaa00'
          },
          {
            hpThreshold: 0.5,
            attackPatterns: [
              {
                type: 'wave',
                damage: 18,
                projectileCount: 15,
                projectileSpeed: 5,
                projectileSize: 14,
                projectileColor: '#ffaa00',
                interval: 1.5,
                duration: 8
              },
              {
                type: 'homing',
                damage: 25,
                projectileCount: 3,
                projectileSpeed: 3,
                projectileSize: 16,
                projectileColor: '#ff4400',
                interval: 3,
                duration: 5
              }
            ],
            movementPattern: { type: 'figure8', radius: 300, speed: 1.8 },
            speed: 1.8,
            color: '#ff8800'
          }
        ]
      };

    case 4: // Dark Matter Sea
      return {
        name: 'Dark Leviathan',
        description: 'Temni leviatan',
        phases: [
          {
            hpThreshold: 1.0,
            attackPatterns: [
              {
                type: 'random',
                damage: 18,
                projectileCount: 20,
                projectileSpeed: 4,
                projectileSize: 14,
                projectileColor: '#6400c8',
                interval: 2,
                duration: 10
              }
            ],
            movementPattern: { type: 'random', radius: 350, speed: 1.5 },
            speed: 1.5,
            color: '#6400c8'
          },
          {
            hpThreshold: 0.4,
            attackPatterns: [
              {
                type: 'random',
                damage: 22,
                projectileCount: 30,
                projectileSpeed: 5,
                projectileSize: 16,
                projectileColor: '#6400c8',
                interval: 1.5,
                duration: 8
              },
              {
                type: 'laser',
                damage: 40,
                projectileCount: 1,
                projectileSpeed: 10,
                projectileSize: 25,
                projectileColor: '#ffffff',
                interval: 5,
                duration: 2
              }
            ],
            movementPattern: { type: 'chase', radius: 150, speed: 2.5 },
            speed: 2.5,
            color: '#8800ff'
          }
        ]
      };

    case 5: // Singularity Core
      return {
        name: 'The Singularity',
        description: 'Singularnost',
        phases: [
          {
            hpThreshold: 1.0,
            attackPatterns: [
              {
                type: 'spiral',
                damage: 20,
                projectileCount: 16,
                projectileSpeed: 5,
                projectileSize: 14,
                projectileColor: '#ff0044',
                interval: 1.5,
                duration: 10
              }
            ],
            movementPattern: { type: 'circle', radius: 200, speed: 2 },
            speed: 2,
            color: '#ff0044'
          },
          {
            hpThreshold: 0.6,
            attackPatterns: [
              {
                type: 'cross',
                damage: 25,
                projectileCount: 4,
                projectileSpeed: 6,
                projectileSize: 16,
                projectileColor: '#ff0044',
                interval: 1,
                duration: 8
              },
              {
                type: 'ring',
                damage: 20,
                projectileCount: 24,
                projectileSpeed: 4,
                projectileSize: 14,
                projectileColor: '#ff4400',
                interval: 2,
                duration: 6
              }
            ],
            movementPattern: { type: 'figure8', radius: 250, speed: 2.5 },
            speed: 2.5,
            color: '#ff0000'
          },
          {
            hpThreshold: 0.3,
            attackPatterns: [
              {
                type: 'burst',
                damage: 30,
                projectileCount: 40,
                projectileSpeed: 7,
                projectileSize: 18,
                projectileColor: '#ff0044',
                interval: 1,
                duration: 5
              }
            ],
            movementPattern: { type: 'chase', radius: 100, speed: 3 },
            speed: 3,
            color: '#ff0000'
          }
        ]
      };

    default:
      return {
        name: 'Unknown Entity',
        description: 'Neznana entiteta',
        phases: [
          {
            hpThreshold: 1.0,
            attackPatterns: [
              {
                type: 'spiral',
                damage: 15,
                projectileCount: 10,
                projectileSpeed: 4,
                projectileSize: 10,
                projectileColor: level.color,
                interval: 2,
                duration: 10
              }
            ],
            movementPattern: { type: 'circle', radius: 200, speed: 1 },
            speed: 1,
            color: level.color
          }
        ]
      };
  }
}

export function getBossHPForLevel(level: Level): number {
  return 500 + level.id * 200;
}

export function getBossScoreForLevel(level: Level): number {
  return 1000 * level.id;
}
