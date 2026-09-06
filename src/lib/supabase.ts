import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Intentar leer desde variables de entorno de Vite o desde LocalStorage si se configuró en la UI
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const localUrl = typeof window !== 'undefined' ? localStorage.getItem('bitacora_supabase_url') || '' : '';
const localKey = typeof window !== 'undefined' ? localStorage.getItem('bitacora_supabase_key') || '' : '';

export const supabaseUrl = envUrl || localUrl;
export const supabaseAnonKey = envKey || localKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('tu-proyecto') &&
  supabaseUrl.startsWith('https://')
);

export let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.error('Error inicializando cliente de Supabase:', err);
  }
}

/**
 * Permite actualizar las credenciales de Supabase en caliente desde la UI
 */
export function updateSupabaseConfig(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('bitacora_supabase_url', url.trim());
      localStorage.setItem('bitacora_supabase_key', key.trim());
    } else {
      localStorage.removeItem('bitacora_supabase_url');
      localStorage.removeItem('bitacora_supabase_key');
    }
    window.location.reload();
  }
}
