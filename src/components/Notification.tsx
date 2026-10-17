import { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Notification({ message, type, duration = 3000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  const typeClasses = {
    success: 'bg-green-500/20 border-green-400 text-green-400',
    warning: 'bg-yellow-500/20 border-yellow-400 text-yellow-400',
    error: 'bg-red-500/20 border-red-400 text-red-400',
    info: 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
  };

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  };

  return (
    <div
      className={`fixed top-20 right-4 z-50 px-6 py-4 border-2 rounded font-mono text-sm transition-all duration-300 ${typeClasses[type]} ${
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      style={{
        boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <span>{message}</span>
      </div>
    </div>
  );
}
