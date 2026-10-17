export interface DifficultyMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  enemyHpMultiplier: number;
  enemyDamageMultiplier: number;
  enemySpeedMultiplier: number;
  playerDamageMultiplier: number;
  xpMultiplier: number;
  goldMultiplier: number;
  scoreMultiplier: number;
  unlockLevel: number;
  color: string;
}

export const DIFFICULTY_MODES: DifficultyMode[] = [
  {
    id: 'easy',
    name: 'Easy',
    description: 'Za začetnike',
    icon: '😊',
    enemyHpMultiplier: 0.7,
    enemyDamageMultiplier: 0.5,
    enemySpeedMultiplier: 0.8,
    playerDamageMultiplier: 1.5,
    xpMultiplier: 0.8,
    goldMultiplier: 0.8,
    scoreMultiplier: 0.8,
    unlockLevel: 1,
    color: '#00ff44'
  },
  {
    id: 'normal',
    name: 'Normal',
    description: 'Standardna težavnost',
    icon: '😐',
    enemyHpMultiplier: 1.0,
    enemyDamageMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    playerDamageMultiplier: 1.0,
    xpMultiplier: 1.0,
    goldMultiplier: 1.0,
    scoreMultiplier: 1.0,
    unlockLevel: 1,
    color: '#ffaa00'
  },
  {
    id: 'hard',
    name: 'Hard',
    description: 'Za izkušene igralce',
    icon: '😠',
    enemyHpMultiplier: 1.5,
    enemyDamageMultiplier: 1.5,
    enemySpeedMultiplier: 1.2,
    playerDamageMultiplier: 0.8,
    xpMultiplier: 1.5,
    goldMultiplier: 1.5,
    scoreMultiplier: 1.5,
    unlockLevel: 10,
    color: '#ff4444'
  },
  {
    id: 'nightmare',
    name: 'Nightmare',
    description: 'Za prave mojstre',
    icon: '💀',
    enemyHpMultiplier: 2.0,
    enemyDamageMultiplier: 2.0,
    enemySpeedMultiplier: 1.5,
    playerDamageMultiplier: 0.6,
    xpMultiplier: 2.5,
    goldMultiplier: 2.5,
    scoreMultiplier: 2.5,
    unlockLevel: 20,
    color: '#ff00ff'
  },
  {
    id: 'impossible',
    name: 'Impossible',
    description: 'Nemogoče - samo za norce',
    icon: '☠️',
    enemyHpMultiplier: 3.0,
    enemyDamageMultiplier: 3.0,
    enemySpeedMultiplier: 2.0,
    playerDamageMultiplier: 0.4,
    xpMultiplier: 4.0,
    goldMultiplier: 4.0,
    scoreMultiplier: 4.0,
    unlockLevel: 30,
    color: '#ff0000'
  }
];

export function getDifficultyById(id: string): DifficultyMode | undefined {
  return DIFFICULTY_MODES.find(d => d.id === id);
}

export function getAvailableDifficulties(playerLevel: number): DifficultyMode[] {
  return DIFFICULTY_MODES.filter(d => d.unlockLevel <= playerLevel);
}

export function getDefaultDifficulty(): DifficultyMode {
  return DIFFICULTY_MODES.find(d => d.id === 'normal')!;
}

export function getDifficultyColor(difficulty: DifficultyMode): string {
  return difficulty.color;
}

export function getDifficultyName(difficulty: DifficultyMode): string {
  return difficulty.name;
}
