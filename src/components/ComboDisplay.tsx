import { useState, useEffect } from 'react';

interface ComboDisplayProps {
  combo: number;
  multiplier: number;
  maxCombo: number;
  isVisible: boolean;
}

export function ComboDisplay({ combo, multiplier, maxCombo, isVisible }: ComboDisplayProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (combo > 0) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 200);
      return () => clearTimeout(timer);
    }
  }, [combo]);

  if (!isVisible || combo === 0) return null;

  const getComboColor = () => {
    if (combo >= 50) return '#ff00ff';
    if (combo >= 30) return '#ff4444';
    if (combo >= 20) return '#ffaa00';
    if (combo >= 10) return '#ffff00';
    return '#00ffff';
  };

  const getComboGlow = () => {
    if (combo >= 50) return '0 0 30px rgba(255, 0, 255, 0.8), 0 0 60px rgba(255, 0, 255, 0.4)';
    if (combo >= 30) return '0 0 25px rgba(255, 68, 68, 0.8), 0 0 50px rgba(255, 68, 68, 0.4)';
    if (combo >= 20) return '0 0 20px rgba(255, 170, 0, 0.8), 0 0 40px rgba(255, 170, 0, 0.4)';
    if (combo >= 10) return '0 0 15px rgba(255, 255, 0, 0.8), 0 0 30px rgba(255, 255, 0, 0.4)';
    return '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.4)';
  };

  return (
    <div className="fixed top-32 right-4 z-30">
      <div
        className={`bg-black/80 border-2 rounded-lg p-4 backdrop-blur-sm transition-all ${
          animate ? 'scale-110' : 'scale-100'
        }`}
        style={{
          borderColor: getComboColor(),
          boxShadow: getComboGlow()
        }}
      >
        <div className="text-center">
          <div className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-1">
            Combo
          </div>
          <div
            className={`text-5xl font-bold font-mono ${animate ? 'animate-bounce' : ''}`}
            style={{
              color: getComboColor(),
              textShadow: getComboGlow()
            }}
          >
            {combo}x
          </div>
          <div className="text-gray-300 font-mono text-sm mt-2">
            Multiplier: <span style={{ color: getComboColor() }}>{multiplier.toFixed(1)}x</span>
          </div>
          {maxCombo > 0 && (
            <div className="text-gray-500 font-mono text-xs mt-1">
              Max: {maxCombo}x
            </div>
          )}
        </div>

        {/* Combo bar */}
        <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min((combo / 50) * 100, 100)}%`,
              background: `linear-gradient(90deg, ${getComboColor()}, ${getComboColor()}88)`,
              boxShadow: `0 0 10px ${getComboColor()}`
            }}
          />
        </div>
      </div>
    </div>
  );
}
