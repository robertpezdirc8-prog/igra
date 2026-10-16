import { useState, useEffect } from 'react';
import { Button } from './Button';

interface GameOverScreenProps {
  score: number;
  wave: number;
  enemiesKilled: number;
  totalDamage: number;
  survivalTime: number;
  maxCombo: number;
  seed: string;
  highScore: number;
  isNewHighScore: boolean;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function GameOverScreen({
  score,
  wave,
  enemiesKilled,
  totalDamage,
  survivalTime,
  maxCombo,
  seed,
  highScore,
  isNewHighScore,
  onRestart,
  onMainMenu
}: GameOverScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setShowStats(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const stats = [
    { label: 'Končni rezultat', value: score.toLocaleString(), color: '#00ffff' },
    { label: 'Val dosežen', value: wave.toString(), color: '#ff8800' },
    { label: 'Sovražniki ubiti', value: enemiesKilled.toString(), color: '#ff4444' },
    { label: 'Skupna škoda', value: Math.floor(totalDamage).toLocaleString(), color: '#ffff00' },
    { label: 'Čas preživetja', value: `${Math.floor(survivalTime)}s`, color: '#00ff88' },
    { label: 'Največji combo', value: `${maxCombo}x`, color: '#ff00ff' }
  ];

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center transition-all duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        background: 'radial-gradient(ellipse at center, rgba(20, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.98) 100%)'
      }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500 rounded-full animate-ping"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-2xl w-full mx-4">
        {/* Title */}
        <div className="text-center mb-8">
          <h1
            className="text-6xl font-bold font-mono mb-2"
            style={{
              color: '#ff0044',
              textShadow: '0 0 30px rgba(255, 0, 68, 0.8), 0 0 60px rgba(255, 0, 68, 0.4)',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            VOID CONSUMED
          </h1>
          <p className="text-gray-500 font-mono text-sm">Tvoja pot se je končala v praznini</p>
        </div>

        {/* New high score notification */}
        {isNewHighScore && (
          <div
            className="text-center mb-6 py-4 px-6 bg-yellow-500/20 border-2 border-yellow-400 rounded-lg"
            style={{
              animation: 'glow 1s ease-in-out infinite alternate'
            }}
          >
            <p
              className="text-2xl font-bold font-mono"
              style={{
                color: '#ffaa00',
                textShadow: '0 0 20px rgba(255, 170, 0, 0.8)'
              }}
            >
              ★ NOV NAJBOLJŠI REZULTAT ★
            </p>
          </div>
        )}

        {/* Stats grid */}
        {showStats && (
          <div
            className="bg-black/60 border-2 border-red-400/30 rounded-lg p-6 mb-6"
            style={{
              animation: 'fadeIn 0.5s ease-out'
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-gray-900/50 rounded p-3 border border-gray-700"
                  style={{
                    animation: `slideIn 0.3s ease-out ${i * 0.1}s both`
                  }}
                >
                  <p className="text-gray-500 font-mono text-xs mb-1">{stat.label}</p>
                  <p
                    className="text-xl font-bold font-mono"
                    style={{
                      color: stat.color,
                      textShadow: `0 0 10px ${stat.color}88`
                    }}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seed */}
        <div className="text-center mb-6">
          <p className="text-gray-500 font-mono text-xs mb-1">SEED</p>
          <p
            className="text-lg font-mono"
            style={{
              color: '#888',
              textShadow: '0 0 5px rgba(136, 136, 136, 0.5)'
            }}
          >
            {seed}
          </p>
          <p className="text-gray-600 font-mono text-xs mt-1">
            Deli ta seed s prijatelji za izziv!
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <Button onClick={onRestart} variant="primary" size="large" className="flex-1">
            POSKUSI ZNOVA
          </Button>
          <Button onClick={onMainMenu} variant="secondary" size="large" className="flex-1">
            GLAVNI MENI
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes glow {
          from { box-shadow: 0 0 10px rgba(255, 170, 0, 0.5); }
          to { box-shadow: 0 0 30px rgba(255, 170, 0, 0.8); }
        }
      `}</style>
    </div>
  );
}
