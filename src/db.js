import { useState, useEffect, useCallback } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabase = SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your_supabase');

let supabase = null;
if (hasSupabase) {
  import('./supabase').then(m => { supabase = m.supabase; });
}

// ── Demo users for offline mode ──
const DEMO_USERS = [
  { id: 1, name: "admin", password: "admin", role: "admin" },
  { id: 2, name: "staff", password: "staff", role: "staff" },
];

export function useDB() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Refresh ──
  const refreshUsers = useCallback(async () => {
    if (supabase) {
      const { data } = await supabase.from('users').select('*').order('id');
      if (data) setUsers(data);
    } else {
      setUsers(DEMO_USERS);
    }
  }, []);

  // ── Init ──
  useEffect(() => {
    (async () => {
      try { await refreshUsers(); } catch(e) { console.warn("DB fetch failed:", e); setUsers(DEMO_USERS); }
      setLoading(false);
    })();
    if (supabase) {
      const interval = setInterval(() => { try { refreshUsers(); } catch(e){} }, 15000);
      return () => clearInterval(interval);
    }
  }, [refreshUsers]);

  // ── CRUD ──
  const createUser = useCallback(async (user) => {
    if (supabase) {
      const { error } = await supabase.from('users').insert(user);
      if (!error) await refreshUsers();
    }
  }, [refreshUsers]);

  const updateUser = useCallback(async (id, fields) => {
    if (supabase) {
      const { error } = await supabase.from('users').update(fields).eq('id', id);
      if (!error) await refreshUsers();
    }
  }, [refreshUsers]);

  const deleteUser = useCallback(async (id) => {
    if (supabase) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (!error) await refreshUsers();
    }
  }, [refreshUsers]);

  return {
    users, loading, hasSupabase,
    refreshUsers, createUser, updateUser, deleteUser,
  };
}
