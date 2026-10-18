import { useState, useEffect } from 'react';

interface CrosshairProps {
  x: number;
  y: number;
  isActive: boolean;
  /** Dash available right now (cooldown finished AND enough energy). */
  dashReady?: boolean;
  /** Remaining dash cooldown, normalized 0..1 (1 = just dashed, 0 = ready). */
  dashPct?: number;
}

const RING_R = 17;
const RING_C = 2 * Math.PI * RING_R;

export function Crosshair({ x, y, isActive, dashReady = true, dashPct = 0 }: CrosshairProps) {
  const [isShooting, setIsShooting] = useState(false);
  const [readyPulse, setReadyPulse] = useState(false);

  useEffect(() => {
    if (isActive) {
      const raf = requestAnimationFrame(() => setIsShooting(true));
      const timer = setTimeout(() => setIsShooting(false), 100);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [isActive]);

  // Brief bright pulse when the dash ring refills (cooldown -> ready)
  useEffect(() => {
    if (!dashReady) return;
    const raf = requestAnimationFrame(() => setReadyPulse(true));
    const timer = setTimeout(() => setReadyPulse(false), 250);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [dashReady]);

  // Ring fill: grows back to full as the cooldown recovers
  const fill = Math.min(1, Math.max(0, 1 - dashPct));
  const energyStarved = dashPct === 0 && !dashReady;
  const ringColor = energyStarved
    ? '#ffaa00'                              // cooldown done but not enough energy
    : dashReady
      ? readyPulse ? '#aaffff' : '#00ffff'   // ready (brief brighter pulse)
      : 'rgba(0,255,255,0.4)';               // still cooling down

  return (
    <div
      className="fixed pointer-events-none z-40 transition-transform duration-75"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)'
      }}
      aria-hidden="true"
    >
      {/* Dash cooldown ring (SVG) — full + bright = SPACE dash available */}
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) ${readyPulse ? 'scale(1.25)' : 'scale(1)'}`,
          transition: 'transform 120ms ease-out',
          overflow: 'visible'
        }}
      >
        <circle
          cx="20"
          cy="20"
          r={RING_R}
          fill="none"
          stroke={ringColor}
          strokeWidth={readyPulse ? 3 : 2}
          strokeLinecap="round"
          strokeDasharray={`${RING_C * fill} ${RING_C}`}
          transform="rotate(-90 20 20)"
          style={{
            filter: dashReady ? `drop-shadow(0 0 ${readyPulse ? 6 : 3}px rgba(0,255,255,0.9))` : 'none',
            transition: 'stroke 120ms linear, stroke-width 120ms linear'
          }}
        />
      </svg>

      {/* Outer ring */}
      <div
        className="absolute w-8 h-8 border-2 rounded-full transition-all duration-100"
        style={{
          borderColor: isShooting ? '#ff0044' : '#00ffff',
          boxShadow: isShooting
            ? '0 0 15px rgba(255, 0, 68, 0.8)'
            : '0 0 10px rgba(0, 255, 255, 0.6)',
          transform: isShooting ? 'scale(1.2)' : 'scale(1)'
        }}
      />

      {/* Inner dot */}
      <div
        className="absolute w-1 h-1 rounded-full"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: isShooting ? '#ff0044' : '#00ffff',
          boxShadow: isShooting
            ? '0 0 10px rgba(255, 0, 68, 0.8)'
            : '0 0 5px rgba(0, 255, 255, 0.8)'
        }}
      />

      {/* Cross lines */}
      <div
        className="absolute w-px h-3"
        style={{
          left: '50%',
          top: '-6px',
          transform: 'translateX(-50%)',
          backgroundColor: isShooting ? '#ff0044' : '#00ffff',
          opacity: 0.6
        }}
      />
      <div
        className="absolute w-px h-3"
        style={{
          left: '50%',
          bottom: '-6px',
          transform: 'translateX(-50%)',
          backgroundColor: isShooting ? '#ff0044' : '#00ffff',
          opacity: 0.6
        }}
      />
      <div
        className="absolute h-px w-3"
        style={{
          top: '50%',
          left: '-6px',
          transform: 'translateY(-50%)',
          backgroundColor: isShooting ? '#ff0044' : '#00ffff',
          opacity: 0.6
        }}
      />
      <div
        className="absolute h-px w-3"
        style={{
          top: '50%',
          right: '-6px',
          transform: 'translateY(-50%)',
          backgroundColor: isShooting ? '#ff0044' : '#00ffff',
          opacity: 0.6
        }}
      />
    </div>
  );
}
