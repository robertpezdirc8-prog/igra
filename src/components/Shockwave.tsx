interface ShockwaveProps {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  opacity: number;
}

export function Shockwave({ x, y, radius, maxRadius, color, opacity }: ShockwaveProps) {
  const progress = radius / maxRadius;
  const currentOpacity = opacity * (1 - progress);

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
      {/* Outer ring */}
      <div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: color,
          opacity: currentOpacity,
          boxShadow: `0 0 20px ${color}, inset 0 0 20px ${color}`
        }}
      />
      {/* Inner ring */}
      <div
        className="absolute rounded-full border"
        style={{
          inset: radius * 0.3,
          borderColor: color,
          opacity: currentOpacity * 0.5,
          boxShadow: `0 0 10px ${color}`
        }}
      />
      {/* Center flash */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.4,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: currentOpacity * 0.3
        }}
      />
    </div>
  );
}
