import { HUDBar } from './HUD';

interface HealthBarProps {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  energy: number;
  maxEnergy: number;
}

export function HealthBar({ hp, maxHp, shield, maxShield, energy, maxEnergy }: HealthBarProps) {
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
