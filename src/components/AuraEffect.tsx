interface AuraEffectProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  type: 'fire' | 'ice' | 'electric' | 'dark' | 'holy';
}

export function AuraEffect({ x, y, radius, color, intensity, type }: AuraEffectProps) {
  const getAuraAnimation = () => {
    switch (type) {
      case 'fire': return 'auraFire 1s ease-in-out infinite';
      case 'ice': return 'auraIce 2s ease-in-out infinite';
      case 'electric': return 'auraElectric 0.3s linear infinite';
      case 'dark': return 'auraDark 3s ease-in-out infinite';
      case 'holy': return 'auraHoly 2s ease-in-out infinite';
      default: return 'auraPulse 2s ease-in-out infinite';
    }
  };

  return (
    <div
      className="fixed pointer-events-none z-26"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Aura glow */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}44 0%, ${color}22 50%, transparent 100%)`,
          opacity: intensity,
          animation: getAuraAnimation()
        }}
      />
      {/* Aura particles */}
      {[...Array(20)].map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = radius * (0.5 + Math.random() * 0.5);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + Math.random() * 3,
              height: 2 + Math.random() * 3,
              left: '50%',
              top: '50%',
              background: color,
              boxShadow: `0 0 10px ${color}`,
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity * 0.8,
              animation: `auraParticle ${2 + Math.random() * 2}s ease-in-out infinite ${Math.random() * 2}s`
            }}
          />
        );
      })}
      {/* Type-specific effects */}
      {type === 'electric' && (
        <>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                width: 2,
                height: radius * 0.8,
                background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
                transformOrigin: '50% 0%',
                transform: `translate(-50%, 0) rotate(${(i / 5) * Math.PI * 2}rad)`,
                opacity: intensity,
                animation: `electricArc ${0.2 + Math.random() * 0.3}s linear infinite ${Math.random() * 0.5}s`
              }}
            />
          ))}
        </>
      )}
      {type === 'fire' && (
        <>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 8 + Math.random() * 8,
                height: 8 + Math.random() * 8,
                left: `${30 + Math.random() * 40}%`,
                bottom: 0,
                background: `radial-gradient(circle, ${color}, transparent)`,
                opacity: intensity * 0.6,
                animation: `fireRise ${1 + Math.random()}s ease-out infinite ${Math.random()}s`
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
