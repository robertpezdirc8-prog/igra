interface LensFlareProps {
  x: number;
  y: number;
  intensity: number;
  color?: string;
}

export function LensFlare({ x, y, intensity, color = '#ffffff' }: LensFlareProps) {
  return (
    <div
      className="fixed pointer-events-none z-25"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Main flare */}
      <div
        className="absolute rounded-full"
        style={{
          width: 100 * intensity,
          height: 100 * intensity,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: 0.6 * intensity,
          filter: 'blur(10px)'
        }}
      />
      {/* Horizontal streak */}
      <div
        className="absolute"
        style={{
          width: 300 * intensity,
          height: 2,
          left: -150 * intensity,
          top: '50%',
          transform: 'translateY(-50%)',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          opacity: 0.4 * intensity,
          filter: 'blur(2px)'
        }}
      />
      {/* Vertical streak */}
      <div
        className="absolute"
        style={{
          width: 2,
          height: 300 * intensity,
          left: '50%',
          top: -150 * intensity,
          transform: 'translateX(-50%)',
          background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
          opacity: 0.4 * intensity,
          filter: 'blur(2px)'
        }}
      />
      {/* Secondary flares */}
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 20 + i * 10,
            height: 20 + i * 10,
            left: 50 + (i - 1) * 40,
            top: 50 + (i - 1) * 30,
            background: `radial-gradient(circle, ${color}44 0%, transparent 70%)`,
            opacity: 0.3 * intensity,
            filter: 'blur(5px)'
          }}
        />
      ))}
    </div>
  );
}
