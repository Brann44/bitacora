import React, { useState, useEffect, useRef } from 'react';
import { Activity } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TimeInput12h } from './ui/TimeInput12h';
import { Clock, Plus, Trash2, Play, Square } from 'lucide-react';
import { useToast } from './ui/Toast';

interface SubtaskAccordionProps {
  activity: Activity;
  onAddManualSubtask: (
    actId: string,
    desc: string,
    hours: number,
    startTime?: string,
    endTime?: string
  ) => Promise<void>;
  onDeleteSubtask: (actId: string, subtaskId: string) => Promise<void>;
}

function formatTime12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export const SubtaskAccordion: React.FC<SubtaskAccordionProps> = ({
  activity,
  onAddManualSubtask,
  onDeleteSubtask,
}) => {
  const toast = useToast();
  const [description, setDescription] = useState('');
  const [manualHours, setManualHours] = useState('');
  const [startTime, setStartTime] = useState(''); // "Desde"
  const [endTime, setEndTime] = useState('');     // "Hasta"
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const subtasks = activity.subtasks || [];
  const totalHours = subtasks.reduce((sum, st) => sum + (st.hours || 0), 0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const calculateHoursFromTimes = (start: string, end: string) => {
    if (!start || !end) return;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);

    let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diffMinutes < 0) diffMinutes += 24 * 60;

    setManualHours((diffMinutes / 60).toFixed(2));
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    calculateHoursFromTimes(value, endTime);
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    calculateHoursFromTimes(startTime, value);
  };

  const handleManualAdd = async () => {
    if (!description.trim()) {
      toast.error('Escribe una descripción para la sub-tarea');
      return;
    }
    const normalizedInput = manualHours.replace(',', '.');
    const parsedHours = parseFloat(normalizedInput);
    const hoursNum = !isNaN(parsedHours) && parsedHours > 0 ? parsedHours : 0;

    try {
      setLoading(true);
      await onAddManualSubtask(
        activity.id,
        description.trim(),
        hoursNum,
        startTime || undefined,
        endTime || undefined
      );
      setDescription('');
      setManualHours('');
      setStartTime('');
      setEndTime('');
      toast.success('Sub-tarea guardada');
    } catch (err) {
      toast.error('Error al guardar la sub-tarea');
    } finally {
      setLoading(false);
    }
  };

  const toggleStopwatch = async () => {
    const desc = description.trim() || 'Sub-tarea registrada';

    if (!isTimerRunning) {
      setIsTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsTimerRunning(false);

      const computedHours = Math.max(0.01, parseFloat((timerSeconds / 3600).toFixed(2)));
      setTimerSeconds(0);

      try {
        setLoading(true);
        await onAddManualSubtask(
          activity.id,
          desc,
          computedHours,
          undefined,
          undefined
        );
        setDescription('');
        toast.success('Tiempo medido guardado');
      } catch (err) {
        toast.error('Error guardando tiempo medido');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 shadow-lg my-2">
      {/* Encabezado */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Clock size={15} className="text-slate-400" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Hojas de Horas / Sub-tareas</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">({activity.name})</span>
        </div>
        <span className="bg-slate-100 dark:bg-slate-800/80 text-indigo-700 dark:text-indigo-400 font-mono text-[11px] px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700/50">
          Total: {totalHours.toFixed(2)} hrs
          {Boolean(activity.overtimeHours) && (
            <span className="text-amber-700 dark:text-amber-400"> ({activity.overtimeHours!.toFixed(2)} Extra)</span>
          )}
        </span>
      </div>

      {/* Lista de Sub-tareas */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {subtasks.length > 0 ? (
          subtasks.map((st) => {
            const hoursFormatted = st.hours ? st.hours.toFixed(2) : '0.00';
            const timeRangeText = st.startTime && st.endTime
              ? `${formatTime12h(st.startTime)} - ${formatTime12h(st.endTime)}`
              : '';
            return (
              <div
                key={st.id}
                className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-lg px-3 py-2 flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{st.description || 'Sub-tarea'}</span>
                  {timeRangeText && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">({timeRangeText})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    {hoursFormatted} hrs
                  </span>
                  <button
                    onClick={() => onDeleteSubtask(activity.id, st.id)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    title="Eliminar sub-tarea"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-2">
            No hay sub-tareas registradas para esta actividad.
          </p>
        )}
      </div>

      {/* Formulario de Entrada */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 pt-3 space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
          <div className="md:col-span-4">
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción de la sub-tarea..."
              className="text-xs py-1.5"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualAdd();
              }}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-semibold">Desde:</span>
            <TimeInput12h
              value={startTime}
              onChange={handleStartTimeChange}
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-semibold">Hasta:</span>
            <TimeInput12h
              value={endTime}
              onChange={handleEndTimeChange}
              disabled={loading}
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-1">
            <Input
              type="text"
              inputMode="decimal"
              value={manualHours}
              onChange={(e) => setManualHours(e.target.value)}
              placeholder="Horas"
              className="text-xs py-1.5 font-mono text-center"
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleManualAdd();
              }}
            />
            <span className="text-[11px] text-slate-400 font-mono">hrs</span>
          </div>

          <div className="md:col-span-2 flex items-center gap-1.5 justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleManualAdd}
              disabled={loading || !description.trim()}
              className="text-xs gap-1 py-1.5"
            >
              <Plus size={13} /> Agregar
            </Button>

            <Button
              type="button"
              variant={isTimerRunning ? 'danger' : 'secondary'}
              size="sm"
              onClick={toggleStopwatch}
              disabled={loading}
              className="text-xs gap-1 py-1.5"
              title={isTimerRunning ? 'Detener y guardar tiempo' : 'Iniciar cronómetro en vivo'}
            >
              {isTimerRunning ? (
                <>
                  <Square size={13} /> {formatTimer(timerSeconds)}
                </>
              ) : (
                <>
                  <Play size={13} /> Medir
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
