interface NebulaCloudProps {
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
}

export function NebulaCloud({ x, y, radius, color, intensity }: NebulaCloudProps) {
  return (
    <div
      className="fixed pointer-events-none z-1"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Main nebula */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}44 0%, ${color}22 40%, transparent 70%)`,
          opacity: intensity,
          filter: 'blur(30px)',
          animation: 'nebulaDrift 20s ease-in-out infinite'
        }}
      />
      {/* Secondary clouds */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
            width: `${30 + Math.random() * 40}%`,
            height: `${30 + Math.random() * 40}%`,
            background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
            opacity: intensity * 0.6,
            filter: 'blur(20px)',
            animation: `nebulaCloud ${15 + i * 5}s ease-in-out infinite ${i * 2}s`
          }}
        />
      ))}
      {/* Star formation */}
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 1 + Math.random() * 2,
            height: 1 + Math.random() * 2,
            background: '#ffffff',
            opacity: intensity * (0.3 + Math.random() * 0.7),
            boxShadow: '0 0 3px #ffffff',
            animation: `starTwinkle ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 2}s`
          }}
        />
      ))}
      {/* Cosmic dust */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: intensity * 0.1,
          mixBlendMode: 'screen'
        }}
      />
    </div>
  );
}
