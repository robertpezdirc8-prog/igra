import { useState } from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

export function Button({ 
  onClick, 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  className = ''
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = 'relative font-mono uppercase tracking-wider transition-all duration-200 outline-none';
  
  const variantClasses = {
    primary: 'bg-cyan-500/20 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-500/30 hover:border-cyan-300 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]',
    secondary: 'bg-purple-500/20 border-2 border-purple-400 text-purple-400 hover:bg-purple-500/30 hover:border-purple-300 hover:text-purple-300 hover:shadow-[0_0_20px_rgba(255,0,255,0.5)]',
    danger: 'bg-red-500/20 border-2 border-red-400 text-red-400 hover:bg-red-500/30 hover:border-red-300 hover:text-red-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.5)]'
  };

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      style={{
        transform: isPressed ? 'scale(0.95)' : isHovered ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {/* Glow effect */}
      {isHovered && !disabled && (
        <div className="absolute inset-0 rounded animate-pulse opacity-50" 
             style={{ 
               background: variant === 'primary' ? 'radial-gradient(circle, rgba(0,255,255,0.3) 0%, transparent 70%)' :
                          variant === 'secondary' ? 'radial-gradient(circle, rgba(255,0,255,0.3) 0%, transparent 70%)' :
                          'radial-gradient(circle, rgba(255,0,0,0.3) 0%, transparent 70%)'
             }} 
        />
      )}
      
      {/* Button content */}
      <span className="relative z-10">{children}</span>
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current opacity-50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current opacity-50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current opacity-50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current opacity-50" />
    </button>
  );
}
