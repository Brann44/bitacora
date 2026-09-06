import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl shadow-sm overflow-hidden transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
