interface HologramEffectProps {
  isActive: boolean;
  intensity: number;
}

export function HologramEffect({ isActive, intensity }: HologramEffectProps) {
  if (!isActive) return null;

  return (
    <>
      {/* Scan lines */}
      <div
        className="fixed inset-0 pointer-events-none z-27"
        style={{
          background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, ${intensity * 0.1}) 2px, rgba(0, 255, 255, ${intensity * 0.1}) 4px)`,
          animation: 'hologramScan 3s linear infinite'
        }}
      />
      {/* Color aberration */}
      <div
        className="fixed inset-0 pointer-events-none z-27"
        style={{
          background: `linear-gradient(90deg, rgba(255, 0, 0, ${intensity * 0.05}), transparent, rgba(0, 0, 255, ${intensity * 0.05}))`,
          animation: 'hologramShift 2s ease-in-out infinite'
        }}
      />
      {/* Flicker effect */}
      <div
        className="fixed inset-0 pointer-events-none z-27"
        style={{
          background: `rgba(0, 255, 255, ${intensity * 0.02})`,
          animation: 'hologramFlicker 0.1s infinite'
        }}
      />
    </>
  );
}
