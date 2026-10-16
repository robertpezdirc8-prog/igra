interface EnergyFieldProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function EnergyField({ x, y, radius, color, intensity }: EnergyFieldProps) {
  return (
    <div
      className="fixed pointer-events-none z-16"
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
          background: `radial-gradient(circle, ${color}00 0%, ${color}44 50%, ${color}00 100%)`,
          opacity: intensity,
          animation: 'pulse 2s ease-in-out infinite'
        }}
      />
      {/* Inner field */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.2,
          background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
          opacity: intensity,
          animation: 'pulse 1.5s ease-in-out infinite reverse'
        }}
      />
      {/* Energy rings */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            inset: radius * (0.3 + i * 0.2),
            borderColor: `${color}${Math.floor(intensity * 100).toString(16).padStart(2, '0')}`,
            borderWidth: 1,
            animation: `spin ${3 + i}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
          }}
        />
      ))}
    </div>
  );
}
