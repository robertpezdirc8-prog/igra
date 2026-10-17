import { useEffect, useState } from 'react';

interface LevelDisplayProps {
  level: number;
  xp: number;
  xpToNext: number;
}

export function LevelDisplay({ level, xp, xpToNext }: LevelDisplayProps) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);

  useEffect(() => {
    if (level > prevLevel) {
      const raf = requestAnimationFrame(() => {
        setShowLevelUp(true);
        setPrevLevel(level);
      });
      const timer = setTimeout(() => setShowLevelUp(false), 2000);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [level, prevLevel]);

  const xpPercentage = (xp / xpToNext) * 100;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30">
      <div className="bg-black/60 border-2 border-yellow-400/50 rounded-lg px-6 py-3 backdrop-blur-sm">
        {/* Level indicator */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-gray-400 font-mono text-xs uppercase tracking-wider">Nivo</p>
            <p
              className={`text-3xl font-bold font-mono ${showLevelUp ? 'animate-bounce' : ''}`}
              style={{
                color: '#ffaa00',
                textShadow: '0 0 15px rgba(255, 170, 0, 0.8)',
                animation: showLevelUp ? 'levelUpPulse 0.5s ease-out' : 'none'
              }}
            >
              {level}
            </p>
          </div>

          {/* XP Bar */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-gray-400">XP</span>
              <span className="text-yellow-400">{xp} / {xpToNext}</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-yellow-400/30">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 transition-all duration-300 relative"
                style={{
                  width: `${xpPercentage}%`,
                  boxShadow: '0 0 10px rgba(255, 170, 0, 0.8)'
                }}
              >
                {/* Shine effect */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Level up notification */}
        {showLevelUp && (
          <div
            className="absolute -top-12 left-1/2 -translate-x-1/2 text-center animate-fadeIn"
            style={{
              animation: 'levelUpNotification 2s ease-out forwards'
            }}
          >
            <p
              className="text-2xl font-bold font-mono"
              style={{
                color: '#ffaa00',
                textShadow: '0 0 20px rgba(255, 170, 0, 0.8), 0 0 40px rgba(255, 170, 0, 0.4)'
              }}
            >
              LEVEL UP!
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes levelUpPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes levelUpNotification {
          0% { opacity: 0; transform: translate(-50%, 20px); }
          20% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -20px); }
        }
      `}</style>
    </div>
  );
}
