import { useEffect, useState } from 'react';

interface ScreenShakeProps {
  intensity: number;
  duration: number;
  isActive: boolean;
}

export function ScreenShake({ intensity, duration, isActive }: ScreenShakeProps) {
  const [shake, setShake] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isActive) {
      setShake({ x: 0, y: 0 });
      return;
    }

    const shakeInterval = setInterval(() => {
      const x = (Math.random() - 0.5) * intensity;
      const y = (Math.random() - 0.5) * intensity;
      setShake({ x, y });
    }, 50);

    const timeout = setTimeout(() => {
      setShake({ x: 0, y: 0 });
    }, duration);

    return () => {
      clearInterval(shakeInterval);
      clearTimeout(timeout);
    };
  }, [isActive, intensity, duration]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-10"
      style={{
        transform: `translate(${shake.x}px, ${shake.y}px)`,
        transition: 'transform 0.05s ease-out'
      }}
    />
  );
}
