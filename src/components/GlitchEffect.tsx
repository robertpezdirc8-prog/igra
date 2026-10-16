interface GlitchEffectProps {
  intensity: number;
  isActive: boolean;
}

export function GlitchEffect({ intensity, isActive }: GlitchEffectProps) {
  if (!isActive) return null;

  return (
    <>
      {/* Red channel */}
      <div
        className="fixed inset-0 pointer-events-none z-23"
        style={{
          background: 'rgba(255, 0, 0, 0.03)',
          transform: `translate(${Math.random() * intensity * 10 - intensity * 5}px, 0)`,
          mixBlendMode: 'screen',
          animation: 'glitch 0.1s infinite'
        }}
      />
      {/* Blue channel */}
      <div
        className="fixed inset-0 pointer-events-none z-23"
        style={{
          background: 'rgba(0, 0, 255, 0.03)',
          transform: `translate(${Math.random() * intensity * 10 - intensity * 5}px, 0)`,
          mixBlendMode: 'screen',
          animation: 'glitch 0.15s infinite'
        }}
      />
      {/* Horizontal glitch lines */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="fixed pointer-events-none z-24"
          style={{
            left: 0,
            right: 0,
            top: `${Math.random() * 100}%`,
            height: `${Math.random() * 5 + 1}px`,
            background: `rgba(255, 255, 255, ${Math.random() * 0.1})`,
            transform: `translateX(${Math.random() * intensity * 20 - intensity * 10}px)`,
            animation: `glitchLine ${0.1 + Math.random() * 0.2}s infinite`
          }}
        />
      ))}
    </>
  );
}
