interface EnergyVortexProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function EnergyVortex({ x, y, radius, color, intensity }: EnergyVortexProps) {
  return (
    <div
      className="fixed pointer-events-none z-33"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Vortex core */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.3,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: intensity,
          animation: 'vortexCore 2s ease-in-out infinite'
        }}
      />
      {/* Spiral arms */}
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            width: radius * 0.8,
            height: 4,
            background: `linear-gradient(90deg, ${color}, transparent)`,
            transformOrigin: '0 50%',
            transform: `translate(0, -50%) rotate(${(i / 4) * Math.PI * 2}rad)`,
            opacity: intensity * 0.8,
            filter: 'blur(2px)',
            animation: `vortexSpiral ${3}s linear infinite ${i * 0.25}s`
          }}
        />
      ))}
      {/* Energy rings */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            inset: radius * (0.1 + i * 0.12),
            borderColor: `${color}${Math.floor(intensity * 150).toString(16).padStart(2, '0')}`,
            borderWidth: 1,
            animation: `vortexRing ${4 + i}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
          }}
        />
      ))}
      {/* Orbiting particles */}
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
              animation: `vortexOrbit ${2 + Math.random() * 2}s linear infinite ${Math.random() * 2}s`
            }}
          />
        );
      })}
    </div>
  );
}
