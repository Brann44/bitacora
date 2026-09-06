import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { WeekDate } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getISOWeekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getMondayOfISOWeek(weekKey: string): Date {
  const parts = weekKey.split('-W');
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);

  const simple = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = simple.getUTCDay() || 7;
  const mondayWeek1 = new Date(simple.getTime() - (dayOfWeek - 1) * 86400000);
  
  const targetMonday = new Date(mondayWeek1.getTime() + (week - 1) * 7 * 86400000);
  return new Date(targetMonday.getUTCFullYear(), targetMonday.getUTCMonth(), targetMonday.getUTCDate());
}

export function getWeekDates(weekKey: string): WeekDate[] {
  const monday = getMondayOfISOWeek(weekKey);
  const dayLabels = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];
  const shortNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return Array.from({ length: 5 }, (_, i) => {
    const current = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfMonth = String(current.getDate()).padStart(2, '0');
    const label = `${dayLabels[i]} ${dayOfMonth} ${monthNames[current.getMonth()]}`;

    return {
      dayIndex: i,
      label,
      shortLabel: shortNames[i],
      date: dateStr,
      formatted: `${dayOfMonth} ${monthNames[current.getMonth()]}`,
      isWeekend: false,
    };
  });
}

export function getWeekDateRangeString(dates: WeekDate[]): string {
  if (!dates || dates.length === 0) return '';
  const first = dates[0].formatted || '';
  const last = dates[dates.length - 1].formatted || '';
  return `${first} al ${last}`;
}

export function formatHours(hours: number): string {
  if (!hours || isNaN(hours)) return '0.00 hrs';
  return `${hours.toFixed(2)} hrs`;
}
