interface LightningBoltProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  intensity: number;
  segments?: number;
}

export function LightningBolt({ 
  startX, 
  startY, 
  endX, 
  endY, 
  color, 
  intensity,
  segments = 10 
}: LightningBoltProps) {
  const points = [];
  const dx = endX - startX;
  const dy = endY - startY;
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = startX + dx * t;
    const y = startY + dy * t;
    
    // Add random displacement for jagged effect
    if (i > 0 && i < segments) {
      const offset = (Math.random() - 0.5) * 50 * intensity;
      const perpX = -dy / Math.sqrt(dx * dx + dy * dy);
      const perpY = dx / Math.sqrt(dx * dx + dy * dy);
      points.push({
        x: x + perpX * offset,
        y: y + perpY * offset
      });
    } else {
      points.push({ x, y });
    }
  }

  const pathData = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;

  return (
    <svg className="fixed inset-0 pointer-events-none z-25" style={{ width: '100%', height: '100%' }}>
      <defs>
        <filter id="lightningGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Outer glow */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={intensity * 0.3}
        filter="url(#lightningGlow)"
      />
      {/* Main bolt */}
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={intensity}
      />
      {/* Inner core */}
      <path
        d={pathData}
        fill="none"
        stroke="#ffffff"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={intensity * 0.8}
      />
    </svg>
  );
}
