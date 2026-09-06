import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Target,
  Moon,
  Sun,
  Settings,
  Send,
  Database,
  CheckCircle2,
  ChevronDown,
  Eye,
  Crown,
  Shield,
  User as UserIcon,
  Users,
  Check,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { UserMenu } from './UserMenu';
import { useTheme } from '../hooks/useTheme';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  activeTab: 'bitacora' | 'goals';
  onTabChange: (tab: 'bitacora' | 'goals') => void;
  onOpenReportModal: () => void;
  onOpenSettingsModal: () => void;
  technicianName: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenReportModal,
  onOpenSettingsModal,
  technicianName,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, allUsers, viewingUserId, setViewingUserId, viewingUser, openUserManagement } = useAuth();
  const [isSupervisorMenuOpen, setIsSupervisorMenuOpen] = useState(false);
  const supervisorMenuRef = useRef<HTMLDivElement>(null);

  const isAdminOrSuper = user?.role === 'superadmin' || user?.role === 'admin';
  const isSupervisingOther = Boolean(viewingUserId && viewingUserId !== user?.id);

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (supervisorMenuRef.current && !supervisorMenuRef.current.contains(e.target as Node)) {
        setIsSupervisorMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo, Marca & Selector de Supervisor */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                <Calendar size={20} />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white block leading-none">
                  Bitácora Pro
                </span>

                {isAdminOrSuper ? (
                  <div className="relative mt-1" ref={supervisorMenuRef}>
                    <button
                      onClick={() => setIsSupervisorMenuOpen(!isSupervisorMenuOpen)}
                      className={`inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all border ${
                        isSupervisingOther
                          ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 shadow-sm animate-pulse-subtle'
                          : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Eye size={11} className={isSupervisingOther ? 'text-amber-600 dark:text-amber-400' : 'text-indigo-600 dark:text-indigo-400'} />
                      <span className="truncate max-w-[130px] sm:max-w-[200px]">
                        {viewingUser?.name || technicianName || user?.name}
                      </span>
                      {isSupervisingOther && (
                        <span className="text-[9px] font-bold bg-amber-500 text-white px-1 rounded">
                          Supervisando
                        </span>
                      )}
                      <ChevronDown size={11} className="text-slate-400 shrink-0" />
                    </button>

                    {/* Menú Desplegable de Supervisión para SuperAdmin */}
                    {isSupervisorMenuOpen && (
                      <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                          <span>Supervisar Bitácoras</span>
                          <span className="text-[9px] font-normal text-indigo-600 dark:text-indigo-400">
                            {allUsers.length} usuario(s)
                          </span>
                        </div>

                        {/* Opción 1: Mi propia bitácora */}
                        <div className="p-1 space-y-0.5">
                          <button
                            onClick={() => {
                              setViewingUserId(null);
                              setIsSupervisorMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${
                              !isSupervisingOther
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="flex items-center space-x-2 truncate">
                              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                <Crown size={12} />
                              </div>
                              <div className="truncate">
                                <div className="truncate font-semibold">{user?.name} (Tú)</div>
                                <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
                              </div>
                            </div>
                            {!isSupervisingOther && <Check size={14} className="text-indigo-600 shrink-0 ml-1" />}
                          </button>
                        </div>

                        {/* Lista de los demás usuarios */}
                        {allUsers.filter((u) => u.id !== user?.id).length > 0 && (
                          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-t border-slate-100 dark:border-slate-800 mt-1">
                            Técnicos del Equipo
                          </div>
                        )}

                        <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
                          {allUsers
                            .filter((u) => u.id !== user?.id)
                            .map((u) => {
                              const isCurrentTarget = viewingUserId === u.id;
                              const initials = u.name
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase();

                              return (
                                <button
                                  key={u.id}
                                  onClick={() => {
                                    setViewingUserId(u.id);
                                    setIsSupervisorMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left ${
                                    isCurrentTarget
                                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-800/60'
                                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 truncate">
                                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {initials}
                                    </div>
                                    <div className="truncate">
                                      <div className="truncate font-medium">{u.name}</div>
                                      <div className="text-[10px] text-slate-400 truncate">{u.email}</div>
                                    </div>
                                  </div>
                                  {isCurrentTarget && <Check size={14} className="text-amber-600 shrink-0 ml-1" />}
                                </button>
                              );
                            })}
                        </div>

                        {/* Botón para administrar usuarios */}
                        <div className="p-1 border-t border-slate-100 dark:border-slate-800 mt-1">
                          <button
                            onClick={() => {
                              setIsSupervisorMenuOpen(false);
                              openUserManagement();
                            }}
                            className="w-full flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          >
                            <Users size={12} />
                            <span>Administrar / Crear Usuarios</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {technicianName || 'Semanal'}
                  </span>
                )}
              </div>
            </div>

            {/* Pestañas principales */}
            <nav className="hidden sm:flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <button
                onClick={() => onTabChange('bitacora')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'bitacora'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Calendar size={14} />
                <span>Actividades</span>
              </button>

              <button
                onClick={() => onTabChange('goals')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'goals'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Target size={14} />
                <span>Metas Semanales</span>
              </button>
            </nav>
          </div>

          {/* Acciones del lado derecho */}
          <div className="flex items-center space-x-2.5">
            {/* Estado de Supabase */}
            <div className="hidden lg:flex items-center">
              {isSupabaseConfigured ? (
                <Badge variant="success" className="gap-1 px-2.5 py-1 cursor-pointer" onClick={onOpenSettingsModal}>
                  <CheckCircle2 size={12} />
                  <span>Supabase Conectado</span>
                </Badge>
              ) : (
                <Badge variant="warning" className="gap-1 px-2.5 py-1 cursor-pointer" onClick={onOpenSettingsModal}>
                  <Database size={12} />
                  <span>Almacenamiento Local</span>
                </Badge>
              )}
            </div>

            {/* Botón de Enviar / Previsualizar Reporte */}
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenReportModal}
              className="shadow-indigo-500/20 shadow-md"
            >
              <Send size={14} />
              <span className="hidden sm:inline">Reporte & Correo</span>
            </Button>

            {/* Botón Ajustes */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettingsModal}
              title="Ajustes y Configuración"
            >
              <Settings size={18} />
            </Button>

            {/* Botón Tema */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
            </Button>

            {/* Menú de Usuario / Login */}
            <div className="pl-1 border-l border-slate-200 dark:border-slate-800">
              <UserMenu onOpenSettings={onOpenSettingsModal} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
