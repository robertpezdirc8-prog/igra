export interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rewards: ChallengeReward[];
  condition: (stats: PlayerStats) => boolean;
  expiresAt: number;
}

export interface ChallengeReward {
  type: 'xp' | 'gold' | 'skillPoint' | 'cosmetic';
  amount: number;
  name?: string;
}

export interface PlayerStats {
  score: number;
  level: number;
  wave: number;
  enemiesKilled: number;
  bossKills: number;
  maxCombo: number;
  survivalTime: number;
  damageDealt: number;
  damageTaken: number;
  itemsCollected: number;
  deaths: number;
}

function getTodaySeed(): string {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash % 1000) / 1000;
}

export function generateDailyChallenges(): DailyChallenge[] {
  const seed = getTodaySeed();
  const random = seededRandom(seed);
  
  const expiresAt = new Date();
  expiresAt.setHours(24, 0, 0, 0);
  
  const challenges: DailyChallenge[] = [
    {
      id: 'score_100k',
      name: 'Lovec na rezultate',
      description: 'Doseži vsaj 100.000 točk',
      icon: '🎯',
      difficulty: 'easy',
      rewards: [
        { type: 'xp', amount: 500 },
        { type: 'gold', amount: 100 }
      ],
      condition: (stats) => stats.score >= 100000,
      expiresAt: expiresAt.getTime()
    },
    {
      id: 'wave_20',
      name: 'Preživeli',
      description: 'Preživi do vala 20',
      icon: '🛡️',
      difficulty: 'medium',
      rewards: [
        { type: 'xp', amount: 1000 },
        { type: 'skillPoint', amount: 1 }
      ],
      condition: (stats) => stats.wave >= 20,
      expiresAt: expiresAt.getTime()
    },
    {
      id: 'combo_50',
      name: 'Combo Master',
      description: 'Doseži 50x combo',
      icon: '💥',
      difficulty: 'hard',
      rewards: [
        { type: 'xp', amount: 2000 },
        { type: 'skillPoint', amount: 2 },
        { type: 'cosmetic', amount: 1, name: 'Golden Trail' }
      ],
      condition: (stats) => stats.maxCombo >= 50,
      expiresAt: expiresAt.getTime()
    },
    {
      id: 'boss_hunter',
      name: 'Lovec na bosse',
      description: 'Ubij 5 bossov v eni igri',
      icon: '👹',
      difficulty: 'medium',
      rewards: [
        { type: 'xp', amount: 1500 },
        { type: 'gold', amount: 500 }
      ],
      condition: (stats) => stats.bossKills >= 5,
      expiresAt: expiresAt.getTime()
    },
    {
      id: 'speed_run',
      name: 'Hitri boj',
      description: 'Doseži val 15 v manj kot 10 minutah',
      icon: '⚡',
      difficulty: 'hard',
      rewards: [
        { type: 'xp', amount: 2500 },
        { type: 'skillPoint', amount: 2 },
        { type: 'cosmetic', amount: 1, name: 'Lightning Aura' }
      ],
      condition: (stats) => stats.wave >= 15 && stats.survivalTime <= 600,
      expiresAt: expiresAt.getTime()
    }
  ];
  
  // Select 3 challenges based on seed
  const selectedIndices: number[] = [];
  while (selectedIndices.length < 3) {
    const index = Math.floor(random * challenges.length * (selectedIndices.length + 1)) % challenges.length;
    if (!selectedIndices.includes(index)) {
      selectedIndices.push(index);
    }
  }
  
  return selectedIndices.map(i => challenges[i]);
}

export function checkChallengeCompletion(
  challenge: DailyChallenge,
  stats: PlayerStats
): boolean {
  return challenge.condition(stats);
}

export function getTimeUntilReset(): string {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}
