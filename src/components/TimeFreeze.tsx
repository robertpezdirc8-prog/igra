interface TimeFreezeProps {
  isActive: boolean;
  intensity: number;
}

export function TimeFreeze({ isActive, intensity }: TimeFreezeProps) {
  if (!isActive) return null;

  return (
    <>
      {/* Blue tint overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-28"
        style={{
          background: `rgba(0, 100, 255, ${intensity * 0.1})`,
          backdropFilter: `saturate(0.5) contrast(1.2)`,
          animation: 'timeFreezePulse 2s ease-in-out infinite'
        }}
      />
      {/* Clock hands */}
      <div
        className="fixed pointer-events-none z-29"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <div
          className="absolute w-1 h-32 bg-cyan-400 origin-bottom"
          style={{
            left: '50%',
            bottom: '50%',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
            opacity: intensity * 0.5
          }}
        />
        <div
          className="absolute w-1 h-24 bg-cyan-400 origin-bottom"
          style={{
            left: '50%',
            bottom: '50%',
            transform: 'translateX(-50%) rotate(90deg)',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
            opacity: intensity * 0.5
          }}
        />
      </div>
      {/* Frozen particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="fixed pointer-events-none z-29"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 2,
            height: 2,
            background: '#00ffff',
            borderRadius: '50%',
            boxShadow: '0 0 5px rgba(0, 255, 255, 0.8)',
            opacity: intensity * 0.6,
            animation: `frozenParticle ${2 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`
          }}
        />
      ))}
    </>
  );
}
