import { useState } from 'react';
import { SKILL_TREE, SkillNode, canUnlockSkill, getSkillCost } from '../game/skillTree';

interface SkillTreeUIProps {
  isOpen: boolean;
  onClose: () => void;
  skillPoints: number;
  onUnlockSkill: (skillId: string) => void;
}

export function SkillTreeUI({ isOpen, onClose, skillPoints, onUnlockSkill }: SkillTreeUIProps) {
  const [selectedBranch, setSelectedBranch] = useState<'offense' | 'defense' | 'utility'>('offense');

  if (!isOpen) return null;

  const branchColors = {
    offense: { primary: '#ff4444', secondary: '#ff8888' },
    defense: { primary: '#4444ff', secondary: '#8888ff' },
    utility: { primary: '#44ff44', secondary: '#88ff88' }
  };

  const branchNames = {
    offense: 'Ofenziva',
    defense: 'Defenziva',
    utility: 'Uporabnost'
  };

  const currentBranch = SKILL_TREE[selectedBranch];
  const colors = branchColors[selectedBranch];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-[90vw] max-w-6xl h-[80vh] bg-gradient-to-br from-gray-900 to-black border-2 rounded-lg overflow-hidden"
           style={{ borderColor: colors.primary }}>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-black/80 border-b-2 flex items-center justify-between px-6"
             style={{ borderColor: colors.primary }}>
          <h2 className="text-3xl font-bold font-mono" style={{ color: colors.primary }}>
            SKILL TREE
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-xl font-mono" style={{ color: colors.secondary }}>
              Skill Points: {skillPoints}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono rounded transition-colors"
            >
              ZAPRI
            </button>
          </div>
        </div>

        {/* Branch tabs */}
        <div className="absolute top-16 left-0 right-0 h-12 bg-black/60 border-b flex">
          {(['offense', 'defense', 'utility'] as const).map((branch) => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`flex-1 font-mono text-lg transition-all ${
                selectedBranch === branch ? 'bg-black/80' : 'bg-black/40 hover:bg-black/60'
              }`}
              style={{
                color: selectedBranch === branch ? branchColors[branch].primary : '#888',
                borderBottom: selectedBranch === branch ? `3px solid ${branchColors[branch].primary}` : 'none'
              }}
            >
              {branchNames[branch]}
            </button>
          ))}
        </div>

        {/* Skill tree content */}
        <div className="absolute top-28 left-0 right-0 bottom-0 overflow-y-auto p-8">
          <div className="flex flex-col items-center gap-8">
            {currentBranch.map((skill, index) => (
              <SkillNodeUI
                key={skill.id}
                skill={skill}
                canUnlock={canUnlockSkill(skill, SKILL_TREE)}
                skillPoints={skillPoints}
                cost={getSkillCost(skill)}
                color={colors.primary}
                onUnlock={() => onUnlockSkill(skill.id)}
                isLast={index === currentBranch.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full"
               style={{ background: `radial-gradient(circle, ${colors.primary}44, transparent)` }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
               style={{ background: `radial-gradient(circle, ${colors.secondary}22, transparent)` }} />
        </div>
      </div>
    </div>
  );
}

interface SkillNodeUIProps {
  skill: SkillNode;
  canUnlock: boolean;
  skillPoints: number;
  cost: number;
  color: string;
  onUnlock: () => void;
  isLast: boolean;
}

function SkillNodeUI({ skill, canUnlock, skillPoints, cost, color, onUnlock, isLast }: SkillNodeUIProps) {
  const isMaxed = skill.currentLevel >= skill.maxLevel;
  const canAfford = skillPoints >= cost;
  const isUnlocked = skill.currentLevel > 0;

  return (
    <div className="flex flex-col items-center">
      {/* Connector line */}
      {!isLast && (
        <div className="w-1 h-8 mb-4" style={{ background: `linear-gradient(to bottom, ${color}, transparent)` }} />
      )}

      {/* Skill node */}
      <div
        className={`relative w-64 p-6 rounded-lg border-2 transition-all ${
          isUnlocked ? 'bg-black/60' : 'bg-black/40'
        } ${canUnlock && canAfford && !isMaxed ? 'cursor-pointer hover:scale-105' : ''}`}
        style={{
          borderColor: isUnlocked ? color : '#444',
          boxShadow: isUnlocked ? `0 0 20px ${color}88` : 'none'
        }}
        onClick={() => canUnlock && canAfford && !isMaxed && onUnlock()}
      >
        {/* Icon */}
        <div className="text-center mb-3">
          <span className="text-5xl">{skill.icon}</span>
        </div>

        {/* Name */}
        <h3 className="text-xl font-bold font-mono text-center mb-2" style={{ color: isUnlocked ? color : '#fff' }}>
          {skill.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 text-center mb-4">{skill.description}</p>

        {/* Level indicator */}
        <div className="flex justify-center gap-1 mb-4">
          {Array.from({ length: skill.maxLevel }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full border"
              style={{
                borderColor: color,
                background: i < skill.currentLevel ? color : 'transparent'
              }}
            />
          ))}
        </div>

        {/* Cost and unlock button */}
        {!isMaxed && (
          <div className="text-center">
            <div className="text-sm font-mono mb-2" style={{ color: canAfford ? '#fff' : '#666' }}>
              Cost: {cost} SP
            </div>
            {canUnlock && canAfford && (
              <button
                className="px-4 py-2 rounded font-mono text-sm transition-all hover:scale-110"
                style={{
                  background: color,
                  color: '#000',
                  boxShadow: `0 0 15px ${color}`
                }}
              >
                UGOTOVI
              </button>
            )}
            {!canUnlock && (
              <div className="text-xs text-gray-500 font-mono">
                {skill.requires ? `Zahteva: ${skill.requires.join(', ')}` : ''}
              </div>
            )}
          </div>
        )}

        {isMaxed && (
          <div className="text-center text-lg font-bold font-mono" style={{ color }}>
            MAX LEVEL
          </div>
        )}

        {/* Effects preview */}
        {skill.effects.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 font-mono">
              {skill.effects.map((effect, i) => (
                <div key={i}>
                  +{effect.value}{effect.type === 'percentage' ? '%' : ''} {effect.stat}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
