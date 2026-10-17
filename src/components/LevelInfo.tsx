import type { Level } from '../game/levels';

interface LevelInfoProps {
  level: Level;
  playerLevel: number;
}

export function LevelInfo({ level, playerLevel }: LevelInfoProps) {
  // playerLevel is shown next to the level name (real engine data)
  return (
    <div className="fixed bottom-4 left-4 z-30">
      <div
        className="bg-black/60 border-2 rounded-lg p-3 backdrop-blur-sm"
        style={{
          borderColor: level.color + '66',
          boxShadow: `0 0 20px ${level.color}33`
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-lg"
            style={{
              background: level.color + '33',
              color: level.color,
              border: `2px solid ${level.color}`,
              boxShadow: `0 0 10px ${level.color}66`
            }}
          >
            {level.id}
          </div>
          <div>
            <p
              className="font-mono font-bold text-sm"
              style={{
                color: level.color,
                textShadow: `0 0 10px ${level.color}88`
              }}
            >
              {level.name}
            </p>
            <p className="text-gray-400 font-mono text-xs">
              {level.description}
            </p>
            <p className="text-gray-500 font-mono text-[10px]">
              Igralec: nivo {playerLevel}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
