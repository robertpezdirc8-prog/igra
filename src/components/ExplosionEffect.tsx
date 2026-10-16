interface ExplosionEffectProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function ExplosionEffect({ x, y, radius, color, intensity }: ExplosionEffectProps) {
  return (
    <div
      className="fixed pointer-events-none z-26"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Core flash */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, #ffffff 0%, ${color} 30%, transparent 70%)`,
          opacity: intensity,
          animation: 'explosionFlash 0.3s ease-out forwards'
        }}
      />
      {/* Shockwave ring */}
      <div
        className="absolute inset-0 rounded-full border-4"
        style={{
          borderColor: color,
          opacity: intensity * 0.8,
          animation: 'shockwaveExpand 0.5s ease-out forwards'
        }}
      />
      {/* Debris particles */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = radius * 0.8;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4 + Math.random() * 4,
              height: 4 + Math.random() * 4,
              left: '50%',
              top: '50%',
              background: color,
              boxShadow: `0 0 10px ${color}`,
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity,
              animation: `debrisFly 0.6s ease-out forwards`
            }}
          />
        );
      })}
    </div>
  );
}
