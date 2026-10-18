import { useEffect, useRef, useState, useCallback } from 'react';
import { ClassicArcadeEngine, ClassicGameState } from '../game/classicArcadeEngine';
import {
  ArcadeHighScoreEntry,
  getArcadeHighScores,
  isArcadeHighScore,
  getArcadeHighScoreRank,
  addArcadeHighScore
} from '../game/arcadeHighScores';

interface ClassicArcadeModeProps {
  /** Called when the player wants to return to the main game menu. */
  onExit: () => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/**
 * KLASIČNI ARKADNI NAČIN (merged from webgpu-online-games-51d72).
 *
 * Standalone vertical-scroller arcade mode (Galaga-style: lives, stages,
 * boss fights) powered by ClassicArcadeEngine. Rendered fullscreen on top
 * of the main game; `onExit` returns the player to the main menu.
 *
 * Game over on a top-10 score opens the classic arcade ritual: a 3-letter
 * initials roller (▲▼ per slot, keyboard A-Z works too), then the
 * hall-of-fame table with the fresh entry blinking.
 */
export function ClassicArcadeMode({ onExit }: ClassicArcadeModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ClassicArcadeEngine | null>(null);
  const [gameState, setGameState] = useState<ClassicGameState>('menu');
  const [score, setScore] = useState(0);
  const [stage, setStage] = useState(1);

  // High-score flow: 'initials' → 'table'; 'none' = plain game over
  const [hsPhase, setHsPhase] = useState<'none' | 'initials' | 'table'>('none');
  const [hsRank, setHsRank] = useState(0); // 1-based rank earned this run
  const [hsTable, setHsTable] = useState<ArcadeHighScoreEntry[]>(() => getArcadeHighScores());
  const [initials, setInitials] = useState<string[]>(['A', 'A', 'A']);
  const [activeSlot, setActiveSlot] = useState(0);
  // Blink ticker for the fresh table row (re-render ~2 Hz is plenty)
  const [blinkOn, setBlinkOn] = useState(true);

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

  // Arcade ritual begins: freeze the run's score the moment 'gameover'
  // hits and decide whether it earns a hall-of-fame slot.
  useEffect(() => {
    if (gameState !== 'gameover') return;
    const finalScore = engineRef.current?.getScore() ?? 0;
    if (isArcadeHighScore(finalScore)) {
      setHsRank(getArcadeHighScoreRank(finalScore));
      setInitials(['A', 'A', 'A']);
      setActiveSlot(0);
      setHsPhase('initials');
    } else {
      setHsPhase('none');
    }
  }, [gameState]);

  // The table lives in one place: initialized on mount, refreshed by
  // addArcadeHighScore's return value whenever a run earns a slot. The
  // menu only shows pre-first-run anyway (onExit unmounts this whole
  // component), so no effect-driven refresh is needed.

  // Blink ticker while the table is on screen
  useEffect(() => {
    if (hsPhase !== 'table') return;
    const id = setInterval(() => setBlinkOn(v => !v), 450);
    return () => clearInterval(id);
  }, [hsPhase]);

  const cycleLetter = useCallback((slot: number, dir: 1 | -1) => {
    setInitials(prev => {
      const next = [...prev];
      const idx = ALPHABET.indexOf(next[slot]);
      next[slot] = ALPHABET[(idx + dir + ALPHABET.length) % ALPHABET.length];
      return next;
    });
  }, []);

  const confirmEntry = useCallback(() => {
    const finalScore = engineRef.current?.getScore() ?? 0;
    const finalStage = engineRef.current?.getStage() ?? 1;
    setHsTable(addArcadeHighScore(initials.join(''), finalScore, finalStage));
    setHsPhase('table');
  }, [initials]);

  // Keyboard controls for the initials roller (A-Z types and advances)
  useEffect(() => {
    if (gameState !== 'gameover' || hsPhase !== 'initials') return;

    const onKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (/^[a-zA-Z]$/.test(key)) {
        setInitials(prev => {
          const next = [...prev];
          next[activeSlot] = key.toUpperCase();
          return next;
        });
        setActiveSlot(s => Math.min(2, s + 1));
        e.preventDefault();
      } else if (key === 'ArrowUp') {
        cycleLetter(activeSlot, 1);
        e.preventDefault();
      } else if (key === 'ArrowDown') {
        cycleLetter(activeSlot, -1);
        e.preventDefault();
      } else if (key === 'ArrowLeft') {
        setActiveSlot(s => Math.max(0, s - 1));
        e.preventDefault();
      } else if (key === 'ArrowRight') {
        setActiveSlot(s => Math.min(2, s + 1));
        e.preventDefault();
      } else if (key === 'Backspace') {
        setActiveSlot(s => Math.max(0, s - 1));
        e.preventDefault();
      } else if (key === 'Enter' || key === ' ') {
        if (activeSlot < 2) {
          setActiveSlot(s => s + 1);
        } else {
          confirmEntry();
        }
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, hsPhase, activeSlot, cycleLetter, confirmEntry]);

  const handleStartGame = () => {
    setHsPhase('none');
    engineRef.current?.startGame();
  };

  const topFive = hsTable.slice(0, 5);

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
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-40 overflow-y-auto">
          <div className="text-center px-4 py-8">
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
            <p className="text-gray-400 font-mono text-sm mb-6">
              Klasični arkadni vertical shooter — življenja, stopnje, bossi
            </p>
            <button
              onClick={handleStartGame}
              className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white font-mono font-bold text-xl rounded transition-all hover:scale-110"
              style={{ boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)' }}
            >
              ZAČNI IGRO
            </button>

            {/* Attract-mode hall of fame (top 5) */}
            <div className="mt-8 mb-6">
              <p className="text-yellow-400 font-mono text-sm mb-3 tracking-widest">
                ★ NAJBOLJŠI REZULTATI ★
              </p>
              <div className="inline-block text-left">
                {topFive.map((entry, i) => (
                  <div key={i} className="flex gap-4 font-mono text-sm leading-6">
                    <span className="text-gray-500 w-6 text-right">{i + 1}.</span>
                    <span className="text-cyan-300 w-12">{entry.initials}</span>
                    <span className="text-white tabular-nums">
                      {entry.score.toLocaleString('sl-SI')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-gray-500 font-mono text-xs space-y-1">
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

      {/* Game Over — initials ritual (score made the top 10) */}
      {gameState === 'gameover' && hsPhase === 'initials' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-40">
          <div className="text-center px-4">
            <p
              className="text-3xl sm:text-4xl font-bold font-mono mb-1 text-yellow-400"
              style={{ textShadow: '0 0 20px rgba(255, 255, 0, 0.8)' }}
            >
              ★ NOV REKORD ★
            </p>
            <p className="text-lg font-mono text-cyan-300 mb-4">
              {hsRank}. MESTO MED NAJBOLJŠIMI
            </p>
            <p className="text-4xl sm:text-5xl font-mono text-white mb-8 tabular-nums">
              {score.toLocaleString('sl-SI')}
            </p>

            {/* 3-letter roller — classic cabinet style */}
            <div className="flex justify-center gap-3 sm:gap-6 mb-6">
              {initials.map((letter, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center rounded-lg border-2 px-3 py-2 sm:px-5 sm:py-3 ${
                    activeSlot === i
                      ? 'border-cyan-400 bg-cyan-950/40'
                      : 'border-gray-700 bg-gray-950/60'
                  }`}
                >
                  <button
                    onClick={() => cycleLetter(i, 1)}
                    className={`text-cyan-400 font-mono text-lg px-3 py-1 ${
                      activeSlot === i ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    aria-label={`Črka ${i + 1} naprej`}
                  >
                    ▲
                  </button>
                  <span
                    className={`text-5xl sm:text-6xl font-bold font-mono w-[1.2em] text-center ${
                      activeSlot === i ? 'text-cyan-300' : 'text-gray-500'
                    }`}
                    style={
                      activeSlot === i
                        ? { textShadow: '0 0 15px rgba(0, 255, 255, 0.8)' }
                        : undefined
                    }
                  >
                    {letter}
                  </span>
                  <button
                    onClick={() => cycleLetter(i, -1)}
                    className={`text-cyan-400 font-mono text-lg px-3 py-1 ${
                      activeSlot === i ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    aria-label={`Črka ${i + 1} nazaj`}
                  >
                    ▼
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-3">
              {activeSlot > 0 && (
                <button
                  onClick={() => setActiveSlot(s => Math.max(0, s - 1))}
                  className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-sm rounded border border-gray-600"
                >
                  ◀ NAZAJ
                </button>
              )}
              {activeSlot < 2 ? (
                <button
                  onClick={() => setActiveSlot(s => Math.min(2, s + 1))}
                  className="px-5 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-sm rounded border border-gray-600"
                >
                  NAPREJ ▶
                </button>
              ) : (
                <button
                  onClick={confirmEntry}
                  className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-mono font-bold text-sm rounded transition-all hover:scale-105"
                  style={{ boxShadow: '0 0 15px rgba(255, 255, 0, 0.5)' }}
                >
                  VPISI ▶
                </button>
              )}
            </div>

            <p className="text-gray-600 font-mono text-xs mt-6">
              Tipkaj črke (A–Z) ali uporabi puščice • ENTER = vpis
            </p>
          </div>
        </div>
      )}

      {/* Game Over — hall of fame table */}
      {gameState === 'gameover' && hsPhase === 'table' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-40 overflow-y-auto">
          <div className="text-center px-4 py-8">
            <h2
              className="text-4xl sm:text-5xl font-bold font-mono mb-1 text-red-500"
              style={{ textShadow: '0 0 30px rgba(255, 0, 0, 0.8)' }}
            >
              KONEC IGRE
            </h2>
            <p className="text-xl font-mono text-yellow-400 mb-6">
              Rezultat vpisan na {hsRank}. mesto
            </p>

            <div className="inline-block text-left mb-8 min-w-[260px]">
              <div className="grid grid-cols-[2rem_3.5rem_1fr_3.5rem] gap-x-3 font-mono text-sm leading-7">
                <span className="text-gray-500">#</span>
                <span className="text-cyan-400">IME</span>
                <span className="text-cyan-400 text-right">REZULTAT</span>
                <span className="text-cyan-400 text-right">STG</span>
                {hsTable.map((entry, i) => {
                  const isNew = i === hsRank - 1;
                  return (
                    <div key={i} className="contents">
                      <span className={`${isNew && blinkOn ? 'text-yellow-300' : 'text-gray-500'}`}>
                        {i + 1}.
                      </span>
                      <span className={`${isNew ? 'font-bold text-yellow-300' : 'text-cyan-300'}`}>
                        {entry.initials}
                      </span>
                      <span
                        className={`text-right tabular-nums ${
                          isNew ? 'font-bold text-yellow-300' : 'text-white'
                        }`}
                      >
                        {entry.score.toLocaleString('sl-SI')}
                      </span>
                      <span className={`text-right ${isNew ? 'text-yellow-300' : 'text-gray-400'}`}>
                        {entry.stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleStartGame}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xl rounded transition-all hover:scale-110"
                style={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)' }}
              >
                IGRAJ ZNOVA
              </button>
              <button
                onClick={onExit}
                className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-lg rounded border border-gray-600"
              >
                GLAVNI MENI
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over — plain (score missed the top 10) */}
      {gameState === 'gameover' && hsPhase === 'none' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-40">
          <div className="text-center px-4">
            <h2
              className="text-5xl sm:text-6xl font-bold font-mono mb-4 text-red-500"
              style={{ textShadow: '0 0 30px rgba(255, 0, 0, 0.8)' }}
            >
              KONEC IGRE
            </h2>
            <p className="text-2xl sm:text-3xl font-mono text-white mb-2">
              Končni rezultat: {score.toLocaleString('sl-SI')}
            </p>
            <p className="text-xl font-mono text-gray-400 mb-2">
              Dosežena stopnja: {stage}
            </p>
            <p className="text-sm font-mono text-gray-500 mb-8">
              Najboljši rezultat: {hsTable[0]?.score.toLocaleString('sl-SI') ?? '—'} (
              {hsTable[0]?.initials ?? '—'})
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleStartGame}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xl rounded transition-all hover:scale-110"
                style={{ boxShadow: '0 0 20px rgba(255, 0, 0, 0.5)' }}
              >
                IGRAJ ZNOVA
              </button>
              <button
                onClick={onExit}
                className="px-6 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-lg rounded border border-gray-600"
              >
                GLAVNI MENI
              </button>
            </div>
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
              Rezultat: {score.toLocaleString('sl-SI')}
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
