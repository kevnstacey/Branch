// components/Avatar.tsx
import React from 'react';
import { User } from '../types';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
};

const Avatar: React.FC<AvatarProps> = ({ user, size = 'md' }) => {
  const isEmoji = /\p{Emoji}/u.test(user.avatar);

  // Simple hashing for color generation
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };
  
  // Removed intToRGB as it was unused.
  
  const colors = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', '#34d399', '#2dd4bf', '#22d3ee', '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#c084fc', '#e879f9', '#f472b6'];
  const color = colors[Math.abs(hashCode(user.name)) % colors.length];

  if (isEmoji) {
    return (
      <div className={`flex-shrink-0 flex items-center justify-center rounded-full bg-stone-200 ${sizeClasses[size]}`} title={user.name}>
        <span className="text-xl">{user.avatar}</span>
      </div>
    );
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div 
      className={`flex-shrink-0 flex items-center justify-center rounded-full text-white font-bold ${sizeClasses[size]}`} 
      style={{ backgroundColor: color }}
      title={user.name}
    >
      <span>{initials}</span>
    </div>
  );
};

export default Avatar;