interface WaveInfoProps {
  wave: number;
  enemiesRemaining: number;
  totalEnemies: number;
  isBossWave: boolean;
}

export function WaveInfo({ wave, enemiesRemaining, totalEnemies, isBossWave }: WaveInfoProps) {
  const progress = ((totalEnemies - enemiesRemaining) / totalEnemies) * 100;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30">
      <div className="bg-black/60 border border-cyan-400/30 rounded-lg p-3 backdrop-blur-sm min-w-[200px]">
        {/* Wave number */}
        <div className="text-center mb-2">
          <p className="text-gray-400 font-mono text-xs uppercase tracking-wider">
            {isBossWave ? '⚠️ Boss Val' : 'Val'}
          </p>
          <p
            className={`text-2xl font-bold font-mono ${
              isBossWave ? 'text-red-400' : 'text-cyan-400'
            }`}
            style={{
              textShadow: isBossWave
                ? '0 0 15px rgba(255, 0, 0, 0.8)'
                : '0 0 15px rgba(0, 255, 255, 0.8)'
            }}
          >
            {wave}
          </p>
        </div>

        {/* Enemies remaining */}
        <div className="mb-2">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-gray-400">Sovražniki</span>
            <span className="text-white">{enemiesRemaining}/{totalEnemies}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Boss warning */}
        {isBossWave && (
          <div className="text-center mt-2 animate-pulse">
            <p className="text-red-400 font-mono text-xs font-bold">
              ⚠️ BOSS PRISTAJA ⚠️
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
