import { useEffect, useState } from 'react';

interface DamageNumber {
  id: number;
  value: number;
  x: number;
  y: number;
  isCrit: boolean;
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

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`absolute font-mono font-bold animate-float ${
        number.isCrit ? 'text-3xl text-yellow-400' : 'text-xl text-white'
      }`}
      style={{
        left: number.x,
        top: number.y,
        textShadow: number.isCrit
          ? '0 0 10px rgba(255, 255, 0, 0.8), 2px 2px 0 #000'
          : '0 0 5px rgba(255, 255, 255, 0.5), 1px 1px 0 #000',
        animation: 'floatUp 1s ease-out forwards'
      }}
    >
      {number.isCrit && '💥 '}
      {number.value}
      {number.isCrit && '!'}
    </div>
  );
}
