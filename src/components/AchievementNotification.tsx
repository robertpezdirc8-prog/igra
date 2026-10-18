import { useEffect, useState } from 'react';
import { t, useLang } from '../i18n';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  useLang();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 500);
    }, 4000);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-20 right-4 z-50 transition-all duration-500 ${
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-2 border-yellow-400 rounded-lg p-4 min-w-[300px]"
        style={{
          boxShadow: '0 0 30px rgba(255, 170, 0, 0.5), inset 0 0 20px rgba(255, 170, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className="text-4xl flex-shrink-0"
            style={{
              animation: 'bounce 0.5s ease-in-out',
              filter: 'drop-shadow(0 0 10px rgba(255, 170, 0, 0.8))'
            }}
          >
            {achievement.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className="text-yellow-400 font-mono text-xs uppercase tracking-wider mb-1">
              {t('ach.unlocked')}
            </p>
            <h3
              className="text-lg font-bold font-mono mb-1"
              style={{
                color: '#ffaa00',
                textShadow: '0 0 10px rgba(255, 170, 0, 0.6)'
              }}
            >
              {t('ach.' + achievement.id + '.name')}
            </h3>
            <p className="text-gray-400 font-mono text-xs">
              {t('ach.' + achievement.id + '.desc')}
            </p>
          </div>
        </div>

        {/* Progress bar animation */}
        <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
            style={{
              animation: 'shrink 4s linear forwards'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
