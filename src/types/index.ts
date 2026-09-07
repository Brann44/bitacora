// ==========================================
// BITÁCORA PRO - TIPOS DE DATOS EXACTOS
// ==========================================

export interface SubtaskOvertime {
  normalMinutes: number;
  nightMinutes: number;
  totalMinutes: number;
}

export interface Subtask {
  id: string;
  activity_id?: string;
  description: string;
  hours?: number;
  durationMinutes?: number;
  date?: string;
  startTime?: string | null;
  endTime?: string | null;
  overtime?: SubtaskOvertime | null;
  createdAt?: string;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
  category?: string;
  type?: string;
  branch?: string;
  priority?: string;
  overtimeHours?: number;
  forcedOvertime?: boolean;
  directHours?: number;
  days: boolean[]; // Array de 5 o 7 booleanos: [Lun, Mar, Mié, Jue, Vie, ...]
  subtasks?: Subtask[];
  order_index?: number;
  createdAt?: string;
}

export interface WeekDate {
  dayIndex: number;
  label: string;
  shortLabel: string;
  date: string;
  formatted?: string;
  isWeekend?: boolean;
}

export interface WeekData {
  key: string;               // Ej: "2026-W36"
  year?: number;
  weekNumber?: number;
  startDate?: string;
  dates: WeekDate[];
  activities: Activity[];
  forcedOvertimeDates: string[]; // Fechas marcadas con tiempo extra
  notes?: string;
}

export interface Goal {
  id: string;
  week_key?: string;
  title: string;
  completed?: boolean;
  priority?: 'critica' | 'alta' | 'normal';
  status?: 'pendiente' | 'en_proceso' | 'cumplida';
  category?: string;
  notes?: string;
  created_at?: string;
  createdAt?: string;
}

export interface UserSettings {
  id?: string;
  technician_name: string;
  email: string;
  send_day: number;
  send_time: string;
  work_start_time: string;
  work_end_time: string;
  cc_emails: string[];
  bcc_emails?: string[];
  signature_base64?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  gmail_user?: string;
  gmail_app_password?: string;
}

export type UserRole = 'superadmin' | 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  createdAt?: string;
  initialPassword?: string; // Para que el admin pueda ver/copiar las credenciales que asignó
}

export interface ReportColumnOptions {
  showHours: boolean;
  showCategory: boolean;
  showSubtasks: boolean;
  showOvertime?: boolean;
}

