import { useState, useRef, useEffect } from 'react';

/**
 * Mobile controls — built on the mobile-shmup industry standard
 * (Phoenix 2 / Sky Force research: "the ship is controlled via
 * RELATIVE TOUCH and fires automatically"):
 *
 * 1. AUTO-FIRE — the ship fires automatically (straight battery).
 *    The player's attention belongs to DODGING. The FIRE button gives the
 *    question "where do I shoot?" a visible answer: it glows green with an
 *    AVTO badge while the battery fires by itself; a quick tap switches to
 *    MANUAL (STREL) where holding the button fires.
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
 *
 * VISIBILITY: gated on (pointer: coarse), NOT viewport width. The old
 * `md:hidden` gate hid the ENTIRE control layer on phones held in
 * landscape (CSS width ≥ 768px) — every button vanished.
 *
 * FIRE GATE: auto-fire must be (re-)engaged every time the game becomes
 * visible — this component mounts with App (before the engine exists)
 * and merely returns null while hidden, so a mount-only "shoot(true)"
 * hit a null engine and the ship never fired at all on phones.
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
  /** Mirrored layout: button stack on the LEFT, steering on the RIGHT half. */
  leftHanded?: boolean;
  /** Larger touch targets (FIRE/BOMBA 68px, ghosts 58px). */
  bigButtons?: boolean;
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
  isVisible,
  leftHanded = false,
  bigButtons = false
}: MobileControlsProps) {
  const [hasMovedOnce, setHasMovedOnce] = useState(false);
  const [dashCooldown, setDashCooldown] = useState(false);
  const [secondaryCooldown, setSecondaryCooldown] = useState(false);
  const [touchRipples, setTouchRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const rippleIdRef = useRef(0);

  // Fire mode: AUTO (battery fires itself) vs MANUAL (hold FIRE to shoot).
  const [autoFire, setAutoFire] = useState(true);
  const manualHoldRef = useRef(false);

  // Touch-device gate — pointer capability, not viewport size, so the
  // controls survive phone landscape (≥768px CSS width) and stay off desktop.
  // maxTouchPoints covers devices whose primary pointer lies (mouse attached
  // to a phone/tablet). `?touch=1` / localStorage is a preview + test
  // escape hatch (automation browsers emulate neither media nor touch).
  const computeTouch = () =>
    new URLSearchParams(window.location.search).has('touch') ||
    window.localStorage.getItem('atheria.forceTouch') === '1' ||
    window.matchMedia('(pointer: coarse)').matches ||
    navigator.maxTouchPoints > 0;
  const [isTouchDevice, setIsTouchDevice] = useState(computeTouch);
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setIsTouchDevice(computeTouch());
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  // Latest-callback refs so the auto-fire effect can run exactly once.
  const shootRef = useRef(onShoot);
  useEffect(() => {
    shootRef.current = onShoot;
  }, [onShoot]);

  // ── FIRE GATE ──
  // Runs on every visibility/mode change (NOT mount-only — see header):
  // game starts or resumes → fire per mode; pause/menu/game-over → stop.
  // MUST be gated on isTouchDevice: effects run even while the JSX
  // returns null, so an ungated gate called shoot(true) on DESKTOP too —
  // silently flipping the engine's isMobile flag (touch canvas dialect
  // on desktop + auto-aim engaged for mouse players).
  useEffect(() => {
    if (!isTouchDevice) return;
    if (!isVisible) {
      manualHoldRef.current = false;
      shootRef.current(false);
      return;
    }
    shootRef.current(autoFire || manualHoldRef.current);
    return () => shootRef.current(false);
  }, [isVisible, autoFire, isTouchDevice]);

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

    // Steering half mirrors with the left-handed setting: right-handed
    // players steer on the LEFT half (buttons right), left-handed the
    // opposite. The button stack itself is a real hit-testable layer, so
    // isInteractive already guards it; this split keeps the thumbs apart.
    const onButtonHalf = (clientX: number): boolean =>
      leftHanded ? clientX < window.innerWidth / 2 : clientX >= window.innerWidth / 2;

    const handleTouchStart = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        // Only one steering finger at a time; the button half belongs to buttons.
        if (dragIdRef.current !== null) break;
        if (onButtonHalf(t.clientX)) continue;
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
  }, [isVisible, leftHanded]);

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

  // ── FIRE button ──
  // AUTO mode: quick tap (< 300 ms) → switch to MANUAL (long holds are a
  // no-op, so an accidental press can never silence the battery silently).
  // MANUAL mode: hold → fire, release → stop; quick tap → back to AUTO.
  const fireTouchTsRef = useRef(0);
  const TAP_MS = 300;

  const handleFireStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fireTouchTsRef.current = performance.now();
    if (!autoFire) {
      manualHoldRef.current = true;
      shootRef.current(true);
    }
  };

  const handleFireEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const heldMs = performance.now() - fireTouchTsRef.current;
    if (autoFire) {
      if (heldMs < TAP_MS) setAutoFire(false);
    } else {
      manualHoldRef.current = false;
      shootRef.current(false);
      if (heldMs < TAP_MS) setAutoFire(true);
    }
  };

  const handleFireCancel = () => {
    if (!autoFire && manualHoldRef.current) {
      manualHoldRef.current = false;
      shootRef.current(false);
    }
  };

  if (!isVisible || !isTouchDevice) return null;

  // Touch-target sizes grow with the “big buttons” accessibility setting.
  const sideBtn = bigButtons
    ? 'w-[68px] h-[68px] text-2xl'
    : 'w-14 h-14 text-xl';
  const ghost =
    (bigButtons
      ? 'w-[58px] h-[58px] rounded-full bg-black/45 backdrop-blur-sm border border-white/20 '
      : 'w-[46px] h-[46px] rounded-full bg-black/45 backdrop-blur-sm border border-white/20 ') +
    'flex items-center justify-center ' +
    (bigButtons ? 'text-2xl ' : 'text-xl ') +
    'select-none transition-transform duration-75 ' +
    'active:scale-90 active:bg-white/25';
  // The whole layer mirrors for left-handed players.
  const stackSide = leftHanded ? 'left-3' : 'right-3';
  const hintSide = leftHanded ? 'right-8' : 'left-8';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* First-run hint — vanishes the moment the ship moves */}
      {!hasMovedOnce && (
        <div className={`absolute bottom-28 ${hintSide} pointer-events-none animate-pulse`}>
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-cyan-300/25 flex items-center justify-center">
            <span className="text-cyan-200/40 text-[10px] text-center leading-tight">
              povleci za let<br />🔥 strelja samodejno
            </span>
          </div>
        </div>
      )}

      {/* ── Action stack (mirrors for left-handed players) ── */}
      <div className={`absolute bottom-5 ${stackSide} flex flex-col items-center gap-2 pointer-events-auto`}>
        {/* FIRE — the button the player is looking for. Glows green with an
            AVTO badge while auto-fire is active; quick tap → hold-to-fire. */}
        <button
          onTouchStart={handleFireStart}
          onTouchEnd={handleFireEnd}
          onTouchCancel={handleFireCancel}
          aria-label={
            autoFire
              ? 'Samodejno streljanje vklopljeno — tapni za ročno streljanje'
              : 'Ročno streljanje — drži za strel, tapni za samodejno'
          }
          className={
            `${sideBtn} rounded-full border-2 flex flex-col items-center justify-center select-none transition-transform duration-75 active:scale-90 ` +
            (autoFire
              ? 'bg-emerald-600/40 border-emerald-300/80 shadow-lg shadow-emerald-900/50 animate-pulse'
              : 'bg-black/45 backdrop-blur-sm border-white/30')
          }
          style={{ touchAction: 'none' }}
        >
          <span className="leading-none">🔥</span>
          <span
            className={`text-[8px] leading-none mt-0.5 font-bold tracking-wide ${
              autoFire ? 'text-emerald-100' : 'text-white/60'
            }`}
          >
            {autoFire ? 'AVTO' : 'STREL'}
          </span>
        </button>

        {/* Panic button: BOMBA — the one button sized to find blindly */}
        <button
          onTouchStart={handleBomb}
          aria-label="Bomba"
          className={`${sideBtn} rounded-full bg-red-600/35 backdrop-blur-sm border-2 border-red-400/60 flex items-center justify-center select-none shadow-lg shadow-red-900/40 transition-transform duration-75 active:scale-90 active:bg-red-500/60`}
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
