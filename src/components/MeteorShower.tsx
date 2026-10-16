interface MeteorShowerProps {
  intensity: number;
  color: string;
}

export function MeteorShower({ intensity, color }: MeteorShowerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-4">
      {[...Array(Math.floor(intensity * 20))].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10%',
            width: 2,
            height: 50 + Math.random() * 50,
            background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
            transform: `rotate(${30 + Math.random() * 20}deg)`,
            opacity: intensity * 0.8,
            animation: `meteorFall ${1 + Math.random() * 2}s linear infinite ${Math.random() * 5}s`
          }}
        />
      ))}
    </div>
  );
}
