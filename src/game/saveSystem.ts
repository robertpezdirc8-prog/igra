import { SKILL_TREE, SkillTree } from './skillTree';

// Color-blind accessibility (XAG principle: never rely on hue alone).
// 'standard' — original per-enemy colors; 'contrast' — dark backing plate
// + solid white ring on every enemy shot; 'mono' — all enemy shots forced
// to one danger color. Pure render-layer choice: hitboxes never change.
export type BulletVisibility = 'standard' | 'contrast' | 'mono';
const BULLET_VISIBILITIES: BulletVisibility[] = ['standard', 'contrast', 'mono'];
export function isBulletVisibility(v: unknown): v is BulletVisibility {
  return typeof v === 'string' && (BULLET_VISIBILITIES as string[]).includes(v);
}

export interface SaveData {
  version: string;
  timestamp: number;
  player: {
    highScore: number;
    totalPlayTime: number;
    totalGamesPlayed: number;
    totalEnemiesKilled: number;
    totalBossKills: number;
    highestWave: number;
    highestLevel: number;
    maxCombo: number;
  };
  skillTree: {
    offense: { [skillId: string]: number };
    defense: { [skillId: string]: number };
    utility: { [skillId: string]: number };
  };
  achievements: string[];
  // Skill points earned from level-ups and daily rewards
  skillPoints: number;
  // Selected difficulty mode id (from difficulty.ts), null = not chosen
  difficulty: string | null;
  completedChallenges: {
    [date: string]: string[];
  };
  settings: {
    musicVolume: number;
    sfxVolume: number;
    showFPS: boolean;
    muted: boolean;
    particles: 'low' | 'medium' | 'high';
    touchSensitivity: number;
    leftHanded: boolean;
    bigButtons: boolean;
    bulletVisibility: BulletVisibility;
  };
  cosmetics: {
    unlocked: string[];
    equipped: {
      trail: string | null;
      aura: string | null;
      border: string | null;
    };
  };
  currency: {
    gold: number;
    gems: number;
    // XP granted automatically at the start of the next run (daily reward)
    xp: number;
  };
}

const SAVE_KEY = 'atheria_save_data';
const SAVE_VERSION = '2.0.0';

export function createDefaultSaveData(): SaveData {
  return {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    player: {
      highScore: 0,
      totalPlayTime: 0,
      totalGamesPlayed: 0,
      totalEnemiesKilled: 0,
      totalBossKills: 0,
      highestWave: 0,
      highestLevel: 1,
      maxCombo: 0
    },
    skillTree: {
      offense: {},
      defense: {},
      utility: {}
    },
    achievements: [],
    skillPoints: 0,
    difficulty: null,
    completedChallenges: {},
    settings: {
      musicVolume: 0.5,
      sfxVolume: 0.6,
      showFPS: true,
      muted: false,
      particles: 'high',
      touchSensitivity: 1.2,
      leftHanded: false,
      bigButtons: false,
      bulletVisibility: 'standard'
    },
    cosmetics: {
      unlocked: ['default'],
      equipped: {
        trail: null,
        aura: null,
        border: null
      }
    },
    currency: {
      gold: 0,
      gems: 0,
      xp: 0
    }
  };
}

export function saveGame(data: SaveData): boolean {
  try {
    data.timestamp = Date.now();
    data.version = SAVE_VERSION;
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
}

export function loadGame(): SaveData | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return null;

    const data = JSON.parse(saved) as SaveData;
    
    // Version check and migration
    if (data.version !== SAVE_VERSION) {
      console.log('Save data version mismatch, migrating...');
      return migrateSaveData(data);
    }

    // Sanitize settings even when the version matches: older 2.0.0 saves
    // predate newer keys (bulletVisibility) and corrupt edits are possible.
    if (!data.settings || typeof data.settings !== 'object') {
      data.settings = createDefaultSaveData().settings;
    } else if (!isBulletVisibility(data.settings.bulletVisibility)) {
      data.settings.bulletVisibility = 'standard';
    }

    return data;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

export function deleteSave(): boolean {
  try {
    localStorage.removeItem(SAVE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to delete save:', error);
    return false;
  }
}

export function hasSaveData(): boolean {
  return localStorage.getItem(SAVE_KEY) !== null;
}

function migrateSaveData(oldData: any): SaveData {
  const newData = createDefaultSaveData();
  
  // Migrate player stats
  if (oldData.player) {
    newData.player = { ...newData.player, ...oldData.player };
  }
  
  // Migrate skill tree
  if (oldData.skillTree) {
    newData.skillTree = { ...newData.skillTree, ...oldData.skillTree };
  }
  
  // Migrate achievements
  if (Array.isArray(oldData.achievements)) {
    newData.achievements = oldData.achievements;
  }
  
  // Migrate settings (unknown/corrupt values fall back to defaults)
  if (oldData.settings) {
    newData.settings = { ...newData.settings, ...oldData.settings };
    if (!isBulletVisibility(newData.settings.bulletVisibility)) {
      newData.settings.bulletVisibility = 'standard';
    }
  }

  // v1.0.0 -> v2.0.0: new fields
  if (typeof oldData.skillPoints === 'number' && Number.isFinite(oldData.skillPoints)) {
    newData.skillPoints = Math.max(0, Math.floor(oldData.skillPoints));
  }
  if (typeof oldData.difficulty === 'string' || oldData.difficulty === null) {
    newData.difficulty = oldData.difficulty;
  }
  if (oldData.currency && typeof oldData.currency === 'object') {
    newData.currency = {
      gold: Math.max(0, Math.floor(oldData.currency.gold ?? 0)),
      gems: Math.max(0, Math.floor(oldData.currency.gems ?? 0)),
      xp: Math.max(0, Math.floor(oldData.currency.xp ?? 0))
    };
  }
  if (oldData.cosmetics && typeof oldData.cosmetics === 'object') {
    newData.cosmetics = {
      unlocked: Array.isArray(oldData.cosmetics.unlocked)
        ? oldData.cosmetics.unlocked
        : newData.cosmetics.unlocked,
      equipped: { ...newData.cosmetics.equipped, ...(oldData.cosmetics.equipped ?? {}) }
    };
  }
  if (oldData.completedChallenges && typeof oldData.completedChallenges === 'object') {
    newData.completedChallenges = oldData.completedChallenges;
  }
  
  return newData;
}

export function updateSaveWithGameStats(
  saveData: SaveData,
  gameStats: {
    score: number;
    playTime: number;
    enemiesKilled: number;
    bossKills: number;
    wave: number;
    level: number;
    maxCombo: number;
  }
): SaveData {
  const updated = { ...saveData };
  
  // Update player stats
  updated.player.highScore = Math.max(updated.player.highScore, gameStats.score);
  updated.player.totalPlayTime += gameStats.playTime;
  updated.player.totalGamesPlayed += 1;
  updated.player.totalEnemiesKilled += gameStats.enemiesKilled;
  updated.player.totalBossKills += gameStats.bossKills;
  updated.player.highestWave = Math.max(updated.player.highestWave, gameStats.wave);
  updated.player.highestLevel = Math.max(updated.player.highestLevel, gameStats.level);
  updated.player.maxCombo = Math.max(updated.player.maxCombo, gameStats.maxCombo);
  
  return updated;
}

export function updateSaveWithSkillTree(
  saveData: SaveData,
  skillTree: SkillTree
): SaveData {
  const updated = { ...saveData };
  
  // Save skill tree state
  updated.skillTree.offense = {};
  updated.skillTree.defense = {};
  updated.skillTree.utility = {};
  
  for (const skill of skillTree.offense) {
    updated.skillTree.offense[skill.id] = skill.currentLevel;
  }
  for (const skill of skillTree.defense) {
    updated.skillTree.defense[skill.id] = skill.currentLevel;
  }
  for (const skill of skillTree.utility) {
    updated.skillTree.utility[skill.id] = skill.currentLevel;
  }
  
  return updated;
}

export function loadSkillTreeFromSave(saveData: SaveData): SkillTree {
  const skillTree = JSON.parse(JSON.stringify(SKILL_TREE)) as SkillTree;
  
  // Load offense skills
  for (const skill of skillTree.offense) {
    if (saveData.skillTree.offense[skill.id]) {
      skill.currentLevel = saveData.skillTree.offense[skill.id];
    }
  }
  
  // Load defense skills
  for (const skill of skillTree.defense) {
    if (saveData.skillTree.defense[skill.id]) {
      skill.currentLevel = saveData.skillTree.defense[skill.id];
    }
  }
  
  // Load utility skills
  for (const skill of skillTree.utility) {
    if (saveData.skillTree.utility[skill.id]) {
      skill.currentLevel = saveData.skillTree.utility[skill.id];
    }
  }
  
  return skillTree;
}

export function exportSave(): string {
  const saveData = loadGame();
  if (!saveData) return '';
  return btoa(JSON.stringify(saveData));
}

export function importSave(encoded: string): boolean {
  try {
    const decoded = atob(encoded);
    const data = JSON.parse(decoded) as SaveData;
    return saveGame(data);
  } catch (error) {
    console.error('Failed to import save:', error);
    return false;
  }
}
