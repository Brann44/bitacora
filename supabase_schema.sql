-- ============================================================
-- BITÁCORA PRO - ESQUEMA DE BASE DE DATOS PARA SUPABASE
-- Copia y pega este contenido en el SQL Editor de tu proyecto
-- ============================================================

-- 1. Tabla de Semanas
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

-- 2. Tabla de Actividades Semanales
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'default_user',
    week_key TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Soporte', -- Soporte, Desarrollo, Mantenimiento, Proyecto, etc.
    days JSONB NOT NULL DEFAULT '[false, false, false, false, false, false, false]'::jsonb, -- Lun a Dom
    direct_hours NUMERIC(5,2) DEFAULT 0,
    is_overtime BOOLEAN DEFAULT false,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Subtareas / Desglose de Tiempos
CREATE TABLE IF NOT EXISTS public.subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    hours NUMERIC(5,2) DEFAULT 0,
    day_date TEXT DEFAULT '', -- Formato YYYY-MM-DD
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Metas Semanales (Goals)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'default_user',
    week_key TEXT NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Configuración de Usuario
CREATE TABLE IF NOT EXISTS public.user_settings (
    id TEXT PRIMARY KEY DEFAULT 'default_user',
    technician_name TEXT DEFAULT 'Mi Nombre',
    email TEXT DEFAULT '',
    send_day INT DEFAULT 5, -- 5 = Viernes
    send_time TEXT DEFAULT '17:00',
    work_start_time TEXT DEFAULT '08:00',
    work_end_time TEXT DEFAULT '17:00',
    cc_emails JSONB DEFAULT '[]'::jsonb,
    bcc_emails JSONB DEFAULT '[]'::jsonb,
    signature_base64 TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_activities_week_key ON public.activities(week_key);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_activity_id ON public.subtasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_goals_week_key ON public.goals(week_key);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para uso con Anon Key o usuarios autenticados
CREATE POLICY "Permitir todo en weeks" ON public.weeks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en subtasks" ON public.subtasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en goals" ON public.goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo en user_settings" ON public.user_settings FOR ALL USING (true) WITH CHECK (true);

