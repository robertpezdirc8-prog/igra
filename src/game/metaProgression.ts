// Meta-Progression Unlock Tree System
export interface UnlockNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'character' | 'weapon' | 'ability' | 'cosmetic' | 'mechanic';
  requirement: UnlockRequirement;
  unlocks: string[]; // IDs of what this unlocks
  tier: number; // 1-5, higher = more advanced
  position: { x: number; y: number }; // Position in unlock tree UI
}

export interface UnlockRequirement {
  type: 'level' | 'achievement' | 'boss' | 'wave' | 'combo' | 'currency';
  value: number;
  description: string;
}

export const UNLOCK_TREE: UnlockNode[] = [
  // Tier 1 - Basic unlocks
  {
    id: 'basic_dash',
    name: 'Dash Ability',
    description: 'Odkleni dash mehaniko za izogibanje napadom',
    icon: '💨',
    type: 'ability',
    requirement: { type: 'level', value: 1, description: 'Doseži nivo 1' },
    unlocks: ['double_dash', 'dash_damage'],
    tier: 1,
    position: { x: 0, y: 0 }
  },
  {
    id: 'basic_shield',
    name: 'Shield System',
    description: 'Odkleni ščit, ki absorbira škodo',
    icon: '🛡️',
    type: 'ability',
    requirement: { type: 'level', value: 2, description: 'Doseži nivo 2' },
    unlocks: ['shield_regen', 'shield_burst'],
    tier: 1,
    position: { x: 1, y: 0 }
  },
  {
    id: 'basic_secondary',
    name: 'Secondary Weapon',
    description: 'Odkleni sekundarno orožje',
    icon: '🔫',
    type: 'weapon',
    requirement: { type: 'level', value: 3, description: 'Doseži nivo 3' },
    unlocks: ['secondary_upgrade', 'dual_wield'],
    tier: 1,
    position: { x: 2, y: 0 }
  },

  // Tier 2 - Intermediate unlocks
  {
    id: 'double_dash',
    name: 'Double Dash',
    description: 'Dvojni dash za hitrejše gibanje',
    icon: '💨💨',
    type: 'ability',
    requirement: { type: 'level', value: 5, description: 'Doseži nivo 5' },
    unlocks: ['triple_dash'],
    tier: 2,
    position: { x: -1, y: 1 }
  },
  {
    id: 'dash_damage',
    name: 'Dash Damage',
    description: 'Dash povzroči škodo sovražnikom',
    icon: '💥',
    type: 'ability',
    requirement: { type: 'combo', value: 10, description: 'Doseži 10x combo' },
    unlocks: ['dash_explosion'],
    tier: 2,
    position: { x: 0, y: 1 }
  },
  {
    id: 'shield_regen',
    name: 'Shield Regeneration',
    description: 'Ščit se samodejno regenerira',
    icon: '🔄',
    type: 'ability',
    requirement: { type: 'wave', value: 10, description: 'Preživi 10 valov' },
    unlocks: ['shield_overcharge'],
    tier: 2,
    position: { x: 1, y: 1 }
  },
  {
    id: 'shield_burst',
    name: 'Shield Burst',
    description: 'Ščit eksplodira in poškoduje sovražnike',
    icon: '💫',
    type: 'ability',
    requirement: { type: 'boss', value: 1, description: 'Premagaj 1 bossa' },
    unlocks: ['shield_nova'],
    tier: 2,
    position: { x: 2, y: 1 }
  },
  {
    id: 'secondary_upgrade',
    name: 'Secondary Upgrade',
    description: 'Izboljšaj sekundarno orožje',
    icon: '⬆️',
    type: 'weapon',
    requirement: { type: 'level', value: 7, description: 'Doseži nivo 7' },
    unlocks: ['secondary_mastery'],
    tier: 2,
    position: { x: 3, y: 1 }
  },
  {
    id: 'dual_wield',
    name: 'Dual Wield',
    description: 'Uporabljaj dve sekundarni orožji hkrati',
    icon: '🔫🔫',
    type: 'weapon',
    requirement: { type: 'combo', value: 20, description: 'Doseži 20x combo' },
    unlocks: ['quad_wield'],
    tier: 2,
    position: { x: 4, y: 1 }
  },

  // Tier 3 - Advanced unlocks
  {
    id: 'triple_dash',
    name: 'Triple Dash',
    description: 'Trojni dash z še večjo hitrostjo',
    icon: '💨💨💨',
    type: 'ability',
    requirement: { type: 'level', value: 10, description: 'Doseži nivo 10' },
    unlocks: ['dash_master'],
    tier: 3,
    position: { x: -2, y: 2 }
  },
  {
    id: 'dash_explosion',
    name: 'Dash Explosion',
    description: 'Dash ustvari eksplozijo',
    icon: '💥💥',
    type: 'ability',
    requirement: { type: 'combo', value: 30, description: 'Doseži 30x combo' },
    unlocks: ['dash_nuke'],
    tier: 3,
    position: { x: -1, y: 2 }
  },
  {
    id: 'shield_overcharge',
    name: 'Shield Overcharge',
    description: 'Ščit lahko preseže maksimalno vrednost',
    icon: '⚡',
    type: 'ability',
    requirement: { type: 'wave', value: 20, description: 'Preživi 20 valov' },
    unlocks: ['shield_infinity'],
    tier: 3,
    position: { x: 0, y: 2 }
  },
  {
    id: 'shield_nova',
    name: 'Shield Nova',
    description: 'Ščit ustvari novao, ki uniči vse projekte',
    icon: '🌟',
    type: 'ability',
    requirement: { type: 'boss', value: 3, description: 'Premagaj 3 bosse' },
    unlocks: ['shield_god'],
    tier: 3,
    position: { x: 1, y: 2 }
  },
  {
    id: 'secondary_mastery',
    name: 'Secondary Mastery',
    description: 'Sekundarno orožje dobi posebne sposobnosti',
    icon: '🎯',
    type: 'weapon',
    requirement: { type: 'level', value: 12, description: 'Doseži nivo 12' },
    unlocks: ['secondary_ultimate'],
    tier: 3,
    position: { x: 2, y: 2 }
  },
  {
    id: 'quad_wield',
    name: 'Quad Wield',
    description: 'Uporabljaj štiri sekundarni orožji hkrati',
    icon: '🔫🔫🔫🔫',
    type: 'weapon',
    requirement: { type: 'combo', value: 40, description: 'Doseži 40x combo' },
    unlocks: ['weapon_god'],
    tier: 3,
    position: { x: 3, y: 2 }
  },

  // Tier 4 - Expert unlocks
  {
    id: 'dash_master',
    name: 'Dash Master',
    description: 'Dash nima cooldowna',
    icon: '👑',
    type: 'ability',
    requirement: { type: 'level', value: 20, description: 'Doseži nivo 20' },
    unlocks: ['dash_god'],
    tier: 4,
    position: { x: -2, y: 3 }
  },
  {
    id: 'dash_nuke',
    name: 'Dash Nuke',
    description: 'Dash uniči vse sovražnike na zaslonu',
    icon: '☢️',
    type: 'ability',
    requirement: { type: 'combo', value: 50, description: 'Doseži 50x combo' },
    unlocks: [],
    tier: 4,
    position: { x: -1, y: 3 }
  },
  {
    id: 'shield_infinity',
    name: 'Infinite Shield',
    description: 'Ščit nikoli ne poči',
    icon: '♾️',
    type: 'ability',
    requirement: { type: 'wave', value: 30, description: 'Preživi 30 valov' },
    unlocks: [],
    tier: 4,
    position: { x: 0, y: 3 }
  },
  {
    id: 'shield_god',
    name: 'Shield God',
    description: 'Ščit te naredi nepremagljivega',
    icon: '🛡️✨',
    type: 'ability',
    requirement: { type: 'boss', value: 5, description: 'Premagaj 5 bossov' },
    unlocks: [],
    tier: 4,
    position: { x: 1, y: 3 }
  },
  {
    id: 'secondary_ultimate',
    name: 'Ultimate Secondary',
    description: 'Sekundarno orožje dobi ultimate sposobnost',
    icon: '⭐',
    type: 'weapon',
    requirement: { type: 'level', value: 25, description: 'Doseži nivo 25' },
    unlocks: [],
    tier: 4,
    position: { x: 2, y: 3 }
  },
  {
    id: 'weapon_god',
    name: 'Weapon God',
    description: 'Vsa orožja so maksimalno izboljšana',
    icon: '🔱',
    type: 'weapon',
    requirement: { type: 'combo', value: 100, description: 'Doseži 100x combo' },
    unlocks: [],
    tier: 4,
    position: { x: 3, y: 3 }
  },

  // Tier 5 - God-tier unlocks
  {
    id: 'dash_god',
    name: 'Dash God',
    description: 'Dash te teleportira kamor želiš',
    icon: '🌌',
    type: 'ability',
    requirement: { type: 'level', value: 50, description: 'Doseži nivo 50' },
    unlocks: [],
    tier: 5,
    position: { x: -2, y: 4 }
  }
];

export class MetaProgressionSystem {
  private unlockedNodes: Set<string> = new Set();
  private currency: number = 0;

  constructor() {
    this.loadProgress();
  }

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem('meta_progression');
      if (saved) {
        const data = JSON.parse(saved);
        this.unlockedNodes = new Set(data.unlockedNodes || []);
        this.currency = data.currency || 0;
      }
    } catch (e) {
      console.error('Failed to load meta progression:', e);
    }
  }

  private saveProgress(): void {
    try {
      localStorage.setItem('meta_progression', JSON.stringify({
        unlockedNodes: Array.from(this.unlockedNodes),
        currency: this.currency
      }));
    } catch (e) {
      console.error('Failed to save meta progression:', e);
    }
  }

  addCurrency(amount: number): void {
    this.currency += amount;
    this.saveProgress();
  }

  getCurrency(): number {
    return this.currency;
  }

  isUnlocked(nodeId: string): boolean {
    return this.unlockedNodes.has(nodeId);
  }

  canUnlock(node: UnlockNode, playerStats: {
    level: number;
    maxCombo: number;
    highestWave: number;
    bossKills: number;
  }): boolean {
    if (this.isUnlocked(node.id)) return false;

    // Check if parent is unlocked (except tier 1)
    if (node.tier > 1) {
      const parentUnlocked = UNLOCK_TREE.some(parent => 
        parent.unlocks.includes(node.id) && this.isUnlocked(parent.id)
      );
      if (!parentUnlocked) return false;
    }

    // Check requirement
    switch (node.requirement.type) {
      case 'level':
        return playerStats.level >= node.requirement.value;
      case 'combo':
        return playerStats.maxCombo >= node.requirement.value;
      case 'wave':
        return playerStats.highestWave >= node.requirement.value;
      case 'boss':
        return playerStats.bossKills >= node.requirement.value;
      default:
        return false;
    }
  }

  unlock(nodeId: string): boolean {
    if (this.unlockedNodes.has(nodeId)) return false;
    
    this.unlockedNodes.add(nodeId);
    this.saveProgress();
    return true;
  }

  getUnlockedNodes(): string[] {
    return Array.from(this.unlockedNodes);
  }

  getAvailableUnlocks(playerStats: {
    level: number;
    maxCombo: number;
    highestWave: number;
    bossKills: number;
  }): UnlockNode[] {
    return UNLOCK_TREE.filter(node => this.canUnlock(node, playerStats));
  }

  getProgress(): { unlocked: number; total: number; percentage: number } {
    const total = UNLOCK_TREE.length;
    const unlocked = this.unlockedNodes.size;
    return {
      unlocked,
      total,
      percentage: (unlocked / total) * 100
    };
  }

  reset(): void {
    this.unlockedNodes.clear();
    this.currency = 0;
    this.saveProgress();
  }
}
