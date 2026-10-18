import { useState } from 'react';
import { t, useLang } from '../i18n';

interface InteractiveTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function InteractiveTutorial({ isOpen, onClose, onComplete }: InteractiveTutorialProps) {
  useLang();
  const [currentStep, setCurrentStep] = useState(0);
  const [, setCompleted] = useState(false);

  // Reset progress when the tutorial closes (render-time state adjustment -
  // the documented React pattern instead of a synchronous setState in an effect)

  const steps = [
    {
      title: t('tut.iWelcomeTitle'),
      description: t('tut.descWelcome'),
      icon: '🚀',
      action: t('tut.actionNext'),
      highlight: null
    },
    {
      title: t('tut.iMoveTitle'),
      description: t('tut.iMoveDesc'),
      icon: '🎮',
      action: t('tut.actionNext'),
      highlight: 'movement'
    },
    {
      title: t('tut.iShootTitle'),
      description: t('tut.descShoot'),
      icon: '🎯',
      action: t('tut.actionNext'),
      highlight: 'shooting'
    },
    {
      title: t('tut.iDashTitle'),
      description: t('tut.descDash'),
      icon: '⚡',
      action: t('tut.actionNext'),
      highlight: 'dash'
    },
    {
      title: t('tut.iSecondaryTitle'),
      description: t('tut.descSecondary'),
      icon: '🌀',
      action: t('tut.actionNext'),
      highlight: 'secondary'
    },
    {
      title: t('tut.iUpgradesTitle'),
      description: t('tut.descUpgrades'),
      icon: '⬆️',
      action: t('tut.actionNext'),
      highlight: 'upgrades'
    },
    {
      title: t('tut.iReadyTitle'),
      description: t('tut.iReadyDesc'),
      icon: '💀',
      action: t('tut.actionStart'),
      highlight: null
    }
  ];

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setCurrentStep(0);
      setCompleted(false);
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
      onComplete();
      onClose();
    }
  };

  const handleSkip = () => {
    setCompleted(true);
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="relative w-[90vw] max-w-2xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-cyan-900 to-black border-2 border-cyan-500 rounded-lg">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-cyan-600 to-blue-600 p-6">
          <h2 className="text-3xl font-bold font-mono text-white">
            {t('tut.guideTitle')}
          </h2>
          <p className="text-cyan-200 font-mono text-sm mt-1">
            {t('tut.stepOf', { n: currentStep + 1, total: steps.length })}
          </p>
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 px-4 py-2 bg-black/50 hover:bg-black/70 text-white font-mono text-sm rounded transition-colors"
          >
            {t('tut.skipShort')}
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 bg-black/40 border-b border-cyan-500/50">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.8)'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="text-7xl mb-6">{step.icon}</div>
          <h3 
            className="text-3xl font-bold font-mono text-cyan-400 mb-4"
            style={{ textShadow: '0 0 20px rgba(6, 182, 212, 0.8)' }}
          >
            {step.title}
          </h3>
          <p className="text-gray-300 font-mono text-lg mb-8">
            {step.description}
          </p>

          {/* Visual guide */}
          {step.highlight === 'movement' && (
            <div className="mb-6">
              <div className="inline-block bg-black/60 border border-cyan-500/50 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                  <div></div>
                  <div className="bg-cyan-500/30 border border-cyan-400 rounded p-2 text-cyan-400 font-mono text-center">W</div>
                  <div></div>
                  <div className="bg-cyan-500/30 border border-cyan-400 rounded p-2 text-cyan-400 font-mono text-center">A</div>
                  <div className="bg-cyan-500/30 border border-cyan-400 rounded p-2 text-cyan-400 font-mono text-center">S</div>
                  <div className="bg-cyan-500/30 border border-cyan-400 rounded p-2 text-cyan-400 font-mono text-center">D</div>
                </div>
              </div>
            </div>
          )}

          {step.highlight === 'shooting' && (
            <div className="mb-6">
              <div className="inline-block bg-black/60 border border-cyan-500/50 rounded-lg p-4">
                <div className="text-4xl">🖱️</div>
                <div className="text-cyan-400 font-mono text-sm mt-2">{t('tut.leftClick')}</div>
              </div>
            </div>
          )}

          {step.highlight === 'dash' && (
            <div className="mb-6">
              <div className="inline-block bg-black/60 border border-cyan-500/50 rounded-lg p-4">
                <div className="bg-cyan-500/30 border border-cyan-400 rounded px-6 py-3 text-cyan-400 font-mono text-xl">
                  SPACE
                </div>
              </div>
            </div>
          )}

          {step.highlight === 'secondary' && (
            <div className="mb-6">
              <div className="inline-block bg-black/60 border border-cyan-500/50 rounded-lg p-4">
                <div className="text-4xl">🖱️</div>
                <div className="text-cyan-400 font-mono text-sm mt-2">{t('tut.rightClick')}</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-black/60 p-6 border-t border-cyan-500/50">
          <button
            onClick={handleNext}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-mono font-bold text-lg rounded-lg transition-all hover:scale-105"
            style={{ boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' }}
          >
            {step.action}
          </button>
        </div>
      </div>
    </div>
  );
}
