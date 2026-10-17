import { useState, useEffect } from 'react';
import { GameStats, getGameStats, LeaderboardEntry, getLeaderboard, getPlayerRank, formatPlayTime, formatNumber } from '../game/statsSystem';

interface StatsLeaderboardUIProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsLeaderboardUI({ isOpen, onClose }: StatsLeaderboardUIProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'leaderboard'>('stats');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState(0);

  useEffect(() => {
    if (isOpen) {
      // localStorage is an external system - sync it asynchronously
      const raf = requestAnimationFrame(() => {
        setStats(getGameStats());
        setLeaderboard(getLeaderboard());
        setPlayerRank(getPlayerRank());
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen]);

  if (!isOpen || !stats) return null;

  const statItems = [
    { label: 'Odigrane igre', value: stats.totalGamesPlayed, icon: '🎮' },
    { label: 'Skupni čas igranja', value: formatPlayTime(stats.totalTimePlayed), icon: '⏱️' },
    { label: 'Skupni rezultat', value: formatNumber(stats.totalScore), icon: '🏆' },
    { label: 'Najboljši rezultat', value: formatNumber(stats.highestScore), icon: '⭐' },
    { label: 'Ubijeni sovražniki', value: formatNumber(stats.totalEnemiesKilled), icon: '💀' },
    { label: 'Ubijeni bossi', value: stats.totalBossKills, icon: '👹' },
    { label: 'Najvišji val', value: stats.highestWave, icon: '🌊' },
    { label: 'Najvišji nivo', value: stats.highestLevel, icon: '📈' },
    { label: 'Največji combo', value: `${stats.highestCombo}x`, icon: '💥' },
    { label: 'Skupna škoda', value: formatNumber(stats.totalDamageDealt), icon: '⚔️' },
    { label: 'Prejeta škoda', value: formatNumber(stats.totalDamageTaken), icon: '🛡️' },
    { label: 'Zbrani predmeti', value: stats.totalItemsCollected, icon: '📦' },
    { label: 'Smrti', value: stats.totalDeaths, icon: '☠️' },
    { label: 'Povprečni čas', value: formatPlayTime(stats.averageSurvivalTime), icon: '⏳' },
    { label: 'Odklenjeni dosežki', value: stats.achievementsUnlocked, icon: '🏅' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-[90vw] max-w-5xl h-[85vh] bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500 rounded-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-600 to-orange-600 p-6 flex-shrink-0">
          <h2 className="text-3xl font-bold font-mono text-white">
            📊 STATISTIKA & LEADERBOARD
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white font-mono rounded-full transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-yellow-500/50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-6 py-3 font-mono font-bold transition-all ${
              activeTab === 'stats'
                ? 'bg-yellow-600/30 text-yellow-400 border-b-2 border-yellow-400'
                : 'bg-black/40 text-gray-400 hover:bg-black/60'
            }`}
          >
            📈 STATISTIKA
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 px-6 py-3 font-mono font-bold transition-all ${
              activeTab === 'leaderboard'
                ? 'bg-yellow-600/30 text-yellow-400 border-b-2 border-yellow-400'
                : 'bg-black/40 text-gray-400 hover:bg-black/60'
            }`}
          >
            🏆 LEADERBOARD
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'stats' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {statItems.map((item, i) => (
                <div
                  key={i}
                  className="bg-black/60 border border-yellow-500/30 rounded-lg p-4 hover:border-yellow-500/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="text-gray-400 font-mono text-xs mb-1">
                        {item.label}
                      </div>
                      <div className="text-yellow-400 font-mono text-xl font-bold">
                        {item.value}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-2">
              {playerRank > 0 && (
                <div className="bg-yellow-600/20 border-2 border-yellow-500 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <div className="text-yellow-400 font-mono text-sm mb-1">
                      VAŠA UVRSTITEV
                    </div>
                    <div className="text-yellow-300 font-mono text-4xl font-bold">
                      #{playerRank}
                    </div>
                  </div>
                </div>
              )}

              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    entry.isPlayer
                      ? 'bg-yellow-600/20 border-yellow-500'
                      : 'bg-black/60 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-16 text-center">
                    <div
                      className={`font-mono text-2xl font-bold ${
                        entry.rank === 1
                          ? 'text-yellow-400'
                          : entry.rank === 2
                          ? 'text-gray-300'
                          : entry.rank === 3
                          ? 'text-orange-400'
                          : 'text-gray-500'
                      }`}
                    >
                      #{entry.rank}
                    </div>
                  </div>

                  {/* Player info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-mono font-bold ${entry.isPlayer ? 'text-yellow-400' : 'text-white'}`}>
                        {entry.name}
                      </span>
                      {entry.isPlayer && (
                        <span className="px-2 py-0.5 bg-yellow-500/30 border border-yellow-500 rounded text-yellow-400 font-mono text-xs">
                          VI
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 font-mono text-xs mt-1">
                      Val {entry.wave} • Nivo {entry.level} • {entry.date}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="text-yellow-400 font-mono text-xl font-bold">
                      {formatNumber(entry.score)}
                    </div>
                    <div className="text-gray-500 font-mono text-xs">
                      TOČK
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
