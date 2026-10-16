interface ForceFieldProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  segments?: number;
}

export function ForceField({ x, y, radius, color, intensity, segments = 6 }: ForceFieldProps) {
  return (
    <div
      className="fixed pointer-events-none z-18"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Hexagonal shield */}
      <svg className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="forceFieldGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Outer hexagon */}
        <polygon
          points={Array.from({ length: segments }, (_, i) => {
            const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
            const px = radius + Math.cos(angle) * radius * 0.9;
            const py = radius + Math.sin(angle) * radius * 0.9;
            return `${px},${py}`;
          }).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity={intensity}
          filter="url(#forceFieldGlow)"
        />
        {/* Inner hexagon */}
        <polygon
          points={Array.from({ length: segments }, (_, i) => {
            const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
            const px = radius + Math.cos(angle) * radius * 0.6;
            const py = radius + Math.sin(angle) * radius * 0.6;
            return `${px},${py}`;
          }).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity={intensity * 0.5}
        />
        {/* Connecting lines */}
        {Array.from({ length: segments }, (_, i) => {
          const angle = (i / segments) * Math.PI * 2 - Math.PI / 2;
          const x1 = radius + Math.cos(angle) * radius * 0.6;
          const y1 = radius + Math.sin(angle) * radius * 0.6;
          const x2 = radius + Math.cos(angle) * radius * 0.9;
          const y2 = radius + Math.sin(angle) * radius * 0.9;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="1"
              opacity={intensity * 0.7}
            />
          );
        })}
      </svg>
      {/* Energy field */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, transparent 40%, ${color}22 70%, transparent 100%)`,
          opacity: intensity,
          animation: 'forceFieldPulse 2s ease-in-out infinite'
        }}
      />
    </div>
  );
}
