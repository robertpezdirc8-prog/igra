interface SingularityProps {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export function Singularity({ x, y, radius, intensity }: SingularityProps) {
  return (
    <div
      className="fixed pointer-events-none z-30"
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
          background: 'radial-gradient(circle, #000000 0%, #000000 60%, transparent 100%)',
          opacity: intensity,
          boxShadow: '0 0 50px #000000, inset 0 0 50px #000000'
        }}
      />
      {/* Accretion disk */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            inset: radius * (0.35 + i * 0.1),
            borderColor: `rgba(255, ${100 + i * 30}, 0, ${intensity * (0.8 - i * 0.1)})`,
            borderWidth: 2 - i * 0.3,
            animation: `accretionSpin ${5 + i * 2}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
          }}
        />
      ))}
      {/* Gravitational lensing */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(255, 100, 0, 0.1) 50%, transparent 70%)',
          opacity: intensity * 0.5,
          backdropFilter: 'blur(3px)',
          animation: 'gravitationalLensing 4s ease-in-out infinite'
        }}
      />
      {/* Hawking radiation */}
      {[...Array(20)].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = radius * (0.4 + Math.random() * 0.5);
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
              opacity: intensity * 0.6,
              animation: `hawkingRadiation ${2 + Math.random() * 3}s linear infinite ${Math.random() * 2}s`
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
          animation: 'timeDilation 10s linear infinite'
        }}
      />
    </div>
  );
}
