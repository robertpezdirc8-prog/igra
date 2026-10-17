import { useEffect, useRef, useState } from 'react';
import { ClassicArcadeEngine, ClassicGameState } from '../game/classicArcadeEngine';

interface ClassicArcadeModeProps {
  /** Called when the player wants to return to the main game menu. */
  onExit: () => void;
}

/**
 * KLASIČNI ARKADNI NAČIN (merged from webgpu-online-games-51d72).
 *
 * Standalone vertical-scroller arcade mode (Galaga-style: lives, stages,
 * boss fights) powered by ClassicArcadeEngine. Rendered fullscreen on top
 * of the main game; `onExit` returns the player to the main menu.
 */
export function ClassicArcadeMode({ onExit }: ClassicArcadeModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ClassicArcadeEngine | null>(null);
  const [gameState, setGameState] = useState<ClassicGameState>('menu');
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new ClassicArcadeEngine(canvas, setGameState);
    engineRef.current = engine;

    const resize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    let lastTime = performance.now();
    let animFrame = 0;

    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      engine.update(deltaTime);
      engine.render();

      // Mirror engine state into React UI
      setScore(engine.getScore());
      setStage(engine.getStage());

      animFrame = requestAnimationFrame(gameLoop);
    };

    animFrame = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrame);
      engine.destroy();
    };
  }, []);

  const handleStartGame = () => {
    engineRef.current?.startGame();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Exit button — below the canvas-drawn HUD (top-right) */}
      <button
        onClick={onExit}
        className="absolute top-16 right-3 z-50 px-3 py-2 rounded border border-red-500/60 bg-black/70 text-red-400 font-mono text-xs hover:bg-red-950/70 hover:text-red-300 transition-colors"
        aria-label="Zapri arkadni način"
      >
        ✕ IZHOD
      </button>

      {/* Menu Screen */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-40">
          <div className="text-center px-4">
            <h1
              className="text-4xl sm:text-6xl font-bold font-mono mb-2 text-cyan-400"
              style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.8)' }}
            >
              ATHERIA
            </h1>
            <h2
              className="text-2xl sm:text-3xl font-bold font-mono mb-4 text-purple-400"
              style={{ textShadow: '0 0 15px rgba(255, 0, 255, 0.6)' }}
            >
              ARKADNI NAČIN
            </h2>
            <p className="text-gray-400 font-mono text-sm mb-8">
              Klasični arkadni vertical shooter — življenja, stopnje, bossi
            </p>
            <button
              onClick={handleStartGame}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-mono font-bold text-xl rounded transition-all hover:scale-110"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
            >
              ZAČNI IGRO
            </button>
            <div className="mt-8 text-gray-500 font-mono text-xs space-y-1">
              <p>WASD/Puščice = Premikanje</p>
              <p>Miška/Space = Streljanje</p>
              <p>B = Bomba</p>
              <p>ESC = Pavza</p>
            </div>
          </div>
        </div>
      )}

      {/* Pause Screen */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="text-center">
            <h2
              className="text-5xl font-bold font-mono mb-8 text-yellow-400"
              style={{ textShadow: '0 0 20px rgba(255, 255, 0, 0.8)' }}
            >
              PAVZA
            </h2>
            <p className="text-gray-400 font-mono text-lg">
              Pritisni ESC za nadaljevanje
            </p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-40">
          <div className="text-center px-4">
            <h2
              className="text-5xl sm:text-6xl font-bold font-mono mb-4 text-red-500"
              style={{ textShadow: '0 0 30px rgba(255, 0, 0, 0.8)' }}
            >
              KONEC IGRE
            </h2>
            <p className="text-2xl sm:text-3xl font-mono text-white mb-2">
              Končni rezultat: {score}
            </p>
            <p className="text-xl font-mono text-gray-400 mb-8">
              Dosežena stopnja: {stage}
            </p>
            <button
              onClick={handleStartGame}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xl rounded transition-all hover:scale-110"
              style={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)' }}
            >
              IGRAJ ZNOVA
            </button>
          </div>
        </div>
      )}

      {/* Stage Clear Screen */}
      {gameState === 'stageclear' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="text-center">
            <h2
              className="text-5xl sm:text-6xl font-bold font-mono mb-4 text-green-400"
              style={{ textShadow: '0 0 30px rgba(0, 255, 0, 0.8)' }}
            >
              STOPNJA JASENA!
            </h2>
            <p className="text-3xl font-mono text-white mb-2">
              Rezultat: {score}
            </p>
            <p className="text-xl font-mono text-gray-400">
              Priprava na naslednji stage...
            </p>
          </div>
        </div>
      )}

      {/* HUD riše že ClassicArcadeEngine neposredno na canvas (SCORE/LIVES/STAGE),
          zato React HUD ni potreben — le opozorilo za boss fight: */}

      {/* CRT scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none z-20 opacity-[0.03]"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
        }}
      />
    </div>
  );
}
