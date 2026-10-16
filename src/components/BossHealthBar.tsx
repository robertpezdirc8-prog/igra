interface BossHealthBarProps {
  name: string;
  hp: number;
  maxHp: number;
  phase: number;
  isVisible: boolean;
}

export function BossHealthBar({ name, hp, maxHp, phase, isVisible }: BossHealthBarProps) {
  if (!isVisible) return null;

  const percentage = (hp / maxHp) * 100;
  const phaseColors = ['#ff00ff', '#ff4400', '#ffaa00'];
  const currentColor = phaseColors[Math.min(phase, phaseColors.length - 1)];

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 w-[600px] max-w-[90vw]">
      <div className="bg-black/80 border-2 rounded-lg p-4 backdrop-blur-sm"
           style={{
             borderColor: currentColor + '66',
             boxShadow: `0 0 30px ${currentColor}33, inset 0 0 20px ${currentColor}11`
           }}>
        {/* Boss name */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💀</span>
            <h3
              className="text-xl font-bold font-mono uppercase tracking-wider"
              style={{
                color: currentColor,
                textShadow: `0 0 15px ${currentColor}88`
              }}
            >
              {name}
            </h3>
          </div>
          <div className="text-right">
            <p className="text-gray-400 font-mono text-xs">FAZA {phase + 1}</p>
            <p className="font-mono text-sm font-bold" style={{ color: currentColor }}>
              {Math.ceil(hp)} / {maxHp}
            </p>
          </div>
        </div>

        {/* Health bar */}
        <div className="relative h-6 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: `linear-gradient(90deg, ${currentColor}44 0%, transparent 100%)` }}
          />

          {/* Fill bar */}
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${currentColor} 0%, ${currentColor}cc 100%)`,
              boxShadow: `0 0 15px ${currentColor}88, inset 0 0 10px ${currentColor}44`
            }}
          >
            {/* Shine effect */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)'
              }}
            />

            {/* Animated pulse */}
            <div
              className="absolute inset-0 animate-pulse"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${currentColor}44 50%, transparent 100%)`
              }}
            />
          </div>

          {/* Tick marks */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="absolute inset-y-0 w-px bg-gray-600/30"
              style={{ left: `${(i + 1) * 10}%` }}
            />
          ))}
        </div>

        {/* Phase indicators */}
        <div className="flex justify-center gap-2 mt-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                backgroundColor: i <= phase ? phaseColors[i] : '#333',
                boxShadow: i <= phase ? `0 0 10px ${phaseColors[i]}` : 'none'
              }}
            />
          ))}
        </div>

        {/* Low health warning */}
        {percentage < 25 && (
          <div className="mt-2 text-center">
            <p
              className="text-red-400 font-mono text-xs font-bold animate-pulse"
              style={{ textShadow: '0 0 10px rgba(255, 0, 0, 0.8)' }}
            >
              ⚠ KRITIČNO ZDRAVJE ⚠
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
