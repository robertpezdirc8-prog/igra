interface ChromaticAberrationProps {
  intensity: number;
  isActive: boolean;
}

export function ChromaticAberration({ intensity, isActive }: ChromaticAberrationProps) {
  if (!isActive) return null;

  return (
    <>
      {/* Red channel offset */}
      <div
        className="fixed inset-0 pointer-events-none z-16 mix-blend-screen"
        style={{
          background: 'rgba(255, 0, 0, 0.03)',
          transform: `translate(${intensity}px, 0)`,
          transition: 'transform 0.1s ease-out'
        }}
      />
      {/* Blue channel offset */}
      <div
        className="fixed inset-0 pointer-events-none z-16 mix-blend-screen"
        style={{
          background: 'rgba(0, 0, 255, 0.03)',
          transform: `translate(-${intensity}px, 0)`,
          transition: 'transform 0.1s ease-out'
        }}
      />
    </>
  );
}
