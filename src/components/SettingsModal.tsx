import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { UserSettings } from '../types';
import { updateSupabaseConfig } from '../lib/supabase';
import { useToast } from './ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { Database, User, Mail, Download, Upload, ExternalLink, Key, Crown } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';

  const [activeTab, setActiveTab] = useState<'profile' | 'gmail' | 'supabase' | 'backup'>('profile');
  const [name, setName] = useState(settings.technician_name);
  const [email, setEmail] = useState(settings.email);
  const [workStart, setWorkStart] = useState(settings.work_start_time);
  const [workEnd, setWorkEnd] = useState(settings.work_end_time);
  const [ccEmails, setCcEmails] = useState(settings.cc_emails.join(', '));
  const [bccEmails, setBccEmails] = useState((settings.bcc_emails || []).join(', '));
  
  const [gmailUser, setGmailUser] = useState(settings.gmail_user || '');
  const [gmailAppPassword, setGmailAppPassword] = useState(settings.gmail_app_password || '');

  const [supabaseUrlInput, setSupabaseUrlInput] = useState(settings.supabase_url || '');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(settings.supabase_anon_key || '');

  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Sincronizar campos cuando se abre el modal o cambian los settings del usuario activo
  React.useEffect(() => {
    setName(settings.technician_name || '');
    setEmail(settings.email || '');
    setWorkStart(settings.work_start_time || '08:00');
    setWorkEnd(settings.work_end_time || '17:00');
    setCcEmails((settings.cc_emails || []).join(', '));
    setBccEmails((settings.bcc_emails || []).join(', '));
    setGmailUser(settings.gmail_user || '');
    setGmailAppPassword(settings.gmail_app_password || '');

    // Si el usuario no es superadmin y estaba en la pestaña de supabase, mover a perfil
    if (!isSuperAdmin && activeTab === 'supabase') {
      setActiveTab('profile');
    }
  }, [settings, isOpen, isSuperAdmin, activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const parsedCc = ccEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      const parsedBcc = bccEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      await onSaveSettings({
        technician_name: name.trim(),
        email: email.trim(),
        work_start_time: workStart,
        work_end_time: workEnd,
        cc_emails: parsedCc,
        bcc_emails: parsedBcc,
      });

      toast.success('Perfil y horario guardados correctamente');
    } catch (e: any) {
      toast.error('Error guardando ajustes: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSaveSettings({
        gmail_user: gmailUser.trim(),
        gmail_app_password: gmailAppPassword.trim().replace(/\s+/g, ''),
      });

      toast.success('Credenciales de Gmail guardadas correctamente');
    } catch (e: any) {
      toast.error('Error guardando credenciales de Gmail: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupabase = () => {
    updateSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
    toast.success('Configuración de Supabase actualizada. Recargando...');
  };

  // Exportar Backup
  const handleExportBackup = () => {
    try {
      const allData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('bitacora_') || key.startsWith('bitacora_pro_'))) {
          allData[key] = localStorage.getItem(key);
        }
      }
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bitacora_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Copia de respaldo exportada');
    } catch (e: any) {
      toast.error('Error exportando respaldo: ' + e.message);
    }
  };

  // Importar Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        Object.keys(parsed).forEach((k) => {
          localStorage.setItem(k, parsed[k]);
        });
        toast.success('Copia de respaldo importada con éxito. Recargando...');
        setTimeout(() => window.location.reload(), 1000);
      } catch (err: any) {
        toast.error('Error al leer el archivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustes y Configuración"
      description={isSuperAdmin ? "Personaliza tus datos, conexión de Gmail, Supabase y respaldos." : "Personaliza tu perfil de reporte, horario y tu cuenta de Gmail para envíos."}
      maxWidth="lg"
    >
      {/* Pestañas internas */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'profile'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <User size={14} />
          <span>Perfil y Horario</span>
        </button>

        <button
          onClick={() => setActiveTab('gmail')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'gmail'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Mail size={14} />
          <span>Gmail & Envío</span>
        </button>

        {/* Solo visible para Super Admin */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('supabase')}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'supabase'
                ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database size={14} />
            <span className="flex items-center gap-1">
              <span>Supabase Cloud</span>
              <Crown size={11} className="text-amber-500" />
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'backup'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Download size={14} />
          <span>Respaldos (JSON)</span>
        </button>
      </div>

      {/* Tab: Perfil */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <Input
            label="Nombre Completo / Responsable (Impreso en Reporte)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre para los reportes"
            required
          />

          <div>
            <Input
              label="Correo Visible en el Reporte (PDF / Excel / Empresa)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu_correo_trabajo@empresa.com"
              required
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Este correo es el que aparecerá escrito en el encabezado del PDF, Excel y como remitente visual del reporte.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Horario Inicio"
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
            />
            <Input
              label="Horario Fin"
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Correos en Copia por defecto (CC)"
                value={ccEmails}
                onChange={(e) => setCcEmails(e.target.value)}
                placeholder="jefe@empresa.com, supervisor@empresa.com"
              />
              <p className="text-[10px] text-slate-400 mt-1">Visibles para todos los destinatarios</p>
            </div>

            <div>
              <Input
                label="Correos en Copia Oculta por defecto (CCO / BCC)"
                value={bccEmails}
                onChange={(e) => setBccEmails(e.target.value)}
                placeholder="mi_archivo@gmail.com, auditoria@empresa.com"
              />
              <p className="text-[10px] text-slate-400 mt-1">Invisibles para los demás destinatarios</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading}>
              Guardar Perfil
            </Button>
          </div>
        </form>
      )}

      {/* Tab: Gmail */}
      {activeTab === 'gmail' && (
        <form onSubmit={handleSaveGmail} className="space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
              <span>Conexión de Envío SMTP con Gmail</span>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 hover:underline"
              >
                <span>Generar Contraseña de Aplicación</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <p>
              Usa tu cuenta de Gmail (ej. <strong>brandon501eseuko@gmail.com</strong>) con una contraseña de aplicación de 16 letras para el envío técnico. El reporte PDF puede llevar escrito otro correo si así lo configuraste en tu Perfil.
            </p>
          </div>

          <Input
            label="Cuenta de Gmail Autenticada (Servidor SMTP)"
            type="email"
            value={gmailUser}
            onChange={(e) => setGmailUser(e.target.value)}
            placeholder="tu_cuenta@gmail.com"
            required
          />

          <Input
            label="Contraseña de Aplicación de Google (16 letras)"
            type="password"
            value={gmailAppPassword}
            onChange={(e) => setGmailAppPassword(e.target.value)}
            placeholder="twut jruy revq hylf"
            required
          />

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading}>
              Guardar Credenciales de Gmail
            </Button>
          </div>
        </form>
      )}

      {/* Tab: Supabase (Exclusivo Super Admin) */}
      {activeTab === 'supabase' && isSuperAdmin && (
        <div className="space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
              <span className="flex items-center gap-1.5">
                <Crown size={14} className="text-amber-500" />
                <span>Configuración de Base de Datos (Super Admin)</span>
              </span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1 hover:underline"
              >
                <span>Crear proyecto gratis</span>
                <ExternalLink size={12} />
              </a>
            </div>
            <p>
              Pega la URL del proyecto y la Anon Key de Supabase para activar la sincronización central en la nube para todo tu equipo.
            </p>
          </div>

          <Input
            label="Supabase Project URL"
            value={supabaseUrlInput}
            onChange={(e) => setSupabaseUrlInput(e.target.value)}
            placeholder="https://xyzcompany.supabase.co"
          />

          <Input
            label="Supabase Anon Key"
            value={supabaseKeyInput}
            onChange={(e) => setSupabaseKeyInput(e.target.value)}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          />

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleSaveSupabase}>
              Conectar Supabase
            </Button>
          </div>
        </div>
      )}

      {/* Tab: Respaldos */}
      {activeTab === 'backup' && (
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Puedes exportar una copia completa de tus semanas y configuraciones en formato JSON para respaldarlas en tu computadora o importarlas en otro navegador.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button variant="outline" size="md" onClick={handleExportBackup} className="gap-2 justify-center">
              <Download size={16} />
              <span>Exportar Backup JSON</span>
            </Button>

            <label className="inline-flex items-center justify-center font-medium rounded-lg transition-all border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 px-3.5 py-2 text-sm gap-2 cursor-pointer">
              <Upload size={16} />
              <span>Importar Backup JSON</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>
      )}
    </Modal>
  );
};
