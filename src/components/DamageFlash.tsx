import { useEffect, useState } from 'react';

interface DamageFlashProps {
  isActive: boolean;
  intensity: number; // 0-1
}

export function DamageFlash({ isActive, intensity }: DamageFlashProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-30 transition-opacity duration-300"
      style={{
        opacity: isVisible ? intensity : 0,
        background: `radial-gradient(ellipse at center, transparent 30%, rgba(255, 0, 0, ${0.3 * intensity}) 100%)`,
        boxShadow: `inset 0 0 100px rgba(255, 0, 0, ${0.5 * intensity})`
      }}
    >
      {/* Vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%)'
        }}
      />

      {/* Blood splatter effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(255, 0, 0, 0.4) 0%, transparent 20%),
            radial-gradient(circle at 80% 70%, rgba(255, 0, 0, 0.4) 0%, transparent 20%),
            radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0.2) 0%, transparent 30%)
          `
        }}
      />
    </div>
  );
}
