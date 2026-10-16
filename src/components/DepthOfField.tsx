interface DepthOfFieldProps {
  focusX: number;
  focusY: number;
  focusRadius: number;
  blurIntensity: number;
}

export function DepthOfField({ focusX, focusY, focusRadius, blurIntensity }: DepthOfFieldProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-18"
      style={{
        background: `radial-gradient(circle at ${focusX}px ${focusY}px, transparent 0%, transparent ${focusRadius}px, rgba(0,0,0,0.3) ${focusRadius + 100}px)`,
        backdropFilter: `blur(${blurIntensity}px)`,
        maskImage: `radial-gradient(circle at ${focusX}px ${focusY}px, transparent 0%, transparent ${focusRadius}px, black ${focusRadius + 100}px)`,
        WebkitMaskImage: `radial-gradient(circle at ${focusX}px ${focusY}px, transparent 0%, transparent ${focusRadius}px, black ${focusRadius + 100}px)`
      }}
    />
  );
}
