import React from 'react';

interface FormationVisualizationProps {
  formationType: 'line' | 'circle' | 'vshape' | 'random' | 'spiral';
  centerX: number;
  centerY: number;
  enemyCount: number;
  scale?: number;
  rotation?: number;
  color?: string;
}

export const FormationVisualization: React.FC<FormationVisualizationProps> = ({
  formationType,
  centerX,
  centerY,
  enemyCount,
  scale = 1,
  rotation = 0,
  color = '#00ffff'
}) => {
  const getFormationPositions = () => {
    const positions: Array<{ x: number; y: number }> = [];

    switch (formationType) {
      case 'line':
        for (let i = 0; i < enemyCount; i++) {
          const x = (i - enemyCount / 2) * 50 * scale;
          positions.push({ x, y: 0 });
        }
        break;

      case 'circle':
        for (let i = 0; i < enemyCount; i++) {
          const angle = (i / enemyCount) * Math.PI * 2;
          const radius = 100 * scale;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          positions.push({ x, y });
        }
        break;

      case 'vshape':
        for (let i = 0; i < enemyCount; i++) {
          const vIndex = i - enemyCount / 2;
          const x = vIndex * 40 * scale;
          const y = Math.abs(vIndex) * 30 * scale;
          positions.push({ x, y });
        }
        break;

      case 'spiral':
        for (let i = 0; i < enemyCount; i++) {
          const spiralAngle = (i / enemyCount) * Math.PI * 4;
          const spiralRadius = (i / enemyCount) * 150 * scale;
          const x = Math.cos(spiralAngle) * spiralRadius;
          const y = Math.sin(spiralAngle) * spiralRadius;
          positions.push({ x, y });
        }
        break;

      case 'random':
        for (let i = 0; i < enemyCount; i++) {
          // Deterministic pseudo-random (pure) - Math.random() during render is impure
          const jitter = (n: number) => Math.abs(Math.sin(n * 127.1 + 311.7) * 43758.5453) % 1;
          const x = (jitter(i * 2 + 1) - 0.5) * 200 * scale;
          const y = (jitter(i * 2 + 2) - 0.5) * 200 * scale;
          positions.push({ x, y });
        }
        break;
    }

    // Apply rotation
    return positions.map(pos => {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const rotatedX = pos.x * cos - pos.y * sin;
      const rotatedY = pos.x * sin + pos.y * cos;
      return {
        x: centerX + rotatedX,
        y: centerY + rotatedY
      };
    });
  };

  const positions = getFormationPositions();

  return (
    <g className="formation-visualization">
      {/* Formation outline */}
      <path
        d={positions.map((pos, i) => 
          `${i === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`
        ).join(' ') + ' Z'}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeDasharray="5,5"
        opacity="0.3"
      />
      
      {/* Enemy positions */}
      {positions.map((pos, i) => (
        <g key={i}>
          {/* Position marker */}
          <circle
            cx={pos.x}
            cy={pos.y}
            r="8"
            fill={color}
            opacity="0.6"
          >
            <animate
              attributeName="opacity"
              values="0.6;0.3;0.6"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          
          {/* Position indicator */}
          <circle
            cx={pos.x}
            cy={pos.y}
            r="12"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.4"
          >
            <animate
              attributeName="r"
              values="12;16;12"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.4;0.1;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      ))}

      {/* Center marker */}
      <circle
        cx={centerX}
        cy={centerY}
        r="4"
        fill={color}
        opacity="0.8"
      />
      <circle
        cx={centerX}
        cy={centerY}
        r="8"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.5"
      />
    </g>
  );
};

// Formation selector component for UI
interface FormationSelectorProps {
  currentFormation: 'line' | 'circle' | 'vshape' | 'random' | 'spiral';
  onFormationChange: (formation: 'line' | 'circle' | 'vshape' | 'random' | 'spiral') => void;
}

export const FormationSelector: React.FC<FormationSelectorProps> = ({
  currentFormation,
  onFormationChange
}) => {
  const formations: Array<{
    type: 'line' | 'circle' | 'vshape' | 'random' | 'spiral';
    name: string;
    icon: string;
    description: string;
  }> = [
    { type: 'line', name: 'Linija', icon: '━━', description: 'Sovražniki v ravni liniji' },
    { type: 'circle', name: 'Krog', icon: '◯', description: 'Sovražniki v krožni formaciji' },
    { type: 'vshape', name: 'V-oblika', icon: '∨', description: 'Sovražniki v V obliki' },
    { type: 'spiral', name: 'Spirala', icon: '🌀', description: 'Sovražniki v spiralni formaciji' },
    { type: 'random', name: 'Naključno', icon: '⚂', description: 'Naključna razporeditev' }
  ];

  return (
    <div className="formation-selector">
      <h3 className="text-lg font-bold mb-3 text-cyan-400">Formacija sovražnikov</h3>
      <div className="grid grid-cols-5 gap-2">
        {formations.map(formation => (
          <button
            key={formation.type}
            onClick={() => onFormationChange(formation.type)}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentFormation === formation.type
                ? 'border-cyan-400 bg-cyan-400/20'
                : 'border-gray-600 bg-gray-800/50 hover:border-cyan-600'
            }`}
          >
            <div className="text-2xl mb-1">{formation.icon}</div>
            <div className="text-xs font-bold">{formation.name}</div>
            <div className="text-xs text-gray-400 mt-1">{formation.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
