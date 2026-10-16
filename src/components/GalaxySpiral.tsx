interface GalaxySpiralProps {
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
}

export function GalaxySpiral({ x, y, radius, intensity, color }: GalaxySpiralProps) {
  return (
    <div
      className="fixed pointer-events-none z-42"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Galaxy core */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.3,
          background: `radial-gradient(circle, #ffffff 0%, ${color} 30%, transparent 70%)`,
          opacity: intensity,
          animation: 'galaxyCore 5s ease-in-out infinite'
        }}
      />
      {/* Spiral arms */}
      {[...Array(4)].map((_, armIndex) => (
        <div
          key={armIndex}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            width: radius * 0.8,
            height: radius * 0.2,
            background: `linear-gradient(90deg, ${color}88, transparent)`,
            transformOrigin: '0 50%',
            transform: `translate(0, -50%) rotate(${(armIndex / 4) * Math.PI * 2}rad)`,
            opacity: intensity * 0.6,
            filter: 'blur(10px)',
            animation: `galaxyArm ${20}s linear infinite`
          }}
        />
      ))}
      {/* Star clusters */}
      {[...Array(50)].map((_, i) => {
        const angle = (i / 50) * Math.PI * 4;
        const distance = radius * (0.2 + (i / 50) * 0.6);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 1 + Math.random() * 2,
              height: 1 + Math.random() * 2,
              left: '50%',
              top: '50%',
              background: i % 5 === 0 ? '#ffffff' : color,
              boxShadow: `0 0 3px ${i % 5 === 0 ? '#ffffff' : color}`,
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity * (0.5 + Math.random() * 0.5),
              animation: `galaxyStar ${3 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 3}s`
            }}
          />
        );
      })}
      {/* Galactic disk */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, transparent 30%, ${color}22 60%, transparent 100%)`,
          opacity: intensity * 0.4,
          filter: 'blur(15px)',
          animation: 'galaxyDisk 30s linear infinite'
        }}
      />
    </div>
  );
}
