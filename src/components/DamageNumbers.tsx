import { useEffect, useState } from 'react';

interface DamageNumber {
  id: number;
  value: number;
  x: number;
  y: number;
  isCrit: boolean;
  isHeal: boolean;
}

interface DamageNumbersProps {
  numbers: DamageNumber[];
}

export function DamageNumbers({ numbers }: DamageNumbersProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-25">
      {numbers.map((num) => (
        <DamageNumberItem key={num.id} number={num} />
      ))}
    </div>
  );
}

function DamageNumberItem({ number }: { number: DamageNumber }) {
  const [isVisible, setIsVisible] = useState(true);
  const [position, setPosition] = useState({ x: number.x, y: number.y });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 1000);
    const moveInterval = setInterval(() => {
      setPosition((prev) => ({ ...prev, y: prev.y - 2 }));
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(moveInterval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="absolute font-mono font-bold transition-all duration-1000"
      style={{
        left: position.x,
        top: position.y,
        color: number.isHeal ? '#00ff88' : number.isCrit ? '#ffff00' : '#ffffff',
        fontSize: number.isCrit ? '24px' : '16px',
        textShadow: number.isCrit
          ? '0 0 10px rgba(255, 255, 0, 0.8), 0 0 20px rgba(255, 255, 0, 0.4)'
          : number.isHeal
          ? '0 0 10px rgba(0, 255, 136, 0.8)'
          : '0 0 5px rgba(255, 255, 255, 0.6)',
        opacity: isVisible ? 1 : 0,
        transform: `translate(-50%, -50%) scale(${number.isCrit ? 1.2 : 1})`,
        animation: 'fadeOut 1s ease-out forwards'
      }}
    >
      {number.isHeal ? '+' : ''}{number.value}
      {number.isCrit && '💥'}
    </div>
  );
}
