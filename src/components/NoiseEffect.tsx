interface NoiseEffectProps {
  intensity: number;
  animated?: boolean;
}

export function NoiseEffect({ intensity, animated = true }: NoiseEffectProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-22"
      style={{
        opacity: intensity,
        background: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        mixBlendMode: 'overlay',
        animation: animated ? 'noise 0.5s steps(10) infinite' : 'none'
      }}
    />
  );
}
