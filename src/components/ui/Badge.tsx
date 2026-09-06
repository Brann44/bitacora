import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'purple' | 'danger' | 'category' | 'odoo';
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className, onClick }) => {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    category: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-mono text-[10px]',
    odoo: 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-400 font-mono text-[10px]',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60',
    warning: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60',
    info: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60',
    purple: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/60',
    danger: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60',
  };

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
