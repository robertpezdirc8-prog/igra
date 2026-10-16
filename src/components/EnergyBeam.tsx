interface EnergyBeamProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  color: string;
  intensity: number;
}

export function EnergyBeam({ startX, startY, endX, endY, width, color, intensity }: EnergyBeamProps) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div
      className="fixed pointer-events-none z-22"
      style={{
        left: startX,
        top: startY,
        width: length,
        height: width,
        transform: `rotate(${angle}deg)`,
        transformOrigin: '0 50%'
      }}
    >
      {/* Outer glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, ${color}00 0%, ${color} 20%, ${color} 80%, ${color}00 100%)`,
          opacity: intensity * 0.3,
          filter: 'blur(10px)',
          animation: 'beamPulse 0.5s ease-in-out infinite'
        }}
      />
      {/* Main beam */}
      <div
        className="absolute inset-y-0 left-0 right-0"
        style={{
          background: `linear-gradient(90deg, ${color}00 0%, ${color} 10%, ${color} 90%, ${color}00 100%)`,
          opacity: intensity,
          boxShadow: `0 0 20px ${color}`,
          animation: 'beamFlow 0.3s linear infinite'
        }}
      />
      {/* Core */}
      <div
        className="absolute"
        style={{
          top: '50%',
          left: 0,
          right: 0,
          height: width * 0.3,
          transform: 'translateY(-50%)',
          background: `linear-gradient(90deg, transparent 0%, #ffffff 20%, #ffffff 80%, transparent 100%)`,
          opacity: intensity * 0.8
        }}
      />
      {/* Energy particles along beam */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 4,
            height: 4,
            left: `${(i / 10) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#ffffff',
            boxShadow: `0 0 10px ${color}`,
            opacity: intensity,
            animation: `beamParticle ${0.5 + Math.random() * 0.5}s linear infinite ${i * 0.1}s`
          }}
        />
      ))}
    </div>
  );
}
