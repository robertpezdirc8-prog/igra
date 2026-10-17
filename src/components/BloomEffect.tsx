interface BloomEffectProps {
  intensity: number;
  threshold: number;
}

export function BloomEffect({ intensity }: BloomEffectProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-20"
      style={{
        mixBlendMode: 'screen',
        filter: `brightness(${intensity}) contrast(1.2)`,
        opacity: 0.3,
        background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)'
      }}
    />
  );
}
