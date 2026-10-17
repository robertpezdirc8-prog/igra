import { useEffect, useRef, useState } from 'react';
import { ClassicArcadeEngine, ClassicGameState } from './game/classicArcadeEngine';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ClassicArcadeEngine | null>(null);
  const [gameState, setGameState] = useState<ClassicGameState>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [stage, setStage] = useState(1);

  const handleStateChange = (state: ClassicGameState) => {
    setGameState(state);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new ClassicArcadeEngine(canvas, handleStateChange);
    engineRef.current = engine;

    const resize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    // Game loop
    let lastTime = performance.now();
    let animFrame = 0;

    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - lastTime) / 1000;
      lastTime = timestamp;

      engine.update(deltaTime);
      engine.render();

      // Update UI state
      setScore(engine.getScore());
      setLives(engine.getLives());
      setStage(engine.getStage());

      animFrame = requestAnimationFrame(gameLoop);
    };

    animFrame = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrame);
    };
  }, []);

  const handleStartGame = () => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Menu Screen */}
      {gameState === 'menu' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="text-center">
            <h1 
              className="text-6xl font-bold font-mono mb-4 text-cyan-400"
              style={{ textShadow: '0 0 20px rgba(0, 255, 255, 0.8)' }}
            >
              ATHERIA
            </h1>
            <h2 
              className="text-3xl font-bold font-mono mb-8 text-purple-400"
              style={{ textShadow: '0 0 15px rgba(255, 0, 255, 0.6)' }}
            >
              VOID BREAKER
            </h2>
            <p className="text-gray-400 font-mono text-sm mb-8">
              Klasični arkadni vertical shooter
            </p>
            <button
              onClick={handleStartGame}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-mono font-bold text-xl rounded transition-all hover:scale-110"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
            >
              ZAČNI IGRO
            </button>
            <div className="mt-8 text-gray-500 font-mono text-xs">
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="text-center">
            <h2 
              className="text-6xl font-bold font-mono mb-4 text-red-500"
              style={{ textShadow: '0 0 30px rgba(255, 0, 0, 0.8)' }}
            >
              KONEC IGRE
            </h2>
            <p className="text-3xl font-mono text-white mb-2">
              Končni rezultat: {score}
            </p>
            <p className="text-xl font-mono text-gray-400 mb-8">
              Dosežen stage: {stage}
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center">
            <h2 
              className="text-6xl font-bold font-mono mb-4 text-green-400"
              style={{ textShadow: '0 0 30px rgba(0, 255, 0, 0.8)' }}
            >
              STAGE CLEAR!
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

      {/* HUD */}
      {(gameState === 'playing' || gameState === 'bossfight') && (
        <div className="absolute top-0 left-0 right-0 p-4 pointer-events-none z-40">
          <div className="flex justify-between items-start">
            <div className="text-left">
              <div className="text-2xl font-mono font-bold text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>
                SCORE: {score}
              </div>
              <div className="text-lg font-mono text-yellow-400" style={{ textShadow: '0 0 10px rgba(255, 255, 0, 0.5)' }}>
                LIVES: {'❤️'.repeat(lives)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-bold text-cyan-400" style={{ textShadow: '0 0 10px rgba(0, 255, 255, 0.5)' }}>
                STAGE {stage}
              </div>
              {gameState === 'bossfight' && (
                <div className="text-lg font-mono text-red-400 animate-pulse" style={{ textShadow: '0 0 10px rgba(255, 0, 0, 0.8)' }}>
                  ⚠️ BOSS FIGHT ⚠️
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none z-30 opacity-[0.03]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
        }}
      />
    </div>
  );
}
