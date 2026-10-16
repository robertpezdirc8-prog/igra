interface StarFieldProps {
  density: number;
  twinkleSpeed: number;
}

export function StarField({ density, twinkleSpeed }: StarFieldProps) {
  const starCount = Math.floor(density * 200);

  return (
    <div className="fixed inset-0 pointer-events-none z-1">
      {[...Array(starCount)].map((_, i) => {
        const size = Math.random() < 0.9 ? 1 : 2;
        const brightness = 0.3 + Math.random() * 0.7;
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: size,
              height: size,
              background: '#ffffff',
              opacity: brightness,
              boxShadow: size > 1 ? '0 0 4px #ffffff' : 'none',
              animation: `starTwinkle ${2 + Math.random() * 3}s ease-in-out infinite ${Math.random() * 3}s`
            }}
          />
        );
      })}
    </div>
  );
}
