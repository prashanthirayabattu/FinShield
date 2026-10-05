import React from 'react';

interface BadgeProps {
  variant?: 'cyan' | 'teal' | 'red' | 'yellow' | 'gray';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'cyan',
  children,
  className = '',
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/60',
    teal: 'bg-teal-950/60 text-teal-400 border-teal-800/60',
    red: 'bg-red-950/60 text-red-400 border-red-800/60',
    yellow: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    gray: 'bg-slate-900/60 text-slate-400 border-slate-700/60',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
