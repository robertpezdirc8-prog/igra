import { useState, useEffect } from 'react';

interface CrosshairProps {
  x: number;
  y: number;
  isActive: boolean;
}

export function Crosshair({ x, y, isActive }: CrosshairProps) {
  const [isShooting, setIsShooting] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsShooting(true);
      const timer = setTimeout(() => setIsShooting(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  return (
    <div
      className="fixed pointer-events-none z-40 transition-transform duration-75"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Outer ring */}
      <div
        className="absolute w-8 h-8 border-2 rounded-full transition-all duration-100"
        style={{
          borderColor: isShooting ? '#ff0044' : '#00ffff',
          boxShadow: isShooting
            ? '0 0 15px rgba(255, 0, 68, 0.8)'
            : '0 0 10px rgba(0, 255, 255, 0.6)',
          transform: isShooting ? 'scale(1.2)' : 'scale(1)'
        }}
      />

      {/* Inner dot */}
      <div
        className="absolute w-1 h-1 rounded-full"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: isShooting ? '#ff0044' : '#00ffff',
          boxShadow: isShooting
            ? '0 0 10px rgba(255, 0, 68, 0.8)'
            : '0 0 5px rgba(0, 255, 255, 0.8)'
        }}
      />

      {/* Cross lines */}
      <div
        className="absolute w-px h-3"
        style={{
          left: '50%',
          top: '-6px',
          transform: 'translateX(-50%)',
          backgroundColor: isShooting ? '#ff0044' : '#00ffff',
          opacity: 0.6
        }}
      />
      <div
        className="absolute w-px h-3"
        style={{
          left: '50%',
          bottom: '-6px',
          transform: 'translateX(-50%)',
          backgroundColor: isShooting ? '#ff0044' : '#00ffff',
          opacity: 0.6
        }}
      />
      <div
        className="absolute h-px w-3"
        style={{
          top: '50%',
          left: '-6px',
          transform: 'translateY(-50%)',
          backgroundColor: isShooting ? '#ff0044' : '#00ffff',
          opacity: 0.6
        }}
      />
      <div
        className="absolute h-px w-3"
        style={{
          top: '50%',
          right: '-6px',
          transform: 'translateY(-50%)',
          backgroundColor: isShooting ? '#ff0044' : '#00ffff',
          opacity: 0.6
        }}
      />
    </div>
  );
}
