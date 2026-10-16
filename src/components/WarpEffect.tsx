interface WarpEffectProps {
  centerX: number;
  centerY: number;
  radius: number;
  intensity: number;
  direction: 'in' | 'out';
}

export function WarpEffect({ centerX, centerY, radius, intensity, direction }: WarpEffectProps) {
  return (
    <div
      className="fixed pointer-events-none z-32"
      style={{
        left: centerX - radius,
        top: centerY - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Warp tunnel */}
      {[...Array(10)].map((_, i) => {
        const scale = direction === 'in' ? (1 - i / 10) : (i / 10);
        return (
          <div
            key={i}
            className="absolute rounded-full border"
            style={{
              inset: `${i * 10}%`,
              borderColor: `rgba(0, 255, 255, ${intensity * (1 - i / 10)})`,
              borderWidth: 2,
              transform: `scale(${scale})`,
              animation: `warpTunnel ${1}s linear infinite ${i * 0.1}s`
            }}
          />
        );
      })}
      {/* Speed lines */}
      {[...Array(30)].map((_, i) => {
        const angle = (i / 30) * Math.PI * 2;
        const length = radius * 0.8;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: 2,
              height: length,
              background: `linear-gradient(180deg, transparent, rgba(0, 255, 255, ${intensity * 0.5}), transparent)`,
              transformOrigin: '50% 0%',
              transform: `translate(-50%, 0) rotate(${angle}rad)`,
              animation: `warpSpeedLine ${0.5 + Math.random() * 0.5}s linear infinite ${Math.random() * 0.5}s`
            }}
          />
        );
      })}
      {/* Center flash */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.3,
          background: 'radial-gradient(circle, #ffffff 0%, rgba(0, 255, 255, 0.5) 50%, transparent 100%)',
          opacity: intensity * 0.8,
          animation: direction === 'in' ? 'warpFlashIn 1s ease-in forwards' : 'warpFlashOut 1s ease-out forwards'
        }}
      />
    </div>
  );
}
