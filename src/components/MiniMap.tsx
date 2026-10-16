interface MiniMapProps {
  playerX: number;
  playerY: number;
  enemies: Array<{ x: number; y: number; type: string }>;
  worldWidth: number;
  worldHeight: number;
}

export function MiniMap({ playerX, playerY, enemies, worldWidth, worldHeight }: MiniMapProps) {
  const mapSize = 120;
  const scaleX = mapSize / worldWidth;
  const scaleY = mapSize / worldHeight;

  return (
    <div className="fixed bottom-4 right-4 z-30">
      <div
        className="relative bg-black/60 border-2 border-cyan-400/30 rounded-lg overflow-hidden"
        style={{
          width: `${mapSize}px`,
          height: `${mapSize}px`,
          backdropFilter: 'blur(5px)'
        }}
      >
        {/* Grid */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute top-0 bottom-0 w-px bg-cyan-400"
              style={{ left: `${(i + 1) * 20}%` }}
            />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute left-0 right-0 h-px bg-cyan-400"
              style={{ top: `${(i + 1) * 20}%` }}
            />
          ))}
        </div>

        {/* Enemies */}
        {enemies.map((enemy, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              left: `${enemy.x * scaleX}px`,
              top: `${enemy.y * scaleY}px`,
              backgroundColor: enemy.type === 'boss' ? '#ff00ff' : '#ff4444',
              boxShadow: enemy.type === 'boss' 
                ? '0 0 5px rgba(255, 0, 255, 0.8)' 
                : '0 0 3px rgba(255, 68, 68, 0.6)',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {/* Player */}
        <div
          className="absolute w-2 h-2 bg-cyan-400 rounded-full"
          style={{
            left: `${playerX * scaleX}px`,
            top: `${playerY * scaleY}px`,
            boxShadow: '0 0 8px rgba(0, 255, 255, 0.8)',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 1s ease-in-out infinite'
          }}
        />

        {/* Border glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 20px rgba(0, 255, 255, 0.1)'
          }}
        />
      </div>

      {/* Label */}
      <div className="text-center mt-1">
        <p className="text-cyan-400/60 font-mono text-xs">MINIMAP</p>
      </div>
    </div>
  );
}
