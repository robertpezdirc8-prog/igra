import { useState, useEffect } from 'react';
import { t, useLang } from '../i18n';

interface ArcadeGameProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
}

export function ArcadeGame({ isOpen, onClose, onComplete }: ArcadeGameProps) {
  useLang();
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      resetGame();
    }
  }, [isOpen]);

  function resetGame() {
    setScore(0);
    setTimeLeft(30);
    setTargets([]);
    setIsPlaying(false);
    setGameOver(false);
  }

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, gameOver, score, onComplete]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    let targetId = 0; // monotonic — Date.now()+random() collided in the same ms
    const spawnInterval = setInterval(() => {
      setTargets((prev) => {
        const newTarget = {
          id: ++targetId,
          x: Math.random() * 80 + 10,
          y: Math.random() * 60 + 20,
          size: Math.random() * 30 + 30
        };
        return [...prev.slice(-5), newTarget];
      });
    }, 800);

    return () => clearInterval(spawnInterval);
  }, [isPlaying, gameOver]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const removeInterval = setInterval(() => {
      setTargets((prev) => prev.slice(1));
    }, 2000);

    return () => clearInterval(removeInterval);
  }, [isPlaying, gameOver]);

  // Fire onComplete once when the arcade run ends (not inside a state updater)
  useEffect(() => {
    if (gameOver) {
      onComplete(score);
    }
  }, [gameOver, score, onComplete]);

  const startGame = () => {
    resetGame();
    setIsPlaying(true);
  };

  const hitTarget = (id: number) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
    setScore((prev) => prev + 10);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
      <div className="relative w-[90vw] max-w-4xl h-[80vh] bg-gradient-to-br from-purple-900 to-black border-2 border-purple-500 rounded-lg overflow-hidden">
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-black/80 border-b-2 border-purple-500 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-bold font-mono text-purple-400">
              {t('menu.arcade')}
            </h2>
            {isPlaying && (
              <>
                <div className="text-xl font-mono text-yellow-400">
                  {t('arcade.points', { score })}
                </div>
                <div className={`text-xl font-mono ${timeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>
                  {t('arcade.time', { time: timeLeft })}
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-mono rounded transition-colors"
          >
            {t('arcade.close')}
          </button>
        </div>

        {/* Game area */}
        <div className="absolute top-16 left-0 right-0 bottom-0 bg-gradient-to-br from-purple-950 to-black overflow-hidden">
          {!isPlaying && !gameOver && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-4xl font-bold font-mono text-purple-400 mb-4">
                  {t('arcade.ready')}
                </h3>
                <p className="text-gray-400 font-mono mb-8">
                  {t('arcade.tapHint')}
                </p>
                <button
                  onClick={startGame}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono font-bold text-xl rounded-lg transition-all hover:scale-110"
                  style={{ boxShadow: '0 0 30px rgba(168, 85, 247, 0.5)' }}
                >
                  {t('menu.start')}
                </button>
              </div>
            </div>
          )}

          {isPlaying && (
            <div className="relative w-full h-full">
              {targets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => hitTarget(target.id)}
                  className="absolute rounded-full bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 transition-all hover:scale-110 animate-pulse"
                  style={{
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                    width: `${target.size}px`,
                    height: `${target.size}px`,
                    boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <span className="text-white font-bold text-2xl">🎯</span>
                </button>
              ))}
            </div>
          )}

          {gameOver && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-5xl font-bold font-mono text-yellow-400 mb-4">
                  {t('arcade.runOver')}
                </h3>
                <p className="text-3xl font-mono text-purple-400 mb-8">
                  {t('arcade.finalScore', { score })}
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={startGame}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-mono font-bold rounded-lg transition-all hover:scale-110"
                    style={{ boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)' }}
                  >
                    {t('arcade.playAgain')}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-mono font-bold rounded-lg transition-all hover:scale-110"
                    style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}
                  >
                    {t('arcade.close')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-500 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-500 blur-3xl" />
        </div>
      </div>
    </div>
  );
}
