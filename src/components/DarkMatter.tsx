interface DarkMatterProps {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export function DarkMatter({ x, y, radius, intensity }: DarkMatterProps) {
  return (
    <div
      className="fixed pointer-events-none z-35"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Dark core */}
      <div
        className="absolute rounded-full"
        style={{
          inset: radius * 0.2,
          background: 'radial-gradient(circle, #000000 0%, #1a0033 50%, transparent 100%)',
          opacity: intensity,
          boxShadow: '0 0 50px #000000, inset 0 0 50px #000000',
          animation: 'darkMatterPulse 3s ease-in-out infinite'
        }}
      />
      {/* Gravitational lensing */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border"
          style={{
            inset: radius * (0.25 + i * 0.1),
            borderColor: `rgba(100, 0, 200, ${intensity * (0.5 - i * 0.08)})`,
            borderWidth: 1,
            animation: `darkMatterRing ${5 + i * 2}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`
          }}
        />
      ))}
      {/* Dark energy particles */}
      {[...Array(25)].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = radius * (0.3 + Math.random() * 0.6);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2,
              height: 2,
              left: '50%',
              top: '50%',
              background: '#6400c8',
              boxShadow: '0 0 10px #6400c8',
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity * 0.7,
              animation: `darkMatterParticle ${3 + Math.random() * 2}s linear infinite ${Math.random() * 2}s`
            }}
          />
        );
      })}
      {/* Void tendrils */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const length = radius * 0.7;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: 4,
              height: length,
              background: 'linear-gradient(180deg, #6400c8, transparent)',
              transformOrigin: '50% 0%',
              transform: `translate(-50%, 0) rotate(${angle}rad)`,
              opacity: intensity * 0.5,
              filter: 'blur(2px)',
              animation: `darkMatterTendril ${4 + i}s ease-in-out infinite ${i * 0.5}s`
            }}
          />
        );
      })}
    </div>
  );
}
