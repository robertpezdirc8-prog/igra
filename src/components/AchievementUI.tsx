import { useState, useEffect } from 'react';
import { Achievement } from '../game/achievements';

interface AchievementUIProps {
  achievements: Achievement[];
  unlockedIds: string[];
  onUnlock: (id: string) => void;
  playerStats: {
    level: number;
    totalXp: number;
    enemiesKilled: number;
    bossKills: number;
    maxCombo: number;
    wavesCompleted: number;
    totalDamage: number;
    survivalTime: number;
    highestWave: number;
  };
}

export function AchievementUI({ achievements, unlockedIds, onUnlock, playerStats }: AchievementUIProps) {
  const [showNotification, setShowNotification] = useState<Achievement | null>(null);

  useEffect(() => {
    // Check for newly unlocked achievements
    for (const achievement of achievements) {
      if (!unlockedIds.includes(achievement.id) && achievement.condition(playerStats)) {
        onUnlock(achievement.id);
        setShowNotification(achievement);
        
        // Hide notification after 3 seconds
        setTimeout(() => setShowNotification(null), 3000);
        break; // Show one at a time
      }
    }
  }, [playerStats, achievements, unlockedIds, onUnlock]);

  const unlockedCount = unlockedIds.length;
  const totalCount = achievements.length;
  const progress = (unlockedCount / totalCount) * 100;

  return (
    <>
      {/* Achievement notification */}
      {showNotification && (
        <div className="fixed top-20 right-4 z-50 animate-slideIn">
          <div className="bg-gradient-to-r from-yellow-600 to-orange-600 border-2 border-yellow-400 rounded-lg p-4 shadow-2xl">
            <div className="flex items-center gap-3">
                <div className="text-4xl">{showNotification.icon}</div>
              <div>
                <div className="text-yellow-200 font-mono text-xs uppercase tracking-wider">
                  Dosežek odklenjen!
                </div>
                <div className="text-white font-mono text-lg font-bold">
                  {showNotification.title}
                </div>
                <div className="text-yellow-100 font-mono text-xs">
                  {showNotification.description}
                </div>
              </div>            </div>
          </div>
        </div>
      )}

      {/* Achievement list (can be shown in a modal or panel) */}
      <div className="fixed bottom-4 left-4 z-40 bg-black/80 border border-yellow-500/50 rounded-lg p-3 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🏆</span>
          <div>
            <div className="text-yellow-400 font-mono text-sm font-bold">
              Dosežki
            </div>
            <div className="text-gray-400 font-mono text-xs">
              {unlockedCount}/{totalCount}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-48 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
            style={{
              width: `${progress}%`,
              boxShadow: '0 0 10px rgba(250, 204, 21, 0.8)'
            }}
          />
        </div>
      </div>
    </>
  );
}

// Full achievement panel for main menu or pause menu
interface AchievementPanelProps {
  achievements: Achievement[];
  unlockedIds: string[];
  onClose: () => void;
}

export function AchievementPanel({ achievements, unlockedIds, onClose }: AchievementPanelProps) {
  const unlockedCount = unlockedIds.length;
  const totalCount = achievements.length;
  const progress = (unlockedCount / totalCount) * 100;

  const categories = [
    { id: 'level', name: 'Nivo', icon: '📈' },
    { id: 'combat', name: 'Boj', icon: '⚔️' },
    { id: 'survival', name: 'Preživetje', icon: '🛡️' }
  ];

  const [selectedCategory, setSelectedCategory] = useState('level');

  const filteredAchievements = achievements.filter(a => {
    if (selectedCategory === 'level') return a.id.startsWith('level_');
    if (selectedCategory === 'combat') return a.id.startsWith('kills_') || a.id.startsWith('boss_') || a.id.startsWith('combo_');
    if (selectedCategory === 'survival') return a.id.startsWith('wave_') || a.id.startsWith('time_');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
      <div className="relative w-[90vw] max-w-5xl h-[85vh] bg-gradient-to-br from-yellow-900 via-black to-orange-900 border-2 border-yellow-500 rounded-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-600 to-orange-600 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold font-mono text-white mb-2">
                🏆 DOSEŽKI
              </h2>
              <p className="text-yellow-200 font-mono text-sm">
                {unlockedCount}/{totalCount} odklenjenih ({progress.toFixed(1)}%)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white font-mono rounded-full transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 bg-black/40 border-b border-yellow-500/50 flex-shrink-0">
          <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 transition-all duration-500"
              style={{
                width: `${progress}%`,
                boxShadow: '0 0 10px rgba(250, 204, 21, 0.8)'
              }}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex border-b border-yellow-500/50 flex-shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex-1 px-6 py-3 font-mono font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-yellow-600/30 text-yellow-400 border-b-2 border-yellow-400'
                  : 'bg-black/40 text-gray-400 hover:bg-black/60'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Achievements list */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAchievements.map((achievement) => {
              const isUnlocked = unlockedIds.includes(achievement.id);
              
              return (
                <div
                  key={achievement.id}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isUnlocked
                      ? 'bg-yellow-900/30 border-yellow-500'
                      : 'bg-black/60 border-gray-700'
                  }`}
                  style={{
                    boxShadow: isUnlocked ? '0 0 20px rgba(250, 204, 21, 0.3)' : 'none'
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-5xl flex-shrink-0">
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h3 
                        className={`text-lg font-bold font-mono mb-1 ${
                          isUnlocked ? 'text-yellow-400' : 'text-gray-400'
                        }`}
                      >
                        {achievement.title}
                      </h3>
                      <p className="text-gray-300 font-mono text-sm mb-2">
                        {achievement.description}
                      </p>
                      {isUnlocked && (
                        <div className="text-green-400 font-mono text-xs font-bold">
                          ✓ ODKLENJENO
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black/60 p-4 border-t border-yellow-500/50 flex-shrink-0">
          <div className="text-center text-gray-400 font-mono text-sm">
            Odkleni vse dosežke za posebne nagrade!
          </div>
        </div>
      </div>
    </div>
  );
}
