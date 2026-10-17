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
  // Skill points are scarce (~1 per player level-up / daily reward), so the
  // original 100-400 "cost" values are mapped onto a small-point economy:
  // 100-150 -> 1 SP, 180-200 -> 2 SP, 300 -> 3 SP, 350-400 -> 4 SP.
  const baseCost = Math.max(1, Math.round(skill.cost / 100));
  return baseCost * (skill.currentLevel + 1);
}

// ============= PERSISTENT SKILL BONUSES =============
// Aggregated bonuses derived from the skill tree, applied by the game engine
// at the start of every run.
export interface SkillBonuses {
  maxHp: number;           // flat HP added
  maxShield: number;       // flat shield added
  maxEnergy: number;       // flat energy added
  speedMul: number;        // movement speed multiplier
  damageMul: number;       // weapon damage multiplier
  fireRateMul: number;     // fire rate multiplier
  critRateBonus: number;   // added to base crit rate
  critDmgMul: number;      // crit damage multiplier
  dashCooldownMul: number; // dash cooldown multiplier (<1 = faster dash)
  hpRegen: number;         // HP per second
  shieldRegenMul: number;  // shield regen multiplier
  damageReduction: number; // 0..0.75 incoming damage reduction
  stasisDurationMul: number; // temporal stasis duration multiplier
  energyCostMul: number;   // ability energy cost multiplier (<1 = cheaper)
}

export function defaultSkillBonuses(): SkillBonuses {
  return {
    maxHp: 0,
    maxShield: 0,
    maxEnergy: 0,
    speedMul: 1,
    damageMul: 1,
    fireRateMul: 1,
    critRateBonus: 0,
    critDmgMul: 1,
    dashCooldownMul: 1,
    hpRegen: 0,
    shieldRegenMul: 1,
    damageReduction: 0,
    stasisDurationMul: 1,
    energyCostMul: 1
  };
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * Compute aggregate bonuses from a skill tree. Pure function - the tree is
 * never mutated here.
 */
export function computeSkillBonuses(tree: SkillTree): SkillBonuses {
  const b = defaultSkillBonuses();
  const allSkills: SkillNode[] = [...tree.offense, ...tree.defense, ...tree.utility];

  for (const skill of allSkills) {
    const lvl = Math.max(0, skill.currentLevel);
    if (lvl === 0) continue;

    switch (skill.id) {
      case 'plasma_mastery':
        b.damageMul *= 1 + 0.10 * lvl;
        break;
      case 'critical_strike':
        b.critRateBonus += 0.05 * lvl;
        b.critDmgMul *= 1 + 0.25 * lvl;
        break;
      case 'rapid_fire':
        b.fireRateMul *= 1 + 0.15 * lvl;
        break;
      case 'reinforced_hull':
        b.maxHp += 20 * lvl;
        break;
      case 'shield_generator':
        b.maxShield += 15 * lvl;
        break;
      case 'regeneration':
        b.hpRegen += 1 * lvl;
        break;
      case 'shield_recharge':
        b.shieldRegenMul *= 1 + 0.25 * lvl;
        break;
      case 'energy_shield':
        b.damageReduction = clamp(b.damageReduction + 0.10 * lvl, 0, 0.75);
        break;
      case 'swift_maneuvers':
        b.speedMul *= 1 + 0.10 * lvl;
        break;
      case 'energy_core':
        b.maxEnergy += 15 * lvl;
        break;
      case 'dash_master':
        b.dashCooldownMul = clamp(b.dashCooldownMul - 0.15 * lvl, 0.25, 1);
        break;
      case 'energy_efficiency':
        b.energyCostMul = clamp(b.energyCostMul - 0.10 * lvl, 0.25, 1);
        break;
      case 'temporal_mastery':
        b.stasisDurationMul *= 1 + 0.25 * lvl;
        break;
      // chain_reaction & overcharge are not yet wired into gameplay
      default:
        break;
    }
  }

  return b;
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
