import React from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <label className={cn('flex items-center justify-between cursor-pointer group', disabled && 'opacity-50 cursor-not-allowed')}>
      {(label || description) && (
        <div className="flex flex-col pr-4">
          {label && <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>}
          {description && <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/20',
          checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </label>
  );
};
