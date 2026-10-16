export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (stats: PlayerStats) => boolean;
}

export interface PlayerStats {
  level: number;
  totalXp: number;
  enemiesKilled: number;
  bossKills: number;
  maxCombo: number;
  wavesCompleted: number;
  totalDamage: number;
  survivalTime: number;
  highestWave: number;
}

export const LEVEL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'level_5',
    title: 'Začetnik Voida',
    description: 'Doseži nivo 5',
    icon: '⭐',
    condition: (stats) => stats.level >= 5
  },
  {
    id: 'level_10',
    title: 'Void Walker',
    description: 'Doseži nivo 10',
    icon: '🌟',
    condition: (stats) => stats.level >= 10
  },
  {
    id: 'level_15',
    title: 'Void Master',
    description: 'Doseži nivo 15',
    icon: '💫',
    condition: (stats) => stats.level >= 15
  },
  {
    id: 'level_20',
    title: 'Void Lord',
    description: 'Doseži nivo 20',
    icon: '👑',
    condition: (stats) => stats.level >= 20
  },
  {
    id: 'level_25',
    title: 'Void Emperor',
    description: 'Doseži nivo 25',
    icon: '🏆',
    condition: (stats) => stats.level >= 25
  },
  {
    id: 'level_30',
    title: 'Void God',
    description: 'Doseži nivo 30',
    icon: '🔱',
    condition: (stats) => stats.level >= 30
  },
  {
    id: 'level_40',
    title: 'Void Transcendent',
    description: 'Doseži nivo 40',
    icon: '✨',
    condition: (stats) => stats.level >= 40
  },
  {
    id: 'level_50',
    title: 'Void Incarnate',
    description: 'Doseži nivo 50',
    icon: '🌌',
    condition: (stats) => stats.level >= 50
  }
];

export const COMBAT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'kills_100',
    title: 'Lovec',
    description: 'Ubij 100 sovražnikov',
    icon: '🎯',
    condition: (stats) => stats.enemiesKilled >= 100
  },
  {
    id: 'kills_500',
    title: 'Uničevalec',
    description: 'Ubij 500 sovražnikov',
    icon: '💀',
    condition: (stats) => stats.enemiesKilled >= 500
  },
  {
    id: 'kills_1000',
    title: 'Genocid',
    description: 'Ubij 1000 sovražnikov',
    icon: '☠️',
    condition: (stats) => stats.enemiesKilled >= 1000
  },
  {
    id: 'boss_1',
    title: 'Boss Killer',
    description: 'Ubij svojega prvega bossa',
    icon: '🗡️',
    condition: (stats) => stats.bossKills >= 1
  },
  {
    id: 'boss_10',
    title: 'Boss Hunter',
    description: 'Ubij 10 bossov',
    icon: '⚔️',
    condition: (stats) => stats.bossKills >= 10
  },
  {
    id: 'combo_10',
    title: 'Combo Master',
    description: 'Doseži 10x combo',
    icon: '🔥',
    condition: (stats) => stats.maxCombo >= 10
  },
  {
    id: 'combo_20',
    title: 'Combo God',
    description: 'Doseži 20x combo',
    icon: '💥',
    condition: (stats) => stats.maxCombo >= 20
  }
];

export const SURVIVAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'wave_10',
    title: 'Preživeli',
    description: 'Preživi 10 valov',
    icon: '🛡️',
    condition: (stats) => stats.highestWave >= 10
  },
  {
    id: 'wave_25',
    title: 'Bojevnik',
    description: 'Preživi 25 valov',
    icon: '⚔️',
    condition: (stats) => stats.highestWave >= 25
  },
  {
    id: 'wave_50',
    title: 'Legend',
    description: 'Preživi 50 valov',
    icon: '🏅',
    condition: (stats) => stats.highestWave >= 50
  },
  {
    id: 'time_300',
    title: 'Vztrajen',
    description: 'Igraj 5 minut',
    icon: '⏱️',
    condition: (stats) => stats.survivalTime >= 300
  },
  {
    id: 'time_600',
    title: 'Neutrudljiv',
    description: 'Igraj 10 minut',
    icon: '⏰',
    condition: (stats) => stats.survivalTime >= 600
  }
];

export const ALL_ACHIEVEMENTS = [
  ...LEVEL_ACHIEVEMENTS,
  ...COMBAT_ACHIEVEMENTS,
  ...SURVIVAL_ACHIEVEMENTS
];

export function checkAchievements(
  stats: PlayerStats,
  unlockedIds: Set<string>
): Achievement[] {
  return ALL_ACHIEVEMENTS.filter(
    achievement => 
      !unlockedIds.has(achievement.id) && 
      achievement.condition(stats)
  );
}
