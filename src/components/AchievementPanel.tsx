interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

interface AchievementPanelProps {
  isOpen: boolean;
  achievements: Achievement[];
  onClose: () => void;
}

export function AchievementPanel({ isOpen, achievements, onClose }: AchievementPanelProps) {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progress = (unlockedCount / achievements.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900/95 border-2 border-yellow-400/50 rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2
          className="text-3xl font-bold text-yellow-400 font-mono mb-2 text-center"
          style={{ textShadow: '0 0 15px rgba(255, 170, 0, 0.5)' }}
        >
          DOSEŽKI
        </h2>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm font-mono mb-2">
            <span className="text-gray-400">Napredek</span>
            <span className="text-yellow-400">{unlockedCount} / {achievements.length}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all duration-500"
              style={{
                width: `${progress}%`,
                boxShadow: '0 0 10px rgba(255, 170, 0, 0.8)'
              }}
            />
          </div>
        </div>

        {/* Achievements grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`relative bg-black/40 border rounded-lg p-4 transition-all ${
                achievement.unlocked
                  ? 'border-yellow-400/50'
                  : 'border-gray-700 opacity-50'
              }`}
              style={{
                boxShadow: achievement.unlocked
                  ? '0 0 15px rgba(255, 170, 0, 0.3), inset 0 0 10px rgba(255, 170, 0, 0.1)'
                  : 'none'
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="text-3xl flex-shrink-0"
                  style={{
                    filter: achievement.unlocked
                      ? 'drop-shadow(0 0 10px rgba(255, 170, 0, 0.8))'
                      : 'grayscale(100%)'
                  }}
                >
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-mono text-sm font-bold mb-1 ${
                      achievement.unlocked ? 'text-yellow-400' : 'text-gray-500'
                    }`}
                  >
                    {achievement.title}
                  </h3>
                  <p className="text-gray-400 font-mono text-xs">
                    {achievement.description}
                  </p>
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-gray-600 font-mono text-xs mt-1">
                      Odklenjeno: {new Date(achievement.unlockedAt).toLocaleDateString('sl-SI')}
                    </p>
                  )}
                </div>
              </div>

              {/* Lock icon for locked achievements */}
              {!achievement.unlocked && (
                <div className="absolute top-2 right-2 text-gray-600">
                  🔒
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-yellow-500/20 border-2 border-yellow-400 text-yellow-400 font-mono uppercase tracking-wider hover:bg-yellow-500/30 hover:border-yellow-300 transition-all rounded"
        >
          ZAPRI
        </button>
      </div>
    </div>
  );
}
