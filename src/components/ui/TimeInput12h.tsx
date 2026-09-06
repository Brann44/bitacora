import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface TimeInput12hProps {
  id?: string;
  value: string; // "HH:MM" en 24h, o "" vacío
  onChange: (value24h: string) => void;
  className?: string;
  disabled?: boolean;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i); // 0..59

interface LocalTime {
  hour12: number | null;
  minute: number | null;
  period: 'AM' | 'PM';
}

function to24h(hour12: number, minute: number, period: 'AM' | 'PM'): string {
  const h24 = period === 'PM' ? (hour12 % 12) + 12 : hour12 % 12;
  return `${String(h24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function from24h(value: string): LocalTime {
  if (!value || !value.includes(':')) return { hour12: null, minute: null, period: 'AM' };
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return { hour12: null, minute: null, period: 'AM' };
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: m, period };
}

const selectClass = 'bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-lg py-1.5 focus:outline-none focus:border-indigo-500 font-mono';

export const TimeInput12h: React.FC<TimeInput12hProps> = ({ id, value, onChange, className, disabled }) => {
  const [local, setLocal] = useState<LocalTime>(() => from24h(value));

  useEffect(() => {
    setLocal(from24h(value));
  }, [value]);

  const handleChange = (h: number | null, m: number | null, p: 'AM' | 'PM') => {
    const wasComplete = local.hour12 != null && local.minute != null;
    setLocal({ hour12: h, minute: m, period: p });
    if (h != null && m != null) {
      onChange(to24h(h, m, p));
    } else if (wasComplete) {
      onChange('');
    }
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <select
        id={id}
        aria-label="Hora"
        value={local.hour12 ?? ''}
        onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : null, local.minute, local.period)}
        disabled={disabled}
        className={cn(selectClass, 'w-11 px-1 text-center')}
      >
        <option value="">--</option>
        {HOURS_12.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-slate-400 dark:text-slate-600">:</span>
      <select
        aria-label="Minutos"
        value={local.minute ?? ''}
        onChange={(e) => handleChange(local.hour12, e.target.value ? Number(e.target.value) : null, local.period)}
        disabled={disabled}
        className={cn(selectClass, 'w-11 px-1 text-center')}
      >
        <option value="">--</option>
        {MINUTES_60.map((m) => (
          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
        ))}
      </select>
      <select
        aria-label="AM/PM"
        value={local.period}
        onChange={(e) => handleChange(local.hour12, local.minute, e.target.value as 'AM' | 'PM')}
        disabled={disabled}
        className={cn(selectClass, 'w-14 px-1')}
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};
