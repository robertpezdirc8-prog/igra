import React, { useEffect, useState } from 'react';

interface BossHealthBarProps {
  bossName: string;
  currentHealth: number;
  maxHealth: number;
  currentPhase: number;
  maxPhases: number;
  phaseThresholds: number[];
  bossIcon?: string;
  phaseColors?: string[];
}

export const BossHealthBar: React.FC<BossHealthBarProps> = ({
  bossName,
  currentHealth,
  maxHealth,
  currentPhase,
  maxPhases,
  phaseThresholds,
  bossIcon = '💀',
  phaseColors = ['#ff4444', '#ff8800', '#ffaa00', '#ffff00', '#00ff00']
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousPhase, setPreviousPhase] = useState(currentPhase);

  const healthPercent = (currentHealth / maxHealth) * 100;
  const currentColor = phaseColors[currentPhase - 1] || phaseColors[0];

  useEffect(() => {
    if (currentPhase !== previousPhase) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPreviousPhase(currentPhase);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentPhase, previousPhase]);

  const getPhaseProgress = () => {
    if (currentPhase === 1) {
      return healthPercent;
    }
    
    const previousThreshold = phaseThresholds[currentPhase - 2] || 1;
    const currentThreshold = phaseThresholds[currentPhase - 1] || 0;
    
    const phaseStart = previousThreshold * 100;
    const phaseEnd = currentThreshold * 100;
    const phaseRange = phaseStart - phaseEnd;
    
    return ((healthPercent - phaseEnd) / phaseRange) * 100;
  };

  const phaseProgress = getPhaseProgress();

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 w-[600px] max-w-[90%] z-50">
      {/* Boss name and icon */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-pulse">{bossIcon}</span>
          <div>
            <div className="text-2xl font-bold" style={{ color: currentColor }}>
              {bossName}
            </div>
            <div className="text-sm text-gray-400">
              Faza {currentPhase} / {maxPhases}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold" style={{ color: currentColor }}>
            {Math.ceil(currentHealth)} / {maxHealth}
          </div>
          <div className="text-sm text-gray-400">
            {healthPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main health bar */}
      <div className="relative h-8 bg-gray-900 border-2 rounded-lg overflow-hidden"
           style={{ borderColor: currentColor }}>
        {/* Background segments for phases */}
        {phaseThresholds.map((threshold, index) => (
          <div
            key={index}
            className="absolute top-0 bottom-0 border-r"
            style={{
              left: `${threshold * 100}%`,
              borderColor: phaseColors[index] || phaseColors[0],
              opacity: 0.3
            }}
          />
        ))}

        {/* Health fill */}
        <div
          className="h-full transition-all duration-300 relative"
          style={{
            width: `${healthPercent}%`,
            background: `linear-gradient(90deg, ${currentColor}88, ${currentColor})`,
            boxShadow: `0 0 20px ${currentColor}, inset 0 0 10px ${currentColor}40`
          }}
        >
          {/* Animated shine effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)',
              animation: 'shine 2s ease-in-out infinite'
            }}
          />
        </div>

        {/* Phase transition effect */}
        {isTransitioning && (
          <div
            className="absolute inset-0 animate-ping"
            style={{
              backgroundColor: currentColor,
              opacity: 0.5
            }}
          />
        )}

        {/* Health text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-sm drop-shadow-lg">
            {healthPercent.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Phase indicators */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: maxPhases }, (_, i) => {
          const phase = i + 1;
          const isActive = phase <= currentPhase;
          const isCurrent = phase === currentPhase;
          const color = phaseColors[i] || phaseColors[0];

          return (
            <div
              key={i}
              className="flex flex-col items-center"
              style={{ flex: 1 }}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all ${
                  isCurrent ? 'scale-125' : ''
                }`}
                style={{
                  borderColor: color,
                  backgroundColor: isActive ? color + '40' : 'transparent',
                  color: isActive ? color : '#666',
                  boxShadow: isCurrent ? `0 0 15px ${color}` : 'none'
                }}
              >
                {phase}
              </div>
              <div
                className="text-xs mt-1 font-bold"
                style={{ color: isActive ? color : '#666' }}
              >
                Faza {phase}
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase transition warning */}
      {isTransitioning && (
        <div
          className="mt-2 text-center text-lg font-bold animate-pulse"
          style={{ color: currentColor }}
        >
          ⚠️ FAZA {currentPhase} AKTIVIRANA ⚠️
        </div>
      )}
    </div>
  );
};

// Boss phase info component
interface BossPhaseInfoProps {
  currentPhase: number;
  phaseName: string;
  phaseDescription: string;
  phaseIcon: string;
  color: string;
}

export const BossPhaseInfo: React.FC<BossPhaseInfoProps> = ({
  currentPhase,
  phaseName,
  phaseDescription,
  phaseIcon,
  color
}) => {
  return (
    <div
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 border-2 rounded-lg p-4 min-w-[300px] backdrop-blur-sm z-50"
      style={{
        borderColor: color,
        boxShadow: `0 0 20px ${color}40`
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-3xl animate-pulse">{phaseIcon}</span>
        <div>
          <div className="text-lg font-bold" style={{ color }}>
            Faza {currentPhase}: {phaseName}
          </div>
          <div className="text-sm text-gray-300">
            {phaseDescription}
          </div>
        </div>
      </div>
    </div>
  );
};

// Boss attack pattern indicator
interface BossAttackIndicatorProps {
  attackPattern: string;
  attackName: string;
  attackIcon: string;
  color: string;
  warning?: boolean;
}

export const BossAttackIndicator: React.FC<BossAttackIndicatorProps> = ({
  attackPattern,
  attackName,
  attackIcon,
  color,
  warning = false
}) => {
  return (
    <div
      className={`fixed top-32 left-1/2 transform -translate-x-1/2 bg-black/90 border-2 rounded-lg p-3 min-w-[250px] backdrop-blur-sm z-50 ${
        warning ? 'animate-pulse' : ''
      }`}
      style={{
        borderColor: warning ? '#ff0000' : color,
        boxShadow: warning ? '0 0 30px #ff0000' : `0 0 20px ${color}40`
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{attackIcon}</span>
        <div>
          <div className="text-sm font-bold" style={{ color: warning ? '#ff0000' : color }}>
            {warning ? '⚠️ OPOZORILO' : 'NAPAD'}
          </div>
          <div className="text-lg font-bold text-white">
            {attackName}
          </div>
        </div>
      </div>
    </div>
  );
};
