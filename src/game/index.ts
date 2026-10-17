// Export all game systems for easy access
export * from './systems';
export * from './advancedSystems';
export * from './audioSystem';
export * from './metaProgression';

// Export specific items to avoid conflicts
export { 
  LEVEL_ACHIEVEMENTS, 
  COMBAT_ACHIEVEMENTS, 
  SURVIVAL_ACHIEVEMENTS, 
  ALL_ACHIEVEMENTS,
  checkAchievements 
} from './achievements';
export type { Achievement } from './achievements';

export * from './bosses';
export * from './weapons';
export { 
  ENEMY_TYPES, 
  POWER_UPS,
  getEnemyTypeById,
  getAvailableEnemyTypes,
  getRandomEnemyType,
  getPowerUpById,
  getRandomPowerUp
} from './enemies';
export type { EnemyType, PowerUp } from './enemies';

export * from './cosmetics';
export * from './difficulty';
export * from './levels';
export * from './environment';
export * from './dailyChallenges';
export * from './saveSystem';
export * from './statsSystem';
