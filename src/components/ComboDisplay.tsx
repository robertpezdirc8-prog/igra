import { useEffect, useState } from 'react';

interface ComboDisplayProps {
  combo: number;
  multiplier: number;
}

export function ComboDisplay({ combo, multiplier }: ComboDisplayProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (combo > 1) {
      setIsVisible(true);
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 300);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [combo]);

  if (!isVisible) return null;

  const getComboColor = () => {
    if (combo >= 20) return 'text-red-400';
    if (combo >= 10) return 'text-purple-400';
    if (combo >= 5) return 'text-yellow-400';
    return 'text-cyan-400';
  };

  const getComboGlow = () => {
    if (combo >= 20) return '0 0 20px rgba(255, 0, 0, 0.8)';
    if (combo >= 10) return '0 0 20px rgba(255, 0, 255, 0.8)';
    if (combo >= 5) return '0 0 20px rgba(255, 255, 0, 0.8)';
    return '0 0 20px rgba(0, 255, 255, 0.8)';
  };

  return (
    <div className="fixed top-32 right-4 z-30">
      <div
        className={`bg-black/60 border-2 rounded-lg p-4 backdrop-blur-sm transition-all duration-300 ${
          animate ? 'scale-110' : 'scale-100'
        }`}
        style={{
          borderColor: combo >= 20 ? '#ff0000' : combo >= 10 ? '#ff00ff' : combo >= 5 ? '#ffff00' : '#00ffff',
          boxShadow: getComboGlow()
        }}
      >
        <div className="text-center">
          <p className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-1">
            Combo
          </p>
          <p
            className={`text-4xl font-bold font-mono ${getComboColor()}`}
            style={{
              textShadow: getComboGlow()
            }}
          >
            {combo}x
          </p>
          <p className="text-gray-400 font-mono text-xs mt-1">
            Multiplier: {multiplier.toFixed(1)}x
          </p>
        </div>

        {/* Combo bar */}
        <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.min((combo / 20) * 100, 100)}%`,
              background: combo >= 20
                ? 'linear-gradient(90deg, #ff0000, #ff4444)'
                : combo >= 10
                ? 'linear-gradient(90deg, #ff00ff, #ff44ff)'
                : combo >= 5
                ? 'linear-gradient(90deg, #ffff00, #ffff44)'
                : 'linear-gradient(90deg, #00ffff, #44ffff)'
            }}
          />
        </div>
      </div>
    </div>
  );
}
