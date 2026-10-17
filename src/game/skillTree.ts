export interface SkillNode {
  id: string;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  currentLevel: number;
  cost: number;
  requires?: string[];
  branch: 'offense' | 'defense' | 'utility';
  effects: SkillEffect[];
}

export interface SkillEffect {
  stat: string;
  value: number;
  type: 'flat' | 'percentage';
}

export interface SkillTree {
  offense: SkillNode[];
  defense: SkillNode[];
  utility: SkillNode[];
}

export const SKILL_TREE: SkillTree = {
  offense: [
    {
      id: 'plasma_mastery',
      name: 'Plasma Mastery',
      description: 'Povečaj škodo plazma orožja',
      icon: '⚡',
      maxLevel: 5,
      currentLevel: 0,
      cost: 100,
      branch: 'offense',
      effects: [
        { stat: 'damage', value: 10, type: 'percentage' }
      ]
    },
    {
      id: 'critical_strike',
      name: 'Critical Strike',
      description: 'Povečaj možnost kritičnega zadetka',
      icon: '💥',
      maxLevel: 5,
      currentLevel: 0,
      cost: 150,
      requires: ['plasma_mastery'],
      branch: 'offense',
      effects: [
        { stat: 'critRate', value: 5, type: 'percentage' },
        { stat: 'critDamage', value: 25, type: 'percentage' }
      ]
    },
    {
      id: 'rapid_fire',
      name: 'Rapid Fire',
      description: 'Povečaj hitrost streljanja',
      icon: '🔫',
      maxLevel: 5,
      currentLevel: 0,
      cost: 120,
      requires: ['plasma_mastery'],
      branch: 'offense',
      effects: [
        { stat: 'fireRate', value: 15, type: 'percentage' }
      ]
    },
    {
      id: 'chain_reaction',
      name: 'Chain Reaction',
      description: 'Streli se odbijajo na bližnje sovražnike',
      icon: '⚡',
      maxLevel: 3,
      currentLevel: 0,
      cost: 300,
      requires: ['critical_strike', 'rapid_fire'],
      branch: 'offense',
      effects: [
        { stat: 'chainCount', value: 2, type: 'flat' },
        { stat: 'chainDamage', value: 50, type: 'percentage' }
      ]
    },
    {
      id: 'overcharge',
      name: 'Overcharge',
      description: 'Občasno sprostiš dvojni strel',
      icon: '💫',
      maxLevel: 3,
      currentLevel: 0,
      cost: 400,
      requires: ['chain_reaction'],
      branch: 'offense',
      effects: [
        { stat: 'doubleShotChance', value: 10, type: 'percentage' }
      ]
    }
  ],
  
  defense: [
    {
      id: 'reinforced_hull',
      name: 'Reinforced Hull',
      description: 'Povečaj maksimalno zdravje',
      icon: '❤️',
      maxLevel: 5,
      currentLevel: 0,
      cost: 100,
      branch: 'defense',
      effects: [
        { stat: 'maxHp', value: 20, type: 'flat' }
      ]
    },
    {
      id: 'shield_generator',
      name: 'Shield Generator',
      description: 'Povečaj maksimalni ščit',
      icon: '🛡️',
      maxLevel: 5,
      currentLevel: 0,
      cost: 120,
      branch: 'defense',
      effects: [
        { stat: 'maxShield', value: 15, type: 'flat' }
      ]
    },
    {
      id: 'regeneration',
      name: 'Regeneration',
      description: 'Zdravje se počasi obnovlja',
      icon: '💚',
      maxLevel: 3,
      currentLevel: 0,
      cost: 200,
      requires: ['reinforced_hull'],
      branch: 'defense',
      effects: [
        { stat: 'hpRegen', value: 1, type: 'flat' }
      ]
    },
    {
      id: 'shield_recharge',
      name: 'Shield Recharge',
      description: 'Ščit se hitreje obnovlja',
      icon: '🔋',
      maxLevel: 3,
      currentLevel: 0,
      cost: 180,
      requires: ['shield_generator'],
      branch: 'defense',
      effects: [
        { stat: 'shieldRegen', value: 25, type: 'percentage' }
      ]
    },
    {
      id: 'energy_shield',
      name: 'Energy Shield',
      description: 'Ščit absorbira del škode',
      icon: '✨',
      maxLevel: 3,
      currentLevel: 0,
      cost: 350,
      requires: ['regeneration', 'shield_recharge'],
      branch: 'defense',
      effects: [
        { stat: 'damageReduction', value: 10, type: 'percentage' }
      ]
    }
  ],
  
  utility: [
    {
      id: 'swift_maneuvers',
      name: 'Swift Maneuvers',
      description: 'Povečaj hitrost gibanja',
      icon: '💨',
      maxLevel: 5,
      currentLevel: 0,
      cost: 100,
      branch: 'utility',
      effects: [
        { stat: 'speed', value: 10, type: 'percentage' }
      ]
    },
    {
      id: 'energy_core',
      name: 'Energy Core',
      description: 'Povečaj maksimalno energijo',
      icon: '⚡',
      maxLevel: 5,
      currentLevel: 0,
      cost: 110,
      branch: 'utility',
      effects: [
        { stat: 'maxEnergy', value: 15, type: 'flat' }
      ]
    },
    {
      id: 'dash_master',
      name: 'Dash Master',
      description: 'Skrajšaj cooldown dasha',
      icon: '⚡',
      maxLevel: 3,
      currentLevel: 0,
      cost: 200,
      requires: ['swift_maneuvers'],
      branch: 'utility',
      effects: [
        { stat: 'dashCooldown', value: -15, type: 'percentage' }
      ]
    },
    {
      id: 'energy_efficiency',
      name: 'Energy Efficiency',
      description: 'Smanjšaj porabo energije',
      icon: '🔋',
      maxLevel: 3,
      currentLevel: 0,
      cost: 180,
      requires: ['energy_core'],
      branch: 'utility',
      effects: [
        { stat: 'energyCost', value: -10, type: 'percentage' }
      ]
    },
    {
      id: 'temporal_mastery',
      name: 'Temporal Mastery',
      description: 'Podaljšaj trajanje časovne staze',
      icon: '⏱️',
      maxLevel: 3,
      currentLevel: 0,
      cost: 400,
      requires: ['dash_master', 'energy_efficiency'],
      branch: 'utility',
      effects: [
        { stat: 'stasisDuration', value: 25, type: 'percentage' }
      ]
    }
  ]
};

export function canUnlockSkill(skill: SkillNode, skillTree: SkillTree): boolean {
  if (skill.currentLevel >= skill.maxLevel) return false;
  
  if (skill.requires) {
    for (const reqId of skill.requires) {
      const reqSkill = findSkill(reqId, skillTree);
      if (!reqSkill || reqSkill.currentLevel === 0) {
        return false;
      }
    }
  }
  
  return true;
}

export function findSkill(id: string, skillTree: SkillTree): SkillNode | null {
  for (const branch of Object.values(skillTree)) {
    const skill = branch.find((s: SkillNode) => s.id === id);
    if (skill) return skill;
  }
  return null;
}

export function getSkillCost(skill: SkillNode): number {
  return skill.cost * (skill.currentLevel + 1);
}

export function applySkillEffects(skill: SkillNode, stats: any): any {
  const modifiedStats = { ...stats };
  
  for (const effect of skill.effects) {
    if (effect.type === 'flat') {
      modifiedStats[effect.stat] = (modifiedStats[effect.stat] || 0) + effect.value * skill.currentLevel;
    } else if (effect.type === 'percentage') {
      const baseValue = modifiedStats[effect.stat] || 0;
      modifiedStats[effect.stat] = baseValue * (1 + (effect.value * skill.currentLevel) / 100);
    }
  }
  
  return modifiedStats;
}
