import { DIFFICULTY_MODES, DifficultyMode, getDifficultyColor } from '../game/difficulty';
import { t, useLang } from '../i18n';

interface DifficultySelectUIProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (difficulty: DifficultyMode) => void;
  playerLevel: number;
  currentDifficulty: DifficultyMode | null;
}

export function DifficultySelectUI({ 
  isOpen, 
  onClose, 
  onSelect, 
  playerLevel,
  currentDifficulty
}: DifficultySelectUIProps) {
  useLang();
  if (!isOpen) return null;

  const availableDifficulties = DIFFICULTY_MODES.filter(d => d.unlockLevel <= playerLevel);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-[90vw] max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-red-900 to-black border-2 border-red-500 rounded-lg">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-red-600 to-orange-600 p-6">
          <h2 className="text-3xl font-bold font-mono text-white">
            {t('difficulty.title')}
          </h2>
          <p className="text-red-200 font-mono text-sm mt-1">
            {t('difficulty.subtitle')}
          </p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white font-mono rounded-full transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Difficulty list */}
        <div className="p-6 space-y-4">
          {availableDifficulties.map((difficulty) => {
            const isCurrent = currentDifficulty?.id === difficulty.id;
            const color = getDifficultyColor(difficulty);

            return (
              <div
                key={difficulty.id}
                className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer hover:scale-102 ${
                  isCurrent
                    ? 'bg-green-900/30 border-green-500'
                    : 'bg-black/60 hover:bg-black/80'
                }`}
                style={{
                  borderColor: isCurrent ? '#4ade80' : color
                }}
                onClick={() => onSelect(difficulty)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-5xl">{difficulty.icon}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className="text-2xl font-bold font-mono"
                        style={{ color }}
                      >
                        {t(`difficulty.name.${difficulty.id}`)}
                      </h3>
                      {isCurrent && (
                        <span className="px-3 py-1 bg-green-500/30 border border-green-500 rounded text-green-400 font-mono text-xs">
                          {t('difficulty.current')}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-300 font-mono text-sm mb-4">
                      {t(`difficulty.desc.${difficulty.id}`)}
                    </p>

                    {/* Multipliers */}
                    <div className="grid grid-cols-3 gap-4 text-xs font-mono">
                      <div>
                        <div className="text-gray-400 mb-1">{t('difficulty.enemies')}</div>
                        <div style={{ color }}>
                          {t('difficulty.hp')}: {Math.round(difficulty.enemyHpMultiplier * 100)}%
                          <br />
                          {t('difficulty.damage')}: {Math.round(difficulty.enemyDamageMultiplier * 100)}%
                          <br />
                          {t('difficulty.speed')}: {Math.round(difficulty.enemySpeedMultiplier * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">{t('difficulty.player')}</div>
                        <div style={{ color }}>
                          {t('difficulty.damage')}: {Math.round(difficulty.playerDamageMultiplier * 100)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">{t('difficulty.rewards')}</div>
                        <div style={{ color }}>
                          XP: {Math.round(difficulty.xpMultiplier * 100)}%
                          <br />
                          {t('difficulty.gold')}: {Math.round(difficulty.goldMultiplier * 100)}%
                          <br />
                          {t('difficulty.points')}: {Math.round(difficulty.scoreMultiplier * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative border */}
                <div
                  className="absolute top-0 right-0 w-2 h-full rounded-r"
                  style={{ background: color }}
                />
              </div>
            );
          })}

          {/* Locked difficulties */}
          {DIFFICULTY_MODES.filter(d => d.unlockLevel > playerLevel).length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-gray-500 font-mono text-sm mb-4">
                {t('difficulty.locked')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                {DIFFICULTY_MODES.filter(d => d.unlockLevel > playerLevel).map((difficulty) => (
                  <div
                    key={difficulty.id}
                    className="p-4 bg-black/40 border border-gray-700 rounded-lg opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🔒</span>
                      <div>
                        <div className="text-gray-400 font-mono font-bold">
                          {t(`difficulty.name.${difficulty.id}`)}
                        </div>
                        <div className="text-gray-500 font-mono text-xs">
                          {t('difficulty.unlockLevel', { level: difficulty.unlockLevel })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
