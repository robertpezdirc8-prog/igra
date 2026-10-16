import { useState } from 'react';
import { Button } from './Button';

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialOverlay({ isOpen, onClose }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: 'DOBRODOŠLI V ATHERIA',
      description: 'Igra vesoljskega horrorja z ekstremno težavnostjo',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🚀</div>
          <p className="text-gray-300 font-mono text-sm">
            Premagaj neskončne valove sovražnikov in postani Void Breaker
          </p>
        </div>
      )
    },
    {
      title: 'GIBANJE',
      description: 'Uporabi WASD ali puščice za premikanje',
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
          <p className="text-gray-400 font-mono text-xs">ALI UPORABI PUŠČICE NA TIPKOVNICI</p>
        </div>
      )
    },
    {
      title: 'STRELJANJE',
      description: 'Klikni z miško za streljanje v smeri kazalca',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <p className="text-gray-300 font-mono text-sm">
            Levi klik miške = Streljanje<br/>
            Ciljaj s kazalcem miške
          </p>
        </div>
      )
    },
    {
      title: 'DASH',
      description: 'Pritisni SPACE za hiter premik z nedotakljivostjo',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-gray-300 font-mono text-sm">
            SPACE = Dash<br/>
            <span className="text-cyan-400">Kratka nedotakljivost med dashom</span>
          </p>
          <p className="text-gray-500 font-mono text-xs mt-2">
            Porabi 20 energije
          </p>
        </div>
      )
    },
    {
      title: 'SEKUNDARNO OROŽJE',
      description: 'Desni klik za aktivacijo sekundarnega orožja',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">🌀</div>
          <p className="text-gray-300 font-mono text-sm">
            Desni klik miške = Sekundarno orožje<br/>
            <span className="text-purple-400">Gravity Well, Chain Lightning, ali Temporal Stasis</span>
          </p>
          <p className="text-gray-500 font-mono text-xs mt-2">
            Odkleni z nadgradnjami
          </p>
        </div>
      )
    },
    {
      title: 'NADGRADNJE',
      description: 'Vsakih 3 valov izberi nadgradnjo',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">⬆️</div>
          <p className="text-gray-300 font-mono text-sm">
            Izbiraj med 3 naključnimi nadgradnjami<br/>
            <span className="text-yellow-400">Izboljšaj orožje, hitrost, ščit...</span>
          </p>
        </div>
      )
    },
    {
      title: 'PRIpravljen?',
      description: 'Čas je, da postaneš Void Breaker',
      content: (
        <div className="text-center">
          <div className="text-6xl mb-4">💀</div>
          <p className="text-red-400 font-mono text-sm">
            OPOZORILO: Igra je ekstremno težavna<br/>
            <span className="text-gray-400">Vsaka napaka je tvoja krivda</span>
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
      <div className="bg-gray-900/95 border-2 border-cyan-400/50 rounded-lg p-8 max-w-lg w-full mx-4">
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
              ← NAZAJ
            </Button>
          )}
          <Button onClick={handleNext} variant="primary" className="flex-1">
            {currentStep === steps.length - 1 ? 'ZAČNI IGRO' : 'NAPREJ →'}
          </Button>
        </div>

        {/* Skip button */}
        {currentStep < steps.length - 1 && (
          <button
            onClick={onClose}
            className="w-full mt-4 text-gray-500 font-mono text-xs hover:text-gray-400 transition-colors"
          >
            PRESKOČI VODNIK
          </button>
        )}
      </div>
    </div>
  );
}
