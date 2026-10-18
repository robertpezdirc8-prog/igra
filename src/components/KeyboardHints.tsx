import { useState, useEffect } from 'react';
import { t, useLang } from '../i18n';

export function KeyboardHints() {
  const [isVisible, setIsVisible] = useState(true);
  useLang();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const hints = [
    { key: 'WASD', action: t('hud.hintMove'), icon: '🎮' },
    { key: t('hud.hintMouse'), action: t('hud.hintShoot'), icon: '🎯' },
    { key: 'SPACE', action: t('hud.hintDash'), icon: '⚡' },
    { key: 'ESC', action: t('hud.hintPause'), icon: '⏸️' },
    { key: t('hud.hintRightClick'), action: t('hud.hintSecondary'), icon: '🌀' }
  ];

  return (
    <div
      className="fixed top-1/2 left-4 -translate-y-1/2 z-30 pointer-events-none transition-opacity duration-1000"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div className="bg-black/60 border border-cyan-400/30 rounded-lg p-4 backdrop-blur-sm">
        <p className="text-cyan-400 font-mono text-xs uppercase tracking-wider mb-3">
          {t('hud.hintControls')}
        </p>
        <div className="space-y-2">
          {hints.map((hint, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-lg">{hint.icon}</span>
              <div>
                <p className="text-cyan-400 font-mono text-xs font-bold">{hint.key}</p>
                <p className="text-gray-400 font-mono text-xs">{hint.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
