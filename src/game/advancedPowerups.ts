// Advanced Power-up System with unique effects and visual feedback

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  category: 'offensive' | 'defensive' | 'utility' | 'special';
  duration: number; // seconds, 0 for instant
  icon: string;
  color: string;
  glowColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  effects: PowerUpEffect[];
  visualEffect: PowerUpVisualEffect;
}

export interface PowerUpEffect {
  type: 'damage' | 'speed' | 'fireRate' | 'shield' | 'health' | 'energy' | 'critChance' | 'critDamage' | 'xpGain' | 'goldGain';
  value: number;
  isPercentage: boolean;
}

export interface PowerUpVisualEffect {
  type: 'aura' | 'trail' | 'particles' | 'glow' | 'shield' | 'lightning';
  intensity: number;
  color: string;
}

export const ADVANCED_POWERUPS: PowerUp[] = [
  // Offensive Power-ups
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Dramatično poveča škodo, a zmanjša obrambo',
    category: 'offensive',
    duration: 15,
    icon: '🔥',
    color: '#ff4444',
    glowColor: '#ff0000',
    rarity: 'rare',
    effects: [
      { type: 'damage', value: 100, isPercentage: true },
      { type: 'speed', value: 30, isPercentage: true },
      { type: 'fireRate', value: 50, isPercentage: true }
    ],
    visualEffect: {
      type: 'aura',
      intensity: 1.5,
      color: '#ff4444'
    }
  },
  {
    id: 'precision',
    name: 'Precision Strike',
    description: 'Poveča možnost za kritične zadetke in škodo',
    category: 'offensive',
    duration: 12,
    icon: '🎯',
    color: '#ffaa00',
    glowColor: '#ff8800',
    rarity: 'rare',
    effects: [
      { type: 'critChance', value: 50, isPercentage: true },
      { type: 'critDamage', value: 100, isPercentage: true }
    ],
    visualEffect: {
      type: 'glow',
      intensity: 1.2,
      color: '#ffaa00'
    }
  },
  {
    id: 'rapidFire',
    name: 'Rapid Fire',
    description: 'Ekstremno poveča hitrost streljanja',
    category: 'offensive',
    duration: 10,
    icon: '⚡',
    color: '#ffff00',
    glowColor: '#ffaa00',
    rarity: 'epic',
    effects: [
      { type: 'fireRate', value: 200, isPercentage: true },
      { type: 'damage', value: -20, isPercentage: true }
    ],
    visualEffect: {
      type: 'lightning',
      intensity: 2.0,
      color: '#ffff00'
    }
  },

  // Defensive Power-ups
  {
    id: 'fortress',
    name: 'Fortress',
    description: 'Dramatično poveča ščit in zdravje',
    category: 'defensive',
    duration: 20,
    icon: '🛡️',
    color: '#4488ff',
    glowColor: '#0044ff',
    rarity: 'rare',
    effects: [
      { type: 'shield', value: 100, isPercentage: true },
      { type: 'health', value: 50, isPercentage: true }
    ],
    visualEffect: {
      type: 'shield',
      intensity: 1.5,
      color: '#4488ff'
    }
  },
  {
    id: 'regeneration',
    name: 'Regeneration',
    description: 'Nenehno obnavlja zdravje in ščit',
    category: 'defensive',
    duration: 25,
    icon: '💚',
    color: '#44ff44',
    glowColor: '#00ff00',
    rarity: 'epic',
    effects: [
      { type: 'health', value: 5, isPercentage: false }, // per second
      { type: 'shield', value: 3, isPercentage: false } // per second
    ],
    visualEffect: {
      type: 'particles',
      intensity: 1.0,
      color: '#44ff44'
    }
  },
  {
    id: 'ironSkin',
    name: 'Iron Skin',
    description: 'Začasna nepremagljivost',
    category: 'defensive',
    duration: 5,
    icon: '💎',
    color: '#aaaaff',
    glowColor: '#8888ff',
    rarity: 'legendary',
    effects: [],
    visualEffect: {
      type: 'shield',
      intensity: 3.0,
      color: '#aaaaff'
    }
  },

  // Utility Power-ups
  {
    id: 'speedDemon',
    name: 'Speed Demon',
    description: 'Ekstremno poveča hitrost gibanja',
    category: 'utility',
    duration: 15,
    icon: '💨',
    color: '#00ffff',
    glowColor: '#00aaaa',
    rarity: 'common',
    effects: [
      { type: 'speed', value: 100, isPercentage: true }
    ],
    visualEffect: {
      type: 'trail',
      intensity: 2.0,
      color: '#00ffff'
    }
  },
  {
    id: 'energySurge',
    name: 'Energy Surge',
    description: 'Poveča regeneracijo energije',
    category: 'utility',
    duration: 20,
    icon: '⚡',
    color: '#ff88ff',
    glowColor: '#ff00ff',
    rarity: 'rare',
    effects: [
      { type: 'energy', value: 200, isPercentage: true }
    ],
    visualEffect: {
      type: 'aura',
      intensity: 1.0,
      color: '#ff88ff'
    }
  },
  {
    id: 'fortune',
    name: 'Fortune',
    description: 'Poveča dobitke XP in zlata',
    category: 'utility',
    duration: 30,
    icon: '💰',
    color: '#ffdd00',
    glowColor: '#ffaa00',
    rarity: 'epic',
    effects: [
      { type: 'xpGain', value: 100, isPercentage: true },
      { type: 'goldGain', value: 100, isPercentage: true }
    ],
    visualEffect: {
      type: 'particles',
      intensity: 1.5,
      color: '#ffdd00'
    }
  },

  // Special Power-ups
  {
    id: 'timeWarp',
    name: 'Time Warp',
    description: 'Upočasni čas za sovražnike',
    category: 'special',
    duration: 8,
    icon: '⏰',
    color: '#8800ff',
    glowColor: '#6600cc',
    rarity: 'legendary',
    effects: [],
    visualEffect: {
      type: 'aura',
      intensity: 2.5,
      color: '#8800ff'
    }
  },
  {
    id: 'blackHole',
    name: 'Black Hole',
    description: 'Privlači sovražnike in power-upe',
    category: 'special',
    duration: 10,
    icon: '🕳️',
    color: '#000000',
    glowColor: '#4400aa',
    rarity: 'legendary',
    effects: [],
    visualEffect: {
      type: 'aura',
      intensity: 3.0,
      color: '#4400aa'
    }
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    description: 'Ob smrti se obnoviš z polnim zdravjem',
    category: 'special',
    duration: 0, // instant/triggered
    icon: '🔥',
    color: '#ff8800',
    glowColor: '#ff4400',
    rarity: 'legendary',
    effects: [
      { type: 'health', value: 100, isPercentage: true }
    ],
    visualEffect: {
      type: 'particles',
      intensity: 3.0,
      color: '#ff8800'
    }
  }
];

// Power-up combo system
export interface PowerUpCombo {
  id: string;
  name: string;
  description: string;
  requiredPowerUps: string[];
  bonusEffects: PowerUpEffect[];
  visualEffect: PowerUpVisualEffect;
}

export const POWERUP_COMBOS: PowerUpCombo[] = [
  {
    id: 'ultimateWarrior',
    name: 'Ultimate Warrior',
    description: 'Kombinacija berserkerja in fortress za maksimalno moč',
    requiredPowerUps: ['berserker', 'fortress'],
    bonusEffects: [
      { type: 'damage', value: 50, isPercentage: true },
      { type: 'shield', value: 50, isPercentage: true }
    ],
    visualEffect: {
      type: 'aura',
      intensity: 3.0,
      color: '#ff8800'
    }
  },
  {
    id: 'lightningSpeed',
    name: 'Lightning Speed',
    description: 'Kombinacija speed demon in rapid fire za ekstremno hitrost',
    requiredPowerUps: ['speedDemon', 'rapidFire'],
    bonusEffects: [
      { type: 'speed', value: 50, isPercentage: true },
      { type: 'fireRate', value: 50, isPercentage: true }
    ],
    visualEffect: {
      type: 'lightning',
      intensity: 3.0,
      color: '#ffff00'
    }
  },
  {
    id: 'criticalMaster',
    name: 'Critical Master',
    description: 'Kombinacija precision in fortune za maksimalne dobitke',
    requiredPowerUps: ['precision', 'fortune'],
    bonusEffects: [
      { type: 'critChance', value: 25, isPercentage: true },
      { type: 'goldGain', value: 50, isPercentage: true }
    ],
    visualEffect: {
      type: 'glow',
      intensity: 2.5,
      color: '#ffaa00'
    }
  }
];

// Power-up manager class
export class PowerUpManager {
  private activePowerUps: Map<string, { powerUp: PowerUp; startTime: number; endTime: number }> = new Map();
  private activeCombos: Set<string> = new Set();

  addPowerUp(powerUpId: string): PowerUp | null {
    const powerUp = ADVANCED_POWERUPS.find(p => p.id === powerUpId);
    if (!powerUp) return null;

    const now = Date.now();
    const endTime = powerUp.duration > 0 ? now + powerUp.duration * 1000 : now;

    this.activePowerUps.set(powerUpId, {
      powerUp,
      startTime: now,
      endTime
    });

    // Check for combos
    this.checkCombos();

    return powerUp;
  }

  removePowerUp(powerUpId: string): void {
    this.activePowerUps.delete(powerUpId);
    this.checkCombos();
  }

  getActivePowerUps(): PowerUp[] {
    const now = Date.now();
    const active: PowerUp[] = [];

    this.activePowerUps.forEach((data, id) => {
      if (data.endTime === 0 || data.endTime > now) {
        active.push(data.powerUp);
      } else {
        this.activePowerUps.delete(id);
      }
    });

    return active;
  }

  getActiveCombos(): PowerUpCombo[] {
    return POWERUP_COMBOS.filter(combo => this.activeCombos.has(combo.id));
  }

  getTotalEffects(): PowerUpEffect[] {
    const effects: PowerUpEffect[] = [];
    const now = Date.now();

    // Add effects from active power-ups
    this.activePowerUps.forEach((data) => {
      if (data.endTime === 0 || data.endTime > now) {
        effects.push(...data.powerUp.effects);
      }
    });

    // Add effects from active combos
    this.activeCombos.forEach(comboId => {
      const combo = POWERUP_COMBOS.find(c => c.id === comboId);
      if (combo) {
        effects.push(...combo.bonusEffects);
      }
    });

    return effects;
  }

  private checkCombos(): void {
    const activeIds = Array.from(this.activePowerUps.keys());

    POWERUP_COMBOS.forEach(combo => {
      const hasAll = combo.requiredPowerUps.every(id => activeIds.includes(id));
      
      if (hasAll) {
        this.activeCombos.add(combo.id);
      } else {
        this.activeCombos.delete(combo.id);
      }
    });
  }

  clear(): void {
    this.activePowerUps.clear();
    this.activeCombos.clear();
  }

  getTimeRemaining(powerUpId: string): number {
    const data = this.activePowerUps.get(powerUpId);
    if (!data || data.endTime === 0) return Infinity;
    
    const remaining = (data.endTime - Date.now()) / 1000;
    return Math.max(0, remaining);
  }
}

// Visual effect renderer helper
export function getPowerUpVisualStyles(powerUp: PowerUp): React.CSSProperties {
  const { visualEffect } = powerUp;
  
  switch (visualEffect.type) {
    case 'aura':
      return {
        boxShadow: `0 0 ${20 * visualEffect.intensity}px ${visualEffect.color}, 
                    0 0 ${40 * visualEffect.intensity}px ${visualEffect.color}40`,
        animation: 'pulse 1s ease-in-out infinite'
      };
    
    case 'glow':
      return {
        filter: `drop-shadow(0 0 ${10 * visualEffect.intensity}px ${visualEffect.color})`,
        animation: 'glow 2s ease-in-out infinite'
      };
    
    case 'shield':
      return {
        border: `${2 * visualEffect.intensity}px solid ${visualEffect.color}`,
        boxShadow: `0 0 ${15 * visualEffect.intensity}px ${visualEffect.color},
                    inset 0 0 ${10 * visualEffect.intensity}px ${visualEffect.color}40`,
        animation: 'shield-pulse 1.5s ease-in-out infinite'
      };
    
    case 'lightning':
      return {
        filter: `drop-shadow(0 0 ${8 * visualEffect.intensity}px ${visualEffect.color})`,
        animation: 'lightning 0.1s ease-in-out infinite'
      };
    
    case 'trail':
      return {
        filter: `drop-shadow(0 0 ${12 * visualEffect.intensity}px ${visualEffect.color})`,
        animation: 'trail 0.5s ease-out infinite'
      };
    
    case 'particles':
      return {
        filter: `drop-shadow(0 0 ${10 * visualEffect.intensity}px ${visualEffect.color})`,
        animation: 'particles 2s ease-in-out infinite'
      };
    
    default:
      return {};
  }
}
