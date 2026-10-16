import { useEffect, useState } from 'react';

interface PowerUpNotification {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface PowerUpNotificationDisplayProps {
  notifications: PowerUpNotification[];
}

export function PowerUpNotificationDisplay({ notifications }: PowerUpNotificationDisplayProps) {
  return (
    <div className="fixed top-1/2 right-4 -translate-y-1/2 z-40 space-y-2">
      {notifications.map((notification) => (
        <PowerUpNotificationItem key={notification.id} notification={notification} />
      ))}
    </div>
  );
}

function PowerUpNotificationItem({ notification }: { notification: PowerUpNotification }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const getRarityColor = () => {
    switch (notification.rarity) {
      case 'legendary': return 'border-yellow-400 bg-yellow-500/20';
      case 'epic': return 'border-purple-400 bg-purple-500/20';
      case 'rare': return 'border-blue-400 bg-blue-500/20';
      default: return 'border-gray-400 bg-gray-500/20';
    }
  };

  const getRarityGlow = () => {
    switch (notification.rarity) {
      case 'legendary': return '0 0 20px rgba(255, 215, 0, 0.8)';
      case 'epic': return '0 0 20px rgba(168, 85, 247, 0.8)';
      case 'rare': return '0 0 20px rgba(59, 130, 246, 0.8)';
      default: return '0 0 10px rgba(156, 163, 175, 0.5)';
    }
  };

  return (
    <div
      className={`border-2 rounded-lg p-3 backdrop-blur-sm animate-slideIn ${getRarityColor()}`}
      style={{
        boxShadow: getRarityGlow(),
        animation: 'slideIn 0.3s ease-out, fadeOut 0.5s ease-in 2.5s forwards'
      }}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">{notification.icon}</div>
        <div>
          <p className="text-white font-mono font-bold text-sm">
            {notification.name}
          </p>
          <p className="text-gray-300 font-mono text-xs">
            {notification.description}
          </p>
        </div>
      </div>
    </div>
  );
}
