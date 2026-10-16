interface WormholeProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function Wormhole({ x, y, radius, color, intensity }: WormholeProps) {
  return (
    <div
      className="fixed pointer-events-none z-40"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Wormhole throat */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.3,
          background: `radial-gradient(circle, #000000 0%, ${color}44 50%, transparent 100%)`,
          opacity: intensity,
          boxShadow: `0 0 50px ${color}`,
          animation: 'wormholeThroat 3s ease-in-out infinite'
        }}
      />
      {/* Spiral rings */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2"
          style={{
            inset: radius * (0.1 + i * 0.08),
            borderColor: `${color}${Math.floor(intensity * (200 - i * 15)).toString(16).padStart(2, '0')}`,
            animation: `wormholeSpiral ${3 + i * 0.5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
          }}
        />
      ))}
      {/* Energy streams */}
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = radius * (0.4 + Math.random() * 0.4);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3,
              height: 3,
              left: '50%',
              top: '50%',
              background: color,
              boxShadow: `0 0 10px ${color}`,
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity,
              animation: `wormholeStream ${2 + Math.random() * 2}s linear infinite ${Math.random() * 2}s`
            }}
          />
        );
      })}
      {/* Gravitational distortion */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          backdropFilter: `blur(${intensity * 3}px)`,
          opacity: intensity * 0.3,
          animation: 'wormholeDistortion 4s ease-in-out infinite'
        }}
      />
      {/* Event horizon glow */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.35,
          border: `3px solid ${color}`,
          opacity: intensity * 0.8,
          boxShadow: `inset 0 0 30px ${color}, 0 0 30px ${color}`,
          animation: 'wormholeHorizon 2s ease-in-out infinite'
        }}
      />
    </div>
  );
}
