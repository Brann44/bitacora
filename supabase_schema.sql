-- ============================================================
-- BITÁCORA PRO - ESQUEMA DE BASE DE DATOS PARA SUPABASE
-- Copia y pega todo este contenido en el SQL Editor de Supabase y dale a "RUN"
-- ============================================================

-- 1. Tabla de Usuarios del Sistema (Cuentas creadas por Super Admin)
CREATE TABLE IF NOT EXISTS public.system_users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user',
    initial_password TEXT DEFAULT '123456',
    password_hash TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Semanas
CREATE TABLE IF NOT EXISTS public.weeks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'default_user',
    week_key TEXT NOT NULL, -- Ej: "2026-W36"
    year INT NOT NULL,
    week_number INT NOT NULL,
    forced_overtime_dates JSONB DEFAULT '[]'::jsonb,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, week_key)
);

-- 3. Tabla de Actividades Semanales
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'default_user',
    week_key TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'Soporte',
    type TEXT DEFAULT 'Operativa',
    branch TEXT DEFAULT 'Oficina Central',
    priority TEXT DEFAULT 'Media',
    days JSONB NOT NULL DEFAULT '[false, false, false, false, false]'::jsonb,
    direct_hours NUMERIC(5,2) DEFAULT 0,
    is_overtime BOOLEAN DEFAULT false,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Subtareas / Desglose de Tiempos
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    hours NUMERIC(5,2) DEFAULT 0,
    start_time TEXT DEFAULT NULL,
    end_time TEXT DEFAULT NULL,
    day_date TEXT DEFAULT '', -- Formato YYYY-MM-DD
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Metas Semanales (Goals)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'default_user',
    week_key TEXT NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabla de Configuración de Usuario y Credenciales
CREATE TABLE IF NOT EXISTS public.user_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_user',
    technician_name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    send_day INT DEFAULT 5, -- 5 = Viernes
    send_time TEXT DEFAULT '17:00',
    work_start_time TEXT DEFAULT '08:00',
    work_end_time TEXT DEFAULT '17:00',
    cc_emails JSONB DEFAULT '[]'::jsonb,
    bcc_emails JSONB DEFAULT '[]'::jsonb,
    signature_base64 TEXT DEFAULT '',
    gmail_user TEXT DEFAULT '',
    gmail_app_password TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para búsqueda ultra rápida
CREATE INDEX IF NOT EXISTS idx_activities_week_key ON public.activities(week_key);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_activity_id ON public.subtasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_goals_week_key ON public.goals(week_key);
CREATE INDEX IF NOT EXISTS idx_system_users_email ON public.system_users(email);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para API pública con Anon Key
CREATE POLICY "Permitir todo en system_users" ON public.system_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en weeks" ON public.weeks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en subtasks" ON public.subtasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en user_settings" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);
