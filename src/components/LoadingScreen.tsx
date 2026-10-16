import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Inicializacija...');

  useEffect(() => {
    const loadingSteps = [
      { text: 'Inicializacija WebGPU...', progress: 20 },
      { text: 'Nalaganje tekstur...', progress: 40 },
      { text: 'Generiranje zvokov...', progress: 60 },
      { text: 'Priprava fizike...', progress: 80 },
      { text: 'Zagon igre...', progress: 100 }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        setLoadingText(loadingSteps[currentStep].text);
        setProgress(loadingSteps[currentStep].progress);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 400);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="relative z-10 mb-12">
        <h1 className="text-6xl font-bold text-cyan-400 font-mono animate-pulse"
            style={{ textShadow: '0 0 30px rgba(0, 255, 255, 0.8)' }}>
          ATHERIA
        </h1>
        <p className="text-2xl text-purple-400 font-mono mt-2"
           style={{ textShadow: '0 0 20px rgba(255, 0, 255, 0.6)' }}>
          VOID BREAKER
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 w-96">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-cyan-400/30">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-cyan-400 font-mono text-sm">{loadingText}</p>
          <p className="text-gray-500 font-mono text-xs mt-1">{progress}%</p>
        </div>
      </div>

      {/* Loading spinner */}
      <div className="relative z-10 mt-12">
        <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    </div>
  );
}
