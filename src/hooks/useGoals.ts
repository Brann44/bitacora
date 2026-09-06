import { useState, useEffect, useCallback } from 'react';
import { Goal } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useGoals(weekKey: string) {
  const { user, viewingUserId } = useAuth();
  const effectiveUserId =
    (user?.role === 'superadmin' || user?.role === 'admin') && viewingUserId
      ? viewingUserId
      : user?.id || 'default_user';

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const localKey = `bitacora_u_${effectiveUserId}_goals_${weekKey}`;

  const loadGoals = useCallback(async () => {
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('goals')
          .select('*')
          .eq('week_key', weekKey)
          .eq('user_id', effectiveUserId)
          .order('created_at', { ascending: true });

        if (data && !error) {
          setGoals(data);
          localStorage.setItem(localKey, JSON.stringify(data));
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Error cargando metas de Supabase:', err);
      }
    }

    try {
      const saved = localStorage.getItem(localKey);
      if (saved) {
        setGoals(JSON.parse(saved));
      } else {
        setGoals([]);
      }
    } catch (e) {
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [weekKey, localKey, effectiveUserId]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals, effectiveUserId]);

  const addGoal = async (title: string, category: string = 'General') => {
    if (!title.trim()) return;

    const newGoal: Goal = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      week_key: weekKey,
      title: title.trim(),
      completed: false,
      category,
      created_at: new Date().toISOString(),
    };

    const updated = [...goals, newGoal];
    setGoals(updated);
    localStorage.setItem(localKey, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      await supabase.from('goals').insert({
        id: newGoal.id,
        user_id: effectiveUserId,
        week_key: newGoal.week_key,
        title: newGoal.title,
        completed: newGoal.completed,
        category: newGoal.category,
      });
    }
  };

  const toggleGoal = async (id: string) => {
    const updated = goals.map((g) => (g.id === id ? { ...g, completed: !g.completed } : g));
    setGoals(updated);
    localStorage.setItem(localKey, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      const target = updated.find((g) => g.id === id);
      if (target) {
        await supabase.from('goals').update({ completed: target.completed }).eq('id', id);
      }
    }
  };

  const deleteGoal = async (id: string) => {
    const updated = goals.filter((g) => g.id !== id);
    setGoals(updated);
    localStorage.setItem(localKey, JSON.stringify(updated));

    if (isSupabaseConfigured && supabase) {
      await supabase.from('goals').delete().eq('id', id);
    }
  };

  return {
    goals,
    loading,
    addGoal,
    toggleGoal,
    deleteGoal,
    reload: loadGoals,
  };
}
