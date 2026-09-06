import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isUserManagementOpen: boolean;
  openUserManagement: () => void;
  closeUserManagement: () => void;
  allUsers: AuthUser[];
  viewingUserId: string | null;
  setViewingUserId: (userId: string | null) => void;
  viewingUser: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createUser: (name: string, email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userId: string, data: { name?: string; email?: string; password?: string; role?: UserRole }) => Promise<{ success: boolean; error?: string }>;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_USERS_KEY = 'bitacora_system_users_v2';
const CURRENT_USER_KEY = 'bitacora_active_session_user';

export interface LocalUserRecord extends AuthUser {
  passwordHash: string;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + btoa(str).slice(0, 10);
}

const INITIAL_SUPERADMIN: LocalUserRecord = {
  id: 'user_brandon_superadmin',
  name: 'Brandon Ramirez',
  email: 'brandon501eseuko@gmail.com',
  role: 'superadmin',
  initialPassword: 'admin',
  passwordHash: simpleHash('admin'),
  createdAt: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<AuthUser[]>([]);

  // Cargar lista de usuarios del sistema con migración automática de todas las claves previas
  const loadUsersFromStorage = useCallback((): LocalUserRecord[] => {
    let records: LocalUserRecord[] = [];
    const keysToCheck = [
      LOCAL_USERS_KEY,
      'bitacora_local_auth_users',
      'bitacora_system_users',
    ];

    for (const key of keysToCheck) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (item && item.email) {
                const cleanEmail = String(item.email).trim().toLowerCase();
                if (!records.some((r) => r.email.toLowerCase() === cleanEmail)) {
                  records.push({
                    id: item.id || 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
                    name: item.name || 'Usuario',
                    email: cleanEmail,
                    role: item.role || (cleanEmail === 'brandon501eseuko@gmail.com' ? 'superadmin' : 'user'),
                    initialPassword: item.initialPassword || '123456',
                    passwordHash: item.passwordHash || simpleHash(item.initialPassword || '123456'),
                    createdAt: item.createdAt || new Date().toISOString(),
                  });
                }
              }
            });
          }
        }
      } catch (e) {
        console.warn('Error migrando usuarios de key:', key, e);
      }
    }

    // Asegurar que Brandon Super Admin siempre esté presente
    const brandonMatch = records.find((r) => r.email.toLowerCase() === 'brandon501eseuko@gmail.com');
    if (!brandonMatch) {
      records.unshift(INITIAL_SUPERADMIN);
    } else {
      brandonMatch.role = 'superadmin';
      if (!brandonMatch.initialPassword) {
        brandonMatch.initialPassword = 'admin';
      }
    }

    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(records));
    return records;
  }, []);

  const saveUsersToStorage = (users: LocalUserRecord[]) => {
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    setAllUsers(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        avatar_url: u.avatar_url,
        createdAt: u.createdAt,
        initialPassword: u.initialPassword,
      }))
    );
  };

      // Sincronizar usuarios con Supabase Cloud si está configurado
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: dbUsers } = await supabase.from('system_users').select('*');
          if (dbUsers && dbUsers.length > 0) {
            dbUsers.forEach((u: any) => {
              const cleanEmail = String(u.email).trim().toLowerCase();
              const match = records.find((r) => r.email.toLowerCase() === cleanEmail);
              if (!match) {
                records.push({
                  id: u.id,
                  name: u.name,
                  email: cleanEmail,
                  role: u.role,
                  initialPassword: u.initial_password,
                  passwordHash: u.password_hash,
                  createdAt: u.created_at,
                });
              } else {
                match.name = u.name;
                match.role = u.role;
                match.initialPassword = u.initial_password;
                match.passwordHash = u.password_hash;
              }
            });
            localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(records));
          } else if (records.length > 0) {
            for (const r of records) {
              await supabase.from('system_users').upsert({
                id: r.id,
                name: r.name,
                email: r.email,
                role: r.role,
                initial_password: r.initialPassword,
                password_hash: r.passwordHash,
                created_at: r.createdAt,
              });
            }
          }
        } catch (err) {
          console.warn('Error sincronizando usuarios con Supabase:', err);
        }
      }

      setAllUsers(
        records.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          avatar_url: u.avatar_url,
          createdAt: u.createdAt,
          initialPassword: u.initialPassword,
        }))
      );

      // Verificar si hay sesión activa guardada
      try {
        const session = localStorage.getItem(CURRENT_USER_KEY);
        if (session) {
          const parsed: AuthUser = JSON.parse(session);
          // Verificar que el usuario siga existiendo en el sistema
          const match = records.find((r) => r.id === parsed.id || r.email.toLowerCase() === parsed.email.toLowerCase());
          if (match) {
            setUser({
              id: match.id,
              name: match.name,
              email: match.email,
              role: match.role,
              avatar_url: match.avatar_url,
              createdAt: match.createdAt,
              initialPassword: match.initialPassword,
            });
          } else {
            localStorage.removeItem(CURRENT_USER_KEY);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error leyendo sesión activa:', e);
        setUser(null);
      }

      setLoading(false);
    };

    init();
  }, [loadUsersFromStorage]);

  // Iniciar Sesión
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Por favor escribe tu correo y contraseña.' };
    }

    // 1. Supabase Auth si está configurado
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });
        if (!error && data.user) {
          const isSuper = cleanEmail === 'brandon501eseuko@gmail.com';
          const authUser: AuthUser = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
            role: isSuper ? 'superadmin' : 'user',
          };
          setUser(authUser);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authUser));
          return { success: true };
        }
      } catch (err) {
        console.warn('Fallback a autenticación local');
      }
    }

    // 2. Autenticación Local
    const records = loadUsersFromStorage();
    const userMatch = records.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!userMatch) {
      return {
        success: false,
        error: 'Usuario no encontrado. Pide a tu Administrador que cree tu cuenta.',
      };
    }

    const targetHash = simpleHash(cleanPass);
    if (userMatch.passwordHash !== targetHash && userMatch.initialPassword !== cleanPass) {
      return { success: false, error: 'Contraseña incorrecta. Verifica tus datos o pide un reinicio de contraseña.' };
    }

    const authUser: AuthUser = {
      id: userMatch.id,
      name: userMatch.name,
      email: userMatch.email,
      role: userMatch.role,
      avatar_url: userMatch.avatar_url,
      createdAt: userMatch.createdAt,
      initialPassword: userMatch.initialPassword,
    };

    setUser(authUser);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(authUser));
    return { success: true };
  };

  // Cerrar Sesión (Cierra todo y vuelve a la pantalla de Login)
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Error cerrando sesión en Supabase:', e);
      }
    }

    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  // Crear Usuario (Solo Admin / Super Admin)
  const createUser = async (
    name: string,
    email: string,
    password: string,
    role: UserRole = 'user'
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanName || !cleanEmail || !cleanPass) {
      return { success: false, error: 'Todos los campos son obligatorios.' };
    }

    if (cleanPass.length < 3) {
      return { success: false, error: 'La contraseña debe tener al menos 3 caracteres.' };
    }

    const records = loadUsersFromStorage();
    if (records.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Ya existe un usuario registrado con este correo.' };
    }

    const newId = 'user_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const newRecord: LocalUserRecord = {
      id: newId,
      name: cleanName,
      email: cleanEmail,
      role,
      initialPassword: cleanPass,
      passwordHash: simpleHash(cleanPass),
      createdAt: new Date().toISOString(),
    };

    const updated = [...records, newRecord];
    saveUsersToStorage(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('system_users').insert({
          id: newRecord.id,
          name: newRecord.name,
          email: newRecord.email,
          role: newRecord.role,
          initial_password: newRecord.initialPassword,
          password_hash: newRecord.passwordHash,
          created_at: newRecord.createdAt,
        });
      } catch (e) {
        console.warn('Error guardando nuevo usuario en Supabase:', e);
      }
    }

    return { success: true };
  };

  // Actualizar Usuario (Nombre, Correo, Contraseña, Rol)
  const updateUser = async (
    userId: string,
    data: { name?: string; email?: string; password?: string; role?: UserRole }
  ): Promise<{ success: boolean; error?: string }> => {
    const records = loadUsersFromStorage();
    const index = records.findIndex((u) => u.id === userId);

    if (index === -1) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    const current = records[index];
    const updatedRecord: LocalUserRecord = {
      ...current,
      name: data.name?.trim() || current.name,
      email: data.email?.trim().toLowerCase() || current.email,
      role: data.role || current.role,
    };

    if (data.password && data.password.trim()) {
      updatedRecord.initialPassword = data.password.trim();
      updatedRecord.passwordHash = simpleHash(data.password.trim());
    }

    records[index] = updatedRecord;
    saveUsersToStorage(records);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('system_users').update({
          name: updatedRecord.name,
          email: updatedRecord.email,
          role: updatedRecord.role,
          initial_password: updatedRecord.initialPassword,
          password_hash: updatedRecord.passwordHash,
        }).eq('id', userId);
      } catch (e) {
        console.warn('Error actualizando usuario en Supabase:', e);
      }
    }

    // Si se editó el usuario activo
    if (user?.id === userId) {
      const updatedUser: AuthUser = {
        id: updatedRecord.id,
        name: updatedRecord.name,
        email: updatedRecord.email,
        role: updatedRecord.role,
        avatar_url: updatedRecord.avatar_url,
        createdAt: updatedRecord.createdAt,
        initialPassword: updatedRecord.initialPassword,
      };
      setUser(updatedUser);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    }

    return { success: true };
  };

  // Eliminar Usuario
  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (user?.id === userId) {
      return { success: false, error: 'No puedes eliminar tu propia cuenta mientras estás conectado.' };
    }

    const records = loadUsersFromStorage();
    const target = records.find((u) => u.id === userId);

    if (!target) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    if (target.role === 'superadmin') {
      const superAdminCount = records.filter((u) => u.role === 'superadmin').length;
      if (superAdminCount <= 1) {
        return { success: false, error: 'No puedes eliminar al único Super Administrador del sistema.' };
      }
    }

    const updated = records.filter((u) => u.id !== userId);
    saveUsersToStorage(updated);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('system_users').delete().eq('id', userId);
      } catch (e) {
        console.warn('Error eliminando usuario en Supabase:', e);
      }
    }

    // Limpiar datos locales asociados a este usuario
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith(`bitacora_u_${userId}`) || key.startsWith(`bitacora_user_${userId}`))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      console.warn('Error limpiando datos de usuario eliminado:', e);
    }

    return { success: true };
  };

  const openUserManagement = () => setIsUserManagementOpen(true);
  const closeUserManagement = () => setIsUserManagementOpen(false);

  // Usuario supervisado (o el usuario conectado por defecto)
  const viewingUser = viewingUserId
    ? allUsers.find((u) => u.id === viewingUserId) || user
    : user;

  // Escuchar cambios de localStorage en otras pestañas o ventanas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_USERS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setAllUsers(
              parsed.map((u: any) => ({
                id: u.id,
                email: u.email,
                name: u.name,
                role: u.role,
                avatar_url: u.avatar_url,
                createdAt: u.createdAt,
                initialPassword: u.initialPassword,
              }))
            );
          }
        } catch (err) {
          console.error('Error sincronizando usuarios entre pestañas:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isUserManagementOpen,
        openUserManagement,
        closeUserManagement,
        allUsers,
        viewingUserId,
        setViewingUserId,
        viewingUser,
        login,
        logout,
        createUser,
        updateUser,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
