import { useState, useRef, useEffect } from 'react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onShoot: (active: boolean) => void;
  onDash: () => void;
  onSecondary: () => void;
  isVisible: boolean;
  joystickPosition?: { x: number; y: number };
}

export function MobileControls({ 
  onMove, 
  onShoot, 
  onDash, 
  onSecondary, 
  isVisible,
  joystickPosition 
}: MobileControlsProps) {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickOrigin, setJoystickOrigin] = useState({ x: 0, y: 0 });
  const [shootActive, setShootActive] = useState(false);
  const [dashCooldown, setDashCooldown] = useState(false);
  const [secondaryCooldown, setSecondaryCooldown] = useState(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const shootIntervalRef = useRef<number | null>(null);

  // Haptic feedback
  const triggerHaptic = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Dynamic joystick - appears where you touch on left side
  const handleJoystickStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    
    // Only activate joystick on left half of screen
    if (touch.clientX < screenWidth / 2) {
      setJoystickActive(true);
      setJoystickOrigin({ x: touch.clientX, y: touch.clientY });
      setJoystickPos({ x: 0, y: 0 });
      triggerHaptic(10);
    }
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - joystickOrigin.x;
    const deltaY = touch.clientY - joystickOrigin.y;
    
    // Limit joystick movement to 60px radius
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 60;
    
    let moveX = deltaX;
    let moveY = deltaY;
    
    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      moveX = deltaX * ratio;
      moveY = deltaY * ratio;
    }
    
    setJoystickPos({ x: moveX, y: moveY });
    
    // Normalize to -1 to 1 range
    const normalizedX = moveX / maxDistance;
    const normalizedY = moveY / maxDistance;
    
    onMove(normalizedX, normalizedY);
  };

  const handleJoystickEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  // Shoot button - continuous fire while held
  const handleShootStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShootActive(true);
    onShoot(true);
    triggerHaptic(5);
    
    // Continuous shooting
    shootIntervalRef.current = window.setInterval(() => {
      onShoot(true);
    }, 100);
  };

  const handleShootEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShootActive(false);
    onShoot(false);
    
    if (shootIntervalRef.current) {
      clearInterval(shootIntervalRef.current);
      shootIntervalRef.current = null;
    }
  };

  // Dash button with cooldown
  const handleDash = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!dashCooldown) {
      onDash();
      triggerHaptic([20, 50, 20]);
      setDashCooldown(true);
      
      setTimeout(() => {
        setDashCooldown(false);
      }, 1000); // 1 second cooldown
    }
  };

  // Secondary weapon with cooldown
  const handleSecondary = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!secondaryCooldown) {
      onSecondary();
      triggerHaptic([30, 50, 30]);
      setSecondaryCooldown(true);
      
      setTimeout(() => {
        setSecondaryCooldown(false);
      }, 2000); // 2 second cooldown
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (shootIntervalRef.current) {
        clearInterval(shootIntervalRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-none md:hidden"
      onTouchStart={handleJoystickStart}
      onTouchMove={handleJoystickMove}
      onTouchEnd={handleJoystickEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Dynamic Virtual Joystick */}
      {joystickActive && (
        <div
          ref={joystickRef}
          className="absolute pointer-events-none"
          style={{
            left: joystickOrigin.x - 75,
            top: joystickOrigin.y - 75,
            width: 150,
            height: 150
          }}
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 border-4 border-cyan-400/50" />
          
          {/* Inner joystick */}
          <div
            className="absolute w-20 h-20 rounded-full bg-cyan-400/40 border-4 border-cyan-300 shadow-lg shadow-cyan-500/50 transition-all duration-75"
            style={{
              left: `calc(50% - 40px + ${joystickPos.x}px)`,
              top: `calc(50% - 40px + ${joystickPos.y}px)`
            }}
          />
          
          {/* Direction indicators */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute top-2 text-cyan-400/50 text-2xl">▲</div>
            <div className="absolute bottom-2 text-cyan-400/50 text-2xl">▼</div>
            <div className="absolute left-2 text-cyan-400/50 text-2xl">◀</div>
            <div className="absolute right-2 text-cyan-400/50 text-2xl">▶</div>
          </div>
        </div>
      )}

      {/* Joystick hint when not active */}
      {!joystickActive && (
        <div className="absolute bottom-32 left-8 pointer-events-none animate-pulse">
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-cyan-400/30 flex items-center justify-center">
            <span className="text-cyan-400/50 text-xs text-center">Dotakni se<br/>za gibanje</span>
          </div>
        </div>
      )}

      {/* Action Buttons - Right side */}
      <div className="absolute bottom-8 right-8 flex flex-col gap-4 pointer-events-auto">
        {/* Shoot Button - Large and prominent */}
        <button
          onTouchStart={handleShootStart}
          onTouchEnd={handleShootEnd}
          onTouchCancel={handleShootEnd}
          className={`w-28 h-28 rounded-full border-4 transition-all duration-100 shadow-2xl ${
            shootActive
              ? 'bg-red-500/60 border-red-400 shadow-red-500/80 scale-95'
              : 'bg-red-500/30 border-red-400/70 shadow-red-500/40'
          }`}
          style={{ touchAction: 'none' }}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <span className="text-5xl">🎯</span>
            <span className="text-xs text-white font-bold mt-1">STRELJAJ</span>
          </div>
          {shootActive && (
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
          )}
        </button>

        {/* Dash and Secondary - Side by side */}
        <div className="flex gap-3">
          {/* Dash Button */}
          <button
            onTouchStart={handleDash}
            disabled={dashCooldown}
            className={`w-20 h-20 rounded-full border-4 transition-all duration-100 shadow-xl ${
              dashCooldown
                ? 'bg-gray-600/30 border-gray-500/50 opacity-50'
                : 'bg-cyan-500/30 border-cyan-400/70 shadow-cyan-500/40 active:bg-cyan-500/60 active:scale-95'
            }`}
            style={{ touchAction: 'none' }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-3xl">⚡</span>
              <span className="text-xs text-white font-bold mt-1">DASH</span>
            </div>
            {dashCooldown && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              </div>
            )}
          </button>

          {/* Secondary Weapon Button */}
          <button
            onTouchStart={handleSecondary}
            disabled={secondaryCooldown}
            className={`w-20 h-20 rounded-full border-4 transition-all duration-100 shadow-xl ${
              secondaryCooldown
                ? 'bg-gray-600/30 border-gray-500/50 opacity-50'
                : 'bg-purple-500/30 border-purple-400/70 shadow-purple-500/40 active:bg-purple-500/60 active:scale-95'
            }`}
            style={{ touchAction: 'none' }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span className="text-3xl">🌀</span>
              <span className="text-xs text-white font-bold mt-1">SPEC.</span>
            </div>
            {secondaryCooldown && (
              <div className="absolute inset-0 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-t-purple-400 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Touch zones visualization (debug - remove in production) */}
      {/* <div className="absolute top-0 left-0 w-1/2 h-full border-r-2 border-dashed border-yellow-500/30 pointer-events-none" /> */}
    </div>
  );
}
