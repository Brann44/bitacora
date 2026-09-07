import React, { useState } from 'react';
import { WeekData, Activity } from '../types';
import { SubtaskAccordion } from './SubtaskAccordion';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { useToast } from './ui/Toast';
import { Check, Clock, Trash2, GripVertical, Folder, Zap, ChevronDown, Plus, Tag } from 'lucide-react';

const PRESET_CATEGORIES = [
  'Soporte',
  'Soporte Técnico',
  'Desarrollo',
  'Mantenimiento',
  'Infraestructura IT',
  'Redes',
  'Administrativa',
  'Reunión / Capacitación',
  'Proyecto',
  'Calidad / QA',
  'General',
];

interface BitacoraTableProps {
  weekData: WeekData | null;
  loading?: boolean;
  onToggleDay: (actId: string, dayIndex: number) => Promise<void>;
  onToggleForcedOvertimeDate: (date: string) => Promise<void>;
  onToggleActivityOvertime: (actId: string, currentValue: boolean) => Promise<void>;
  onUpdateActivityDirectHours: (actId: string, directHours: number) => Promise<void>;
  onUpdateActivityCategory: (actId: string, category: string) => Promise<void>;
  onAddManualSubtask: (
    actId: string,
    desc: string,
    hours: number,
    startTime?: string,
    endTime?: string
  ) => Promise<void>;
  onDeleteSubtask: (actId: string, subtaskId: string) => Promise<void>;
  onDeleteActivity: (actId: string) => Promise<void>;
  onReorderActivities: (orderedIds: string[]) => Promise<void>;
  sortMode: 'day' | 'name' | 'manual';
  onSortModeChange: (mode: 'day' | 'name' | 'manual') => void;
}

export const BitacoraTable: React.FC<BitacoraTableProps> = ({
  weekData,
  loading,
  onToggleDay,
  onToggleForcedOvertimeDate,
  onToggleActivityOvertime,
  onUpdateActivityDirectHours,
  onUpdateActivityCategory,
  onAddManualSubtask,
  onDeleteSubtask,
  onDeleteActivity,
  onReorderActivities,
  sortMode,
  onSortModeChange,
}) => {
  const toast = useToast();
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({});
  const [openCategoryMenuId, setOpenCategoryMenuId] = useState<string | null>(null);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [directHoursDrafts, setDirectHoursDrafts] = useState<Record<string, string>>({});

  if (loading) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              {[...Array(5)].map((__, j) => (
                <Skeleton key={j} className="h-7 w-7 rounded-lg shrink-0" />
              ))}
              <Skeleton className="h-7 w-16 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!weekData || !weekData.activities) return null;

  const isManualMode = sortMode === 'manual';
  const forcedOvertimeDates = weekData.forcedOvertimeDates || [];

  const handleToggleForcedOvertimeDate = (date: string) => {
    onToggleForcedOvertimeDate(date).catch((err: any) =>
      toast.error(`Error al marcar día como tiempo extra: ${err.message}`)
    );
  };

  const handleToggleActivityOvertime = (actId: string, currentValue: boolean) => {
    onToggleActivityOvertime(actId, currentValue).catch((err: any) =>
      toast.error(`Error al marcar actividad como tiempo extra: ${err.message}`)
    );
  };

  const commitDirectHours = (actId: string, rawValue: string) => {
    const normalized = rawValue.replace(',', '.').trim();
    const parsed = normalized === '' ? 0 : parseFloat(normalized);
    const hoursNum = !isNaN(parsed) && parsed > 0 ? parsed : 0;
    setDirectHoursDrafts((prev) => {
      const next = { ...prev };
      delete next[actId];
      return next;
    });
    onUpdateActivityDirectHours(actId, hoursNum).catch((err: any) =>
      toast.error(`Error al guardar horas directas: ${err.message}`)
    );
  };

  const toggleAccordion = (actId: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [actId]: !prev[actId],
    }));
  };

  const sortedActivities = [...weekData.activities].sort((a, b) => {
    if (sortMode === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const handleDrop = (targetId: string) => {
    const draggedFrom = draggedId;
    setDraggedId(null);
    setDragOverId(null);
    if (!draggedFrom || draggedFrom === targetId) return;

    const ids = sortedActivities.map((a) => a.id);
    const fromIdx = ids.indexOf(draggedFrom);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;

    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, draggedFrom);
    onReorderActivities(ids).catch((err: any) => toast.error(`Error al reordenar: ${err.message}`));
  };

  return (
    <div className="space-y-4">
      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
          <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Actividades de la Semana
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Ordenar por:</span>
            <select
              value={sortMode}
              onChange={(e) => onSortModeChange(e.target.value as any)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500"
            >
              <option value="day">Día de la Semana (Lunes a Viernes)</option>
              <option value="name">Nombre de Actividad (A-Z)</option>
              <option value="manual">Orden Manual</option>
            </select>
            {isManualMode && (
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <GripVertical size={12} /> Arrastra las filas para reordenar
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-5/12">ACTIVIDAD / TAREA</th>
                {weekData.dates.map((d) => {
                  const isForced = forcedOvertimeDates.includes(d.date);
                  return (
                    <th
                      key={d.dayIndex}
                      className={`py-3 px-2 text-center w-24 transition-colors ${
                        isForced ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{d.label}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleForcedOvertimeDate(d.date)}
                          className={`p-1 rounded-md border normal-case tracking-normal transition-colors ${
                            isForced
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30'
                              : 'bg-slate-100 border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 dark:bg-slate-800/30 dark:border-slate-700/60 dark:hover:text-slate-300 dark:hover:border-slate-600'
                          }`}
                          title={
                            isForced
                              ? 'Día marcado como tiempo extra -- clic para quitar la marca'
                              : 'Marcar todo el día como tiempo extra'
                          }
                        >
                          <Zap size={11} />
                        </button>
                      </div>
                    </th>
                  );
                })}
                <th className="py-3 px-4 text-center w-28">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {sortedActivities.length > 0 ? (
                sortedActivities.map((act) => {
                  const subtasks = act.subtasks || [];
                  const totalSubtaskHours = subtasks.reduce((sum, st) => sum + (st.hours || 0), 0);
                  const totalActivityHours = (act.directHours || 0) + totalSubtaskHours;
                  const directHoursValue = directHoursDrafts[act.id] ?? (act.directHours ? String(act.directHours) : '');
                  const isExpanded = Boolean(expandedRowIds[act.id]);

                  return (
                    <React.Fragment key={act.id}>
                      <tr
                        draggable={isManualMode}
                        onDragStart={isManualMode ? () => setDraggedId(act.id) : undefined}
                        onDragOver={isManualMode ? (e) => { e.preventDefault(); setDragOverId(act.id); } : undefined}
                        onDragLeave={isManualMode ? () => setDragOverId((prev) => (prev === act.id ? null : prev)) : undefined}
                        onDrop={isManualMode ? (e) => { e.preventDefault(); handleDrop(act.id); } : undefined}
                        onDragEnd={isManualMode ? () => { setDraggedId(null); setDragOverId(null); } : undefined}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                          isManualMode ? 'cursor-move' : ''
                        } ${draggedId === act.id ? 'opacity-40' : ''} ${
                          dragOverId === act.id && draggedId !== act.id
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 outline outline-2 -outline-offset-2 outline-indigo-400'
                            : ''
                        } ${
                          act.forcedOvertime ? 'border-l-2 border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/[0.03]' : ''
                        }`}
                      >
                        {/* Nombre & Badges */}
                        <td className="py-3.5 px-4 align-top">
                          <div className="flex items-start gap-2">
                            {isManualMode && (
                              <GripVertical size={14} className="text-slate-400 shrink-0 mt-1" />
                            )}
                            <div className="space-y-1 flex-1 min-w-0">
                              <strong className="text-xs text-slate-900 dark:text-slate-100 font-semibold block leading-snug">
                                {act.name}
                              </strong>

                              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                {/* Selector Interactivo de Categoría */}
                                <div className="relative inline-block">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (openCategoryMenuId === act.id) {
                                        setOpenCategoryMenuId(null);
                                      } else {
                                        setOpenCategoryMenuId(act.id);
                                        setCustomCategoryInput('');
                                      }
                                    }}
                                    className="text-[11px] font-medium px-2 py-0.5 rounded-md border inline-flex items-center gap-1 transition-all bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-800 shadow-sm cursor-pointer"
                                    title="Clic para cambiar la categoría de esta actividad"
                                  >
                                    <Folder size={11} className="text-indigo-500 shrink-0" />
                                    <span>{act.category || 'Soporte'}</span>
                                    <ChevronDown size={10} className="opacity-70 ml-0.5" />
                                  </button>

                                  {/* Menú Flotante de Categorías */}
                                  {openCategoryMenuId === act.id && (
                                    <>
                                      {/* Backdrop para cerrar al hacer clic fuera */}
                                      <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setOpenCategoryMenuId(null)}
                                      />
                                      <div className="absolute left-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="px-2 py-1 mb-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Seleccionar Categoría
                                          </span>
                                          <Tag size={12} className="text-slate-400" />
                                        </div>

                                        {/* Lista de Categorías Predefinidas */}
                                        <div className="max-h-48 overflow-y-auto space-y-0.5 custom-scrollbar">
                                          {PRESET_CATEGORIES.map((cat) => {
                                            const isCurrent = (act.category || 'Soporte') === cat;
                                            return (
                                              <button
                                                key={cat}
                                                type="button"
                                                onClick={async () => {
                                                  setOpenCategoryMenuId(null);
                                                  try {
                                                    await onUpdateActivityCategory(act.id, cat);
                                                    toast.success(`Categoría cambiada a: ${cat}`);
                                                  } catch (err: any) {
                                                    toast.error(`Error actualizando categoría: ${err.message}`);
                                                  }
                                                }}
                                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                                                  isCurrent
                                                    ? 'bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/60 dark:text-indigo-300'
                                                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                                }`}
                                              >
                                                <span className="truncate">{cat}</span>
                                                {isCurrent && <Check size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {/* Input para Categoría Personalizada */}
                                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="text"
                                              value={customCategoryInput}
                                              onChange={(e) => setCustomCategoryInput(e.target.value)}
                                              onKeyDown={async (e) => {
                                                if (e.key === 'Enter' && customCategoryInput.trim()) {
                                                  e.preventDefault();
                                                  const newCat = customCategoryInput.trim();
                                                  setOpenCategoryMenuId(null);
                                                  try {
                                                    await onUpdateActivityCategory(act.id, newCat);
                                                    toast.success(`Categoría cambiada a: ${newCat}`);
                                                  } catch (err: any) {
                                                    toast.error(`Error: ${err.message}`);
                                                  }
                                                }
                                              }}
                                              placeholder="Otra categoría..."
                                              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                                            />
                                            <button
                                              type="button"
                                              disabled={!customCategoryInput.trim()}
                                              onClick={async () => {
                                                if (!customCategoryInput.trim()) return;
                                                const newCat = customCategoryInput.trim();
                                                setOpenCategoryMenuId(null);
                                                try {
                                                  await onUpdateActivityCategory(act.id, newCat);
                                                  toast.success(`Categoría cambiada a: ${newCat}`);
                                                } catch (err: any) {
                                                  toast.error(`Error: ${err.message}`);
                                                }
                                              }}
                                              className="p-1 rounded-lg bg-indigo-600 text-white disabled:opacity-40 hover:bg-indigo-700 transition-colors"
                                              title="Guardar categoría personalizada"
                                            >
                                              <Plus size={13} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Badge Interactivo de Sub-tareas */}
                                <button
                                  type="button"
                                  onClick={() => toggleAccordion(act.id)}
                                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md border cursor-pointer inline-flex items-center gap-1 transition-colors ${
                                    act.overtimeHours
                                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                                      : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                                  }`}
                                  title={act.overtimeHours ? `Incluye ${act.overtimeHours.toFixed(2)} hrs de tiempo extra` : undefined}
                                >
                                  <Clock size={11} /> {subtasks.length} sub-tarea{subtasks.length !== 1 ? 's' : ''} · Total {totalActivityHours.toFixed(2)} hrs
                                  {Boolean(act.overtimeHours) && <span className="font-semibold">· {act.overtimeHours!.toFixed(2)} Extra</span>}
                                </button>

                                {/* Horas Directas de la Tarea Padre */}
                                <label
                                  className="text-[11px] font-mono px-2 py-0.5 rounded-md border bg-slate-100 border-slate-300 text-slate-600 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300 inline-flex items-center gap-1"
                                  title="Horas cargadas directo en la Tarea Padre"
                                >
                                  <Clock size={11} className="text-slate-400" /> Directas
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={directHoursValue}
                                    onChange={(e) => setDirectHoursDrafts((prev) => ({ ...prev, [act.id]: e.target.value }))}
                                    onBlur={(e) => commitDirectHours(act.id, e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                    placeholder="0.00"
                                    className="w-12 bg-transparent text-center focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                  />
                                  hrs
                                </label>

                                {/* Botón manual: marcar actividad como tiempo extra */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleActivityOvertime(act.id, Boolean(act.forcedOvertime))}
                                  className={`text-[11px] font-mono px-2 py-0.5 rounded-md border cursor-pointer inline-flex items-center gap-1 transition-colors ${
                                    act.forcedOvertime
                                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30'
                                      : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                                  }`}
                                  title={act.forcedOvertime ? 'Actividad marcada como tiempo extra -- clic para quitar' : 'Marcar actividad como tiempo extra'}
                                >
                                  <Zap size={11} /> {act.forcedOvertime ? 'Es Extra' : 'Marcar Extra'}
                                </button>
                              </div>

                              {act.description && act.description !== act.name && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight pt-0.5">
                                  {act.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Checkboxes Habit Tracker por Día (LUN-VIE) */}
                        {weekData.dates.map((d) => {
                          const isChecked = Boolean(act.days[d.dayIndex]);
                          const isForced = forcedOvertimeDates.includes(d.date);
                          return (
                            <td key={d.dayIndex} className={`py-3 px-2 text-center align-middle ${isForced ? 'bg-amber-500/5' : ''}`}>
                              <button
                                type="button"
                                onClick={() => onToggleDay(act.id, d.dayIndex)}
                                className={`habit-tracker-btn pointer-events-auto cursor-pointer relative z-10 select-none focus:outline-none w-7 h-7 mx-auto rounded-lg border flex items-center justify-center transition-all ${
                                  isChecked
                                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/20'
                                    : 'bg-slate-100 border-slate-300 text-slate-400 hover:border-slate-400 dark:bg-slate-800/30 dark:border-slate-700/60 dark:text-slate-500 dark:hover:border-slate-600'
                                }`}
                              >
                                {isChecked && <Check size={16} className="pointer-events-none" />}
                              </button>
                            </td>
                          );
                        })}

                        {/* Botones de Acción */}
                        <td className="py-3 px-4 text-center align-middle">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => toggleAccordion(act.id)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Hojas de Horas / Sub-tareas"
                            >
                              <Clock size={15} />
                            </button>
                            <button
                              onClick={() => onDeleteActivity(act.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 dark:text-slate-500 dark:hover:text-rose-400 rounded-lg transition-colors"
                              title="Eliminar actividad"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Fila desplegable Acordeón Sub-tareas */}
                      {isExpanded && (
                        <tr className="bg-slate-50 dark:bg-slate-950/40">
                          <td colSpan={weekData.dates.length + 2} className="p-3 border-t border-slate-200 dark:border-slate-800/80">
                            <SubtaskAccordion
                              activity={act}
                              onAddManualSubtask={onAddManualSubtask}
                              onDeleteSubtask={onDeleteSubtask}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={weekData.dates.length + 2} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                    No hay actividades registradas en esta semana.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
