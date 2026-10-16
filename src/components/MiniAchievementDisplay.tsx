import { useEffect, useState } from 'react';

interface MiniAchievement {
  id: number;
  title: string;
  icon: string;
}

interface MiniAchievementDisplayProps {
  achievements: MiniAchievement[];
}

export function MiniAchievementDisplay({ achievements }: MiniAchievementDisplayProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 space-y-2">
      {achievements.map((achievement) => (
        <MiniAchievementItem key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}

function MiniAchievementItem({ achievement }: { achievement: MiniAchievement }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="bg-yellow-500/20 border-2 border-yellow-400 rounded-lg px-4 py-2 backdrop-blur-sm animate-slideUp"
      style={{
        boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)',
        animation: 'slideUp 0.3s ease-out, fadeOut 0.5s ease-in 1.5s forwards'
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{achievement.icon}</span>
        <span className="text-yellow-400 font-mono font-bold text-sm">
          {achievement.title}
        </span>
      </div>
    </div>
  );
}
