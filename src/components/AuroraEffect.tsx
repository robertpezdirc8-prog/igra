interface AuroraEffectProps {
  intensity: number;
  color1: string;
  color2: string;
}

export function AuroraEffect({ intensity, color1, color2 }: AuroraEffectProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-3">
      {/* Aurora bands */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: 0,
            right: 0,
            top: `${20 + i * 15}%`,
            height: '20%',
            background: `linear-gradient(90deg, transparent 0%, ${i % 2 === 0 ? color1 : color2}44 30%, ${i % 2 === 0 ? color2 : color1}44 70%, transparent 100%)`,
            opacity: intensity * (0.3 + i * 0.1),
            filter: 'blur(30px)',
            animation: `auroraWave ${10 + i * 2}s ease-in-out infinite ${i * 2}s`
          }}
        />
      ))}
      {/* Shimmer effect */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${color1}22 30%, ${color2}22 70%, transparent 100%)`,
          opacity: intensity * 0.5,
          animation: 'auroraShimmer 5s ease-in-out infinite'
        }}
      />
    </div>
  );
}
