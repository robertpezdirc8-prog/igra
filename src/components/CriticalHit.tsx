interface CriticalHitProps {
  x: number;
  y: number;
  intensity: number;
}

export function CriticalHit({ x, y, intensity }: CriticalHitProps) {
  return (
    <div
      className="fixed pointer-events-none z-25"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Impact flash */}
      <div
        className="absolute rounded-full"
        style={{
          width: 100 * intensity,
          height: 100 * intensity,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, #ffffff 0%, #ffff00 30%, transparent 70%)',
          opacity: intensity,
          animation: 'critFlash 0.3s ease-out forwards'
        }}
      />
      {/* Impact lines */}
      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: 50 * intensity,
              height: 3,
              background: 'linear-gradient(90deg, #ffff00, transparent)',
              transformOrigin: '0 50%',
              transform: `translate(0, -50%) rotate(${angle}rad)`,
              opacity: intensity,
              animation: `critLine 0.4s ease-out forwards ${i * 0.05}s`
            }}
          />
        );
      })}
      {/* Sparks */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const distance = 30 + Math.random() * 40;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 4,
              height: 4,
              left: '50%',
              top: '50%',
              background: '#ffff00',
              boxShadow: '0 0 10px #ffff00',
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity,
              animation: `critSpark 0.5s ease-out forwards ${i * 0.03}s`
            }}
          />
        );
      })}
      {/* "CRIT!" text */}
      <div
        className="absolute font-bold font-mono"
        style={{
          left: '50%',
          top: '-30px',
          transform: 'translateX(-50%)',
          fontSize: 24 * intensity,
          color: '#ffff00',
          textShadow: '0 0 10px #ffff00, 0 0 20px #ff8800',
          opacity: intensity,
          animation: 'critText 0.8s ease-out forwards'
        }}
      >
        CRIT!
      </div>
    </div>
  );
}
