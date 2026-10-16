interface ScanlineEffectProps {
  intensity: number;
  speed?: number;
}

export function ScanlineEffect({ intensity, speed = 1 }: ScanlineEffectProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-21"
      style={{
        background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,${intensity}) 2px, rgba(0,0,0,${intensity}) 4px)`,
        animation: `scanline ${10 / speed}s linear infinite`
      }}
    />
  );
}
