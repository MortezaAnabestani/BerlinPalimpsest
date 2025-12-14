import React, { useState, useEffect } from 'react';
import { MousePointer2, Target } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  active?: boolean;
}

export const BrutalistButton: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  active = false,
  className = '',
  ...props 
}) => {
  // Changed text-left to text-start for RTL support
  const baseStyle = "border-4 px-6 py-4 font-bold text-lg uppercase transition-all duration-100 active:translate-x-1 active:translate-y-1 box-border block w-full text-start";
  
  const variants = {
    primary: `${active ? 'bg-berlin-neon text-white border-berlin-neon' : 'bg-white text-black border-black hover:bg-berlin-neon hover:text-white hover:border-berlin-neon'}`,
    secondary: "bg-transparent text-white border-white hover:bg-white hover:text-black",
    danger: "bg-red-600 text-white border-white hover:bg-red-700"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      {...props}
    >
      <div className="flex items-center justify-between gap-4">
        <span>{children}</span>
        {active && <Target className="w-5 h-5 animate-pulse shrink-0" />}
      </div>
    </button>
  );
};

export const ManifestoCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white border-4 border-black p-8 max-w-2xl w-full shadow-[8px_8px_0px_0px_rgba(255,0,255,1)]">
    {children}
  </div>
);

export const CoordinatesDisplay: React.FC<{ lat: number; lng: number }> = ({ lat, lng }) => (
  <div dir="ltr" className="fixed top-0 right-0 p-4 bg-black border-b-4 border-l-4 border-berlin-neon text-berlin-neon font-mono text-xs md:text-sm z-50">
    <div>LAT: {lat.toFixed(6)}</div>
    <div>LNG: {lng.toFixed(6)}</div>
    <div className="animate-pulse mt-1">:: SATELLITE LINK ACTIVE ::</div>
  </div>
);

export const GlitchTitle: React.FC<{ text: string }> = ({ text }) => {
  return (
    <span className="relative inline-block">
      <span className="absolute top-0 left-0 -ml-[2px] text-red-600 opacity-70 animate-pulse pointer-events-none select-none" aria-hidden="true">{text}</span>
      <span className="absolute top-0 left-0 ml-[2px] text-cyan-600 opacity-70 animate-pulse delay-100 pointer-events-none select-none" aria-hidden="true">{text}</span>
      <span className="relative z-10 mix-blend-hard-light">{text}</span>
    </span>
  );
};

export const TypewriterText: React.FC<{ text: string; speed?: number }> = ({ text, speed = 30 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    setDisplayedText('');
    let index = 0;
    
    if (!text) return;

    const intervalId = setInterval(() => {
      setDisplayedText((prev) => {
        if (index < text.length) {
          const charToAdd = text.charAt(index);
          index++;
          return prev + charToAdd;
        }
        clearInterval(intervalId);
        return prev;
      });
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};