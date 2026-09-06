import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '../types';
import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_SETTINGS: UserSettings = {
  technician_name: '',
  email: '',
  send_day: 5, // Viernes
  send_time: '17:00',
  work_start_time: '08:00',
  work_end_time: '17:00',
  cc_emails: [],
  bcc_emails: [],
  signature_base64: '',
  gmail_user: '',
  gmail_app_password: '',
};

export function useSettings() {
  const { user, viewingUserId, allUsers } = useAuth();
  
  // Si es SuperAdmin o Admin y está supervisando a otro usuario, usamos sus settings
  const effectiveUserId =
    (user?.role === 'superadmin' || user?.role === 'admin') && viewingUserId
      ? viewingUserId
      : user?.id || 'default_user';

  const effectiveUser =
    allUsers.find((u) => u.id === effectiveUserId) || user;

  const storageKey = `bitacora_u_${effectiveUserId}_settings`;

  const getInitialSettings = useCallback((): UserSettings => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Auto-sanitización: Si el usuario objetivo no es superadmin, limpiar cualquier credencial residual de Brandon
          if (effectiveUser && effectiveUser.role !== 'superadmin') {
            if (parsed.gmail_user === 'brandon501eseuko@gmail.com') {
              parsed.gmail_user = '';
              parsed.gmail_app_password = '';
            }
            if (!parsed.technician_name || parsed.technician_name === 'Brandon Ramirez') {
              parsed.technician_name = effectiveUser.name || '';
            }
            if (!parsed.email || parsed.email === 'brandon501eseuko@gmail.com') {
              parsed.email = effectiveUser.email || '';
            }
          }
          return { ...DEFAULT_SETTINGS, ...parsed };
        }

        // Migración SOLO para el super admin
        if (effectiveUserId === 'user_brandon_superadmin') {
          const legacy = localStorage.getItem('bitacora_user_settings');
          if (legacy) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(legacy) };
          }
        }
      } catch (e) {
        console.error('Error leyendo settings de localStorage:', e);
      }
    }

    return {
      ...DEFAULT_SETTINGS,
      technician_name: effectiveUser?.name || '',
      email: effectiveUser?.email || '',
    };
  }, [storageKey, effectiveUser, effectiveUserId]);

  const [settings, setSettings] = useState<UserSettings>(getInitialSettings);
  const [loading, setLoading] = useState(false);

  // Recargar configuración cuando cambia el usuario activo o supervisado
  useEffect(() => {
    setSettings(getInitialSettings());
  }, [effectiveUserId, effectiveUser, getInitialSettings]);

  const loadSettings = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', effectiveUserId)
        .single();

      if (data && !error) {
        const merged: UserSettings = {
          technician_name: data.technician_name || effectiveUser?.name || '',
          email: data.email || effectiveUser?.email || '',
          send_day: data.send_day ?? DEFAULT_SETTINGS.send_day,
          send_time: data.send_time || DEFAULT_SETTINGS.send_time,
          work_start_time: data.work_start_time || DEFAULT_SETTINGS.work_start_time,
          work_end_time: data.work_end_time || DEFAULT_SETTINGS.work_end_time,
          cc_emails: Array.isArray(data.cc_emails) ? data.cc_emails : [],
          bcc_emails: Array.isArray(data.bcc_emails) ? data.bcc_emails : [],
          signature_base64: data.signature_base64 || '',
          gmail_user: data.gmail_user || '',
          gmail_app_password: data.gmail_app_password || '',
        };
        setSettings(merged);
        localStorage.setItem(storageKey, JSON.stringify(merged));
      }
    } catch (err) {
      console.warn('No se pudieron cargar los settings de Supabase (usando locales):', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, effectiveUser, storageKey]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async (newSettings: Partial<UserSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('user_settings')
          .upsert({
            id: effectiveUserId,
            technician_name: updated.technician_name,
            email: updated.email,
            send_day: updated.send_day,
            send_time: updated.send_time,
            work_start_time: updated.work_start_time,
            work_end_time: updated.work_end_time,
            cc_emails: updated.cc_emails,
            bcc_emails: updated.bcc_emails,
            signature_base64: updated.signature_base64,
            gmail_user: updated.gmail_user,
            gmail_app_password: updated.gmail_app_password,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.error('Error guardando settings en Supabase:', err);
      }
    }
  };

  return {
    settings: {
      ...settings,
      supabase_url: supabaseUrl,
      supabase_anon_key: supabaseAnonKey,
    },
    saveSettings,
    loading,
    reload: loadSettings,
  };
}

