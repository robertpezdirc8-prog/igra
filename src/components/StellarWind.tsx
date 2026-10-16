interface StellarWindProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  color: string;
  intensity: number;
}

export function StellarWind({ startX, startY, endX, endY, width, color, intensity }: StellarWindProps) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div
      className="fixed pointer-events-none z-37"
      style={{
        left: startX,
        top: startY,
        width: length,
        height: width,
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 50%'
      }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${color}00 0%, ${color}44 30%, ${color}44 70%, ${color}00 100%)`,
          opacity: intensity * 0.3,
          filter: 'blur(20px)',
          animation: 'stellarWindPulse 2s ease-in-out infinite'
        }}
      />
      {/* Main wind */}
      <div
        className="absolute inset-y-0 left-0 right-0"
        style={{
          background: `linear-gradient(90deg, ${color}00 0%, ${color}88 20%, ${color}88 80%, ${color}00 100%)`,
          opacity: intensity * 0.6,
          animation: 'stellarWindFlow 1s linear infinite'
        }}
      />
      {/* Core stream */}
      <div
        className="absolute"
        style={{
          top: '50%',
          left: 0,
          right: 0,
          height: width * 0.3,
          transform: 'translateY(-50%)',
          background: `linear-gradient(90deg, transparent 0%, #ffffff 20%, #ffffff 80%, transparent 100%)`,
          opacity: intensity * 0.8,
          animation: 'stellarWindCore 0.5s linear infinite'
        }}
      />
      {/* Particle streams */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2 + Math.random() * 3,
            height: 2 + Math.random() * 3,
            left: `${(i / 30) * 100}%`,
            top: `${20 + Math.random() * 60}%`,
            background: i % 4 === 0 ? '#ffffff' : color,
            boxShadow: `0 0 5px ${i % 4 === 0 ? '#ffffff' : color}`,
            opacity: intensity,
            animation: `stellarWindParticle ${0.5 + Math.random() * 0.5}s linear infinite ${i * 0.03}s`
          }}
        />
      ))}
      {/* Turbulence */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 10 + Math.random() * 20,
            height: 10 + Math.random() * 20,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `radial-gradient(circle, ${color}44, transparent)`,
            opacity: intensity * 0.3,
            filter: 'blur(5px)',
            animation: `stellarWindTurbulence ${2 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}
