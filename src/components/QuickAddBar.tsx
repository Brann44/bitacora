import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Plus, SlidersHorizontal, CornerDownLeft } from 'lucide-react';
import { useToast } from './ui/Toast';

interface QuickAddBarProps {
  onAddQuickActivity: (name: string) => Promise<void>;
  onOpenAdvancedModal: () => void;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  onAddQuickActivity,
  onOpenAdvancedModal,
}) => {
  const toast = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onAddQuickActivity(name.trim());
      setName('');
      toast.success('Actividad agregada');
    } catch (err) {
      toast.error('Error al agregar la actividad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      {/* Divisor Visual */}
      <div className="border-t border-slate-200 dark:border-slate-800/80 my-5"></div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 p-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg backdrop-blur-md"
      >
        <div className="relative flex-1 flex items-center">
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Añadir nueva actividad o tarea..."
            className="pr-20 py-2.5"
            required
            autoComplete="off"
          />
          <kbd className="absolute right-3 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/50 px-2 py-0.5 rounded pointer-events-none font-mono">
            <CornerDownLeft size={10} /> Enter
          </kbd>
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus size={16} />
          <span>Agregar</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={onOpenAdvancedModal}
          className="shrink-0 gap-2"
          title="Opciones Avanzadas de Actividad"
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Opciones</span>
        </Button>
      </form>
    </div>
  );
};
