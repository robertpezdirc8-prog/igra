interface SupernovaProps {
  x: number;
  y: number;
  radius: number;
  intensity: number;
}

export function Supernova({ x, y, radius, intensity }: SupernovaProps) {
  return (
    <div
      className="fixed pointer-events-none z-38"
      style={{
        left: x - radius,
        top: y - radius,
        width: radius * 2,
        height: radius * 2
      }}
    >
      {/* Core explosion */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, #ffffff 0%, #ffff00 20%, #ff8800 40%, #ff0000 60%, transparent 100%)',
          opacity: intensity,
          animation: 'supernovaCore 2s ease-out forwards'
        }}
      />
      {/* Shockwave rings */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full border-4"
          style={{
            inset: radius * (0.1 + i * 0.1),
            borderColor: i % 2 === 0 ? '#ffff00' : '#ff8800',
            opacity: intensity * (1 - i * 0.1),
            boxShadow: `0 0 30px ${i % 2 === 0 ? '#ffff00' : '#ff8800'}`,
            animation: `supernovaShockwave ${1.5 + i * 0.2}s ease-out forwards ${i * 0.15}s`
          }}
        />
      ))}
      {/* Energy jets */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const length = radius * 1.2;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              width: 8,
              height: length,
              background: `linear-gradient(180deg, #ffffff, #ffff00, #ff8800, transparent)`,
              transformOrigin: '50% 0%',
              transform: `translate(-50%, 0) rotate(${angle}rad)`,
              opacity: intensity * 0.8,
              filter: 'blur(3px)',
              animation: `supernovaJet ${1.5}s ease-out forwards ${i * 0.1}s`
            }}
          />
        );
      })}
      {/* Debris field */}
      {[...Array(50)].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = radius * (0.3 + Math.random() * 0.9);
        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + Math.random() * 5,
              height: 2 + Math.random() * 5,
              left: '50%',
              top: '50%',
              background: ['#ffffff', '#ffff00', '#ff8800', '#ff0000'][Math.floor(Math.random() * 4)],
              boxShadow: `0 0 10px ${['#ffffff', '#ffff00', '#ff8800', '#ff0000'][Math.floor(Math.random() * 4)]}`,
              transform: `translate(-50%, -50%) rotate(${angle}rad) translateX(${distance}px)`,
              opacity: intensity,
              animation: `supernovaDebris ${2 + Math.random() * 2}s ease-out forwards ${Math.random() * 0.5}s`
            }}
          />
        );
      })}
      {/* Nebula remnant */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, transparent 30%, rgba(255, 136, 0, 0.2) 60%, transparent 100%)',
          opacity: intensity * 0.5,
          filter: 'blur(20px)',
          animation: 'supernovaNebula 3s ease-out forwards'
        }}
      />
    </div>
  );
}
