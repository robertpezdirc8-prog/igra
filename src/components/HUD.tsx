import { useEffect, useState } from 'react';
import { t, useLang } from '../i18n';

interface HUDBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  icon?: string;
  showText?: boolean;
}

export function HUDBar({ label, value, maxValue, color, icon, showText = true }: HUDBarProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const percentage = (value / maxValue) * 100;

  useEffect(() => {
    const timer = setTimeout(() => setDisplayValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative">
      {/* Label */}
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">{label}</span>
        {showText && (
          <span className="ml-auto text-xs font-mono" style={{ color }}>
            {Math.ceil(displayValue)}/{maxValue}
          </span>
        )}
      </div>

      {/* Bar container */}
      <div className="relative h-4 bg-black/60 border border-gray-700 rounded overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `linear-gradient(90deg, ${color}44 0%, transparent 100%)` }}
        />

        {/* Fill bar */}
        <div
          className="absolute inset-y-0 left-0 transition-all duration-300 ease-out"
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
            boxShadow: `0 0 10px ${color}88, inset 0 0 5px ${color}44`
          }}
        >
          {/* Shine effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
            }}
          />
        </div>

        {/* Tick marks */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="absolute inset-y-0 w-px bg-gray-600/30"
            style={{ left: `${(i + 1) * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
}

interface ComboCounterProps {
  combo: number;
  isVisible: boolean;
}

export function ComboCounter({ combo, isVisible }: ComboCounterProps) {
  useLang();
  if (!isVisible || combo <= 1) return null;

  return (
    <div className="fixed top-1/4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div
        className="text-center animate-bounce"
        style={{
          animation: 'pulse 0.5s ease-in-out infinite'
        }}
      >
        <div
          className="text-6xl font-bold font-mono"
          style={{
            color: '#ffaa00',
            textShadow: '0 0 20px rgba(255, 170, 0, 0.8), 0 0 40px rgba(255, 170, 0, 0.4)',
            animation: 'glow 1s ease-in-out infinite alternate'
          }}
        >
          {combo}x
        </div>
        <div
          className="text-xl font-mono uppercase tracking-widest"
          style={{
            color: '#ff8800',
            textShadow: '0 0 10px rgba(255, 136, 0, 0.6)'
          }}
        >
          {t('combo.big')}
        </div>
      </div>
    </div>
  );
}

interface WaveAnnouncementProps {
  wave: number;
  isBoss: boolean;
  isVisible: boolean;
}

export function WaveAnnouncement({ wave, isBoss, isVisible }: WaveAnnouncementProps) {
  useLang();
  if (!isVisible) return null;

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="text-center animate-pulse">
        <div
          className="text-5xl font-bold font-mono mb-2"
          style={{
            color: isBoss ? '#ff00ff' : '#00ffff',
            textShadow: isBoss
              ? '0 0 30px rgba(255, 0, 255, 0.8), 0 0 60px rgba(255, 0, 255, 0.4)'
              : '0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.4)'
          }}
        >
          {isBoss ? t('hud.voidBreach') : t('hud.waveN', { n: wave })}
        </div>
        <div
          className="text-xl font-mono"
          style={{
            color: isBoss ? '#ff44ff' : '#88ffff',
            textShadow: isBoss
              ? '0 0 15px rgba(255, 68, 255, 0.6)'
              : '0 0 15px rgba(136, 255, 255, 0.6)'
          }}
        >
          {isBoss ? t('hud.bossIncoming') : t('hud.hostilesDetected', { n: 3 + wave * 2 })}
        </div>
      </div>
    </div>
  );
}
