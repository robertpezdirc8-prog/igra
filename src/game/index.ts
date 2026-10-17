// Export all game systems for easy access
export * from './systems';
export * from './advancedSystems';
export * from './audioSystem';
export * from './metaProgression';
export * from './enemyAI';
// weatherSystem also exports an `EnvironmentalHazard` interface that would
// clash with the one from './advancedSystems' under `export *` - alias it.
export { WeatherSystem, EnvironmentalHazardsSystem } from './weatherSystem';
export type {
  WeatherType,
  WeatherEffect,
  WeatherParticle,
  EnvironmentalHazard as WeatherEnvironmentalHazard
} from './weatherSystem';
export * from './advancedPowerups';

// Export specific items to avoid conflicts
export { 
  LEVEL_ACHIEVEMENTS, 
  COMBAT_ACHIEVEMENTS, 
  SURVIVAL_ACHIEVEMENTS, 
  ALL_ACHIEVEMENTS,
  checkAchievements 
} from './achievements';
export type { Achievement } from './achievements';

// NOTE: './bosses', './weapons' and './enemies' were removed during the
// merge - their functionality lives in engine.ts / systems.ts now.
// Re-add exports here only if those modules are restored.

export * from './cosmetics';
export * from './difficulty';
export * from './levels';
export * from './environment';
export * from './dailyChallenges';
export * from './saveSystem';
export * from './statsSystem';
