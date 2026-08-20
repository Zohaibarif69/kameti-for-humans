import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-[12px]',
  md: 'w-9 h-9 text-[13px]',
  lg: 'w-11 h-11 text-[15px]',
};

const colors = [
  'bg-[#176B4D] text-white',
  'bg-[#3B6EA8] text-white',
  'bg-[#B7791F] text-white',
  'bg-[#6B4D8B] text-white',
  'bg-[#4D6B8B] text-white',
  'bg-[#8B4D6B] text-white',
];

function getColor(name: string): string {
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  return (
    <div className={`${sizeClasses[size]} ${getColor(name)} rounded-full flex items-center justify-center font-semibold shrink-0 ${className}`} aria-label={name}>
      {initials}
    </div>
  );
}
