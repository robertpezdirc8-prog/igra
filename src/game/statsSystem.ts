export interface GameStats {
  totalGamesPlayed: number;
  totalTimePlayed: number;
  totalScore: number;
  highestScore: number;
  totalEnemiesKilled: number;
  totalBossKills: number;
  highestWave: number;
  highestLevel: number;
  highestCombo: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalItemsCollected: number;
  totalDeaths: number;
  averageSurvivalTime: number;
  favoriteWeapon: string;
  achievementsUnlocked: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  wave: number;
  level: number;
  date: string;
  isPlayer?: boolean;
}

const STATS_KEY = 'atheria_game_stats';
const LEADERBOARD_KEY = 'atheria_leaderboard';

export function getGameStats(): GameStats {
  try {
    const saved = localStorage.getItem(STATS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load game stats:', error);
  }
  
  return {
    totalGamesPlayed: 0,
    totalTimePlayed: 0,
    totalScore: 0,
    highestScore: 0,
    totalEnemiesKilled: 0,
    totalBossKills: 0,
    highestWave: 0,
    highestLevel: 0,
    highestCombo: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    totalItemsCollected: 0,
    totalDeaths: 0,
    averageSurvivalTime: 0,
    favoriteWeapon: 'Plasma',
    achievementsUnlocked: 0
  };
}

export function updateGameStats(gameResult: {
  score: number;
  playTime: number;
  enemiesKilled: number;
  bossKills: number;
  wave: number;
  level: number;
  maxCombo: number;
  damageDealt: number;
  damageTaken: number;
  itemsCollected: number;
}): GameStats {
  const stats = getGameStats();
  
  stats.totalGamesPlayed += 1;
  stats.totalTimePlayed += gameResult.playTime;
  stats.totalScore += gameResult.score;
  stats.highestScore = Math.max(stats.highestScore, gameResult.score);
  stats.totalEnemiesKilled += gameResult.enemiesKilled;
  stats.totalBossKills += gameResult.bossKills;
  stats.highestWave = Math.max(stats.highestWave, gameResult.wave);
  stats.highestLevel = Math.max(stats.highestLevel, gameResult.level);
  stats.highestCombo = Math.max(stats.highestCombo, gameResult.maxCombo);
  stats.totalDamageDealt += gameResult.damageDealt;
  stats.totalDamageTaken += gameResult.damageTaken;
  stats.totalItemsCollected += gameResult.itemsCollected;
  stats.totalDeaths += 1;
  stats.averageSurvivalTime = stats.totalTimePlayed / stats.totalGamesPlayed;
  
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save game stats:', error);
  }
  
  return stats;
}

export function resetGameStats(): void {
  try {
    localStorage.removeItem(STATS_KEY);
  } catch (error) {
    console.error('Failed to reset game stats:', error);
  }
}

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
  }
  
  return generateDefaultLeaderboard();
}

export function addToLeaderboard(entry: Omit<LeaderboardEntry, 'rank'>): LeaderboardEntry[] {
  const leaderboard = getLeaderboard();
  
  // Remove player's old entries
  const filtered = leaderboard.filter(e => !e.isPlayer);
  
  // Add new entry
  filtered.push({ ...entry, rank: 0, isPlayer: true });
  
  // Sort by score
  filtered.sort((a, b) => b.score - a.score);
  
  // Keep top 100
  const top100 = filtered.slice(0, 100);
  
  // Assign ranks
  const ranked = top100.map((e, i) => ({ ...e, rank: i + 1 }));
  
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(ranked));
  } catch (error) {
    console.error('Failed to save leaderboard:', error);
  }
  
  return ranked;
}

export function getPlayerRank(): number {
  const leaderboard = getLeaderboard();
  const playerEntry = leaderboard.find(e => e.isPlayer);
  return playerEntry?.rank || 0;
}

function generateDefaultLeaderboard(): LeaderboardEntry[] {
  const names = [
    'VoidMaster', 'CosmicHunter', 'NebulaKing', 'StarSlayer',
    'GalaxyWarrior', 'QuantumAce', 'PlasmaLord', 'DarkPhoenix',
    'StellarKnight', 'NovaCrusher'
  ];
  
  const entries: LeaderboardEntry[] = names.map((name, i) => ({
    rank: i + 1,
    name,
    score: Math.floor(1000000 - i * 80000 + Math.random() * 50000),
    wave: Math.floor(50 - i * 3 + Math.random() * 5),
    level: Math.floor(30 - i * 2 + Math.random() * 3),
    date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isPlayer: false
  }));
  
  return entries;
}

export function formatPlayTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
