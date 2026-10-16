interface TeleportEffectProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  phase: 'in' | 'out';
}

export function TeleportEffect({ x, y, radius, color, intensity, phase }: TeleportEffectProps) {
  return (
    <div
      className="fixed pointer-events-none z-24"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Teleport ring */}
      <div
        className="absolute inset-0 rounded-full border-4"
        style={{
          borderColor: color,
          opacity: intensity,
          boxShadow: `0 0 30px ${color}, inset 0 0 30px ${color}`,
          animation: phase === 'in' ? 'teleportIn 0.5s ease-out forwards' : 'teleportOut 0.5s ease-in forwards'
        }}
      />
      {/* Energy spiral */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-2"
          style={{
            inset: radius * (0.2 + i * 0.2),
            borderColor: `${color}${Math.floor(intensity * 150).toString(16).padStart(2, '0')}`,
            animation: `teleportSpin ${1 + i * 0.5}s linear infinite ${phase === 'in' ? '' : 'reverse'}`
          }}
        />
      ))}
      {/* Particle vortex */}
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = phase === 'in' ? radius * (1 - i / 20) : radius * (i / 20);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 3,
              height: 3,
              left: '50%',
              top: '50%',
              background: color,
              boxShadow: `0 0 10px ${color}`,
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity,
              animation: `teleportParticle ${0.5}s linear infinite ${i * 0.05}s`
            }}
          />
        );
      })}
      {/* Center flash */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.3,
          background: `radial-gradient(circle, #ffffff 0%, ${color} 50%, transparent 100%)`,
          opacity: intensity * 0.8,
          animation: phase === 'in' ? 'teleportFlashIn 0.5s ease-out forwards' : 'teleportFlashOut 0.5s ease-in forwards'
        }}
      />
    </div>
  );
}
