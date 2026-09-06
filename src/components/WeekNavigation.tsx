import React from 'react';
import { WeekData } from '../types';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface WeekNavigationProps {
  weekData: WeekData | null;
  onSelectWeek: (weekKey: string) => void;
}

export const WeekNavigation: React.FC<WeekNavigationProps> = ({ weekData, onSelectWeek }) => {
  if (!weekData) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl shadow-lg mb-6 backdrop-blur-md">
      {/* Información de Semana Actual */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <Calendar size={20} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Semana {weekData.key}
            <span className="text-[10px] font-mono font-normal text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {weekData.startDate}
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {weekData.dates[0]?.date} al {weekData.dates[weekData.dates.length - 1]?.date}
          </p>
        </div>
      </div>

      {/* Controles de Navegación de Semana */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            const [year, week] = weekData.key.split('-W').map(Number);
            const prevW = String(week - 1).padStart(2, '0');
            onSelectWeek(`${year}-W${prevW}`);
          }}
          className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:bg-slate-950/60 dark:hover:bg-slate-800 dark:border-slate-800 rounded-lg transition-colors"
          title="Semana Anterior"
        >
          <ChevronLeft size={18} />
        </button>

        <button
          onClick={() => onSelectWeek('')}
          className="px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors"
        >
          Semana Actual
        </button>

        <button
          onClick={() => {
            const [year, week] = weekData.key.split('-W').map(Number);
            const nextW = String(week + 1).padStart(2, '0');
            onSelectWeek(`${year}-W${nextW}`);
          }}
          className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:bg-slate-950/60 dark:hover:bg-slate-800 dark:border-slate-800 rounded-lg transition-colors"
          title="Semana Siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
