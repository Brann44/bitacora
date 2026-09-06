import React from 'react';
import { cn } from '../../lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200 dark:bg-slate-800', className)}
    />
  );
};
