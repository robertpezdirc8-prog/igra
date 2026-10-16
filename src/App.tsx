import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/engine';

type GameState = 'menu' | 'playing' | 'paused' | 'levelup' | 'gameover';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [showControls, setShowControls] = useState(false);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, handleStateChange);
    engineRef.current = engine;

    const resize = () => {
      engine.resize(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    engine.startLoop();
    engine.start();

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      engine.handleKeyDown(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engine.handleKeyUp(e.key);
    };
    const handleMouseMove = (e: MouseEvent) => {
      engine.handleMouseMove(e.clientX, e.clientY);
    };
    const handleMouseDown = (e: MouseEvent) => {
      engine.handleMouseDown();
      engine.handleClick(e.clientX, e.clientY);
    };
    const handleMouseUp = () => {
      engine.handleMouseUp();
    };
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      engine.handleMouseMove(touch.clientX, touch.clientY);
      engine.handleMouseDown();
      engine.handleClick(touch.clientX, touch.clientY);
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      engine.handleMouseMove(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = () => {
      engine.handleMouseUp();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      engine.destroy();
    };
  }, [handleStateChange]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        style={{ touchAction: 'none' }}
      />
      
      {/* Pause Overlay */}
      {gameState === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-cyan-400 font-mono mb-4"
                style={{ textShadow: '0 0 20px #00ffff' }}>
              PAUSED
            </h2>
            <p className="text-white/60 font-mono text-sm">Press ESC to resume</p>
            <button
              onClick={() => setShowControls(!showControls)}
              className="mt-6 px-4 py-2 border border-cyan-400/50 text-cyan-400 font-mono text-sm
                         hover:bg-cyan-400/10 transition-colors rounded"
            >
              {showControls ? 'HIDE' : 'SHOW'} CONTROLS
            </button>
            {showControls && (
              <div className="mt-4 text-white/50 font-mono text-xs space-y-1">
                <p>WASD / Arrows — Move</p>
                <p>Mouse — Aim & Shoot</p>
                <p>Space — Dash (invincibility frames)</p>
                <p>ESC — Pause / Resume</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scanline effect */}
      <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03]"
           style={{
             background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
           }}
      />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-20"
           style={{
             background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)'
           }}
      />

      {/* Chromatic aberration border effect */}
      <div className="absolute inset-0 pointer-events-none z-20"
           style={{
             boxShadow: 'inset 0 0 100px rgba(0, 255, 255, 0.05), inset 0 0 200px rgba(255, 0, 255, 0.03)'
           }}
      />
    </div>
  );
}
