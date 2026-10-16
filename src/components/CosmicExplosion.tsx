interface CosmicExplosionProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function CosmicExplosion({ x, y, radius, color, intensity }: CosmicExplosionProps) {
  return (
    <div
      className="fixed pointer-events-none z-36"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Core flash */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, #ffffff 0%, ${color} 30%, transparent 70%)`,
          opacity: intensity,
          animation: 'cosmicExplosionFlash 0.5s ease-out forwards'
        }}
      />
      {/* Shockwave */}
      <div
        className="absolute inset-0 rounded-full border-4"
        style={{
          borderColor: color,
          opacity: intensity * 0.8,
          boxShadow: `0 0 50px ${color}, inset 0 0 50px ${color}`,
          animation: 'cosmicExplosionShockwave 1s ease-out forwards'
        }}
      />
      {/* Energy rings */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2"
          style={{
            inset: radius * (0.1 + i * 0.15),
            borderColor: `${color}${Math.floor(intensity * 200).toString(16).padStart(2, '0')}`,
            opacity: intensity * (1 - i * 0.15),
            animation: `cosmicExplosionRing ${0.8 + i * 0.2}s ease-out forwards ${i * 0.1}s`
          }}
        />
      ))}
      {/* Debris particles */}
      {[...Array(30)].map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const distance = radius * (0.5 + Math.random() * 0.5);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3 + Math.random() * 4,
              height: 3 + Math.random() * 4,
              left: '50%',
              top: '50%',
              background: i % 3 === 0 ? '#ffffff' : color,
              boxShadow: `0 0 10px ${i % 3 === 0 ? '#ffffff' : color}`,
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity,
              animation: `cosmicExplosionDebris ${1 + Math.random()}s ease-out forwards ${Math.random() * 0.3}s`
            }}
          />
        );
      })}
      {/* Energy tendrils */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const length = radius * (0.6 + Math.random() * 0.4);
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: 4,
              height: length,
              background: `linear-gradient(180deg, ${color}, transparent)`,
              transformOrigin: '50% 0%',
              transform: `translate(-50%, 0) rotate(${angle}rad)`,
              opacity: intensity * 0.8,
              filter: 'blur(2px)',
              animation: `cosmicExplosionTendril ${0.8}s ease-out forwards ${i * 0.05}s`
            }}
          />
        );
      })}
    </div>
  );
}
