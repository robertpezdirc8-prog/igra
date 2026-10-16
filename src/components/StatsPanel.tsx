interface StatsPanelProps {
  isOpen: boolean;
  stats: {
    totalDamage: number;
    enemiesKilled: number;
    shotsFired: number;
    accuracy: number;
    timePlayed: number;
    upgradesCollected: number;
  };
  onClose: () => void;
}

export function StatsPanel({ isOpen, stats, onClose }: StatsPanelProps) {
  if (!isOpen) return null;

  const statItems = [
    { label: 'Skupna škoda', value: Math.floor(stats.totalDamage).toLocaleString(), icon: '💥', color: '#ff4444' },
    { label: 'Sovražniki ubiti', value: stats.enemiesKilled.toString(), icon: '💀', color: '#ff8800' },
    { label: 'Streli izstreljeni', value: stats.shotsFired.toString(), icon: '🔫', color: '#00ffff' },
    { label: 'Natančnost', value: `${stats.accuracy.toFixed(1)}%`, icon: '🎯', color: '#ffff00' },
    { label: 'Čas igranja', value: `${Math.floor(stats.timePlayed)}s`, icon: '⏱️', color: '#00ff88' },
    { label: 'Nadgradnje', value: stats.upgradesCollected.toString(), icon: '⬆️', color: '#ff00ff' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-gray-900/95 border-2 border-cyan-400/50 rounded-lg p-8 max-w-2xl w-full mx-4">
        <h2
          className="text-3xl font-bold text-cyan-400 font-mono mb-6 text-center"
          style={{ textShadow: '0 0 15px rgba(0, 255, 255, 0.5)' }}
        >
          STATISTIKA
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {statItems.map((item, i) => (
            <div
              key={i}
              className="bg-black/40 border border-gray-700 rounded-lg p-4"
              style={{
                animation: `fadeIn 0.3s ease-out ${i * 0.1}s both`
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{item.icon}</span>
                <div>
                  <p className="text-gray-500 font-mono text-xs uppercase tracking-wider">
                    {item.label}
                  </p>
                  <p
                    className="text-xl font-bold font-mono"
                    style={{
                      color: item.color,
                      textShadow: `0 0 10px ${item.color}88`
                    }}
                  >
                    {item.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400 font-mono uppercase tracking-wider hover:bg-cyan-500/30 hover:border-cyan-300 transition-all rounded"
        >
          ZAPRI
        </button>
      </div>
    </div>
  );
}
