interface PlasmaStormProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function PlasmaStorm({ x, y, radius, color, intensity }: PlasmaStormProps) {
  return (
    <div
      className="fixed pointer-events-none z-34"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Storm core */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}88 0%, ${color}44 40%, transparent 70%)`,
          opacity: intensity,
          filter: 'blur(10px)',
          animation: 'plasmaStormPulse 1s ease-in-out infinite'
        }}
      />
      {/* Lightning bolts */}
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
              width: 3,
              height: length,
              background: `linear-gradient(180deg, ${color}, transparent)`,
              transformOrigin: '50% 0%',
              transform: `translate(-50%, 0) rotate(${angle}rad)`,
              opacity: intensity,
              filter: 'blur(1px)',
              boxShadow: `0 0 10px ${color}`,
              animation: `plasmaLightning ${0.2 + Math.random() * 0.3}s linear infinite ${Math.random() * 0.5}s`
            }}
          />
        );
      })}
      {/* Plasma tendrils */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = radius * (0.3 + Math.random() * 0.5);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 5 + Math.random() * 5,
              height: 5 + Math.random() * 5,
              left: '50%',
              top: '50%',
              background: color,
              boxShadow: `0 0 15px ${color}`,
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity * 0.8,
              animation: `plasmaTendril ${1 + Math.random()}s ease-in-out infinite ${Math.random()}s`
            }}
          />
        );
      })}
      {/* Energy sparks */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 2,
            height: 2,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: '#ffffff',
            boxShadow: `0 0 5px ${color}`,
            opacity: intensity,
            animation: `plasmaSpark ${0.5 + Math.random() * 0.5}s linear infinite ${Math.random() * 0.5}s`
          }}
        />
      ))}
    </div>
  );
}
