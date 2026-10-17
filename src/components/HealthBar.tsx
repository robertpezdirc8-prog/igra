import { HUDBar } from './HUD';

interface HealthBarProps {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
  /** Touch layout: two compact rows instead of three labelled bars —
   *  HP (with shield overlay) + energy sliver. Saves ~90px of the top
   *  playfield on a phone and never collides with the centered wave
   *  panel (which is why the old fixed top-[118px] score readout
   *  kept sliding UNDER the energy bar). */
  compact?: boolean;
}

export function HealthBar({ hp, maxHp, shield, maxShield, energy, maxEnergy, compact }: HealthBarProps) {
  if (compact) {
    const hpPct = Math.max(0, (hp / maxHp) * 100);
    const shPct = Math.max(0, (shield / maxShield) * 100);
    const enPct = Math.max(0, (energy / maxEnergy) * 100);
    const low = hp < maxHp * 0.3;
    return (
      <div className="w-full space-y-1">
        {/* HP + shield: one bar, blue shield layer drawn OVER the green HP fill */}
        <div className="relative h-2.5 bg-black/60 border border-gray-700 rounded overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{
              width: `${hpPct}%`,
              background: low ? 'linear-gradient(90deg,#ff3344,#ff6666)' : 'linear-gradient(90deg,#00ff44,#44ff88)',
              boxShadow: `0 0 6px ${low ? 'rgba(255,51,68,.6)' : 'rgba(0,255,68,.5)'}`
            }}
          />
          {/* shield translucent second layer (visually in FRONT of hull) */}
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300"
            style={{
              width: `${shPct}%`,
              background: 'rgba(0,136,255,0.55)',
              borderRight: shPct > 0 ? '1px solid rgba(120,200,255,0.9)' : 'none'
            }}
          />
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] leading-none">
          <span className={low ? 'text-red-400 animate-pulse' : 'text-green-400'}>
            ❤{Math.ceil(hp)}
          </span>
          <span className="text-sky-400">🛡{Math.ceil(shield)}</span>
          <span className="ml-auto flex-1 max-w-[72px]">
            {/* inline energy sliver */}
            <span className="block h-1 bg-black/60 border border-gray-700 rounded overflow-hidden">
              <span
                className="block h-full transition-all duration-300"
                style={{
                  width: `${enPct}%`,
                  background: 'linear-gradient(90deg,#ffaa00,#ffd24d)'
                }}
              />
            </span>
          </span>
          <span className="text-amber-400">⚡{Math.ceil(energy)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-30 space-y-2 w-64">
      {/* HP Bar */}
      <HUDBar
        label="ZDRAVJE"
        value={hp}
        maxValue={maxHp}
        color="#00ff44"
        icon="❤️"
      />

      {/* Shield Bar */}
      <HUDBar
        label="ŠČIT"
        value={shield}
        maxValue={maxShield}
        color="#0088ff"
        icon="🛡️"
      />

      {/* Energy Bar */}
      <HUDBar
        label="ENERGIJA"
        value={energy}
        maxValue={maxEnergy}
        color="#ffaa00"
        icon="⚡"
      />

      {/* Status indicators */}
      <div className="flex gap-2 mt-2">
        {hp < maxHp * 0.3 && (
          <div
            className="px-2 py-1 bg-red-500/20 border border-red-400 rounded text-red-400 font-mono text-xs animate-pulse"
          >
            ⚠ NIZKO ZDRAVJE
          </div>
        )}
        {energy < 20 && (
          <div
            className="px-2 py-1 bg-yellow-500/20 border border-yellow-400 rounded text-yellow-400 font-mono text-xs animate-pulse"
          >
            ⚡ NIZKA ENERGIJA
          </div>
        )}
      </div>
    </div>
  );
}
