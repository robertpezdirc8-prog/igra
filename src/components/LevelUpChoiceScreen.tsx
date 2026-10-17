import { useState } from 'react';
import { pseudoRandom } from '../utils/pseudoRandom';

interface LevelUpChoice {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LevelUpChoiceScreenProps {
  choices: LevelUpChoice[];
  onSelect: (choice: LevelUpChoice) => void;
  level: number;
}

export function LevelUpChoiceScreen({ choices, onSelect, level }: LevelUpChoiceScreenProps) {
  const [hoveredChoice, setHoveredChoice] = useState<string | null>(null);

  const getRarityColor = (rarity: LevelUpChoice['rarity']) => {
    switch (rarity) {
      case 'legendary': return { border: '#ffaa00', bg: 'rgba(255, 170, 0, 0.2)', glow: '0 0 30px rgba(255, 170, 0, 0.8)' };
      case 'epic': return { border: '#ff00ff', bg: 'rgba(255, 0, 255, 0.2)', glow: '0 0 30px rgba(255, 0, 255, 0.8)' };
      case 'rare': return { border: '#00aaff', bg: 'rgba(0, 170, 255, 0.2)', glow: '0 0 30px rgba(0, 170, 255, 0.8)' };
      default: return { border: '#888888', bg: 'rgba(136, 136, 136, 0.2)', glow: '0 0 20px rgba(136, 136, 136, 0.5)' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-pulse"
            style={{
              left: `${pseudoRandom(i * 4 + 11) * 100}%`,
              top: `${pseudoRandom(i * 4 + 12) * 100}%`,
              animationDelay: `${pseudoRandom(i * 4 + 13) * 2}s`,
              animationDuration: `${1 + pseudoRandom(i * 4 + 14) * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-5xl w-full mx-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h1
            className="text-5xl font-bold font-mono mb-2"
            style={{
              color: '#ffaa00',
              textShadow: '0 0 30px rgba(255, 170, 0, 0.8), 0 0 60px rgba(255, 170, 0, 0.4)',
              animation: 'levelUpTitle 1s ease-out'
            }}
          >
            LEVEL {level}
          </h1>
          <p className="text-yellow-400/70 font-mono text-lg">
            Izberi nadgradnjo
          </p>
        </div>

        {/* Choice cards */}
        <div className="flex gap-6 justify-center">
          {choices.map((choice) => {
            const colors = getRarityColor(choice.rarity);
            const isHovered = hoveredChoice === choice.id;

            return (
              <div
                key={choice.id}
                onMouseEnter={() => setHoveredChoice(choice.id)}
                onMouseLeave={() => setHoveredChoice(null)}
                onClick={() => onSelect(choice)}
                className="relative cursor-pointer transition-all duration-300"
                style={{
                  transform: isHovered ? 'translateY(-10px) scale(1.05)' : 'translateY(0) scale(1)',
                }}
              >
                {/* Card */}
                <div
                  className="w-64 h-80 rounded-lg p-6 flex flex-col items-center justify-between border-2 transition-all duration-300"
                  style={{
                    background: isHovered ? colors.bg : 'rgba(20, 20, 40, 0.9)',
                    borderColor: colors.border,
                    boxShadow: isHovered ? colors.glow : '0 0 10px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  {/* Rarity badge */}
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full font-mono text-xs font-bold uppercase"
                    style={{
                      background: colors.border,
                      color: '#000',
                      boxShadow: colors.glow
                    }}
                  >
                    {choice.rarity}
                  </div>

                  {/* Icon */}
                  <div
                    className="text-6xl mb-4 transition-transform duration-300"
                    style={{
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                      filter: isHovered ? `drop-shadow(0 0 20px ${colors.border})` : 'none'
                    }}
                  >
                    {choice.icon}
                  </div>

                  {/* Name */}
                  <h3
                    className="text-xl font-bold font-mono text-center mb-2"
                    style={{
                      color: colors.border,
                      textShadow: isHovered ? `0 0 10px ${colors.border}88` : 'none'
                    }}
                  >
                    {choice.name}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 font-mono text-sm text-center leading-relaxed">
                    {choice.description}
                  </p>

                  {/* Select indicator */}
                  {isHovered && (
                    <div
                      className="mt-4 font-mono text-sm font-bold"
                      style={{
                        color: colors.border,
                        animation: 'bounce 0.5s ease-in-out infinite'
                      }}
                    >
                      ▼ IZBERI ▼
                    </div>
                  )}
                </div>

                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 opacity-50" 
                     style={{ borderColor: colors.border }} />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 opacity-50"
                     style={{ borderColor: colors.border }} />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 opacity-50"
                     style={{ borderColor: colors.border }} />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 opacity-50"
                     style={{ borderColor: colors.border }} />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes levelUpTitle {
          0% { opacity: 0; transform: scale(0.5); }
          50% { transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
