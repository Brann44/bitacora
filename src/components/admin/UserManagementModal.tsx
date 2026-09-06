import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole, AuthUser } from '../../types';
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Trash2,
  Key,
  Copy,
  Check,
  Edit2,
  Lock,
  Mail,
  User as UserIcon,
  Crown,
  Eye,
} from 'lucide-react';
import { useToast } from '../ui/Toast';

export const UserManagementModal: React.FC = () => {
  const {
    isUserManagementOpen,
    closeUserManagement,
    allUsers,
    createUser,
    updateUser,
    deleteUser,
    user: currentUser,
    viewingUserId,
    setViewingUserId,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);

  // Formulario Crear
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');

  // Formulario Editar
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('user');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createUser(newName, newEmail, newPassword, newRole);
      if (!res.success) {
        toast.error(res.error || 'Error al crear usuario.');
      } else {
        toast.success(`¡Usuario ${newName} creado con éxito!`);
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('user');
        setActiveTab('list');
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (u: AuthUser) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword(u.initialPassword || '');
    setEditRole(u.role);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    try {
      const res = await updateUser(editingUser.id, {
        name: editName,
        email: editEmail,
        password: editPassword,
        role: editRole,
      });

      if (!res.success) {
        toast.error(res.error || 'Error al actualizar.');
      } else {
        toast.success('Usuario actualizado correctamente.');
        setEditingUser(null);
      }
    } catch (e: any) {
      toast.error('Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (u: AuthUser) => {
    if (window.confirm(`¿Estás seguro de eliminar la cuenta de "${u.name}" (${u.email})? Esta acción no se puede deshacer.`)) {
      const res = await deleteUser(u.id);
      if (!res.success) {
        toast.error(res.error || 'Error al eliminar usuario.');
      } else {
        toast.success(`Usuario ${u.name} eliminado.`);
      }
    }
  };

  const handleCopyCredentials = (u: AuthUser) => {
    const pass = u.initialPassword || 'Contraseña configurada';
    const text = `📋 Credenciales de Acceso a Bitácora Pro:\n• Nombre: ${u.name}\n• Correo: ${u.email}\n• Contraseña: ${pass}\n• Enlace: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedId(u.id);
    toast.success(`Credenciales de ${u.name} copiadas al portapapeles`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <Crown size={11} /> Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <Shield size={11} /> Administrador
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <UserIcon size={11} /> Usuario / Técnico
          </span>
        );
    }
  };

  return (
    <Modal
      isOpen={isUserManagementOpen}
      onClose={closeUserManagement}
      title="Panel de Administración de Usuarios"
      description="Crea, administra y gestiona las credenciales de acceso para tu equipo."
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
          <button
            onClick={() => {
              setEditingUser(null);
              setActiveTab('list');
            }}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'list' && !editingUser
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users size={14} />
            <span>Usuarios Registrados ({allUsers.length})</span>
          </button>

          <button
            onClick={() => {
              setEditingUser(null);
              setActiveTab('create');
            }}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'create'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus size={14} />
            <span>Crear Nuevo Usuario</span>
          </button>

          {editingUser && (
            <button
              className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold border-b-2 border-amber-600 text-amber-600 dark:text-amber-400"
            >
              <Edit2 size={14} />
              <span>Editar a {editingUser.name}</span>
            </button>
          )}
        </div>

        {/* Vista: Lista de Usuarios */}
        {activeTab === 'list' && !editingUser && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Usuario / Nombre</th>
                    <th className="py-3 px-3">Correo</th>
                    <th className="py-3 px-3 text-center">Rol</th>
                    <th className="py-3 px-3 text-center">Contraseña</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allUsers.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    const initials = u.name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          isSelf ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {initials}
                            </div>
                            <div>
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="ml-1.5 text-[9px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-100 dark:bg-indigo-900/60 px-1 py-0.2 rounded">
                                  Tú
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {u.email}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {getRoleBadge(u.role)}
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-slate-600 dark:text-slate-300">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">
                            {u.initialPassword || '••••••••'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Ver Bitácora (Modo Supervisión) */}
                            <button
                              type="button"
                              onClick={() => {
                                setViewingUserId(isSelf ? null : u.id);
                                closeUserManagement();
                                toast.success(
                                  isSelf
                                    ? 'Cargando tu propia bitácora...'
                                    : `👁️ Modo Supervisión: Viendo bitácora de ${u.name}`
                                );
                              }}
                              title={`Ver y supervisar la bitácora de ${u.name}`}
                              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                                (viewingUserId === u.id || (!viewingUserId && isSelf))
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/60'
                              }`}
                            >
                              <Eye size={13} />
                              <span className="hidden sm:inline">
                                {viewingUserId === u.id || (!viewingUserId && isSelf) ? 'Viendo' : 'Ver Bitácora'}
                              </span>
                            </button>

                            {/* Copiar credenciales */}
                            <button
                              type="button"
                              onClick={() => handleCopyCredentials(u)}
                              title="Copiar credenciales para enviárselas"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all"
                            >
                              {copiedId === u.id ? (
                                <Check size={14} className="text-emerald-500" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(u)}
                              title="Editar usuario o cambiar contraseña"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Eliminar (no a uno mismo) */}
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => handleDelete(u)}
                                title="Eliminar usuario"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Copy size={14} className="text-indigo-600 dark:text-indigo-400" />
                <span>
                  Haz clic en el icono de <strong>Copiar</strong> para obtener el usuario y clave y pasárselos a tu compañero.
                </span>
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('create')}
                className="gap-1 text-xs"
              >
                <UserPlus size={13} />
                <span>Crear Usuario</span>
              </Button>
            </div>
          </div>
        )}

        {/* Vista: Crear Nuevo Usuario */}
        {activeTab === 'create' && !editingUser && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombre Completo / Técnico"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Carlos Gómez"
                required
              />

              <Input
                label="Correo Electrónico (Login)"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="carlos@empresa.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Contraseña Inicial"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ej: 123456 o clave segura"
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol del Usuario
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="user">Usuario / Técnico (Acceso a su bitácora)</option>
                  <option value="admin">Administrador (Puede crear y gestionar usuarios)</option>
                  <option value="superadmin">Super Administrador (Acceso total)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setActiveTab('list')}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={loading} className="gap-1.5">
                <UserPlus size={14} />
                <span>Guardar y Crear Usuario</span>
              </Button>
            </div>
          </form>
        )}

        {/* Vista: Editar Usuario */}
        {editingUser && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nombre Completo / Técnico"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <Input
                label="Correo Electrónico"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nueva Contraseña (dejar igual o cambiar)"
                type="text"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Nueva contraseña"
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rol del Usuario
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="user">Usuario / Técnico</option>
                  <option value="admin">Administrador</option>
                  <option value="superadmin">Super Administrador</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={loading} className="gap-1.5">
                <span>Guardar Cambios</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
