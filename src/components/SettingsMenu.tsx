import { useState } from 'react';
import { Button } from './Button';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    musicVolume: number;
    sfxVolume: number;
    showFPS: boolean;
    particles: 'low' | 'medium' | 'high';
    autoAim?: boolean;
  };
  onSettingsChange: (settings: any) => void;
}

export function SettingsMenu({ isOpen, onClose, settings, onSettingsChange }: SettingsMenuProps) {
  // Hooks must run unconditionally - never after an early return
  const [localSettings, setLocalSettings] = useState(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900/95 border-2 border-cyan-400/50 rounded-lg p-4 sm:p-8 max-w-md w-[calc(100%-2rem)] mx-4 max-h-[85vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-cyan-400 font-mono mb-6 text-center"
            style={{ textShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}>
          NASTAVITVE
        </h2>

        <div className="space-y-6">
          {/* Music Volume */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">
              GLASBA: {Math.round(localSettings.musicVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.musicVolume}
              onChange={(e) => setLocalSettings({ ...localSettings, musicVolume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">
              ZVOČNI EFEKTI: {Math.round(localSettings.sfxVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.sfxVolume}
              onChange={(e) => setLocalSettings({ ...localSettings, sfxVolume: parseFloat(e.target.value) })}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Particles Quality */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">
              KAKOVOST DELCEV
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => setLocalSettings({ ...localSettings, particles: quality })}
                  className={`flex-1 px-4 py-2 font-mono text-sm border-2 rounded transition-all ${
                    localSettings.particles === quality
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-400'
                      : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {quality === 'low' ? 'NIZKA' : quality === 'medium' ? 'SREDNJA' : 'VISOKA'}
                </button>
              ))}
            </div>
          </div>

          {/* Show FPS */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-mono text-gray-400">PRIKAŽI FPS</label>
            <button
              onClick={() => setLocalSettings({ ...localSettings, showFPS: !localSettings.showFPS })}
              className={`relative w-14 h-7 rounded-full transition-all ${
                localSettings.showFPS ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                  localSettings.showFPS ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Auto-Aim for Mobile */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-mono text-gray-400">AUTO-AIM</label>
              <p className="text-xs font-mono text-gray-500 mt-1">Samodejno namerjanje za mobilne naprave</p>
            </div>
            <button
              onClick={() => setLocalSettings({ ...localSettings, autoAim: !localSettings.autoAim })}
              className={`relative w-14 h-7 rounded-full transition-all ${
                localSettings.autoAim !== false ? 'bg-cyan-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                  localSettings.autoAim !== false ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button onClick={handleSave} variant="primary" className="flex-1">
            SHRANI
          </Button>
          <Button onClick={onClose} variant="secondary" className="flex-1">
            PREKLIČI
          </Button>
        </div>
      </div>
    </div>
  );
}
