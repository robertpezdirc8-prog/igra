interface CosmicBackgroundProps {
  nebulaIntensity: number;
  starDensity: number;
}

export function CosmicBackground({ nebulaIntensity, starDensity }: CosmicBackgroundProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #0a0015 0%, #000005 100%)'
        }}
      />
      {/* Nebula clouds */}
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + Math.sin(i * 2) * 20}%`,
            width: `${300 + i * 100}px`,
            height: `${300 + i * 100}px`,
            background: `radial-gradient(circle, ${
              i % 3 === 0 ? '#4400aa' : i % 3 === 1 ? '#aa0044' : '#004488'
            }44 0%, transparent 70%)`,
            opacity: nebulaIntensity * 0.3,
            filter: 'blur(50px)',
            animation: `nebulaFloat ${20 + i * 5}s ease-in-out infinite ${i * 2}s`
          }}
        />
      ))}
      {/* Stars */}
      {[...Array(Math.floor(starDensity * 100))].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
            background: '#ffffff',
            opacity: 0.3 + Math.random() * 0.7,
            boxShadow: '0 0 3px #ffffff',
            animation: `starTwinkle ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 2}s`
          }}
        />
      ))}
      {/* Cosmic dust */}
      <div
        className="absolute inset-0"
        style={{
          background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          opacity: 0.05,
          mixBlendMode: 'screen'
        }}
      />
    </div>
  );
}
