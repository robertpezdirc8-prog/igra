export interface Level {
  id: number;
  name: string;
  description: string;
  background: string;
  enemyTypes: string[];
  bossType: string;
  unlockLevel: number;
  color: string;
}

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'Void Nexus',
    description: 'Začetna cona praznine',
    background: 'cosmic',
    enemyTypes: ['swarmer', 'sniper'],
    bossType: 'Void Sentinel',
    unlockLevel: 1,
    color: '#00ffff'
  },
  {
    id: 2,
    name: 'Crystal Wastes',
    description: 'Uničeni kristalni svetovi',
    background: 'crystal',
    enemyTypes: ['swarmer', 'sniper', 'titan'],
    bossType: 'Crystal Guardian',
    unlockLevel: 5,
    color: '#ff00ff'
  },
  {
    id: 3,
    name: 'Stellar Graveyard',
    description: 'Pokopališče mrtvih zvezd',
    background: 'stellar',
    enemyTypes: ['swarmer', 'sniper', 'titan'],
    bossType: 'Stellar Reaper',
    unlockLevel: 10,
    color: '#ffaa00'
  },
  {
    id: 4,
    name: 'Dark Matter Sea',
    description: 'Morje temne snovi',
    background: 'dark',
    enemyTypes: ['sniper', 'titan'],
    bossType: 'Dark Leviathan',
    unlockLevel: 15,
    color: '#6400c8'
  },
  {
    id: 5,
    name: 'Singularity Core',
    description: 'Jedro singularnosti',
    background: 'singularity',
    enemyTypes: ['titan'],
    bossType: 'The Singularity',
    unlockLevel: 20,
    color: '#ff0044'
  },
  {
    id: 6,
    name: 'Quantum Realm',
    description: 'Kvantna dimenzija',
    background: 'quantum',
    enemyTypes: ['swarmer', 'sniper', 'titan'],
    bossType: 'Quantum Overlord',
    unlockLevel: 25,
    color: '#00ff88'
  },
  {
    id: 7,
    name: 'Cosmic Abyss',
    description: 'Kozmična brezno',
    background: 'abyss',
    enemyTypes: ['sniper', 'titan'],
    bossType: 'Abyssal Horror',
    unlockLevel: 30,
    color: '#8800ff'
  },
  {
    id: 8,
    name: 'Supernova Remnant',
    description: 'Ostanek supernove',
    background: 'supernova',
    enemyTypes: ['swarmer', 'sniper', 'titan'],
    bossType: 'Supernova Entity',
    unlockLevel: 35,
    color: '#ff8800'
  },
  {
    id: 9,
    name: 'Event Horizon',
    description: 'Obzorje dogodkov',
    background: 'horizon',
    enemyTypes: ['titan'],
    bossType: 'Horizon Keeper',
    unlockLevel: 40,
    color: '#ffffff'
  },
  {
    id: 10,
    name: 'The Void Heart',
    description: 'Srce praznine - končni izziv',
    background: 'void',
    enemyTypes: ['swarmer', 'sniper', 'titan'],
    bossType: 'Void Incarnate',
    unlockLevel: 50,
    color: '#ff00ff'
  }
];

export function getLevelForPlayer(playerLevel: number): Level {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (playerLevel >= level.unlockLevel) {
      currentLevel = level;
    }
  }
  return currentLevel;
}

export function getNextLevel(playerLevel: number): Level | null {
  for (const level of LEVELS) {
    if (level.unlockLevel > playerLevel) {
      return level;
    }
  }
  return null;
}
