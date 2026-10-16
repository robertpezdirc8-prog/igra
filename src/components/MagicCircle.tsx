interface MagicCircleProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  rotationSpeed?: number;
}

export function MagicCircle({ x, y, radius, color, intensity, rotationSpeed = 1 }: MagicCircleProps) {
  return (
    <div
      className="fixed pointer-events-none z-27"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      <svg className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="magicGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Outer circle */}
        <circle
          cx={radius}
          cy={radius}
          r={radius * 0.9}
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity={intensity}
          filter="url(#magicGlow)"
          style={{ animation: `spin ${10 / rotationSpeed}s linear infinite` }}
        />
        
        {/* Inner circle */}
        <circle
          cx={radius}
          cy={radius}
          r={radius * 0.6}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity={intensity * 0.7}
          style={{ animation: `spin ${8 / rotationSpeed}s linear infinite reverse` }}
        />
        
        {/* Pentagram */}
        <polygon
          points={Array.from({ length: 5 }, (_, i) => {
            const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
            const px = radius + Math.cos(angle) * radius * 0.7;
            const py = radius + Math.sin(angle) * radius * 0.7;
            return `${px},${py}`;
          }).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity={intensity * 0.8}
          style={{ animation: `spin ${15 / rotationSpeed}s linear infinite` }}
        />
        
        {/* Runes */}
        {Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const px = radius + Math.cos(angle) * radius * 0.75;
          const py = radius + Math.sin(angle) * radius * 0.75;
          return (
            <text
              key={i}
              x={px}
              y={py}
              fill={color}
              fontSize="12"
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={intensity * 0.6}
              style={{ animation: `runeGlow ${2 + i * 0.2}s ease-in-out infinite ${i * 0.1}s` }}
            >
              {['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ'][i]}
            </text>
          );
        })}
        
        {/* Connecting lines */}
        {Array.from({ length: 6 }, (_, i) => {
          const angle1 = (i / 6) * Math.PI * 2;
          const angle2 = ((i + 2) / 6) * Math.PI * 2;
          const x1 = radius + Math.cos(angle1) * radius * 0.9;
          const y1 = radius + Math.sin(angle1) * radius * 0.9;
          const x2 = radius + Math.cos(angle2) * radius * 0.9;
          const y2 = radius + Math.sin(angle2) * radius * 0.9;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="0.5"
              opacity={intensity * 0.4}
            />
          );
        })}
      </svg>
      
      {/* Center glow */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.3,
          background: `radial-gradient(circle, ${color}44 0%, transparent 70%)`,
          opacity: intensity,
          animation: 'magicPulse 2s ease-in-out infinite'
        }}
      />
    </div>
  );
}
