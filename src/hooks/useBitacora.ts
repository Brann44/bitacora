import { useState, useEffect, useCallback } from 'react';
import { WeekData, Activity, Subtask } from '../types';
import { getISOWeekKey, getWeekDates, getWeekDateRangeString } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useBitacora(initialWeekKey?: string) {
  const { user, viewingUserId } = useAuth();
  
  // Si es SuperAdmin o Admin y está supervisando a otro usuario, usamos su ID
  const effectiveUserId =
    (user?.role === 'superadmin' || user?.role === 'admin') && viewingUserId
      ? viewingUserId
      : user?.id || 'default_user';

  const defaultKey = initialWeekKey || getISOWeekKey();
  const [activeWeekKey, setActiveWeekKey] = useState<string>(defaultKey);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortMode, setSortMode] = useState<'day' | 'name' | 'manual'>('day');

  const getStorageKey = useCallback(
    (key: string) => `bitacora_u_${effectiveUserId}_week_${key}`,
    [effectiveUserId]
  );

  const createEmptyWeek = (key: string): WeekData => {
    const dates = getWeekDates(key);
    return {
      key,
      startDate: getWeekDateRangeString(dates),
      dates,
      activities: [],
      forcedOvertimeDates: [],
      notes: '',
    };
  };

  const loadWeek = useCallback(async (key: string = activeWeekKey) => {
    setLoading(true);
    const localKey = getStorageKey(key);
    const dates = getWeekDates(key);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data: weekRecord } = await supabase
          .from('weeks')
          .select('*')
          .eq('week_key', key)
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        const { data: actRecords } = await supabase
          .from('activities')
          .select(`
            *,
            subtasks (*)
          `)
          .eq('week_key', key)
          .eq('user_id', effectiveUserId)
          .order('order_index', { ascending: true });

        const forcedDates = (weekRecord?.forced_overtime_dates as string[]) || [];

        const activities: Activity[] = (actRecords || []).map((a: any) => ({
          id: a.id,
          name: a.name,
          description: a.description || '',
          category: a.category || 'Soporte',
          type: a.type || 'Operativa',
          branch: a.branch || 'Oficina Central',
          priority: a.priority || 'Media',
          forcedOvertime: Boolean(a.is_overtime || a.forced_overtime),
          directHours: Number(a.direct_hours || a.directHours) || 0,
          days: Array.isArray(a.days) ? a.days : [false, false, false, false, false],
          order_index: a.order_index || 0,
          subtasks: (a.subtasks || []).map((s: any) => ({
            id: s.id,
            description: s.text || s.description || '',
            hours: Number(s.hours) || 0,
            startTime: s.start_time || s.startTime || null,
            endTime: s.end_time || s.endTime || null,
            date: s.day_date || s.date || '',
          })),
        }));

        const compiled: WeekData = {
          key,
          startDate: getWeekDateRangeString(dates),
          dates,
          activities,
          forcedOvertimeDates: forcedDates,
          notes: weekRecord?.notes || '',
        };

        setWeekData(compiled);
        localStorage.setItem(localKey, JSON.stringify(compiled));
        setLoading(false);
        return;
      } catch (err) {
        console.warn('Error cargando de Supabase:', err);
      }
    }

    try {
      let saved = localStorage.getItem(localKey);
      // Migración de datos existentes para usuario default
      if (!saved && (effectiveUserId === 'user_default' || effectiveUserId === 'default_user' || effectiveUserId === 'user_brandon_superadmin')) {
        saved = localStorage.getItem(`bitacora_pro_week_${key}`);
      }

      if (saved) {
        const parsed: WeekData = JSON.parse(saved);
        parsed.dates = dates;
        parsed.startDate = getWeekDateRangeString(dates);
        setWeekData(parsed);
      } else {
        setWeekData(createEmptyWeek(key));
      }
    } catch (e) {
      setWeekData(createEmptyWeek(key));
    } finally {
      setLoading(false);
    }
  }, [activeWeekKey, getStorageKey, effectiveUserId]);

  useEffect(() => {
    loadWeek(activeWeekKey);
  }, [activeWeekKey, loadWeek, effectiveUserId]);

  const persistWeek = async (updated: WeekData) => {
    setWeekData(updated);
    localStorage.setItem(getStorageKey(updated.key), JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('weeks')
          .upsert({
            user_id: effectiveUserId,
            week_key: updated.key,
            year: parseInt(updated.key.split('-W')[0], 10),
            week_number: parseInt(updated.key.split('-W')[1], 10),
            forced_overtime_dates: updated.forcedOvertimeDates,
            notes: updated.notes || '',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,week_key' });
      } catch (e) {
        console.error('Error persistiendo en Supabase:', e);
      }
    }
  };

  // Toggle Día (Habit Tracker)
  const toggleDay = async (actId: string, dayIndex: number) => {
    if (!weekData) return;
    const updatedActivities = weekData.activities.map((act) => {
      if (act.id === actId) {
        const newDays = [...act.days];
        newDays[dayIndex] = !newDays[dayIndex];
        return { ...act, days: newDays };
      }
      return act;
    });

    const updated = { ...weekData, activities: updatedActivities };
    await persistWeek(updated);

    if (isSupabaseConfigured && supabase) {
      const act = updatedActivities.find((a) => a.id === actId);
      if (act) {
        await supabase
          .from('activities')
          .update({ days: act.days, updated_at: new Date().toISOString() })
          .eq('id', actId);
      }
    }
  };

  // Marcar Día como Tiempo Extra (Zap)
  const toggleForcedOvertimeDate = async (dateStr: string) => {
    if (!weekData) return;
    const exists = (weekData.forcedOvertimeDates || []).includes(dateStr);
    const newDates = exists
      ? weekData.forcedOvertimeDates.filter((d) => d !== dateStr)
      : [...(weekData.forcedOvertimeDates || []), dateStr];

    const updated = { ...weekData, forcedOvertimeDates: newDates };
    await persistWeek(updated);
  };

  // Marcar Actividad como Tiempo Extra
  const toggleActivityOvertime = async (actId: string, currentValue: boolean) => {
    if (!weekData) return;
    const newValue = !currentValue;
    const updatedActivities = weekData.activities.map((act) => {
      if (act.id === actId) {
        return { ...act, forcedOvertime: newValue };
      }
      return act;
    });

    const updated = { ...weekData, activities: updatedActivities };
    await persistWeek(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('activities')
        .update({ is_overtime: newValue, updated_at: new Date().toISOString() })
        .eq('id', actId);
    }
  };

  // Actualizar Horas Directas
  const updateActivityDirectHours = async (actId: string, directHours: number) => {
    if (!weekData) return;
    const updatedActivities = weekData.activities.map((act) => {
      if (act.id === actId) {
        return { ...act, directHours };
      }
      return act;
    });

    const updated = { ...weekData, activities: updatedActivities };
    await persistWeek(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('activities')
        .update({ direct_hours: directHours, updated_at: new Date().toISOString() })
        .eq('id', actId);
    }
  };

  // Actualizar Categoría de Actividad
  const updateActivityCategory = async (actId: string, category: string) => {
    if (!weekData) return;
    const updatedActivities = weekData.activities.map((act) => {
      if (act.id === actId) {
        return { ...act, category };
      }
      return act;
    });

    const updated = { ...weekData, activities: updatedActivities };
    await persistWeek(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('activities')
        .update({ category, updated_at: new Date().toISOString() })
        .eq('id', actId);
    }
  };

  // Agregar Subtarea Manual
  const addManualSubtask = async (
    actId: string,
    desc: string,
    hours: number,
    startTime?: string,
    endTime?: string
  ) => {
    if (!weekData || !desc.trim()) return;

    const newSub: Subtask = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      activity_id: actId,
      description: desc.trim(),
      hours: Number(hours) || 0,
      startTime: startTime || null,
      endTime: endTime || null,
      createdAt: new Date().toISOString(),
    };

    const updatedActivities = weekData.activities.map((act) => {
      if (act.id === actId) {
        return { ...act, subtasks: [...(act.subtasks || []), newSub] };
      }
      return act;
    });

    const updated = { ...weekData, activities: updatedActivities };
    await persistWeek(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('subtasks').insert({
        id: newSub.id,
        activity_id: actId,
        text: newSub.description,
        hours: newSub.hours,
      });
    }
  };

  // Eliminar Subtarea
  const deleteSubtask = async (actId: string, subtaskId: string) => {
    if (!weekData) return;
    const updatedActivities = weekData.activities.map((act) => {
      if (act.id === actId) {
        return { ...act, subtasks: (act.subtasks || []).filter((s) => s.id !== subtaskId) };
      }
      return act;
    });

    const updated = { ...weekData, activities: updatedActivities };
    await persistWeek(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('subtasks').delete().eq('id', subtaskId);
    }
  };

  // Agregar Actividad Rápida
  const addQuickActivity = async (name: string) => {
    if (!weekData || !name.trim()) return;

    const newAct: Activity = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      name: name.trim(),
      category: 'Soporte',
      type: 'Operativa',
      branch: 'Oficina Central',
      priority: 'Media',
      days: [false, false, false, false, false],
      directHours: 0,
      forcedOvertime: false,
      order_index: weekData.activities.length,
      subtasks: [],
    };

    const updated = { ...weekData, activities: [...weekData.activities, newAct] };
    await persistWeek(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('activities').insert({
        id: newAct.id,
        user_id: effectiveUserId,
        week_key: weekData.key,
        name: newAct.name,
        description: newAct.description || '',
        category: newAct.category,
        type: newAct.type,
        branch: newAct.branch,
        priority: newAct.priority,
        days: newAct.days,
        direct_hours: newAct.directHours,
        is_overtime: newAct.forcedOvertime,
        order_index: newAct.order_index,
      });
    }
  };

  // Crear Actividad Avanzada
  const createAdvancedActivity = async (data: {
    name: string;
    description?: string;
    category?: string;
    type?: string;
    branch?: string;
    priority?: string;
  }) => {
    if (!weekData || !data.name.trim()) return;

    const newAct: Activity = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      name: data.name.trim(),
      description: data.description?.trim() || '',
      category: data.category || 'Soporte',
      type: data.type || 'Operativa',
      branch: data.branch || 'Oficina Central',
      priority: data.priority || 'Media',
      days: [false, false, false, false, false],
      directHours: 0,
      forcedOvertime: false,
      order_index: weekData.activities.length,
      subtasks: [],
    };

    const updated = { ...weekData, activities: [...weekData.activities, newAct] };
    await persistWeek(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('activities').insert({
        id: newAct.id,
        user_id: effectiveUserId,
        week_key: weekData.key,
        name: newAct.name,
        description: newAct.description,
        category: newAct.category,
        type: newAct.type,
        branch: newAct.branch,
        priority: newAct.priority,
        days: newAct.days,
        direct_hours: newAct.directHours,
        is_overtime: newAct.forcedOvertime,
        order_index: newAct.order_index,
      });
    }
  };

  // Eliminar Actividad
  const deleteActivity = async (actId: string) => {
    if (!weekData) return;
    const updated = {
      ...weekData,
      activities: weekData.activities.filter((a) => a.id !== actId),
    };
    await persistWeek(updated);

    if (isSupabaseConfigured && supabase) {
      await supabase.from('activities').delete().eq('id', actId);
    }
  };

  // Reordenar Actividades (Drag and drop)
  const reorderActivities = async (orderedIds: string[]) => {
    if (!weekData) return;
    const idMap = new Map(weekData.activities.map((a) => [a.id, a]));
    const reordered: Activity[] = [];
    orderedIds.forEach((id, idx) => {
      const found = idMap.get(id);
      if (found) {
        reordered.push({ ...found, order_index: idx });
      }
    });

    const updated = { ...weekData, activities: reordered };
    await persistWeek(updated);

    if (isSupabaseConfigured && supabase) {
      for (let i = 0; i < reordered.length; i++) {
        await supabase
          .from('activities')
          .update({ order_index: i })
          .eq('id', reordered[i].id);
      }
    }
  };

  return {
    weekData,
    activeWeekKey,
    setActiveWeekKey,
    loading,
    sortMode,
    setSortMode,
    loadWeek,
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
  };
}
