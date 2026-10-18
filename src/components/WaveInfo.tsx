import { t, useLang } from '../i18n';

interface WaveInfoProps {
  wave: number;
  enemiesRemaining: number;
  totalEnemies: number;
  isBossWave: boolean;
  /** Touch layout: one horizontal strip instead of a tall card —
   *  leaves the top playfield clear on phones in both orientations. */
  compact?: boolean;
}

export function WaveInfo({ wave, enemiesRemaining, totalEnemies, isBossWave, compact }: WaveInfoProps) {
  useLang();
  const progress = totalEnemies > 0
    ? ((totalEnemies - enemiesRemaining) / totalEnemies) * 100
    : 0;

  if (compact) {
    return (
      <div className="fixed top-[100px] left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div
          className={`bg-black/60 border rounded-lg px-2.5 py-1.5 backdrop-blur-sm flex items-center gap-2 min-w-[168px] ${
            isBossWave ? 'border-red-400/60' : 'border-cyan-400/30'
          }`}
        >
          <span
            className={`font-mono font-bold text-sm leading-none ${
              isBossWave ? 'text-red-400' : 'text-cyan-400'
            }`}
            style={{
              textShadow: isBossWave
                ? '0 0 12px rgba(255,0,0,0.8)'
                : '0 0 12px rgba(0,255,255,0.8)'
            }}
          >
            {isBossWave ? '⚠' : ''} {t('hud.waveN', { n: wave })}
          </span>
          {/* wave-clear progress */}
          <span className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <span
              className="block h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </span>
          <span className="font-mono text-[10px] text-gray-300 leading-none whitespace-nowrap">
            {enemiesRemaining}/{totalEnemies}
          </span>
        </div>
        {isBossWave && (
          <p className="text-center text-red-400 font-mono text-[10px] font-bold animate-pulse mt-1">
            ⚠️ BOSS PRISTAJA ⚠️
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30">
      <div className="bg-black/60 border border-cyan-400/30 rounded-lg p-3 backdrop-blur-sm min-w-[200px]">
        {/* Wave number */}
        <div className="text-center mb-2">
          <p className="text-gray-400 font-mono text-xs uppercase tracking-wider">
            {isBossWave ? t('hud.waveBoss') : t('hud.waveLabel')}
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
            <span className="text-gray-400">{t('hud.enemies')}</span>
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
