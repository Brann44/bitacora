import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { WeekNavigation } from './components/WeekNavigation';
import { QuickAddBar } from './components/QuickAddBar';
import { BitacoraTable } from './components/BitacoraTable';
import { GoalsView } from './components/GoalsView';
import { NewActivityModal } from './components/NewActivityModal';
import { ReportPreviewModal } from './components/ReportPreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { UserManagementModal } from './components/admin/UserManagementModal';
import { useBitacora } from './hooks/useBitacora';
import { useSettings } from './hooks/useSettings';
import { Loader2 } from 'lucide-react';

const MainDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bitacora' | 'goals'>('bitacora');
  const [isNewActivityModalOpen, setIsNewActivityModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { user, viewingUserId, setViewingUserId, viewingUser } = useAuth();

  const {
    weekData,
    activeWeekKey,
    setActiveWeekKey,
    loading: bitacoraLoading,
    sortMode,
    setSortMode,
    toggleDay,
    toggleForcedOvertimeDate,
    toggleActivityOvertime,
    updateActivityDirectHours,
    updateActivityCategory,
    addManualSubtask,
    deleteSubtask,
    addQuickActivity,
    createAdvancedActivity,
    deleteActivity,
    reorderActivities,
  } = useBitacora();

  const { settings, saveSettings } = useSettings();
  const displayName = viewingUser?.name || user?.name || settings.technician_name;
  const isSupervisingOther = Boolean(viewingUserId && viewingUserId !== user?.id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Header Superior */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        technicianName={displayName}
      />

      {/* Banner de Modo Supervisión para SuperAdmin */}
      {isSupervisingOther && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-indigo-500/10 border-b border-amber-300 dark:border-amber-800/80 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 backdrop-blur-sm shadow-sm animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center space-x-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="font-bold text-amber-700 dark:text-amber-300">
                👁️ Modo Supervisión Activo:
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                Estás visualizando la bitácora de <strong>{viewingUser?.name}</strong> ({viewingUser?.email}).
              </span>
            </div>
            <button
              onClick={() => setViewingUserId(null)}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-sm transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>↩️ Volver a mi bitácora</span>
            </button>
          </div>
        </div>
      )}

      {/* Contenedor Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'bitacora' && (
          <div className="space-y-4">
            {/* Navegación de Semana */}
            <WeekNavigation
              weekData={weekData}
              onSelectWeek={(key) => setActiveWeekKey(key)}
            />

            {/* Tabla Principal de Actividades */}
            <BitacoraTable
              weekData={weekData}
              loading={bitacoraLoading}
              onToggleDay={toggleDay}
              onToggleForcedOvertimeDate={toggleForcedOvertimeDate}
              onToggleActivityOvertime={toggleActivityOvertime}
              onUpdateActivityDirectHours={updateActivityDirectHours}
              onUpdateActivityCategory={updateActivityCategory}
              onAddManualSubtask={addManualSubtask}
              onDeleteSubtask={deleteSubtask}
              onDeleteActivity={deleteActivity}
              onReorderActivities={reorderActivities}
              sortMode={sortMode}
              onSortModeChange={setSortMode}
            />

            {/* Barra de Creación Rápida */}
            <QuickAddBar
              onAddQuickActivity={addQuickActivity}
              onOpenAdvancedModal={() => setIsNewActivityModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'goals' && (
          <GoalsView activeWeekKey={activeWeekKey} />
        )}
      </main>

      {/* Modales */}
      {weekData && (
        <>
          <NewActivityModal
            isOpen={isNewActivityModalOpen}
            onClose={() => setIsNewActivityModalOpen(false)}
            activeWeekKey={activeWeekKey}
            userName={displayName}
            onSuccess={createAdvancedActivity}
          />

          <ReportPreviewModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            weekData={weekData}
            settings={{ ...settings, technician_name: displayName }}
          />
        </>
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={saveSettings}
      />

      <UserManagementModal />
    </div>
  );
};

const AuthGate: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center space-y-3 text-white">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <span className="text-xs text-slate-400 font-medium">Iniciando Bitácora Pro...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <MainDashboard />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
};


