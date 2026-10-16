import { useState, useEffect } from 'react';
import { Button } from './Button';

interface MainMenuProps {
  onStartGame: () => void;
  onShowTutorial: () => void;
  onShowSettings: () => void;
  highScore: number;
  webgpuSupported: boolean;
}

export function MainMenu({ onStartGame, onShowTutorial, onShowSettings, highScore, webgpuSupported }: MainMenuProps) {
  const [titleGlow, setTitleGlow] = useState(0);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleGlow((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => {
        const newParticles = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.02
          }))
          .filter((p) => p.life > 0);

        // Add new particles
        if (newParticles.length < 50) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 200 + Math.random() * 100;
          newParticles.push({
            x: window.innerWidth / 2 + Math.cos(angle) * dist,
            y: window.innerHeight / 2 + Math.sin(angle) * dist,
            vx: -Math.cos(angle) * 2,
            vy: -Math.sin(angle) * 2,
            life: 1
          });
        }

        return newParticles;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black/95">
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: p.x,
              top: p.y,
              backgroundColor: i % 2 === 0 ? '#00ffff' : '#ff00ff',
              opacity: p.life,
              boxShadow: `0 0 10px ${i % 2 === 0 ? '#00ffff' : '#ff00ff'}`
            }}
          />
        ))}
      </div>

      {/* Animated rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="absolute border-2 rounded-full"
            style={{
              width: `${200 + i * 80}px`,
              height: `${200 + i * 80}px`,
              borderColor: i % 2 === 0 ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255, 0, 255, 0.1)',
              animation: `spin ${10 + i * 2}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-12 text-center">
        <h1
          className="text-7xl font-bold font-mono mb-2"
          style={{
            color: '#00ffff',
            textShadow: `0 0 ${20 + Math.sin(titleGlow * 0.05) * 10}px rgba(0, 255, 255, 0.8), 0 0 ${40 + Math.sin(titleGlow * 0.05) * 20}px rgba(0, 255, 255, 0.4)`
          }}
        >
          ATHERIA
        </h1>
        <p
          className="text-3xl font-mono"
          style={{
            color: '#ff00ff',
            textShadow: `0 0 ${15 + Math.sin(titleGlow * 0.05 + 1) * 8}px rgba(255, 0, 255, 0.6)`
          }}
        >
          VOID BREAKER
        </p>
        <p className="text-gray-500 font-mono text-sm mt-4">
          WebGPU Cosmic-Horror Rogue-Lite
        </p>
      </div>

      {/* Menu buttons */}
      <div className="relative z-10 flex flex-col gap-4 w-64">
        <Button onClick={onStartGame} variant="primary" size="large" className="w-full">
          ZAČNI IGRO
        </Button>
        <Button onClick={onShowTutorial} variant="secondary" size="medium" className="w-full">
          VODNIK
        </Button>
        <Button onClick={onShowSettings} variant="secondary" size="medium" className="w-full">
          NASTAVITVE
        </Button>
      </div>

      {/* High score */}
      {highScore > 0 && (
        <div className="relative z-10 mt-8 text-center">
          <p className="text-yellow-400 font-mono text-sm">NAJBOLJŠI REZULTAT</p>
          <p
            className="text-2xl font-bold font-mono"
            style={{
              color: '#ffaa00',
              textShadow: '0 0 10px rgba(255, 170, 0, 0.6)'
            }}
          >
            {highScore.toLocaleString()}
          </p>
        </div>
      )}

      {/* WebGPU status */}
      <div className="relative z-10 mt-8">
        <div
          className={`px-4 py-2 rounded-full font-mono text-xs ${
            webgpuSupported ? 'bg-green-500/20 border border-green-400 text-green-400' : 'bg-yellow-500/20 border border-yellow-400 text-yellow-400'
          }`}
        >
          {webgpuSupported ? '● WebGPU AKTIVEN' : '● Canvas2D NAČIN'}
        </div>
      </div>

      {/* Controls hint */}
      <div className="relative z-10 mt-8 text-center">
        <p className="text-gray-600 font-mono text-xs">
          WASD = Gibanje | Miška = Streljanje | SPACE = Dash | ESC = Pavza
        </p>
      </div>
    </div>
  );
}
