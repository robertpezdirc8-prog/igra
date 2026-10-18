import { useState } from 'react';
import { Button } from './Button';
import { BulletVisibility } from '../game/saveSystem';
import { t, useLang, setLanguage, getLanguage } from '../i18n';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    musicVolume: number;
    sfxVolume: number;
    showFPS: boolean;
    particles: 'low' | 'medium' | 'high';
    autoAim?: boolean;
    touchSensitivity?: number;
    leftHanded?: boolean;
    bigButtons?: boolean;
    bulletVisibility?: BulletVisibility;
  };
  onSettingsChange: (settings: any) => void;
}

export function SettingsMenu({ isOpen, onClose, settings, onSettingsChange }: SettingsMenuProps) {
  // Hooks must run unconditionally - never after an early return
  const [localSettings, setLocalSettings] = useState(settings);
  // Language applies INSTANTLY (display preference, not part of Save flow)
  useLang();

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
          {t('settings.title')}
        </h2>

        <div className="space-y-6">
          {/* Music Volume */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">
              {t('settings.music')}: {Math.round(localSettings.musicVolume * 100)}%
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
              {t('settings.sfx')}: {Math.round(localSettings.sfxVolume * 100)}%
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
              {t('settings.particles')}
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
                  {t(`settings.particles${quality === 'low' ? 'Low' : quality === 'medium' ? 'Medium' : 'High'}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Show FPS */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-mono text-gray-400">{t('settings.showFps')}</label>
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

          {/* Language (applies instantly, stored independently of the save) */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-1">
              {t('settings.language')}
            </label>
            <div className="flex gap-2">
              {(['sl', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  aria-pressed={getLanguage() === lang}
                  onClick={() => setLanguage(lang)}
                  className={`flex-1 px-3 py-2 font-mono text-xs border-2 rounded transition-all ${
                    getLanguage() === lang
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-400'
                      : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {lang === 'sl' ? 'SLOVENŠČINA' : 'ENGLISH'}
                </button>
              ))}
            </div>
          </div>

          {/* Bullet visibility (color-blind accessibility) */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-1">
              {t('settings.bullets')}
            </label>
            <p className="text-xs font-mono text-gray-500 mb-2">
              {t('settings.bulletsDesc')}
            </p>
            <div className="flex gap-2">
              {(['standard', 'contrast', 'mono'] as const).map((mode) => (
                <button
                  key={mode}
                  aria-pressed={localSettings.bulletVisibility === mode}
                  aria-label={t(
                    mode === 'standard'
                      ? 'settings.bulletsAriaStandard'
                      : mode === 'contrast'
                        ? 'settings.bulletsAriaContrast'
                        : 'settings.bulletsAriaMono'
                  )}
                  onClick={() => setLocalSettings({ ...localSettings, bulletVisibility: mode })}
                  className={`flex-1 px-3 py-2 font-mono text-xs border-2 rounded transition-all ${
                    (localSettings.bulletVisibility ?? 'standard') === mode
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-400'
                      : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {t(mode === 'standard' ? 'settings.bulletsStandard' : mode === 'contrast' ? 'settings.bulletsContrast' : 'settings.bulletsMono')}
                </button>
              ))}
            </div>
          </div>

          {/* Auto-Aim for Mobile */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-mono text-gray-400">{t('settings.autoAim')}</label>
              <p className="text-xs font-mono text-gray-500 mt-1">{t('settings.autoAimDesc')}</p>
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

          {/* ── Mobile control feel ── */}
          <div className="pt-4 border-t border-gray-700/60">
            <p className="text-xs font-mono text-cyan-300/70 mb-4 tracking-widest">{t('settings.mobileControls')}</p>

            {/* Drag sensitivity */}
            <div className="mb-4">
              <label className="block text-sm font-mono text-gray-400 mb-2">
                {t('settings.dragSensitivity')}: ×{(localSettings.touchSensitivity ?? 1.2).toFixed(1)}
              </label>
              <input
                type="range"
                min="0.6"
                max="2"
                step="0.1"
                value={localSettings.touchSensitivity ?? 1.2}
                onChange={(e) => setLocalSettings({ ...localSettings, touchSensitivity: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-xs font-mono text-gray-500 mt-1">{t('settings.dragSensitivityDesc')}</p>
            </div>

            {/* Left-handed layout */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="text-sm font-mono text-gray-400">{t('settings.leftHanded')}</label>
                <p className="text-xs font-mono text-gray-500 mt-1">{t('settings.leftHandedDesc')}</p>
              </div>
              <button
                onClick={() => setLocalSettings({ ...localSettings, leftHanded: !localSettings.leftHanded })}
                className={`relative w-14 h-7 rounded-full transition-all ${
                  localSettings.leftHanded ? 'bg-cyan-500' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                    localSettings.leftHanded ? 'left-8' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Bigger touch targets */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-mono text-gray-400">{t('settings.bigButtons')}</label>
                <p className="text-xs font-mono text-gray-500 mt-1">{t('settings.bigButtonsDesc')}</p>
              </div>
              <button
                onClick={() => setLocalSettings({ ...localSettings, bigButtons: !localSettings.bigButtons })}
                className={`relative w-14 h-7 rounded-full transition-all ${
                  localSettings.bigButtons ? 'bg-cyan-500' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                    localSettings.bigButtons ? 'left-8' : 'left-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button onClick={handleSave} variant="primary" className="flex-1">
            {t('common.save')}
          </Button>
          <Button onClick={onClose} variant="secondary" className="flex-1">
            {t('common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}
