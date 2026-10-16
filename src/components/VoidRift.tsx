interface VoidRiftProps {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

export function VoidRift({ x, y, width, height, intensity }: VoidRiftProps) {
  return (
    <div
      className="fixed pointer-events-none z-21"
      style={{
        left: x - width / 2,
        top: y - height / 2,
        width: width,
        height: height
      }}
    >
      {/* Void core */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse, #000000 0%, #1a0033 50%, transparent 100%)',
          opacity: intensity,
          animation: 'voidPulse 3s ease-in-out infinite'
        }}
      />
      {/* Energy edges */}
      <div
        className="absolute inset-0"
        style={{
          border: '2px solid #ff00ff',
          borderRadius: '50%',
          opacity: intensity * 0.8,
          boxShadow: '0 0 30px #ff00ff, inset 0 0 30px #ff00ff',
          animation: 'voidEdge 2s ease-in-out infinite'
        }}
      />
      {/* Dimensional tears */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + Math.sin(i) * 20}%`,
            width: 2,
            height: height * 0.4,
            background: 'linear-gradient(180deg, transparent, #ff00ff, transparent)',
            opacity: intensity * 0.6,
            transform: `rotate(${i * 15}deg)`,
            animation: `voidTear ${2 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`
          }}
        />
      ))}
      {/* Particle emission */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2,
            height: 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: '#ff00ff',
            boxShadow: '0 0 5px #ff00ff',
            opacity: intensity * 0.8,
            animation: `voidParticle ${3 + Math.random() * 2}s linear infinite ${Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}
