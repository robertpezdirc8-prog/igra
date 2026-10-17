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

  // Clear particles when deactivating (render-time state adjustment -
  // the documented React pattern instead of a synchronous setState in an effect)
  const [prevActive, setPrevActive] = useState(isActive);
  if (prevActive !== isActive) {
    setPrevActive(isActive);
    if (!isActive) {
      setParticles([]);
    }
  }

  useEffect(() => {
    if (!isActive) {
      return;
    }

    // Monotonic id counter — Date.now()+random() collided within the same
    // millisecond and React dropped particles with duplicate keys.
    let particleId = 0;
    const interval = setInterval(() => {
      setParticles((prev) => {
        // Add new particles
        const newParticles: Particle[] = [];
        for (let i = 0; i < 3; i++) {
          newParticles.push({
            id: ++particleId,
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
