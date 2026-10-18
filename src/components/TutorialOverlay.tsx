import { useState } from 'react';
import { Button } from './Button';
import { t, useLang } from '../i18n';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialOverlay({ isOpen, onClose }: TutorialOverlayProps) {
  useLang();
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: t('tut.welcomeTitle'),
      description: t('tut.descWelcome'),
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <p className="text-gray-300 font-mono text-sm">
            {t('tut.welcomeBody')}
          </p>
        </div>
      )
    },
    {
      title: t('tut.moveTitle'),
      description: t('tut.moveDesc'),
      content: (
        <div className="text-center">
          <div className="grid grid-cols-3 gap-2 w-32 mx-auto mb-4">
            <div></div>
            <div className="bg-cyan-500/30 border-2 border-cyan-400 rounded p-2 text-cyan-400 font-mono">W</div>
            <div></div>
            <div className="bg-cyan-500/30 border-2 border-cyan-400 rounded p-2 text-cyan-400 font-mono">A</div>
            <div className="bg-cyan-500/30 border-2 border-cyan-400 rounded p-2 text-cyan-400 font-mono">S</div>
            <div className="bg-cyan-500/30 border-2 border-cyan-400 rounded p-2 text-cyan-400 font-mono">D</div>
          </div>
          <p className="text-gray-400 font-mono text-xs">{t('tut.moveAlt')}</p>
        </div>
      )
    },
    {
      title: t('tut.shootTitle'),
      description: t('tut.descShoot'),
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-300 font-mono text-sm">
            {t('tut.shootLine1')}<br/>
            {t('tut.shootLine2')}
          </p>
        </div>
      )
    },
    {
      title: t('tut.dashTitle'),
      description: t('tut.descDash'),
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-gray-300 font-mono text-sm">
            {t('tut.dashLine1')}<br/>
            <span className="text-cyan-400">{t('tut.dashLine2')}</span>
          </p>
          <p className="text-gray-500 font-mono text-xs mt-2">
            {t('tut.dashCost')}
          </p>
        </div>
      )
    },
    {
      title: t('tut.secondaryTitle'),
      description: t('tut.descSecondary'),
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🌀</div>
          <p className="text-gray-300 font-mono text-sm">
            {t('tut.secondaryLine1')}<br/>
            <span className="text-purple-400">{t('tut.secondaryLine2')}</span>
          </p>
          <p className="text-gray-500 font-mono text-xs mt-2">
            {t('tut.secondaryUnlock')}
          </p>
        </div>
      )
    },
    {
      title: t('tut.upgradesTitle'),
      description: t('tut.descUpgrades'),
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">⬆️</div>
          <p className="text-gray-300 font-mono text-sm">
            {t('tut.upgradesLine1')}<br/>
            <span className="text-yellow-400">{t('tut.upgradesLine2')}</span>
          </p>
        </div>
      )
    },
    {
      title: t('tut.readyTitle'),
      description: t('tut.readyDesc'),
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">💀</div>
          <p className="text-red-400 font-mono text-sm">
            {t('tut.readyLine1')}<br/>
            <span className="text-gray-400">{t('tut.readyLine2')}</span>
          </p>
        </div>
      )
    }
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="bg-gray-900/95 border-2 border-cyan-400/50 rounded-lg p-4 sm:p-8 max-w-lg w-[calc(100%-2rem)] mx-4 max-h-[85vh] overflow-y-auto">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep ? 'bg-cyan-400 w-8' : i < currentStep ? 'bg-cyan-400/50' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-cyan-400 font-mono mb-2 text-center"
            style={{ textShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}>
          {step.title}
        </h2>
        <p className="text-purple-400 font-mono text-sm mb-6 text-center">
          {step.description}
        </p>

        {/* Content */}
        <div className="min-h-[200px] flex items-center justify-center mb-6">
          {step.content}
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          {currentStep > 0 && (
            <Button onClick={handlePrev} variant="secondary" className="flex-1">
              {t('tut.back')}
            </Button>
          )}
          <Button onClick={handleNext} variant="primary" className="flex-1">
            {currentStep === steps.length - 1 ? t('menu.start') : t('tut.next')}
          </Button>
        </div>

        {/* Skip button */}
        {currentStep < steps.length - 1 && (
          <button
            onClick={onClose}
            className="w-full mt-4 text-gray-500 font-mono text-xs hover:text-gray-400 transition-colors"
          >
            {t('tut.skip')}
          </button>
        )}
      </div>
    </div>
  );
}
