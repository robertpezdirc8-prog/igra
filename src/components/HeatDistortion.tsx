interface HeatDistortionProps {
  intensity: number;
  isActive: boolean;
}

export function HeatDistortion({ intensity, isActive }: HeatDistortionProps) {
  if (!isActive) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-17"
      style={{
        backdropFilter: `blur(${intensity * 2}px)`,
        opacity: intensity * 0.5,
        animation: 'heatDistortion 2s ease-in-out infinite'
      }}
    />
  );
}
