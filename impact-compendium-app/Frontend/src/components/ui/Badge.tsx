import React from 'react';

interface BadgeProps {
  variant: 'impact' | 'outcome' | 'story' | 'other';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  const variants = {
    impact: 'bg-red-100 text-red-800 border-red-200',
    outcome: 'bg-green-100 text-green-800 border-green-200',
    story: 'bg-blue-100 text-blue-800 border-blue-200',
    other: 'bg-purple-100 text-purple-800 border-purple-200'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};
