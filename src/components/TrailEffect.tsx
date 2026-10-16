interface TrailEffectProps {
  points: Array<{ x: number; y: number; opacity: number }>;
  color: string;
  width: number;
}

export function TrailEffect({ points, color, width }: TrailEffectProps) {
  if (points.length < 2) return null;

  return (
    <svg className="fixed inset-0 pointer-events-none z-15" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={`M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
        fill="none"
        stroke="url(#trailGradient)"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow)"
        opacity="0.8"
      />
    </svg>
  );
}
