interface PortalEffectProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function PortalEffect({ x, y, radius, color, intensity }: PortalEffectProps) {
  return (
    <div
      className="fixed pointer-events-none z-19"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, transparent 30%, ${color}44 60%, transparent 100%)`,
          opacity: intensity,
          animation: 'portalPulse 2s ease-in-out infinite'
        }}
      />
      {/* Spiral rings */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2"
          style={{
            inset: radius * (0.1 + i * 0.15),
            borderColor: `${color}${Math.floor(intensity * 200).toString(16).padStart(2, '0')}`,
            animation: `spin ${2 + i * 0.5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
          }}
        />
      ))}
      {/* Center vortex */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.3,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: intensity * 0.8,
          animation: 'vortexSpin 3s linear infinite'
        }}
      />
      {/* Energy particles */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4,
              height: 4,
              left: '50%',
              top: '50%',
              background: color,
              boxShadow: `0 0 10px ${color}`,
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${radius * 0.6}px)`,
              animation: `orbitParticle ${3 + i * 0.2}s linear infinite`
            }}
          />
        );
      })}
    </div>
  );
}
