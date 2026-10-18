import { t, useLang } from '../i18n';

interface WeaponIndicatorProps {
  weaponLevel: number;
  secondaryWeapon: 'none' | 'gravity' | 'chain' | 'temporal';
  secondaryCooldown: number;
  dashCooldown: number;
}

export function WeaponIndicator({ weaponLevel, secondaryWeapon, secondaryCooldown, dashCooldown }: WeaponIndicatorProps) {
  useLang();
  const secondaryIcons = {
    none: null,
    gravity: { icon: '🌀', name: 'Gravity Well', color: '#8800ff' },
    chain: { icon: '⚡', name: 'Chain Lightning', color: '#ffff00' },
    temporal: { icon: '⏸️', name: 'Temporal Stasis', color: '#00ccff' }
  };

  const secondary = secondaryIcons[secondaryWeapon];

  return (
    <div className="fixed bottom-4 left-4 z-30">
      <div className="bg-black/60 border border-cyan-400/30 rounded-lg p-4 backdrop-blur-sm">
        {/* Primary weapon */}
        <div className="mb-3">
          <p className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-1">
            {t('hud.primaryWeapon')}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔫</span>
            <div>
              <p className="text-cyan-400 font-mono text-sm font-bold">
                Plasma Lv.{weaponLevel}
              </p>
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-sm"
                    style={{
                      backgroundColor: i < weaponLevel ? '#00ffff' : '#333',
                      boxShadow: i < weaponLevel ? '0 0 5px rgba(0, 255, 255, 0.8)' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary weapon */}
        {secondary && (
          <div className="mb-3 pt-3 border-t border-gray-700">
            <p className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-1">
              {t('hud.secondaryWeapon')}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{secondary.icon}</span>
              <div>
                <p
                  className="font-mono text-sm font-bold"
                  style={{ color: secondary.color }}
                >
                  {secondary.name}
                </p>
                {secondaryCooldown > 0 && (
                  <p className="text-gray-400 font-mono text-xs">
                    Cooldown: {secondaryCooldown.toFixed(1)}s
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dash */}
        <div className="pt-3 border-t border-gray-700">
          <p className="text-gray-500 font-mono text-xs uppercase tracking-wider mb-1">
            Dash
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              {dashCooldown > 0 ? (
                <p className="text-gray-400 font-mono text-sm">
                  {dashCooldown.toFixed(1)}s
                </p>
              ) : (
                <p className="text-cyan-400 font-mono text-sm font-bold animate-pulse">
                  {t('hud.ready')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
