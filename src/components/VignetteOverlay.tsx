interface VignetteOverlayProps {
  intensity: number;
  color?: string;
}

export function VignetteOverlay({ intensity, color = 'black' }: VignetteOverlayProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-15"
      style={{
        background: `radial-gradient(ellipse at center, transparent 0%, transparent 50%, ${color}${Math.floor(intensity * 255).toString(16).padStart(2, '0')} 100%)`,
        transition: 'all 0.3s ease-out'
      }}
    />
  );
}
