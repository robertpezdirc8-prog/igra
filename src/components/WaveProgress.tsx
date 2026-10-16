interface WaveProgressProps {
  currentWave: number;
  enemiesRemaining: number;
  totalEnemies: number;
  isBossWave: boolean;
}

export function WaveProgress({ currentWave, enemiesRemaining, totalEnemies, isBossWave }: WaveProgressProps) {
  const progress = ((totalEnemies - enemiesRemaining) / totalEnemies) * 100;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 w-96">
      <div className="bg-black/60 border border-cyan-400/30 rounded-lg p-3 backdrop-blur-sm">
        {/* Wave title */}
        <div className="flex items-center justify-between mb-2">
          <p
            className="font-mono text-sm font-bold"
            style={{
              color: isBossWave ? '#ff00ff' : '#00ffff',
              textShadow: isBossWave
                ? '0 0 10px rgba(255, 0, 255, 0.6)'
                : '0 0 10px rgba(0, 255, 255, 0.6)'
            }}
          >
            {isBossWave ? '⚠ BOSS VAL' : `VAL ${currentWave}`}
          </p>
          <p className="text-gray-400 font-mono text-xs">
            {enemiesRemaining} / {totalEnemies}
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: isBossWave
                ? 'linear-gradient(90deg, #ff00ff 0%, #ff44ff 100%)'
                : 'linear-gradient(90deg, #00ffff 0%, #00aaff 100%)',
              boxShadow: isBossWave
                ? '0 0 10px rgba(255, 0, 255, 0.8)'
                : '0 0 10px rgba(0, 255, 255, 0.8)'
            }}
          />
          
          {/* Shine effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
            }}
          />
        </div>

        {/* Boss warning */}
        {isBossWave && enemiesRemaining === 1 && (
          <div className="mt-2 text-center">
            <p
              className="text-red-400 font-mono text-xs font-bold animate-pulse"
              style={{ textShadow: '0 0 10px rgba(255, 0, 0, 0.8)' }}
            >
              ⚠ ŠEF SE BORII ⚠
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
