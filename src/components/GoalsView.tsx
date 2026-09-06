import React, { useState } from 'react';
import { Target, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { useGoals } from '../hooks/useGoals';
import { useToast } from './ui/Toast';

interface GoalsViewProps {
  activeWeekKey: string;
}

const CATEGORIES = ['General', 'Desarrollo', 'Infraestructura', 'Soporte', 'Seguridad', 'Aprendizaje'];

export const GoalsView: React.FC<GoalsViewProps> = ({ activeWeekKey }) => {
  const { goals, loading, addGoal, toggleGoal, deleteGoal } = useGoals(activeWeekKey);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const { toast } = useToast();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addGoal(title.trim(), category);
    setTitle('');
    toast('Meta agregada a la semana', 'success');
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const progressPercent = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Encabezado y Progreso */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Target size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Metas y Objetivos de la Semana
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define las prioridades clave a completar en {activeWeekKey}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {completedCount} de {goals.length} completadas
              </span>
              <span className="text-xs text-slate-400 block font-mono">{progressPercent}% completado</span>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        {goals.length > 0 && (
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </Card>

      {/* Formulario para agregar meta */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Escribe un objetivo para esta semana..."
          className="flex-1 px-4 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <Button type="submit" variant="primary" size="md" disabled={!title.trim()} className="gap-1.5 shrink-0">
          <Plus size={16} />
          <span>Agregar Meta</span>
        </Button>
      </form>

      {/* Listado de Metas */}
      <Card className="divide-y divide-slate-100 dark:divide-slate-800">
        {goals.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            No has agregado metas para esta semana. Define tus objetivos arriba.
          </div>
        ) : (
          goals.map((goal) => (
            <div
              key={goal.id}
              className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => toggleGoal(goal.id)}
                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  {goal.completed ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Circle size={20} />
                  )}
                </button>
                <div>
                  <span
                    className={`text-sm font-medium ${
                      goal.completed
                        ? 'line-through text-slate-400 dark:text-slate-500'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {goal.title}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Badge variant="default" className="text-[10px]">
                  {goal.category}
                </Badge>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                  title="Eliminar meta"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};
