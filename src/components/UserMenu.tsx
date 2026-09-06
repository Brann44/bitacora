import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, LogIn, LogOut, Users, Settings, ChevronDown, Crown, Shield } from 'lucide-react';
import { Button } from './ui/Button';

interface UserMenuProps {
  onOpenSettings: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onOpenSettings }) => {
  const { user, openUserManagement, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return null;
  }

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isSuperAdmin = user.role === 'superadmin';
  const isAdmin = user.role === 'admin' || isSuperAdmin;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all text-xs font-medium text-slate-700 dark:text-slate-200"
      >
        <div className={`w-7 h-7 rounded-lg text-white font-bold text-[11px] flex items-center justify-center shadow-sm ${
          isSuperAdmin
            ? 'bg-gradient-to-br from-amber-500 to-amber-700'
            : isAdmin
            ? 'bg-gradient-to-br from-indigo-500 to-indigo-700'
            : 'bg-gradient-to-br from-slate-600 to-slate-800'
        }`}>
          {initials}
        </div>
        <span className="hidden sm:inline font-semibold max-w-[120px] truncate">
          {user.name || user.email.split('@')[0]}
        </span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header con Info del Usuario */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className={`w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shadow-sm ${
                isSuperAdmin
                  ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                  : isAdmin
                  ? 'bg-gradient-to-br from-indigo-500 to-indigo-700'
                  : 'bg-gradient-to-br from-slate-600 to-slate-800'
              }`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate block">
                    {user.name}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">
                    {user.email}
                  </span>
                  {isSuperAdmin ? (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/60 px-1 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                      <Crown size={9} /> Super Admin
                    </span>
                  ) : isAdmin ? (
                    <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-900/60 px-1 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                      <Shield size={9} /> Admin
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Opciones del Menú */}
          <div className="p-1 space-y-0.5 text-xs">
            {/* Opción solo para Super Admin / Admin */}
            {isAdmin && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  openUserManagement();
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors font-semibold text-left"
              >
                <Crown size={14} className="text-amber-500" />
                <span>Gestión de Usuarios</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors font-medium text-left"
            >
              <Settings size={14} className="text-slate-400" />
              <span>Mi Perfil & Ajustes</span>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-semibold text-left"
            >
              <LogOut size={14} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
