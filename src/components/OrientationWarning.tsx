import { useState, useEffect } from 'react';
import { t, useLang } from '../i18n';

export function OrientationWarning() {
  useLang();
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center md:hidden">
      <div className="text-center p-8">
        <div className="text-8xl mb-8 animate-bounce">📱</div>
        <h2 className="text-3xl font-bold text-cyan-400 mb-4 font-mono">
          {t('orient.title')}
        </h2>
        <p className="text-xl text-gray-300 mb-8 font-mono">
          {t('orient.desc')}
        </p>
        <div className="text-6xl animate-pulse">↻</div>
        <p className="text-sm text-gray-500 mt-8 font-mono">
          ATHERIA: VOID BREAKER
        </p>
      </div>
    </div>
  );
}
