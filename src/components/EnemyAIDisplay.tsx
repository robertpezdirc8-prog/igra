import React from 'react';

interface EnemyAIDisplayProps {
  enemies: Array<{
    id: string;
    x: number;
    y: number;
    behavior: 'idle' | 'patrol' | 'chase' | 'attack' | 'flee' | 'circle';
    targetX?: number;
    targetY?: number;
    health: number;
    maxHealth: number;
    type: string;
    personality?: {
      aggression: number;
      intelligence: number;
      reactionTime: number;
      accuracy: number;
    };
  }>;
  showBehavior?: boolean;
  showTargets?: boolean;
  showPersonality?: boolean;
}

export const EnemyAIDisplay: React.FC<EnemyAIDisplayProps> = ({
  enemies,
  showBehavior = true,
  showTargets = true,
  showPersonality = false
}) => {
  const getBehaviorColor = (behavior: string) => {
    switch (behavior) {
      case 'idle': return '#888888';
      case 'patrol': return '#4488ff';
      case 'chase': return '#ffaa00';
      case 'attack': return '#ff4444';
      case 'flee': return '#44ff44';
      case 'circle': return '#ff44ff';
      default: return '#ffffff';
    }
  };

  const getBehaviorIcon = (behavior: string) => {
    switch (behavior) {
      case 'idle': return '💤';
      case 'patrol': return '🚶';
      case 'chase': return '🏃';
      case 'attack': return '⚔️';
      case 'flee': return '🏃💨';
      case 'circle': return '🔄';
      default: return '❓';
    }
  };

  const getBehaviorName = (behavior: string) => {
    switch (behavior) {
      case 'idle': return 'Mirovanje';
      case 'patrol': return 'Patrolja';
      case 'chase': return 'Sledenje';
      case 'attack': return 'Napad';
      case 'flee': return 'Beg';
      case 'circle': return 'Kroženje';
      default: return 'Neznano';
    }
  };

  return (
    <g className="enemy-ai-display">
      {enemies.map(enemy => {
        const behaviorColor = getBehaviorColor(enemy.behavior);
        const behaviorIcon = getBehaviorIcon(enemy.behavior);
        const healthPercent = (enemy.health / enemy.maxHealth) * 100;

        return (
          <g key={enemy.id}>
            {/* Behavior indicator circle */}
            {showBehavior && (
              <g>
                {/* Outer ring showing behavior */}
                <circle
                  cx={enemy.x}
                  cy={enemy.y}
                  r="25"
                  fill="none"
                  stroke={behaviorColor}
                  strokeWidth="2"
                  opacity="0.6"
                  strokeDasharray={enemy.behavior === 'circle' ? '5,5' : 'none'}
                >
                  {enemy.behavior === 'attack' && (
                    <animate
                      attributeName="r"
                      values="25;30;25"
                      dur="0.5s"
                      repeatCount="indefinite"
                    />
                  )}
                  {enemy.behavior === 'chase' && (
                    <animate
                      attributeName="opacity"
                      values="0.6;0.3;0.6"
                      dur="1s"
                      repeatCount="indefinite"
                    />
                  )}
                </circle>

                {/* Behavior icon */}
                <text
                  x={enemy.x}
                  y={enemy.y - 35}
                  textAnchor="middle"
                  fontSize="16"
                  fill={behaviorColor}
                >
                  {behaviorIcon}
                </text>

                {/* Behavior name */}
                <text
                  x={enemy.x}
                  y={enemy.y - 45}
                  textAnchor="middle"
                  fontSize="10"
                  fill={behaviorColor}
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {getBehaviorName(enemy.behavior)}
                </text>
              </g>
            )}

            {/* Target indicator */}
            {showTargets && enemy.targetX !== undefined && enemy.targetY !== undefined && (
              <g>
                {/* Line to target */}
                <line
                  x1={enemy.x}
                  y1={enemy.y}
                  x2={enemy.targetX}
                  y2={enemy.targetY}
                  stroke={behaviorColor}
                  strokeWidth="1"
                  strokeDasharray="5,5"
                  opacity="0.4"
                />

                {/* Target marker */}
                <circle
                  cx={enemy.targetX}
                  cy={enemy.targetY}
                  r="5"
                  fill={behaviorColor}
                  opacity="0.6"
                >
                  <animate
                    attributeName="r"
                    values="5;8;5"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Target crosshair */}
                <line
                  x1={enemy.targetX - 10}
                  y1={enemy.targetY}
                  x2={enemy.targetX + 10}
                  y2={enemy.targetY}
                  stroke={behaviorColor}
                  strokeWidth="1"
                  opacity="0.6"
                />
                <line
                  x1={enemy.targetX}
                  y1={enemy.targetY - 10}
                  x2={enemy.targetX}
                  y2={enemy.targetY + 10}
                  stroke={behaviorColor}
                  strokeWidth="1"
                  opacity="0.6"
                />
              </g>
            )}

            {/* Health bar */}
            <g>
              <rect
                x={enemy.x - 20}
                y={enemy.y + 20}
                width="40"
                height="4"
                fill="#333"
                rx="2"
              />
              <rect
                x={enemy.x - 20}
                y={enemy.y + 20}
                width={40 * (healthPercent / 100)}
                height="4"
                fill={healthPercent > 50 ? '#44ff44' : healthPercent > 25 ? '#ffaa00' : '#ff4444'}
                rx="2"
              />
            </g>

            {/* Personality indicators (if enabled) */}
            {showPersonality && enemy.personality && (
              <g>
                {/* Aggression indicator */}
                <circle
                  cx={enemy.x - 30}
                  cy={enemy.y - 30}
                  r={3 + enemy.personality.aggression * 5}
                  fill="#ff4444"
                  opacity={0.3 + enemy.personality.aggression * 0.4}
                />
                <text
                  x={enemy.x - 30}
                  y={enemy.y - 35}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#ff4444"
                >
                  A
                </text>

                {/* Intelligence indicator */}
                <circle
                  cx={enemy.x + 30}
                  cy={enemy.y - 30}
                  r={3 + enemy.personality.intelligence * 5}
                  fill="#4488ff"
                  opacity={0.3 + enemy.personality.intelligence * 0.4}
                />
                <text
                  x={enemy.x + 30}
                  y={enemy.y - 35}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#4488ff"
                >
                  I
                </text>

                {/* Reaction time indicator */}
                <circle
                  cx={enemy.x - 30}
                  cy={enemy.y + 30}
                  r={3 + enemy.personality.reactionTime * 5}
                  fill="#ffaa00"
                  opacity={0.3 + enemy.personality.reactionTime * 0.4}
                />
                <text
                  x={enemy.x - 30}
                  y={enemy.y + 35}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#ffaa00"
                >
                  R
                </text>

                {/* Accuracy indicator */}
                <circle
                  cx={enemy.x + 30}
                  cy={enemy.y + 30}
                  r={3 + enemy.personality.accuracy * 5}
                  fill="#44ff44"
                  opacity={0.3 + enemy.personality.accuracy * 0.4}
                />
                <text
                  x={enemy.x + 30}
                  y={enemy.y + 35}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#44ff44"
                >
                  P
                </text>
              </g>
            )}

            {/* Attack warning */}
            {enemy.behavior === 'attack' && (
              <g>
                <circle
                  cx={enemy.x}
                  cy={enemy.y}
                  r="35"
                  fill="none"
                  stroke="#ff0000"
                  strokeWidth="3"
                  opacity="0.8"
                >
                  <animate
                    attributeName="r"
                    values="35;45;35"
                    dur="0.3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.8;0.3;0.8"
                    dur="0.3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <text
                  x={enemy.x}
                  y={enemy.y - 55}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#ff0000"
                  fontWeight="bold"
                >
                  ⚠️ NAPAD ⚠️
                </text>
              </g>
            )}

            {/* Flee indicator */}
            {enemy.behavior === 'flee' && (
              <g>
                <text
                  x={enemy.x}
                  y={enemy.y - 55}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#44ff44"
                  fontWeight="bold"
                >
                  🏃💨 BEG 💨🏃
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

// AI behavior legend component
interface AIBehaviorLegendProps {
  showBehavior: boolean;
  showTargets: boolean;
  showPersonality: boolean;
  onToggleBehavior: () => void;
  onToggleTargets: () => void;
  onTogglePersonality: () => void;
}

export const AIBehaviorLegend: React.FC<AIBehaviorLegendProps> = ({
  showBehavior,
  showTargets,
  showPersonality,
  onToggleBehavior,
  onToggleTargets,
  onTogglePersonality
}) => {
  const behaviors = [
    { name: 'Mirovanje', icon: '💤', color: '#888888' },
    { name: 'Patrolja', icon: '🚶', color: '#4488ff' },
    { name: 'Sledenje', icon: '🏃', color: '#ffaa00' },
    { name: 'Napad', icon: '⚔️', color: '#ff4444' },
    { name: 'Beg', icon: '🏃💨', color: '#44ff44' },
    { name: 'Kroženje', icon: '🔄', color: '#ff44ff' }
  ];

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 border-2 border-cyan-500 rounded-lg p-4 backdrop-blur-sm z-40">
      <h3 className="text-lg font-bold text-cyan-400 mb-3">AI Vedenje</h3>
      
      {/* Behavior legend */}
      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Vedenja:</div>
        <div className="grid grid-cols-2 gap-2">
          {behaviors.map(behavior => (
            <div key={behavior.name} className="flex items-center gap-2">
              <span className="text-lg">{behavior.icon}</span>
              <span className="text-xs" style={{ color: behavior.color }}>
                {behavior.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle buttons */}
      <div className="space-y-2">
        <button
          onClick={onToggleBehavior}
          className={`w-full px-3 py-2 rounded text-sm font-bold transition-all ${
            showBehavior
              ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-400'
              : 'bg-gray-800 border-2 border-gray-600 text-gray-400'
          }`}
        >
          {showBehavior ? '✓' : '✗'} Prikaži vedenje
        </button>

        <button
          onClick={onToggleTargets}
          className={`w-full px-3 py-2 rounded text-sm font-bold transition-all ${
            showTargets
              ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-400'
              : 'bg-gray-800 border-2 border-gray-600 text-gray-400'
          }`}
        >
          {showTargets ? '✓' : '✗'} Prikaži cilje
        </button>

        <button
          onClick={onTogglePersonality}
          className={`w-full px-3 py-2 rounded text-sm font-bold transition-all ${
            showPersonality
              ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-400'
              : 'bg-gray-800 border-2 border-gray-600 text-gray-400'
          }`}
        >
          {showPersonality ? '✓' : '✗'} Prikaži osebnost
        </button>
      </div>

      {/* Personality legend */}
      {showPersonality && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400 mb-2">Osebnost:</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-300">A = Agresivnost</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-300">I = Inteligenca</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-300">R = Reakcijski čas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-300">P = Natančnost</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
