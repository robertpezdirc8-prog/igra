interface PowerUp {
  id: string;
  name: string;
  icon: string;
  duration: number;
  maxDuration: number;
  color: string;
}

interface PowerUpIndicatorProps {
  powerUps: PowerUp[];
}

export function PowerUpIndicator({ powerUps }: PowerUpIndicatorProps) {
  if (powerUps.length === 0) return null;

  return (
    <div className="fixed top-1/2 right-4 -translate-y-1/2 z-30">
      <div className="space-y-2">
        {powerUps.map((powerUp) => {
          const percentage = (powerUp.duration / powerUp.maxDuration) * 100;
          const isLow = percentage < 30;

          return (
            <div
              key={powerUp.id}
              className="relative bg-black/60 border rounded-lg p-2 backdrop-blur-sm"
              style={{
                borderColor: powerUp.color + '66',
                boxShadow: `0 0 10px ${powerUp.color}33`
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{powerUp.icon}</span>
                <div className="flex-1">
                  <p
                    className="font-mono text-xs font-bold"
                    style={{ color: powerUp.color }}
                  >
                    {powerUp.name}
                  </p>
                  {/* Duration bar */}
                  <div className="mt-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: powerUp.color,
                        boxShadow: `0 0 5px ${powerUp.color}`
                      }}
                    />
                  </div>
                  <p className="text-gray-500 font-mono text-xs mt-0.5">
                    {Math.ceil(powerUp.duration)}s
                  </p>
                </div>
              </div>

              {/* Low duration warning */}
              {isLow && (
                <div
                  className="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
                  style={{
                    boxShadow: `inset 0 0 10px ${powerUp.color}66`
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
