import React from 'react';

interface EnemyVisualEffectsProps {
  enemyType: string;
  x: number;
  y: number;
  size: number;
  isElite?: boolean;
  isBoss?: boolean;
  health?: number;
  maxHealth?: number;
}

export const EnemyVisualEffects: React.FC<EnemyVisualEffectsProps> = ({
  enemyType,
  x,
  y,
  size,
  isElite = false,
  isBoss = false,
  health,
  maxHealth
}) => {
  const getEnemyEffects = () => {
    switch (enemyType) {
      case 'swarmer':
        return {
          color: '#ff4444',
          glowColor: '#ff0000',
          particleCount: 3,
          particleSpeed: 2,
          auraSize: size * 1.5,
          effect: 'swarm'
        };
      
      case 'fast_swarmer':
        return {
          color: '#ff8844',
          glowColor: '#ff4400',
          particleCount: 5,
          particleSpeed: 4,
          auraSize: size * 1.3,
          effect: 'speed'
        };
      
      case 'sniper':
        return {
          color: '#ff8800',
          glowColor: '#ff4400',
          particleCount: 2,
          particleSpeed: 1,
          auraSize: size * 1.8,
          effect: 'target'
        };
      
      case 'burst_sniper':
        return {
          color: '#ffaa00',
          glowColor: '#ff8800',
          particleCount: 4,
          particleSpeed: 2,
          auraSize: size * 2,
          effect: 'burst'
        };
      
      case 'titan':
        return {
          color: '#aa00ff',
          glowColor: '#8800ff',
          particleCount: 6,
          particleSpeed: 1,
          auraSize: size * 2.5,
          effect: 'heavy'
        };
      
      case 'heavy_titan':
        return {
          color: '#8800ff',
          glowColor: '#6600cc',
          particleCount: 8,
          particleSpeed: 0.5,
          auraSize: size * 3,
          effect: 'massive'
        };
      
      case 'bomber':
        return {
          color: '#ff0088',
          glowColor: '#ff0044',
          particleCount: 4,
          particleSpeed: 3,
          auraSize: size * 1.8,
          effect: 'explosive'
        };
      
      case 'teleporter':
        return {
          color: '#00ff88',
          glowColor: '#00ff44',
          particleCount: 6,
          particleSpeed: 5,
          auraSize: size * 2,
          effect: 'teleport'
        };
      
      case 'shielder':
        return {
          color: '#0088ff',
          glowColor: '#0044ff',
          particleCount: 3,
          particleSpeed: 1,
          auraSize: size * 2.2,
          effect: 'shield'
        };
      
      case 'elite_swarmer':
        return {
          color: '#ff0044',
          glowColor: '#ff0000',
          particleCount: 5,
          particleSpeed: 3,
          auraSize: size * 1.8,
          effect: 'elite'
        };
      
      case 'phantom':
        return {
          color: '#aa00aa',
          glowColor: '#880088',
          particleCount: 7,
          particleSpeed: 4,
          auraSize: size * 2,
          effect: 'phantom'
        };
      
      case 'destroyer':
        return {
          color: '#ff0000',
          glowColor: '#cc0000',
          particleCount: 10,
          particleSpeed: 2,
          auraSize: size * 3.5,
          effect: 'destroyer'
        };
      
      default:
        return {
          color: '#ffffff',
          glowColor: '#888888',
          particleCount: 2,
          particleSpeed: 1,
          auraSize: size * 1.5,
          effect: 'default'
        };
    }
  };

  const effects = getEnemyEffects();

  return (
    <g className="enemy-visual-effects">
      {/* Main aura */}
      <circle
        cx={x}
        cy={y}
        r={effects.auraSize}
        fill="none"
        stroke={effects.color}
        strokeWidth="2"
        opacity="0.3"
      >
        <animate
          attributeName="r"
          values={`${effects.auraSize};${effects.auraSize * 1.2};${effects.auraSize}`}
          dur="2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.3;0.5;0.3"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Inner glow */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={effects.color}
        opacity="0.2"
      >
        <animate
          attributeName="opacity"
          values="0.2;0.4;0.2"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Particle effects */}
      {Array.from({ length: effects.particleCount }).map((_, i) => {
        const angle = (i / effects.particleCount) * Math.PI * 2;
        const distance = size * 1.5;
        const particleX = x + Math.cos(angle) * distance;
        const particleY = y + Math.sin(angle) * distance;

        return (
          <circle
            key={i}
            cx={particleX}
            cy={particleY}
            r="3"
            fill={effects.color}
            opacity="0.8"
          >
            <animate
              attributeName="cx"
              values={`${particleX};${x};${particleX}`}
              dur={`${2 / effects.particleSpeed}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values={`${particleY};${y};${particleY}`}
              dur={`${2 / effects.particleSpeed}s`}
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0.2;0.8"
              dur={`${2 / effects.particleSpeed}s`}
              repeatCount="indefinite"
            />
          </circle>
        );
      })}

      {/* Special effects based on type */}
      {effects.effect === 'speed' && (
        <g>
          {/* Speed trails */}
          {Array.from({ length: 3 }).map((_, i) => (
            <line
              key={i}
              x1={x - size * 2 - i * 10}
              y1={y}
              x2={x - size - i * 10}
              y2={y}
              stroke={effects.color}
              strokeWidth="2"
              opacity={0.5 - i * 0.15}
            >
              <animate
                attributeName="opacity"
                values={`${0.5 - i * 0.15};${0.2 - i * 0.05};${0.5 - i * 0.15}`}
                dur="0.5s"
                repeatCount="indefinite"
              />
            </line>
          ))}
        </g>
      )}

      {effects.effect === 'target' && (
        <g>
          {/* Targeting reticle */}
          <circle
            cx={x}
            cy={y}
            r={size * 2}
            fill="none"
            stroke={effects.color}
            strokeWidth="1"
            strokeDasharray="5,5"
            opacity="0.5"
          >
            <animate
              attributeName="r"
              values={`${size * 2};${size * 2.5};${size * 2}`}
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <line
            x1={x - size * 2.5}
            y1={y}
            x2={x - size * 1.5}
            y2={y}
            stroke={effects.color}
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1={x + size * 1.5}
            y1={y}
            x2={x + size * 2.5}
            y2={y}
            stroke={effects.color}
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1={x}
            y1={y - size * 2.5}
            x2={x}
            y2={y - size * 1.5}
            stroke={effects.color}
            strokeWidth="2"
            opacity="0.6"
          />
          <line
            x1={x}
            y1={y + size * 1.5}
            x2={x}
            y2={y + size * 2.5}
            stroke={effects.color}
            strokeWidth="2"
            opacity="0.6"
          />
        </g>
      )}

      {effects.effect === 'heavy' && (
        <g>
          {/* Heavy armor plates */}
          {Array.from({ length: 4 }).map((_, i) => {
            const angle = (i / 4) * Math.PI * 2;
            const plateX = x + Math.cos(angle) * size * 1.2;
            const plateY = y + Math.sin(angle) * size * 1.2;
            return (
              <rect
                key={i}
                x={plateX - 5}
                y={plateY - 5}
                width="10"
                height="10"
                fill={effects.color}
                opacity="0.4"
                transform={`rotate(${(angle * 180) / Math.PI} ${plateX} ${plateY})`}
              >
                <animate
                  attributeName="opacity"
                  values="0.4;0.6;0.4"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </rect>
            );
          })}
        </g>
      )}

      {effects.effect === 'explosive' && (
        <g>
          {/* Explosion warning */}
          <circle
            cx={x}
            cy={y}
            r={size * 1.5}
            fill="none"
            stroke={effects.color}
            strokeWidth="3"
            opacity="0.6"
          >
            <animate
              attributeName="r"
              values={`${size * 1.5};${size * 2};${size * 1.5}`}
              dur="1s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.6;0.2;0.6"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
          <text
            x={x}
            y={y - size * 2}
            textAnchor="middle"
            fontSize="16"
            fill={effects.color}
          >
            💣
          </text>
        </g>
      )}

      {effects.effect === 'teleport' && (
        <g>
          {/* Teleport effect */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const distance = size * (1 + Math.sin(Date.now() / 500 + i) * 0.5);
            const portalX = x + Math.cos(angle) * distance;
            const portalY = y + Math.sin(angle) * distance;
            return (
              <circle
                key={i}
                cx={portalX}
                cy={portalY}
                r="4"
                fill={effects.color}
                opacity="0.6"
              >
                <animate
                  attributeName="opacity"
                  values="0.6;0.1;0.6"
                  dur={`${1 + i * 0.2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}
        </g>
      )}

      {effects.effect === 'shield' && (
        <g>
          {/* Shield bubble */}
          <circle
            cx={x}
            cy={y}
            r={size * 2}
            fill="none"
            stroke={effects.color}
            strokeWidth="3"
            opacity="0.4"
          >
            <animate
              attributeName="opacity"
              values="0.4;0.6;0.4"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx={x}
            cy={y}
            r={size * 2.2}
            fill="none"
            stroke={effects.color}
            strokeWidth="1"
            strokeDasharray="10,5"
            opacity="0.3"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${x} ${y}`}
              to={`360 ${x} ${y}`}
              dur="10s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}

      {effects.effect === 'phantom' && (
        <g>
          {/* Phantom afterimages */}
          {Array.from({ length: 3 }).map((_, i) => (
            <circle
              key={i}
              cx={x - (i + 1) * 10}
              cy={y}
              r={size * (1 - i * 0.2)}
              fill={effects.color}
              opacity={0.3 - i * 0.1}
            >
              <animate
                attributeName="opacity"
                values={`${0.3 - i * 0.1};${0.1 - i * 0.03};${0.3 - i * 0.1}`}
                dur={`${1 + i * 0.3}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      )}

      {effects.effect === 'destroyer' && (
        <g>
          {/* Destroyer energy field */}
          <circle
            cx={x}
            cy={y}
            r={size * 3}
            fill="none"
            stroke={effects.color}
            strokeWidth="4"
            opacity="0.5"
          >
            <animate
              attributeName="r"
              values={`${size * 3};${size * 3.5};${size * 3}`}
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const energyX = x + Math.cos(angle) * size * 2.5;
            const energyY = y + Math.sin(angle) * size * 2.5;
            return (
              <circle
                key={i}
                cx={energyX}
                cy={energyY}
                r="5"
                fill={effects.color}
                opacity="0.7"
              >
                <animate
                  attributeName="r"
                  values="5;8;5"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}
        </g>
      )}

      {/* Elite indicator */}
      {isElite && (
        <g>
          <text
            x={x}
            y={y - size * 2.5}
            textAnchor="middle"
            fontSize="20"
            fill="#ffaa00"
          >
            ⭐
          </text>
          <circle
            cx={x}
            cy={y}
            r={size * 1.5}
            fill="none"
            stroke="#ffaa00"
            strokeWidth="2"
            strokeDasharray="10,5"
            opacity="0.6"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${x} ${y}`}
              to={`360 ${x} ${y}`}
              dur="5s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}

      {/* Boss indicator */}
      {isBoss && (
        <g>
          <text
            x={x}
            y={y - size * 3}
            textAnchor="middle"
            fontSize="24"
            fill="#ff00ff"
          >
            👑
          </text>
          <circle
            cx={x}
            cy={y}
            r={size * 2}
            fill="none"
            stroke="#ff00ff"
            strokeWidth="3"
            opacity="0.8"
          >
            <animate
              attributeName="r"
              values={`${size * 2};${size * 2.5};${size * 2}`}
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;0.4;0.8"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}
    </g>
  );
};
