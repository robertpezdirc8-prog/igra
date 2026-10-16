interface QuantumFieldProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function QuantumField({ x, y, radius, color, intensity }: QuantumFieldProps) {
  return (
    <div
      className="fixed pointer-events-none z-29"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Quantum superposition */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            inset: radius * (0.2 + i * 0.2),
            border: `1px solid ${color}`,
            opacity: intensity * (0.3 + i * 0.2),
            animation: `quantumSuperposition ${2 + i}s ease-in-out infinite ${i * 0.5}s`
          }}
        />
      ))}
      {/* Probability waves */}
      <svg className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
        <defs>
          <filter id="quantumGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Wave function */}
        <path
          d={`M ${radius * 0.2} ${radius} Q ${radius * 0.5} ${radius * 0.5}, ${radius} ${radius} T ${radius * 1.8} ${radius}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
          opacity={intensity * 0.6}
          filter="url(#quantumGlow)"
          style={{ animation: 'quantumWave 3s ease-in-out infinite' }}
        />
        {/* Probability cloud */}
        <circle
          cx={radius}
          cy={radius}
          r={radius * 0.4}
          fill={color}
          opacity={intensity * 0.2}
          filter="url(#quantumGlow)"
          style={{ animation: 'probabilityCloud 2s ease-in-out infinite' }}
        />
      </svg>
      {/* Quantum particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            left: `${30 + Math.random() * 40}%`,
            top: `${30 + Math.random() * 40}%`,
            background: color,
            boxShadow: `0 0 10px ${color}`,
            opacity: intensity * 0.8,
            animation: `quantumParticle ${1 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`
          }}
        />
      ))}
      {/* Entanglement lines */}
      {[...Array(5)].map((_, i) => {
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = angle1 + Math.PI;
        const r1 = radius * 0.3;
        const r2 = radius * 0.7;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: 1,
              height: r2 - r1,
              background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
              transformOrigin: '50% 0%',
              transform: `translate(-50%, 0) rotate(${angle1}rad) translateY(${r1}px)`,
              opacity: intensity * 0.4,
              animation: `entanglement ${2 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`
            }}
          />
        );
      })}
    </div>
  );
}
