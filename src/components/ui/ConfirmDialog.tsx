import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={options.title || 'Confirmar acción'}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle size={20} />
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed pt-0.5">
              {options.message}
            </p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              {options.cancelText || 'Cancelar'}
            </Button>
            <Button
              variant={options.variant === 'danger' ? 'danger' : 'primary'}
              size="sm"
              onClick={handleConfirm}
            >
              {options.confirmText || 'Confirmar'}
            </Button>
          </div>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context;
}
