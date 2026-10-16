interface CosmicRayProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  width: number;
  intensity: number;
}

export function CosmicRay({ startX, startY, endX, endY, width, intensity }: CosmicRayProps) {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <div
      className="fixed pointer-events-none z-31"
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
          background: 'linear-gradient(90deg, transparent 0%, #ff00ff 20%, #ff00ff 80%, transparent 100%)',
          opacity: intensity * 0.3,
          filter: 'blur(15px)',
          animation: 'cosmicRayPulse 0.5s ease-in-out infinite'
        }}
      />
      {/* Main ray */}
      <div
        className="absolute inset-y-0 left-0 right-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #ff00ff 10%, #ffffff 50%, #ff00ff 90%, transparent 100%)',
          opacity: intensity,
          boxShadow: '0 0 30px #ff00ff',
          animation: 'cosmicRayFlow 0.2s linear infinite'
        }}
      />
      {/* Core */}
      <div
        className="absolute"
        style={{
          top: '50%',
          left: 0,
          right: 0,
          height: width * 0.2,
          transform: 'translateY(-50%)',
          background: 'linear-gradient(90deg, transparent 0%, #ffffff 20%, #ffffff 80%, transparent 100%)',
          opacity: intensity * 0.9
        }}
      />
      {/* Energy particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 3,
            height: 3,
            left: `${(i / 15) * 100}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#ffffff',
            boxShadow: '0 0 10px #ff00ff',
            opacity: intensity,
            animation: `cosmicRayParticle ${0.3 + Math.random() * 0.3}s linear infinite ${i * 0.05}s`
          }}
        />
      ))}
      {/* Impact flash at end */}
      <div
        className="absolute rounded-full"
        style={{
          right: -20,
          top: '50%',
          width: 40,
          height: 40,
          transform: 'translateY(-50%)',
          background: 'radial-gradient(circle, #ffffff 0%, #ff00ff 50%, transparent 100%)',
          opacity: intensity * 0.8,
          animation: 'cosmicRayImpact 0.3s ease-out infinite'
        }}
      />
    </div>
  );
}
