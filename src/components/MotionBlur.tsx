interface MotionBlurProps {
  velocityX: number;
  velocityY: number;
  intensity: number;
}

export function MotionBlur({ velocityX, velocityY, intensity }: MotionBlurProps) {
  const angle = Math.atan2(velocityY, velocityX);
  const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
  const blurAmount = Math.min(magnitude * intensity, 20);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-19"
      style={{
        backdropFilter: `blur(${blurAmount}px)`,
        transform: `translate(${Math.cos(angle) * blurAmount}px, ${Math.sin(angle) * blurAmount}px)`,
        opacity: Math.min(magnitude * 0.01, 0.3),
        transition: 'all 0.1s ease-out'
      }}
    />
  );
}
