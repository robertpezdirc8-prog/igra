import { t, useLang, localeTag } from '../i18n';

interface ScoreDisplayProps {
  score: number;
  wave: number;
  combo: number;
  grazeCount: number;
  fps: number;
  seed: string;
  webgpuSupported: boolean;
}

export function ScoreDisplay({ score, wave, combo, grazeCount, fps, seed, webgpuSupported }: ScoreDisplayProps) {
  useLang();
  return (
    <div className="fixed top-4 right-4 z-30 text-right">
      {/* Score */}
      <div className="mb-4">
        <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">{t('score.label')}</p>
        <p
          className="text-3xl font-bold font-mono"
          style={{
            color: '#00ffff',
            textShadow: '0 0 15px rgba(0, 255, 255, 0.6)'
          }}
        >
          {score.toLocaleString(localeTag())}
        </p>
      </div>

      {/* Wave */}
      <div className="mb-4">
        <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">{t('score.wave')}</p>
        <p
          className="text-2xl font-bold font-mono"
          style={{
            color: '#ff8800',
            textShadow: '0 0 10px rgba(255, 136, 0, 0.6)'
          }}
        >
          {wave}
        </p>
      </div>

      {/* Combo */}
      {combo > 1 && (
        <div className="mb-4 animate-pulse">
          <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">{t('score.combo')}</p>
          <p
            className="text-2xl font-bold font-mono"
            style={{
              color: '#ffaa00',
              textShadow: '0 0 15px rgba(255, 170, 0, 0.8)'
            }}
          >
            {combo}x
          </p>
        </div>
      )}

      {/* Graze: live risk/reward counter (purple = graze identity color) */}
      {grazeCount > 0 && (
        <div className="mb-4">
          <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">{t('score.graze')}</p>
          <p
            className="text-xl font-bold font-mono"
            style={{
              color: '#cc99ff',
              textShadow: '0 0 10px rgba(204, 153, 255, 0.6)'
            }}
          >
            {grazeCount.toLocaleString(localeTag())}
          </p>
        </div>
      )}

      {/* Technical info */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <p className="text-gray-600 font-mono text-xs">
          {t('score.fps')} <span className={fps >= 50 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>{fps}</span>
        </p>
        <p className="text-gray-600 font-mono text-xs mt-1">
          {t('score.seed')} <span className="text-gray-400">{seed}</span>
        </p>
        <p className="text-gray-600 font-mono text-xs mt-1">
          {webgpuSupported ? (
            <span className="text-green-400">{t('score.webgpu')}</span>
          ) : (
            <span className="text-yellow-400">{t('score.canvas')}</span>
          )}
        </p>
      </div>
    </div>
  );
}
