import { useState, useEffect } from 'react';
import { DailyChallenge, generateDailyChallenges, getTimeUntilReset, checkChallengeCompletion, PlayerStats } from '../game/dailyChallenges';

interface DailyChallengesUIProps {
  isOpen: boolean;
  onClose: () => void;
  playerStats: PlayerStats;
  completedChallenges: string[];
  onCompleteChallenge: (challengeId: string) => void;
}

export function DailyChallengesUI({ 
  isOpen, 
  onClose, 
  playerStats, 
  completedChallenges,
  onCompleteChallenge 
}: DailyChallengesUIProps) {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    if (isOpen) {
      setChallenges(generateDailyChallenges());
      
      const updateTimer = () => {
        setTimeUntilReset(getTimeUntilReset());
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const difficultyColors = {
    easy: { bg: 'from-green-600 to-green-800', border: '#4ade80', text: '#4ade80' },
    medium: { bg: 'from-yellow-600 to-yellow-800', border: '#facc15', text: '#facc15' },
    hard: { bg: 'from-red-600 to-red-800', border: '#f87171', text: '#f87171' }
  };

  const difficultyNames = {
    easy: 'Enostavno',
    medium: 'Srednje',
    hard: 'Težko'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-[90vw] max-w-4xl bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500 rounded-lg overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold font-mono text-white">
                🎯 DNEVNI IZZIVI
              </h2>
              <p className="text-purple-200 font-mono text-sm mt-1">
                Novi izzivi vsak dan
              </p>
            </div>
            <div className="text-right">
              <div className="text-white font-mono text-lg">
                Ponastavitev čez
              </div>
              <div className="text-yellow-300 font-mono text-2xl font-bold">
                {timeUntilReset}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white font-mono rounded-full transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Challenges list */}
        <div className="p-6 space-y-4">
          {challenges.map((challenge) => {
            const isCompleted = completedChallenges.includes(challenge.id);
            const canComplete = checkChallengeCompletion(challenge, playerStats);
            const colors = difficultyColors[challenge.difficulty];

            return (
              <div
                key={challenge.id}
                className={`relative p-6 rounded-lg border-2 transition-all ${
                  isCompleted 
                    ? 'bg-green-900/30 border-green-500' 
                    : 'bg-black/60 hover:bg-black/80'
                }`}
                style={{
                  borderColor: isCompleted ? '#4ade80' : colors.border
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-5xl">{challenge.icon}</div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold font-mono text-white">
                        {challenge.name}
                      </h3>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-mono font-bold"
                        style={{
                          background: colors.border + '33',
                          color: colors.text,
                          border: `1px solid ${colors.border}`
                        }}
                      >
                        {difficultyNames[challenge.difficulty]}
                      </span>
                    </div>

                    <p className="text-gray-300 font-mono text-sm mb-4">
                      {challenge.description}
                    </p>

                    {/* Rewards */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-gray-400 font-mono text-xs">NAGRADE:</span>
                      {challenge.rewards.map((reward, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-yellow-600/30 border border-yellow-500 rounded text-yellow-300 font-mono text-xs"
                        >
                          {reward.type === 'xp' && `⭐ ${reward.amount} XP`}
                          {reward.type === 'gold' && `💰 ${reward.amount} Gold`}
                          {reward.type === 'skillPoint' && `🌟 ${reward.amount} Skill Point${reward.amount > 1 ? 's' : ''}`}
                          {reward.type === 'cosmetic' && `✨ ${reward.name}`}
                        </span>
                      ))}
                    </div>

                    {/* Action button */}
                    {!isCompleted && canComplete && (
                      <button
                        onClick={() => onCompleteChallenge(challenge.id)}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-mono font-bold rounded transition-all hover:scale-105"
                        style={{
                          boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)'
                        }}
                      >
                        ✓ ZAKLJUČI
                      </button>
                    )}

                    {isCompleted && (
                      <div className="flex items-center gap-2 text-green-400 font-mono font-bold">
                        <span className="text-2xl">✓</span>
                        <span>ZAKLJUČENO</span>
                      </div>
                    )}

                    {!isCompleted && !canComplete && (
                      <div className="text-gray-500 font-mono text-sm">
                        V napredku...
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress indicator */}
                {!isCompleted && (
                  <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b rounded-r"
                       style={{
                         background: canComplete 
                           ? 'linear-gradient(to bottom, #4ade80, #22c55e)'
                           : `linear-gradient(to bottom, ${colors.border}44, ${colors.border}22)`
                       }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-black/60 p-4 border-t border-purple-500/50">
          <p className="text-center text-gray-400 font-mono text-xs">
            Izzivi se ponastavijo vsak dan ob polnoči. Zaključi vse tri za bonus nagrado!
          </p>
        </div>
      </div>
    </div>
  );
}
