import { useState, useEffect } from 'react';

interface ControlsOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ControlsOverlay({ isVisible, onClose }: ControlsOverlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setCurrentSlide(0);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const slides = [
    {
      title: "Gibanje",
      icon: "🎮",
      description: "Uporabi WASD ali puščice za premikanje ladje",
      keys: ["W", "A", "S", "D"]
    },
    {
      title: "Streljanje",
      icon: "🔫",
      description: "Klikni z miško za streljanje v smeri kazalca",
      keys: ["LMB"]
    },
    {
      title: "Dash",
      icon: "⚡",
      description: "Pritisni SPACE za hiter premik z nedotakljivostjo",
      keys: ["SPACE"]
    },
    {
      title: "Sekundarno orožje",
      icon: "🌀",
      description: "Desni klik za aktivacijo sekundarnega orožja",
      keys: ["RMB"]
    },
    {
      title: "Pavza",
      icon: "⏸️",
      description: "Pritisni ESC za pavzo igre",
      keys: ["ESC"]
    }
  ];

  const currentSlideData = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <div className="bg-gray-900/95 border-2 border-cyan-400/50 rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-3xl font-bold text-cyan-400 font-mono mb-6 text-center"
            style={{ textShadow: '0 0 20px #00ffff' }}>
          KONTROLE
        </h2>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{currentSlideData.icon}</div>
          <h3 className="text-2xl font-bold text-white font-mono mb-2">
            {currentSlideData.title}
          </h3>
          <p className="text-gray-400 font-mono text-sm mb-4">
            {currentSlideData.description}
          </p>
          
          <div className="flex justify-center gap-2 flex-wrap">
            {currentSlideData.keys.map((key, i) => (
              <div
                key={i}
                className="px-4 py-2 bg-cyan-500/20 border-2 border-cyan-400 rounded font-mono text-cyan-400 font-bold"
              >
                {key}
              </div>
            ))}
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentSlide ? 'bg-cyan-400 w-8' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4">
          {currentSlide > 0 && (
            <button
              onClick={() => setCurrentSlide(currentSlide - 1)}
              className="flex-1 px-6 py-3 bg-purple-500/20 border-2 border-purple-400 text-purple-400 font-mono uppercase tracking-wider hover:bg-purple-500/30 hover:border-purple-300 transition-all rounded"
            >
              ← NAZAJ
            </button>
          )}
          
          {currentSlide < slides.length - 1 ? (
            <button
              onClick={() => setCurrentSlide(currentSlide + 1)}
              className="flex-1 px-6 py-3 bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400 font-mono uppercase tracking-wider hover:bg-cyan-500/30 hover:border-cyan-300 transition-all rounded"
            >
              NAPREJ →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-green-500/20 border-2 border-green-400 text-green-400 font-mono uppercase tracking-wider hover:bg-green-500/30 hover:border-green-300 transition-all rounded"
            >
              ZAČNI IGRO
            </button>
          )}
        </div>

        {/* Skip button */}
        {currentSlide < slides.length - 1 && (
          <button
            onClick={onClose}
            className="w-full mt-4 text-gray-500 font-mono text-xs hover:text-gray-400 transition-colors"
          >
            PRESKOČI
          </button>
        )}
      </div>
    </div>
  );
}
