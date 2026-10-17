import { useState, useRef, useEffect } from 'react';

/**
 * Mobile controls — built on the mobile-shmup industry standard
 * (Phoenix 2 / Sky Force research: "the ship is controlled via
 * RELATIVE TOUCH and fires automatically"):
 *
 * 1. AUTO-FIRE — the ship fires automatically (straight battery).
 *    The player's attention belongs to DODGING, so there is no shoot button.
 * 2. RELATIVE DRAG — touch anywhere on the left half; the ship does NOT
 *    jump to the finger. It keeps its touchstart offset and follows the
 *    finger's movement delta 1:1 (engine applies a small sensitivity gain).
 *    No acceleration, no deadzone, no joystick ring — the finger itself
 *    is the indicator. This is what makes dodge maneuvers feel instant.
 * 3. One panic button (BOMBA) + a compact ghost stack of utility icons —
 *    no labels, ~46px touch targets, tucked against the right edge so
 *    the playfield stays clear.
 *
 * IMPLEMENTATION NOTE: drag listeners live on `window` (native, with
 * touch-identifier tracking) because this layer is `pointer-events-none`
 * — the browser never hit-tests it. Identifier tracking keeps it
 * multi-touch safe: left thumb steers while the right thumb taps buttons.
 */

interface MobileControlsProps {
  onDragStart: () => void;
  onDragMove: (dx: number, dy: number) => void;
  onDragEnd: () => void;
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
  onDragStart,
  onDragMove,
  onDragEnd,
  onShoot,
  onDash,
  onSecondary,
  onBomb,
  onWaveStart,
  onWaveEnd,
  onGradius,
  isVisible
}: MobileControlsProps) {
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

  // ── Relative drag — native window listeners, multi-touch safe ──
  const dragIdRef = useRef<number | null>(null);
  const anchorRef = useRef({ x: 0, y: 0 });
  const dragStartRef = useRef(onDragStart);
  const dragMoveRef = useRef(onDragMove);
  const dragEndRef = useRef(onDragEnd);
  useEffect(() => {
    dragStartRef.current = onDragStart;
    dragMoveRef.current = onDragMove;
    dragEndRef.current = onDragEnd;
  }, [onDragStart, onDragMove, onDragEnd]);

  useEffect(() => {
    if (!isVisible) {
      // Controls hidden → release any active drag instantly.
      if (dragIdRef.current !== null) {
        dragIdRef.current = null;
        dragEndRef.current();
      }
      return;
    }

    const isInteractive = (el: EventTarget | null): boolean =>
      el instanceof Element && !!el.closest('button, input, a, select, textarea, [role="button"]');

    const handleTouchStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        // Only one steering finger at a time; right half belongs to buttons.
        if (dragIdRef.current !== null) break;
        if (t.clientX >= window.innerWidth / 2) continue;
        if (isInteractive(t.target)) continue;
        dragIdRef.current = t.identifier;
        anchorRef.current = { x: t.clientX, y: t.clientY };
        setHasMovedOnce(true);
        triggerHaptic(8);
        dragStartRef.current();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (dragIdRef.current === null) return;
      const t = Array.from(e.touches).find(x => x.identifier === dragIdRef.current);
      if (!t) return;
      // Steering finger → suppress browser pan/zoom gestures.
      e.preventDefault();
      dragMoveRef.current(
        t.clientX - anchorRef.current.x,
        t.clientY - anchorRef.current.y
      );
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (dragIdRef.current === null) return;
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier === dragIdRef.current) {
          dragIdRef.current = null;
          dragEndRef.current();
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isVisible]);

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
    <div className="fixed inset-0 z-50 pointer-events-none md:hidden">
      {/* First-run hint — vanishes the moment the ship moves */}
      {!hasMovedOnce && (
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
