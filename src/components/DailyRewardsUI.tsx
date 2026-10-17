import { useState, useEffect } from 'react';

interface DailyReward {
  day: number;
  reward: string;
  amount: number;
  icon: string;
  claimed: boolean;
}

interface DailyRewardsUIProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (reward: DailyReward) => void;
}

const REWARDS: Omit<DailyReward, 'claimed'>[] = [
  { day: 1, reward: 'gold', amount: 100, icon: '💰' },
  { day: 2, reward: 'xp', amount: 500, icon: '⭐' },
  { day: 3, reward: 'gold', amount: 200, icon: '💰' },
  { day: 4, reward: 'skillPoint', amount: 1, icon: '🌟' },
  { day: 5, reward: 'gold', amount: 300, icon: '💰' },
  { day: 6, reward: 'xp', amount: 1000, icon: '⭐' },
  { day: 7, reward: 'gem', amount: 10, icon: '💎' }
];

export function DailyRewardsUI({ isOpen, onClose, onClaim }: DailyRewardsUIProps) {
  const [rewards, setRewards] = useState<DailyReward[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRewards();
    }
  }, [isOpen]);

  const loadRewards = () => {
    const saved = localStorage.getItem('daily_rewards');
    if (saved) {
      const data = JSON.parse(saved);
      setRewards(data.rewards);
      setCurrentDay(data.currentDay);
      setCanClaim(data.canClaim);
    } else {
      const initial = REWARDS.map((r, i) => ({
        ...r,
        claimed: false
      }));
      setRewards(initial);
      setCurrentDay(1);
      setCanClaim(true);
    }
  };

  const saveRewards = (newRewards: DailyReward[], day: number, claim: boolean) => {
    localStorage.setItem('daily_rewards', JSON.stringify({
      rewards: newRewards,
      currentDay: day,
      canClaim: claim,
      lastClaim: Date.now()
    }));
  };

  const handleClaim = () => {
    if (!canClaim) return;

    const reward = rewards[currentDay - 1];
    const newRewards = [...rewards];
    newRewards[currentDay - 1] = { ...reward, claimed: true };

    let nextDay = currentDay + 1;
    if (nextDay > 7) {
      nextDay = 1;
      // Reset all rewards for new week
      newRewards.forEach((r, i) => {
        newRewards[i] = { ...r, claimed: false };
      });
    }

    setRewards(newRewards);
    setCurrentDay(nextDay);
    setCanClaim(false);
    saveRewards(newRewards, nextDay, false);

    onClaim(reward);

    // Reset claim ability after 24 hours
    setTimeout(() => {
      setCanClaim(true);
      const saved = localStorage.getItem('daily_rewards');
      if (saved) {
        const data = JSON.parse(saved);
        data.canClaim = true;
        localStorage.setItem('daily_rewards', JSON.stringify(data));
      }
    }, 24 * 60 * 60 * 1000);
  };

  if (!isOpen) return null;

  const rewardNames: Record<string, string> = {
    gold: 'Zlato',
    xp: 'XP',
    skillPoint: 'Skill Point',
    gem: 'Gem'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-[90vw] max-w-3xl bg-gradient-to-br from-yellow-900 to-black border-2 border-yellow-500 rounded-lg overflow-hidden">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-600 to-orange-600 p-6">
          <h2 className="text-3xl font-bold font-mono text-white">
            🎁 DNEVNE NAGRADE
          </h2>
          <p className="text-yellow-200 font-mono text-sm mt-1">
            Prijavi se vsak dan in prejmi nagrade!
          </p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-black/70 text-white font-mono rounded-full transition-colors flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Rewards grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-6">
            {rewards.map((reward, i) => (
              <div
                key={i}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  reward.claimed
                    ? 'bg-green-900/30 border-green-500'
                    : i + 1 === currentDay && canClaim
                    ? 'bg-yellow-600/30 border-yellow-400 animate-pulse'
                    : 'bg-black/60 border-gray-700'
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">{reward.icon}</div>
                  <div className="text-xs font-mono text-gray-400 mb-1">
                    Dan {reward.day}
                  </div>
                  <div className="text-sm font-mono font-bold" style={{
                    color: reward.claimed ? '#4ade80' : i + 1 === currentDay ? '#facc15' : '#9ca3af'
                  }}>
                    {reward.amount} {rewardNames[reward.reward]}
                  </div>
                  {reward.claimed && (
                    <div className="absolute top-1 right-1 text-green-400 text-xl">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Claim button */}
          <div className="text-center">
            {canClaim ? (
              <button
                onClick={handleClaim}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-mono font-bold text-xl rounded-lg transition-all hover:scale-110"
                style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.5)' }}
              >
                🎁 ZAHTEVAJ NAGRAVO DNEVA {currentDay}
              </button>
            ) : (
              <div className="text-gray-400 font-mono text-lg">
                ✓ Današnja nagrada že zahtevana!
                <br />
                <span className="text-sm">
                  Vrni se jutri za novo nagrado
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black/60 p-4 border-t border-yellow-500/50">
          <p className="text-center text-gray-400 font-mono text-xs">
            Nagrade se ponastavijo vsakih 7 dni. Ne pozabi se prijaviti vsak dan!
          </p>
        </div>
      </div>
    </div>
  );
}
