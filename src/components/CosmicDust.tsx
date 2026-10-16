interface CosmicDustProps {
  density: number;
  color: string;
  intensity: number;
}

export function CosmicDust({ density, color, intensity }: CosmicDustProps) {
  const particleCount = Math.floor(density * 100);

  return (
    <div className="fixed inset-0 pointer-events-none z-2">
      {[...Array(particleCount)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: 1 + Math.random() * 3,
            height: 1 + Math.random() * 3,
            background: color,
            opacity: intensity * (0.2 + Math.random() * 0.5),
            boxShadow: `0 0 3px ${color}`,
            animation: `cosmicDustFloat ${10 + Math.random() * 20}s linear infinite ${Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  );
}
