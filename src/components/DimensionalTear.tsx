interface DimensionalTearProps {
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

export function DimensionalTear({ x, y, width, height, intensity }: DimensionalTearProps) {
  return (
    <div
      className="fixed pointer-events-none z-28"
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
          animation: 'dimensionalPulse 3s ease-in-out infinite'
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
          animation: 'dimensionalEdge 2s ease-in-out infinite'
        }}
      />
      {/* Dimensional tears */}
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + Math.sin(i * 1.5) * 30}%`,
            width: 2,
            height: height * 0.5,
            background: 'linear-gradient(180deg, transparent, #ff00ff, transparent)',
            opacity: intensity * 0.6,
            transform: `rotate(${i * 10 - 30}deg)`,
            animation: `dimensionalTear ${2 + i * 0.3}s ease-in-out infinite ${i * 0.2}s`
          }}
        />
      ))}
      {/* Particle emission */}
      {[...Array(20)].map((_, i) => (
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
            animation: `dimensionalParticle ${3 + Math.random() * 2}s linear infinite ${Math.random() * 2}s`
          }}
        />
      ))}
      {/* Reality distortion */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: `blur(${intensity * 3}px)`,
          opacity: intensity * 0.3,
          animation: 'realityDistortion 4s ease-in-out infinite'
        }}
      />
    </div>
  );
}
