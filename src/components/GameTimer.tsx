import { useEffect, useState } from 'react';

interface GameTimerProps {
  startTime: number;
  isPaused: boolean;
}

export function GameTimer({ startTime, isPaused }: GameTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, isPaused]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30">
      <div className="bg-black/60 border border-cyan-400/30 rounded-lg px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 font-mono text-xs">ČAS</span>
          <span className="text-cyan-400 font-mono font-bold text-lg">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}
