interface DistortionFieldProps {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export function DistortionField({ x, y, radius, intensity }: DistortionFieldProps) {
  return (
    <div
      className="fixed pointer-events-none z-17"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2,
        backdropFilter: `blur(${intensity * 5}px)`,
        maskImage: `radial-gradient(circle, black 0%, transparent 70%)`,
        WebkitMaskImage: `radial-gradient(circle, black 0%, transparent 70%)`,
        animation: 'distortionPulse 2s ease-in-out infinite'
      }}
    />
  );
}
