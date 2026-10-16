interface PlasmaEffectProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function PlasmaEffect({ x, y, radius, color, intensity }: PlasmaEffectProps) {
  return (
    <div
      className="fixed pointer-events-none z-20"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Plasma core */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color} 0%, ${color}88 30%, transparent 70%)`,
          opacity: intensity,
          filter: 'blur(5px)',
          animation: 'plasmaPulse 1s ease-in-out infinite'
        }}
      />
      {/* Plasma tendrils */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const length = radius * (0.5 + Math.random() * 0.5);
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: length,
              height: 4,
              background: `linear-gradient(90deg, ${color}, transparent)`,
              transformOrigin: '0 50%',
              transform: `translate(0, -50%) rotate(${angle}rad)`,
              opacity: intensity * 0.8,
              filter: 'blur(2px)',
              animation: `plasmaTendril ${1 + Math.random()}s ease-in-out infinite ${Math.random()}s`
            }}
          />
        );
      })}
      {/* Energy sparks */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            left: '50%',
            top: '50%',
            background: '#ffffff',
            boxShadow: `0 0 10px ${color}`,
            transform: `translate(-50%, -50%) rotate(${(i / 12) * Math.PI * 2}rad) translateX(${radius * 0.7}px)`,
            opacity: intensity,
            animation: `sparkOrbit ${2 + Math.random()}s linear infinite ${Math.random()}s`
          }}
        />
      ))}
    </div>
  );
}
