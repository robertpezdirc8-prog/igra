import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  velocityX: number;
  velocityY: number;
}

interface ParticleOverlayProps {
  isActive: boolean;
}

export function ParticleOverlay({ isActive }: ParticleOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    const interval = setInterval(() => {
      setParticles((prev) => {
        // Add new particles
        const newParticles: Particle[] = [];
        for (let i = 0; i < 3; i++) {
          newParticles.push({
            id: Date.now() + Math.random(),
            x: Math.random() * window.innerWidth,
            y: window.innerHeight + 10,
            size: Math.random() * 3 + 1,
            color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff',
            opacity: Math.random() * 0.5 + 0.3,
            velocityX: (Math.random() - 0.5) * 2,
            velocityY: -(Math.random() * 3 + 2)
          });
        }

        // Update existing particles
        const updated = prev
          .map((p) => ({
            ...p,
            x: p.x + p.velocityX,
            y: p.y + p.velocityY,
            opacity: p.opacity - 0.005
          }))
          .filter((p) => p.opacity > 0 && p.y > -10);

        return [...updated, ...newParticles].slice(-100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-5">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transition: 'all 0.1s linear'
          }}
        />
      ))}
    </div>
  );
}
