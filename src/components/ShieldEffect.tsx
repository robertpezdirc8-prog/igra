interface ShieldEffectProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  health: number; // 0-1
}

export function ShieldEffect({ x, y, radius, color, intensity, health }: ShieldEffectProps) {
  return (
    <div
      className="fixed pointer-events-none z-23"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Shield dome */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, transparent 60%, ${color}44 80%, ${color}22 100%)`,
          opacity: intensity * health,
          border: `2px solid ${color}`,
          boxShadow: `0 0 30px ${color}, inset 0 0 30px ${color}`,
          animation: 'shieldPulse 2s ease-in-out infinite'
        }}
      />
      {/* Energy hexagons */}
      <svg className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <defs>
          <pattern id="shieldHex" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <polygon
              points="10,0 20,5 20,15 10,20 0,15 0,5"
              fill="none"
              stroke={color}
              strokeWidth="0.5"
              opacity={intensity * health * 0.5}
            />
          </pattern>
        </defs>
        <circle
          cx={radius}
          cy={radius}
          r={radius * 0.9}
          fill="url(#shieldHex)"
          opacity={intensity * health * 0.3}
        />
      </svg>
      {/* Shield segments based on health */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const isActive = i / 8 < health;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: radius * 0.8,
              height: 3,
              background: isActive ? color : 'transparent',
              transformOrigin: '0 50%',
              transform: `translate(0, -50%) rotate(${angle}rad)`,
              opacity: intensity * (isActive ? 0.8 : 0.2),
              boxShadow: isActive ? `0 0 10px ${color}` : 'none',
              animation: isActive ? `shieldSegment ${1 + i * 0.1}s ease-in-out infinite` : 'none'
            }}
          />
        );
      })}
    </div>
  );
}
