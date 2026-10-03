import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'dark' | 'light';
}

export default function Logo({ className = '', size = 'md', variant = 'dark' }: LogoProps) {
  const textSizes = {
    sm: 'text-xl tracking-tight',
    md: 'text-2xl tracking-tight',
    lg: 'text-3xl sm:text-4xl tracking-tighter',
    xl: 'text-5xl sm:text-6xl tracking-tighter',
  };

  const strykColor = variant === 'light' ? 'text-white' : 'text-zinc-950';

  return (
    <div className={`inline-flex items-baseline font-black font-sans select-none ${textSizes[size]} ${className}`}>
      <span className={`${strykColor} font-black tracking-normal`}>STRY</span>
      <span className="text-[#FF4A00] font-black tracking-normal">Q.</span>
    </div>
  );
}
