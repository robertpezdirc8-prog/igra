interface SolarFlareProps {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export function SolarFlare({ x, y, radius, intensity }: SolarFlareProps) {
  return (
    <div
      className="fixed pointer-events-none z-41"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Solar core */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.3,
          background: 'radial-gradient(circle, #ffffff 0%, #ffff00 30%, #ff8800 60%, transparent 100%)',
          opacity: intensity,
          animation: 'solarCore 2s ease-in-out infinite'
        }}
      />
      {/* Corona */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, transparent 40%, rgba(255, 136, 0, 0.3) 60%, transparent 100%)',
          opacity: intensity * 0.6,
          filter: 'blur(20px)',
          animation: 'solarCorona 3s ease-in-out infinite'
        }}
      />
      {/* Solar flares */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const length = radius * (0.5 + Math.random() * 0.5);
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: 6,
              height: length,
              background: 'linear-gradient(180deg, #ffffff, #ffff00, #ff8800, transparent)',
              transformOrigin: '50% 0%',
              transform: `translate(-50%, 0) rotate(${angle}rad)`,
              opacity: intensity * 0.8,
              filter: 'blur(2px)',
              animation: `solarFlare ${2 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`
            }}
          />
        );
      })}
      {/* Plasma loops */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        return (
          <div
            key={i}
            className="absolute rounded-full border-2"
            style={{
              left: '50%',
              top: '50%',
              width: radius * 0.6,
              height: radius * 0.8,
              borderColor: 'rgba(255, 136, 0, 0.5)',
              transform: `translate(-50%, -50%) rotate(${angle}rad)`,
              opacity: intensity * 0.5,
              animation: `solarLoop ${3 + i}s ease-in-out infinite ${i * 0.5}s`
            }}
          />
        );
      })}
    </div>
  );
}
