import { useState, useRef, useEffect } from 'react';

/**
 * Mobile controls — built on the mobile-shmup industry standard
 * (Sky Force, Phoenix II, Danmaku Unlimited mobile research):
 *
 * 1. AUTO-FIRE — the ship fires automatically (straight battery).
 *    "Auto-fire removes an input that adds no decision" — the player's
 *    attention belongs to DODGING, so there is no shoot button at all.
 * 2. Drag anywhere on the left half — a dynamic ghost joystick that only
 *    appears where the thumb lands.
 * 3. One panic button (BOMBA) + a compact ghost stack of utility icons —
 *    no labels, ~46px touch targets, tucked against the right edge so
 *    the playfield stays clear.
 */

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onShoot: (active: boolean) => void;
  onDash: () => void;
  onSecondary: () => void;
  onBomb: () => void;
  onWaveStart: () => void;
  onWaveEnd: () => void;
  onGradius: () => void;
  isVisible: boolean;
  joystickPosition?: { x: number; y: number };
  buttonSize?: 'small' | 'medium' | 'large';
}

export function MobileControls({
  onMove,
  onShoot,
  onDash,
  onSecondary,
  onBomb,
  onWaveStart,
  onWaveEnd,
  onGradius,
  isVisible
}: MobileControlsProps) {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [joystickOrigin, setJoystickOrigin] = useState({ x: 0, y: 0 });
  const [hasMovedOnce, setHasMovedOnce] = useState(false);
  const [dashCooldown, setDashCooldown] = useState(false);
  const [secondaryCooldown, setSecondaryCooldown] = useState(false);
  const [touchRipples, setTouchRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleIdRef = useRef(0);

  // Latest-callback refs so the auto-fire effect can run exactly once.
  const shootRef = useRef(onShoot);
  useEffect(() => {
    shootRef.current = onShoot;
  }, [onShoot]);

  // ── AUTO-FIRE ──
  // Standard mobile shmup convention: the battery fires the whole run.
  // Mounted while playing → firing; unmounted (pause/menu) → stop.
  useEffect(() => {
    shootRef.current(true);
    return () => shootRef.current(false);
  }, []);

  // Haptic feedback
  const triggerHaptic = (pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const addTouchRipple = (x: number, y: number) => {
    const id = rippleIdRef.current++;
    setTouchRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => {
      setTouchRipples(prev => prev.filter(r => r.id !== id));
    }, 500);
  };

  // Dynamic joystick — appears where the thumb lands on the left half
  const handleJoystickStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX < window.innerWidth / 2) {
      e.stopPropagation();
      setJoystickActive(true);
      setJoystickOrigin({ x: touch.clientX, y: touch.clientY });
      setJoystickPos({ x: 0, y: 0 });
      setHasMovedOnce(true);
      triggerHaptic(8);
    }
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - joystickOrigin.x;
    const deltaY = touch.clientY - joystickOrigin.y;
    const maxDistance = 60;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    let moveX = deltaX;
    let moveY = deltaY;
    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      moveX = deltaX * ratio;
      moveY = deltaY * ratio;
    }
    setJoystickPos({ x: moveX, y: moveY });
    onMove(moveX / maxDistance, moveY / maxDistance);
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const handleDash = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dashCooldown) {
      onDash();
      triggerHaptic([20, 50, 20]);
      setDashCooldown(true);
      setTimeout(() => setDashCooldown(false), 1000);
    }
  };

  const handleBomb = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onBomb();
    addTouchRipple(e.touches[0]?.clientX ?? 0, e.touches[0]?.clientY ?? 0);
    triggerHaptic([60, 40, 60]);
  };

  const handleWaveStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onWaveStart();
    triggerHaptic(15);
  };
  const handleWaveEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onWaveEnd();
    triggerHaptic([40, 30, 40]);
  };

  const handleGradius = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onGradius();
    triggerHaptic(25);
  };

  const handleSecondary = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!secondaryCooldown) {
      onSecondary();
      triggerHaptic([30, 50, 30]);
      setSecondaryCooldown(true);
      setTimeout(() => setSecondaryCooldown(false), 2000);
    }
  };

  if (!isVisible) return null;

  // Shared ghost-button style: small, dark, borderless-ish, label-free.
  const ghost =
    'w-[46px] h-[46px] rounded-full bg-black/45 backdrop-blur-sm border border-white/20 ' +
    'flex items-center justify-center text-xl select-none transition-transform duration-75 ' +
    'active:scale-90 active:bg-white/25';

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none md:hidden"
      onTouchStart={handleJoystickStart}
      onTouchMove={handleJoystickMove}
      onTouchEnd={handleJoystickEnd}
      style={{ touchAction: 'none' }}
    >
      {/* Dynamic ghost joystick — only while the thumb is down */}
      {joystickActive && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: joystickOrigin.x - 70,
            top: joystickOrigin.y - 70,
            width: 140,
            height: 140
          }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-cyan-300/30 bg-cyan-300/5" />
          <div
            className="absolute w-14 h-14 rounded-full bg-cyan-300/25 border-2 border-cyan-200/50"
            style={{
              left: `calc(50% - 28px + ${joystickPos.x}px)`,
              top: `calc(50% - 28px + ${joystickPos.y}px)`
            }}
          />
        </div>
      )}

      {/* First-run hint — vanishes the moment the ship moves */}
      {!joystickActive && !hasMovedOnce && (
        <div className="absolute bottom-28 left-8 pointer-events-none animate-pulse">
          <div className="w-20 h-20 rounded-full border-2 border-dashed border-cyan-300/25 flex items-center justify-center">
            <span className="text-cyan-200/40 text-[10px] text-center leading-tight">
              povleci<br />za let
            </span>
          </div>
        </div>
      )}

      {/* ── Right-edge action stack (compact, label-free) ── */}
      <div className="absolute bottom-5 right-3 flex flex-col items-center gap-2 pointer-events-auto">
        {/* Panic button: BOMBA — the one button sized to find blindly */}
        <button
          onTouchStart={handleBomb}
          aria-label="Bomba"
          className="w-14 h-14 rounded-full bg-red-600/35 backdrop-blur-sm border-2 border-red-400/60 flex items-center justify-center text-2xl select-none shadow-lg shadow-red-900/40 transition-transform duration-75 active:scale-90 active:bg-red-500/60"
          style={{ touchAction: 'none' }}
        >
          💥
        </button>

        {/* Utility ghost stack */}
        <div className="flex flex-col gap-2 mt-1">
          <button
            onTouchStart={handleWaveStart}
            onTouchEnd={handleWaveEnd}
            onTouchCancel={handleWaveEnd}
            aria-label="Valovni top"
            className={`${ghost} ${'text-amber-300/90'}`}
            style={{ touchAction: 'none' }}
          >
            🔆
          </button>
          <button
            onTouchStart={handleGradius}
            aria-label="Gradius kapsula"
            className={`${ghost} text-yellow-300/90`}
            style={{ touchAction: 'none' }}
          >
            🟡
          </button>
          <button
            onTouchStart={handleSecondary}
            aria-label="Posebno orožje"
            className={`${ghost} ${secondaryCooldown ? 'opacity-30' : 'text-purple-300/90'}`}
            style={{ touchAction: 'none' }}
          >
            🌀
          </button>
          <button
            onTouchStart={handleDash}
            aria-label="Dash"
            className={`${ghost} ${dashCooldown ? 'opacity-30' : 'text-cyan-300/90'}`}
            style={{ touchAction: 'none' }}
          >
            ⚡
          </button>
        </div>
      </div>

      {/* Subtle touch ripples */}
      {touchRipples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{ left: ripple.x - 26, top: ripple.y - 26, width: 52, height: 52 }}
        >
          <div className="w-full h-full rounded-full border-2 border-cyan-300/40 animate-ping" />
        </div>
      ))}
    </div>
  );
}
