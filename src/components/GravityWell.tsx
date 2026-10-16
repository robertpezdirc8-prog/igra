interface GravityWellProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function GravityWell({ x, y, radius, color, intensity }: GravityWellProps) {
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
      {/* Dark core */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.3,
          background: `radial-gradient(circle, #000000 0%, ${color}44 50%, transparent 100%)`,
          opacity: intensity,
          boxShadow: `0 0 50px ${color}88`
        }}
      />
      {/* Accretion disk */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            inset: radius * (0.4 + i * 0.15),
            borderColor: `${color}${Math.floor(intensity * 150).toString(16).padStart(2, '0')}`,
            borderWidth: 2 - i * 0.5,
            animation: `spin ${4 + i}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
          }}
        />
      ))}
      {/* Gravitational lensing effect */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, transparent 30%, ${color}22 50%, transparent 70%)`,
          opacity: intensity * 0.5,
          backdropFilter: 'blur(2px)',
          animation: 'gravityPulse 3s ease-in-out infinite'
        }}
      />
      {/* Event horizon */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.35,
          border: `2px solid ${color}`,
          opacity: intensity * 0.8,
          boxShadow: `inset 0 0 20px ${color}, 0 0 20px ${color}`
        }}
      />
    </div>
  );
}
