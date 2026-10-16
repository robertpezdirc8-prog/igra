interface BlackHoleProps {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export function BlackHole({ x, y, radius, intensity }: BlackHoleProps) {
  return (
    <div
      className="fixed pointer-events-none z-39"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Event horizon */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.3,
          background: 'radial-gradient(circle, #000000 0%, #000000 70%, transparent 100%)',
          opacity: intensity,
          boxShadow: '0 0 100px #000000, inset 0 0 100px #000000'
        }}
      />
      {/* Accretion disk */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            inset: radius * (0.35 + i * 0.07),
            borderColor: `rgba(255, ${150 - i * 15}, 0, ${intensity * (0.9 - i * 0.1)})`,
            borderWidth: 3 - i * 0.3,
            animation: `blackHoleAccretion ${6 + i * 2}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
          }}
        />
      ))}
      {/* Gravitational lensing */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(255, 100, 0, 0.15) 50%, transparent 70%)',
          opacity: intensity * 0.6,
          backdropFilter: 'blur(5px)',
          animation: 'blackHoleLensing 5s ease-in-out infinite'
        }}
      />
      {/* Relativistic jets */}
      {[0, Math.PI].map((angle, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            width: 6,
            height: radius * 1.5,
            background: `linear-gradient(180deg, transparent, #00ffff, #ffffff, #00ffff, transparent)`,
            transformOrigin: '50% 0%',
            transform: `translate(-50%, 0) rotate(${angle}rad)`,
            opacity: intensity * 0.7,
            filter: 'blur(2px)',
            animation: `blackHoleJet ${2}s ease-in-out infinite ${i * 1}s`
          }}
        />
      ))}
      {/* Hawking radiation */}
      {[...Array(40)].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = radius * (0.35 + Math.random() * 0.6);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 1 + Math.random() * 2,
              height: 1 + Math.random() * 2,
              left: '50%',
              top: '50%',
              background: '#ffffff',
              boxShadow: '0 0 5px #ffffff',
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity * 0.5,
              animation: `hawkingRadiation ${3 + Math.random() * 4}s linear infinite ${Math.random() * 3}s`
            }}
          />
        );
      })}
      {/* Time dilation effect */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.1)',
          opacity: intensity * 0.3,
          animation: 'blackHoleTimeDilation 15s linear infinite'
        }}
      />
    </div>
  );
}
