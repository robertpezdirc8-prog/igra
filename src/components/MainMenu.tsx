import { useState, useEffect } from 'react';
import { Button } from './Button';
import { t, useLang } from '../i18n';

interface MainMenuProps {
  onStartGame: () => void;
  onShowTutorial: () => void;
  onShowSettings: () => void;
  onShowSaveLoad: () => void;
  onShowStats: () => void;
  onShowArcade: () => void;
  onShowDailyRewards: () => void;
  onShowShop: () => void;
  onShowDifficulty: () => void;
  onShowMetaProgression: () => void;
  onShowInteractiveTutorial: () => void;
  onShowClassicArcade: () => void;
  highScore: number;
  webgpuSupported: boolean;
}

export function MainMenu({ onStartGame, onShowTutorial, onShowSettings, onShowSaveLoad, onShowStats, onShowArcade, onShowDailyRewards, onShowShop, onShowDifficulty, onShowMetaProgression, onShowInteractiveTutorial, onShowClassicArcade, highScore, webgpuSupported }: MainMenuProps) {
  const [titleGlow, setTitleGlow] = useState(0);
  const [particles, setParticles] = useState<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);
  useLang(); // re-render on language switch

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleGlow((prev) => (prev + 1) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => {
        const newParticles = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 0.02
          }))
          .filter((p) => p.life > 0);

        // Add new particles
        if (newParticles.length < 50) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 200 + Math.random() * 100;
          newParticles.push({
            x: window.innerWidth / 2 + Math.cos(angle) * dist,
            y: window.innerHeight / 2 + Math.sin(angle) * dist,
            vx: -Math.cos(angle) * 2,
            vy: -Math.sin(angle) * 2,
            life: 1
          });
        }

        return newParticles;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const secondaryItems: Array<{ label: string; action: () => void }> = [
    { label: t('menu.guide'), action: onShowTutorial },
    { label: t('menu.settings'), action: onShowSettings },
    { label: t('menu.saveLoad'), action: onShowSaveLoad },
    { label: t('menu.stats'), action: onShowStats },
    { label: t('menu.arcade'), action: onShowArcade },
    { label: t('menu.dailyRewards'), action: onShowDailyRewards },
    { label: t('menu.shop'), action: onShowShop },
    { label: t('menu.difficulty'), action: onShowDifficulty },
    { label: t('menu.meta'), action: onShowMetaProgression },
    { label: t('menu.interactiveGuide'), action: onShowInteractiveTutorial },
    { label: t('menu.classic'), action: onShowClassicArcade }
  ];

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto overscroll-contain bg-black/95">
      {/* Animated particles + rings (pinned to viewport, never scroll) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: p.x,
              top: p.y,
              backgroundColor: i % 2 === 0 ? '#00ffff' : '#ff00ff',
              opacity: p.life,
              boxShadow: `0 0 10px ${i % 2 === 0 ? '#00ffff' : '#ff00ff'}`
            }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="absolute border-2 rounded-full hidden sm:block"
              style={{
                width: `${200 + i * 80}px`,
                height: `${200 + i * 80}px`,
                borderColor: i % 2 === 0 ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255, 0, 255, 0.1)',
                animation: `spin ${10 + i * 2}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
              }}
            />
          ))}
        </div>
      </div>

      {/* Scrollable content: centered when short, scrolls when taller than screen */}
      <div className="relative z-10 min-h-full flex flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <div className="mb-5 sm:mb-10 text-center">
          <h1
            className="text-4xl sm:text-6xl md:text-7xl font-bold font-mono mb-1 sm:mb-2"
            style={{
              color: '#00ffff',
              textShadow: `0 0 ${20 + Math.sin(titleGlow * 0.05) * 10}px rgba(0, 255, 255, 0.8), 0 0 ${40 + Math.sin(titleGlow * 0.05) * 20}px rgba(0, 255, 255, 0.4)`
            }}
          >
            ATHERIA
          </h1>
          <p
            className="text-xl sm:text-2xl md:text-3xl font-mono"
            style={{
              color: '#ff00ff',
              textShadow: `0 0 ${15 + Math.sin(titleGlow * 0.05 + 1) * 8}px rgba(255, 0, 255, 0.6)`
            }}
          >
            VOID BREAKER
          </p>
          <p className="text-gray-500 font-mono text-[10px] sm:text-sm mt-2 sm:mt-4">
            {t('menu.subtitle')}
          </p>
        </div>

        {/* Menu buttons */}
        <div className="w-full max-w-xs sm:max-w-sm">
          <Button onClick={onStartGame} variant="primary" size="large" className="w-full">
            {t('menu.start')}
          </Button>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {secondaryItems.map((item) => (
              <Button
                key={item.label}
                onClick={item.action}
                variant="secondary"
                size="small"
                className="w-full min-h-[44px] text-[11px] sm:text-xs px-2"
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        {/* High score + renderer status */}
        <div className="mt-5 sm:mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
          {highScore > 0 && (
            <p className="text-yellow-400 font-mono text-xs sm:text-sm">
              <span className="text-gray-500">{t('menu.best')}</span>{' '}
              <span
                className="text-base sm:text-lg font-bold"
                style={{
                  color: '#ffaa00',
                  textShadow: '0 0 10px rgba(255, 170, 0, 0.6)'
                }}
              >
                {highScore.toLocaleString()}
              </span>
            </p>
          )}
          <div
            className={`px-3 py-1 rounded-full font-mono text-[10px] sm:text-xs ${
              webgpuSupported ? 'bg-green-500/20 border border-green-400 text-green-400' : 'bg-yellow-500/20 border border-yellow-400 text-yellow-400'
            }`}
          >
            {webgpuSupported ? t('menu.webgpuActive') : t('menu.canvasMode')}
          </div>
        </div>

        {/* Controls hint (desktop only — mobile has touch controls) */}
        <div className="hidden md:block mt-6 text-center">
          <p className="text-gray-600 font-mono text-xs">
            {t('menu.controlsHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
