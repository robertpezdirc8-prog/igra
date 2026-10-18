import { useState } from 'react';
import { t, useLang } from '../i18n';

interface Upgrade {
  name: string;
  description: string;
  icon: string;
}

interface LevelUpScreenProps {
  upgrades: Upgrade[];
  onSelectUpgrade: (index: number) => void;
}

export function LevelUpScreen({ upgrades, onSelectUpgrade }: LevelUpScreenProps) {
  useLang();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      {/* Animated background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="absolute border-2 rounded-full"
            style={{
              width: `${300 + i * 100}px`,
              height: `${300 + i * 100}px`,
              borderColor: 'rgba(0, 255, 255, 0.1)',
              animation: `spin ${10 + i * 5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl w-[calc(100%-2rem)] mx-4 max-h-[92vh] overflow-y-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <h2
            className="text-5xl font-bold font-mono mb-2"
            style={{
              color: '#00ffff',
              textShadow: '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.4)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            {t('upgrade.title')}
          </h2>
          <p className="text-purple-400 font-mono text-sm">
            {t('levelup.subtitle')}
          </p>
        </div>

        {/* Upgrade cards */}
        <div className="flex gap-6 justify-center">
          {upgrades.map((upgrade, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <div
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectUpgrade(i)}
                className="relative cursor-pointer transition-all duration-300"
                style={{
                  transform: isHovered ? 'translateY(-10px) scale(1.05)' : 'translateY(0) scale(1)',
                }}
              >
                {/* Card */}
                <div
                  className="w-64 h-80 rounded-lg p-6 flex flex-col items-center justify-between border-2 transition-all duration-300"
                  style={{
                    background: isHovered
                      ? 'linear-gradient(180deg, rgba(0, 255, 255, 0.2) 0%, rgba(0, 100, 150, 0.1) 100%)'
                      : 'linear-gradient(180deg, rgba(20, 20, 40, 0.9) 0%, rgba(10, 10, 30, 0.9) 100%)',
                    borderColor: isHovered ? '#00ffff' : '#444488',
                    boxShadow: isHovered
                      ? '0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 20px rgba(0, 255, 255, 0.1)'
                      : '0 0 10px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {/* Icon */}
                  <div
                    className="text-6xl mb-4 transition-transform duration-300"
                    style={{
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                      filter: isHovered ? 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.8))' : 'none'
                    }}
                  >
                    {upgrade.icon}
                  </div>

                  {/* Name */}
                  <h3
                    className="text-xl font-bold font-mono text-center mb-2"
                    style={{
                      color: isHovered ? '#00ffff' : '#ffffff',
                      textShadow: isHovered ? '0 0 10px rgba(0, 255, 255, 0.6)' : 'none'
                    }}
                  >
                    {upgrade.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 font-mono text-sm text-center leading-relaxed">
                    {upgrade.description}
                  </p>

                  {/* Select indicator */}
                  {isHovered && (
                    <div
                      className="mt-4 text-cyan-400 font-mono text-sm font-bold"
                      style={{
                        animation: 'bounce 0.5s ease-in-out infinite'
                      }}
                    >
                      {t('levelup.select')}
                    </div>
                  )}
                </div>

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current opacity-50" 
                     style={{ borderColor: isHovered ? '#00ffff' : '#444488' }} />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-50"
                     style={{ borderColor: isHovered ? '#00ffff' : '#444488' }} />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-50"
                     style={{ borderColor: isHovered ? '#00ffff' : '#444488' }} />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-50"
                     style={{ borderColor: isHovered ? '#00ffff' : '#444488' }} />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
