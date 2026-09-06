import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useToast } from './ui/Toast';

interface NewActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWeekKey: string;
  onSuccess: (data: {
    name: string;
    description?: string;
    category?: string;
    type?: string;
    branch?: string;
    priority?: string;
  }) => Promise<void>;
  userName?: string;
}

export const NewActivityModal: React.FC<NewActivityModalProps> = ({
  isOpen,
  onClose,
  activeWeekKey,
  onSuccess,
  userName,
}) => {
  const toast = useToast();
  const firstName = (userName || '').trim().split(' ')[0] || 'Usuario';
  const defaultCategory = `Soporte ${firstName}`;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [type, setType] = useState('Operativa');
  const [branch, setBranch] = useState('Oficina Central');
  const [priority, setPriority] = useState('Media');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      await onSuccess({
        name: name.trim(),
        description: description.trim(),
        category,
        type,
        branch,
        priority,
      });
      toast.success('Actividad creada exitosamente');
      onClose();
      setName('');
      setDescription('');
      setCategory(defaultCategory);
    } catch (err) {
      toast.error('Error guardando la nueva actividad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nueva Actividad"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre de la Actividad */}
        <div>
          <label htmlFor="new-activity-name" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Nombre de la Actividad / Tarea *
          </label>
          <Input
            id="new-activity-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Configuración de Servidor..."
            required
            autoFocus
          />
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="new-activity-description" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            Descripción Detallada (Opcional)
          </label>
          <textarea
            id="new-activity-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notas adicionales o detalles sobre la tarea..."
            rows={2}
            className="w-full bg-slate-100/70 dark:bg-slate-950/60 border border-slate-300 dark:border-slate-800 focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
          />
        </div>

        {/* Acordeón de Opciones Avanzadas */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/40 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-colors"
          >
            <span>Categoría, Tipo y Prioridad Avanzada</span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showAdvanced && (
            <div className="p-3 bg-white/60 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="new-activity-category" className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Categoría
                </label>
                <select
                  id="new-activity-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value={defaultCategory}>{defaultCategory}</option>
                  <option value="Infraestructura IT">Infraestructura IT</option>
                  <option value="Soporte Técnico">Soporte Técnico</option>
                  <option value="Desarrollo">Desarrollo</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-activity-type" className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Tipo
                </label>
                <select
                  id="new-activity-type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Operativa">Operativa</option>
                  <option value="Proyecto">Proyecto</option>
                  <option value="Mantenimiento">Mantenimiento</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-activity-branch" className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Sucursal / Ubicación
                </label>
                <select
                  id="new-activity-branch"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Oficina Central">Oficina Central</option>
                  <option value="Sucursal 1">Sucursal 1</option>
                  <option value="Sucursal 2">Sucursal 2</option>
                  <option value="Remoto / Home Office">Remoto / Home Office</option>
                </select>
              </div>

              <div>
                <label htmlFor="new-activity-priority" className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Prioridad
                </label>
                <select
                  id="new-activity-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={loading || !name.trim()}>
            {loading ? 'Guardando...' : 'Crear Actividad'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
