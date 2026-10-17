import { useState } from 'react';

interface MobileControlsProps {
  onMove: (x: number, y: number) => void;
  onShootStart: () => void;
  onShootEnd: () => void;
  onDash: () => void;
  onSecondary: () => void;
  isVisible: boolean;
}

export function MobileControls({ onMove, onShootStart, onShootEnd, onDash, onSecondary, isVisible }: MobileControlsProps) {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });

  if (!isVisible) return null;

  const handleJoystickStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setJoystickActive(true);
    const touch = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    setJoystickPos({ x: deltaX, y: deltaY });
    onMove(deltaX / 50, deltaY / 50);
  };

  const handleJoystickMove = (e: React.TouchEvent) => {
    if (!joystickActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = Math.max(-50, Math.min(50, touch.clientX - centerX));
    const deltaY = Math.max(-50, Math.min(50, touch.clientY - centerY));
    setJoystickPos({ x: deltaX, y: deltaY });
    onMove(deltaX / 50, deltaY / 50);
  };

  const handleJoystickEnd = () => {
    setJoystickActive(false);
    setJoystickPos({ x: 0, y: 0 });
    onMove(0, 0);
  };

  return (
    <div className="fixed inset-0 z-30 pointer-events-none md:hidden">
      {/* Virtual joystick */}
      <div
        className="absolute bottom-20 left-20 w-32 h-32 rounded-full bg-gray-800/50 border-2 border-cyan-400/30 pointer-events-auto"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
      >
        <div
          className="absolute w-16 h-16 rounded-full bg-cyan-400/30 border-2 border-cyan-400 transition-all"
          style={{
            left: `calc(50% - 2rem + ${joystickPos.x}px)`,
            top: `calc(50% - 2rem + ${joystickPos.y}px)`
          }}
        />
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-20 right-20 flex flex-col gap-4 pointer-events-auto">
        {/* Shoot button (continuous fire while held) */}
        <button
          onTouchStart={onShootStart}
          onTouchEnd={onShootEnd}
          onTouchCancel={onShootEnd}
          className="w-20 h-20 rounded-full bg-red-500/30 border-2 border-red-400 active:bg-red-500/50 transition-all"
        >
          <span className="text-3xl">🎯</span>
        </button>

        {/* Dash button */}
        <button
          onTouchStart={onDash}
          className="w-16 h-16 rounded-full bg-cyan-500/30 border-2 border-cyan-400 active:bg-cyan-500/50 transition-all"
        >
          <span className="text-2xl">⚡</span>
        </button>

        {/* Secondary weapon button */}
        <button
          onTouchStart={onSecondary}
          className="w-16 h-16 rounded-full bg-purple-500/30 border-2 border-purple-400 active:bg-purple-500/50 transition-all"
        >
          <span className="text-2xl">🌀</span>
        </button>
      </div>
    </div>
  );
}
