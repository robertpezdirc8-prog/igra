import React, { useEffect, useState } from 'react';
import { PowerUp, PowerUpManager, getPowerUpVisualStyles } from '../game/advancedPowerups';

interface ActivePowerUpsDisplayProps {
  powerUpManager: PowerUpManager;
  updateInterval?: number;
}

export const ActivePowerUpsDisplay: React.FC<ActivePowerUpsDisplayProps> = ({
  powerUpManager,
  updateInterval = 100
}) => {
  const [activePowerUps, setActivePowerUps] = useState<PowerUp[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      const active = powerUpManager.getActivePowerUps();
      setActivePowerUps(active);

      const remaining = new Map<string, number>();
      active.forEach(powerUp => {
        const time = powerUpManager.getTimeRemaining(powerUp.id);
        remaining.set(powerUp.id, time);
      });
      setTimeRemaining(remaining);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [powerUpManager, updateInterval]);

  if (activePowerUps.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 flex flex-col gap-2 z-40">
      {activePowerUps.map(powerUp => {
        const remaining = timeRemaining.get(powerUp.id) || 0;
        const duration = powerUp.duration;
        const progress = duration > 0 ? (remaining / duration) * 100 : 100;
        const visualStyles = getPowerUpVisualStyles(powerUp);

        return (
          <div
            key={powerUp.id}
            className="relative bg-black/80 border-2 rounded-lg p-3 min-w-[200px] backdrop-blur-sm"
            style={{
              borderColor: powerUp.color,
              ...visualStyles
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{powerUp.icon}</span>
              <div className="flex-1">
                <div className="font-bold text-sm" style={{ color: powerUp.color }}>
                  {powerUp.name}
                </div>
                <div className="text-xs text-gray-400">
                  {powerUp.description}
                </div>
              </div>
            </div>

            {/* Effects list */}
            <div className="text-xs mb-2">
              {powerUp.effects.map((effect, index) => (
                <div key={index} className="text-gray-300">
                  {effect.type === 'damage' && `Škoda: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
                  {effect.type === 'speed' && `Hitrost: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
                  {effect.type === 'fireRate' && `Hitrost streljanja: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
                  {effect.type === 'shield' && `Ščit: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
                  {effect.type === 'health' && `Zdravje: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
                  {effect.type === 'energy' && `Energija: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
                  {effect.type === 'critChance' && `Kritična možnost: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
                  {effect.type === 'critDamage' && `Kritična škoda: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
                  {effect.type === 'xpGain' && `XP dobitki: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
                  {effect.type === 'goldGain' && `Zlato: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
                </div>
              ))}
            </div>

            {/* Timer bar */}
            {duration > 0 && (
              <div className="relative">
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: powerUp.color,
                      boxShadow: `0 0 10px ${powerUp.glowColor}`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {remaining.toFixed(1)}s
                </div>
              </div>
            )}

            {/* Visual effect indicator */}
            <div className="absolute top-2 right-2">
              {powerUp.visualEffect.type === 'aura' && (
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{
                    backgroundColor: powerUp.color,
                    boxShadow: `0 0 10px ${powerUp.glowColor}`
                  }}
                />
              )}
              {powerUp.visualEffect.type === 'lightning' && (
                <div className="text-lg animate-pulse">⚡</div>
              )}
              {powerUp.visualEffect.type === 'shield' && (
                <div className="text-lg animate-pulse">🛡️</div>
              )}
              {powerUp.visualEffect.type === 'trail' && (
                <div className="text-lg animate-pulse">💨</div>
              )}
              {powerUp.visualEffect.type === 'particles' && (
                <div className="text-lg animate-pulse">✨</div>
              )}
              {powerUp.visualEffect.type === 'glow' && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: powerUp.color,
                    boxShadow: `0 0 15px ${powerUp.glowColor}`,
                    animation: 'glow 2s ease-in-out infinite'
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Combo display component
interface ActiveCombosDisplayProps {
  powerUpManager: PowerUpManager;
}

export const ActiveCombosDisplay: React.FC<ActiveCombosDisplayProps> = ({
  powerUpManager
}) => {
  const [activeCombos, setActiveCombos] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const combos = powerUpManager.getActiveCombos();
      setActiveCombos(combos);
    }, 100);

    return () => clearInterval(interval);
  }, [powerUpManager]);

  if (activeCombos.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 left-4 flex flex-col gap-2 z-40">
      {activeCombos.map(combo => (
        <div
          key={combo.id}
          className="relative bg-gradient-to-r from-purple-900/90 to-pink-900/90 border-2 border-yellow-400 rounded-lg p-3 min-w-[250px] backdrop-blur-sm"
          style={{
            boxShadow: `0 0 20px ${combo.visualEffect.color}, 0 0 40px ${combo.visualEffect.color}40`,
            animation: 'combo-pulse 2s ease-in-out infinite'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">🌟</span>
            <div className="flex-1">
              <div className="font-bold text-yellow-400 text-lg">
                {combo.name}
              </div>
              <div className="text-xs text-gray-300">
                {combo.description}
              </div>
            </div>
          </div>

          <div className="text-xs">
            <div className="text-yellow-300 font-bold mb-1">Bonus efekti:</div>
            {combo.bonusEffects.map((effect: any, index: number) => (
              <div key={index} className="text-gray-200">
                {effect.type === 'damage' && `Škoda: +${effect.value}${effect.isPercentage ? '%' : ''}`}
                {effect.type === 'shield' && `Ščit: +${effect.value}${effect.isPercentage ? '%' : ''}`}
                {effect.type === 'speed' && `Hitrost: +${effect.value}${effect.isPercentage ? '%' : ''}`}
                {effect.type === 'fireRate' && `Hitrost streljanja: +${effect.value}${effect.isPercentage ? '%' : ''}`}
                {effect.type === 'critChance' && `Kritična možnost: +${effect.value}${effect.isPercentage ? '%' : ''}`}
                {effect.type === 'goldGain' && `Zlato: +${effect.value}${effect.isPercentage ? '%' : ''}`}
              </div>
            ))}
          </div>

          {/* Animated border */}
          <div
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{
              border: '2px solid transparent',
              background: `linear-gradient(45deg, ${combo.visualEffect.color}, transparent, ${combo.visualEffect.color}) border-box`,
              animation: 'rotate 3s linear infinite'
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Power-up notification component
interface PowerUpNotificationProps {
  powerUp: PowerUp;
  onDismiss: () => void;
}

export const PowerUpNotification: React.FC<PowerUpNotificationProps> = ({
  powerUp,
  onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const visualStyles = getPowerUpVisualStyles(powerUp);

  return (
    <div
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/90 border-4 rounded-xl p-6 min-w-[300px] backdrop-blur-md z-50 animate-bounce-in"
      style={{
        borderColor: powerUp.color,
        ...visualStyles
      }}
    >
      <div className="text-center">
        <div className="text-6xl mb-4 animate-pulse">{powerUp.icon}</div>
        <div className="text-2xl font-bold mb-2" style={{ color: powerUp.color }}>
          {powerUp.name}
        </div>
        <div className="text-gray-300 mb-4">
          {powerUp.description}
        </div>
        
        <div className="text-sm mb-4">
          {powerUp.effects.map((effect, index) => (
            <div key={index} className="text-gray-200">
              {effect.type === 'damage' && `Škoda: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
              {effect.type === 'speed' && `Hitrost: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
              {effect.type === 'fireRate' && `Hitrost streljanja: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
              {effect.type === 'shield' && `Ščit: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
              {effect.type === 'health' && `Zdravje: ${effect.value > 0 ? '+' : ''}${effect.value}${effect.isPercentage ? '%' : ''}`}
            </div>
          ))}
        </div>

        <div
          className="inline-block px-4 py-2 rounded-lg font-bold"
          style={{
            backgroundColor: powerUp.color + '40',
            color: powerUp.color,
            border: `2px solid ${powerUp.color}`
          }}
        >
          {powerUp.duration > 0 ? `Trajanje: ${powerUp.duration}s` : 'Takojšnji učinek'}
        </div>
      </div>
    </div>
  );
};
