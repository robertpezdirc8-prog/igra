export interface EnemyType {
  id: string;
  name: string;
  hp: number;
  speed: number;
  size: number;
  color: string;
  score: number;
  xp: number;
  behavior: 'swarmer' | 'sniper' | 'titan' | 'bomber' | 'teleporter' | 'shielder';
  attackPattern: 'single' | 'burst' | 'spread' | 'homing' | 'laser';
  unlockWave: number;
}

export const ENEMY_TYPES: EnemyType[] = [
  {
    id: 'basic_swarmer',
    name: 'Swarmer',
    hp: 20,
    speed: 2.5,
    size: 15,
    color: '#ff4444',
    score: 25,
    xp: 15,
    behavior: 'swarmer',
    attackPattern: 'single',
    unlockWave: 1
  },
  {
    id: 'fast_swarmer',
    name: 'Fast Swarmer',
    hp: 15,
    speed: 4,
    size: 12,
    color: '#ff8844',
    score: 30,
    xp: 18,
    behavior: 'swarmer',
    attackPattern: 'single',
    unlockWave: 3
  },
  {
    id: 'basic_sniper',
    name: 'Sniper',
    hp: 40,
    speed: 1,
    size: 20,
    color: '#ff8800',
    score: 50,
    xp: 25,
    behavior: 'sniper',
    attackPattern: 'single',
    unlockWave: 2
  },
  {
    id: 'burst_sniper',
    name: 'Burst Sniper',
    hp: 50,
    speed: 1.2,
    size: 22,
    color: '#ffaa00',
    score: 75,
    xp: 35,
    behavior: 'sniper',
    attackPattern: 'burst',
    unlockWave: 5
  },
  {
    id: 'basic_titan',
    name: 'Titan',
    hp: 100,
    speed: 0.8,
    size: 35,
    color: '#aa00ff',
    score: 100,
    xp: 50,
    behavior: 'titan',
    attackPattern: 'spread',
    unlockWave: 4
  },
  {
    id: 'heavy_titan',
    name: 'Heavy Titan',
    hp: 200,
    speed: 0.6,
    size: 45,
    color: '#8800ff',
    score: 200,
    xp: 100,
    behavior: 'titan',
    attackPattern: 'spread',
    unlockWave: 8
  },
  {
    id: 'bomber',
    name: 'Bomber',
    hp: 60,
    speed: 1.5,
    size: 25,
    color: '#ff0088',
    score: 80,
    xp: 40,
    behavior: 'bomber',
    attackPattern: 'burst',
    unlockWave: 6
  },
  {
    id: 'teleporter',
    name: 'Teleporter',
    hp: 45,
    speed: 2,
    size: 18,
    color: '#00ff88',
    score: 90,
    xp: 45,
    behavior: 'teleporter',
    attackPattern: 'homing',
    unlockWave: 7
  },
  {
    id: 'shielder',
    name: 'Shielder',
    hp: 80,
    speed: 1.3,
    size: 28,
    color: '#0088ff',
    score: 120,
    xp: 60,
    behavior: 'shielder',
    attackPattern: 'laser',
    unlockWave: 9
  },
  {
    id: 'elite_swarmer',
    name: 'Elite Swarmer',
    hp: 35,
    speed: 3.5,
    size: 18,
    color: '#ff0044',
    score: 60,
    xp: 30,
    behavior: 'swarmer',
    attackPattern: 'burst',
    unlockWave: 10
  },
  {
    id: 'phantom',
    name: 'Phantom',
    hp: 55,
    speed: 2.8,
    size: 20,
    color: '#aa00aa',
    score: 110,
    xp: 55,
    behavior: 'teleporter',
    attackPattern: 'spread',
    unlockWave: 12
  },
  {
    id: 'destroyer',
    name: 'Destroyer',
    hp: 300,
    speed: 0.5,
    size: 50,
    color: '#ff0000',
    score: 300,
    xp: 150,
    behavior: 'titan',
    attackPattern: 'burst',
    unlockWave: 15
  }
];

export function getEnemyTypeById(id: string): EnemyType | undefined {
  return ENEMY_TYPES.find(e => e.id === id);
}

export function getAvailableEnemyTypes(wave: number): EnemyType[] {
  return ENEMY_TYPES.filter(e => e.unlockWave <= wave);
}

export function getRandomEnemyType(wave: number): EnemyType {
  const available = getAvailableEnemyTypes(wave);
  return available[Math.floor(Math.random() * available.length)];
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'health' | 'shield' | 'energy' | 'damage' | 'speed' | 'score' | 'weapon' | 'special';
  duration: number; // seconds, 0 for instant
  value: number;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  dropChance: number; // 0-1
}

export const POWER_UPS: PowerUp[] = [
  // Health
  {
    id: 'small_health',
    name: 'Small Health',
    description: '+20 HP',
    icon: '❤️',
    type: 'health',
    duration: 0,
    value: 20,
    color: '#00ff44',
    rarity: 'common',
    dropChance: 0.3
  },
  {
    id: 'large_health',
    name: 'Large Health',
    description: '+50 HP',
    icon: '💖',
    type: 'health',
    duration: 0,
    value: 50,
    color: '#00ff44',
    rarity: 'rare',
    dropChance: 0.15
  },
  
  // Shield
  {
    id: 'small_shield',
    name: 'Small Shield',
    description: '+15 Shield',
    icon: '🛡️',
    type: 'shield',
    duration: 0,
    value: 15,
    color: '#0088ff',
    rarity: 'common',
    dropChance: 0.25
  },
  {
    id: 'large_shield',
    name: 'Large Shield',
    description: '+40 Shield',
    icon: '🛡️',
    type: 'shield',
    duration: 0,
    value: 40,
    color: '#0088ff',
    rarity: 'rare',
    dropChance: 0.12
  },
  
  // Energy
  {
    id: 'energy_cell',
    name: 'Energy Cell',
    description: '+25 Energy',
    icon: '⚡',
    type: 'energy',
    duration: 0,
    value: 25,
    color: '#ffaa00',
    rarity: 'common',
    dropChance: 0.2
  },
  
  // Damage boost
  {
    id: 'damage_boost',
    name: 'Damage Boost',
    description: '+50% damage for 10s',
    icon: '💥',
    type: 'damage',
    duration: 10,
    value: 0.5,
    color: '#ff4444',
    rarity: 'rare',
    dropChance: 0.1
  },
  {
    id: 'mega_damage',
    name: 'Mega Damage',
    description: '+100% damage for 8s',
    icon: '🔥',
    type: 'damage',
    duration: 8,
    value: 1.0,
    color: '#ff0000',
    rarity: 'epic',
    dropChance: 0.05
  },
  
  // Speed boost
  {
    id: 'speed_boost',
    name: 'Speed Boost',
    description: '+30% speed for 12s',
    icon: '💨',
    type: 'speed',
    duration: 12,
    value: 0.3,
    color: '#00ffff',
    rarity: 'rare',
    dropChance: 0.1
  },
  
  // Score
  {
    id: 'score_multiplier',
    name: 'Score Multiplier',
    description: '2x score for 15s',
    icon: '⭐',
    type: 'score',
    duration: 15,
    value: 2,
    color: '#ffff00',
    rarity: 'epic',
    dropChance: 0.08
  },
  
  // Weapon
  {
    id: 'rapid_fire',
    name: 'Rapid Fire',
    description: '2x fire rate for 10s',
    icon: '🔫',
    type: 'weapon',
    duration: 10,
    value: 2,
    color: '#ff8800',
    rarity: 'rare',
    dropChance: 0.1
  },
  {
    id: 'piercing_shots',
    name: 'Piercing Shots',
    description: 'Shots pierce enemies for 8s',
    icon: '🎯',
    type: 'weapon',
    duration: 8,
    value: 1,
    color: '#ff00ff',
    rarity: 'epic',
    dropChance: 0.06
  },
  
  // Special
  {
    id: 'invincibility',
    name: 'Invincibility',
    description: 'Invincible for 5s',
    icon: '✨',
    type: 'special',
    duration: 5,
    value: 1,
    color: '#ffffff',
    rarity: 'legendary',
    dropChance: 0.02
  },
  {
    id: 'nuke',
    name: 'Nuke',
    description: 'Destroy all enemies on screen',
    icon: '☢️',
    type: 'special',
    duration: 0,
    value: 1,
    color: '#ff0000',
    rarity: 'legendary',
    dropChance: 0.01
  },
  {
    id: 'time_slow',
    name: 'Time Slow',
    description: 'Slow time for 8s',
    icon: '⏱️',
    type: 'special',
    duration: 8,
    value: 0.5,
    color: '#8800ff',
    rarity: 'epic',
    dropChance: 0.05
  }
];

export function getPowerUpById(id: string): PowerUp | undefined {
  return POWER_UPS.find(p => p.id === id);
}

export function getRandomPowerUp(): PowerUp {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const powerUp of POWER_UPS) {
    cumulative += powerUp.dropChance;
    if (roll <= cumulative) {
      return powerUp;
    }
  }
  
  return POWER_UPS[0]; // fallback to common
}

export function getRarityColor(rarity: PowerUp['rarity']): string {
  switch (rarity) {
    case 'legendary': return '#ffaa00';
    case 'epic': return '#ff00ff';
    case 'rare': return '#00aaff';
    default: return '#888888';
  }
}
