
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, WorkLog, Company } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const db = {
  // Auth Helpers
  signIn: async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase no configurado');
    return supabase.auth.signInWithPassword({ email, password });
  },

  getProfile: async (userId: string): Promise<User | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
    return data as User;
  },

  getCompany: async (companyId: string): Promise<Company | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) return null;
    return data as Company;
  },

  // Logs
  getLogs: async (userId?: string, companyId?: string): Promise<WorkLog[]> => {
    if (!supabase) return [];

    let query = supabase.from('work_logs').select('*').order('date', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else if (companyId) {
      // Admin view: see company logs
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
    return data as WorkLog[];
  },

  saveLog: async (log: Partial<WorkLog>) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('work_logs')
      .upsert(log)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  getCurrentLog: async (userId: string): Promise<WorkLog | null> => {
    if (!supabase) return null;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('work_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .neq('status', 'FINISHED')
      .limit(1)
      .maybeSingle();

    if (error) console.error('Error checking current log:', error);
    return data;
  }
};
