interface CosmicWebProps {
  intensity: number;
  color: string;
}

export function CosmicWeb({ intensity, color }: CosmicWebProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-5">
      <svg className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="cosmicWebGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Web connections */}
        {[...Array(30)].map((_, i) => {
          const x1 = Math.random() * 100;
          const y1 = Math.random() * 100;
          const x2 = Math.random() * 100;
          const y2 = Math.random() * 100;
          return (
            <line
              key={i}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke={color}
              strokeWidth="0.5"
              opacity={intensity * 0.3}
              filter="url(#cosmicWebGlow)"
              style={{ animation: `cosmicWebPulse ${5 + Math.random() * 5}s ease-in-out infinite ${Math.random() * 5}s` }}
            />
          );
        })}
        {/* Nodes */}
        {[...Array(20)].map((_, i) => (
          <circle
            key={i}
            cx={`${Math.random() * 100}%`}
            cy={`${Math.random() * 100}%`}
            r="2"
            fill={color}
            opacity={intensity * 0.5}
            filter="url(#cosmicWebGlow)"
            style={{ animation: `cosmicWebNode ${3 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 3}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
