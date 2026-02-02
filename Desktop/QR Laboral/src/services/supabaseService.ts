import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, WorkLog, Company } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null = (SUPABASE_URL && SUPABASE_ANON_KEY)
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    })
    : null;

export const db = {
    // Auth Helpers
    signIn: async (email: string, password: string) => {
        if (!supabase) throw new Error('Supabase no configurado');
        return supabase.auth.signInWithPassword({ email, password });
    },

    resetPasswordForEmail: async (email: string) => {
        if (!supabase) throw new Error('Supabase no configurado');
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'https://www.qrlaboral.com/'
        });
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
    },

    // Users
    getUsers: async (): Promise<User[]> => {
        if (!supabase) return [];
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }
        return data as User[];
    },

    saveUser: async (user: User) => {
        if (!supabase) return;
        console.log('Attempting to save user:', user);
        const { error } = await supabase.from('profiles').upsert(user);
        if (error) {
            console.error('Error saving user to Supabase:', error);
            throw error;
        }
        console.log('User saved successfully to Supabase');
    },

    deleteUser: async (userId: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
    },

    updateCompany: async (company: Company) => {
        if (!supabase) return;
        const { error } = await supabase.from('companies').update(company).eq('id', company.id);
        if (error) throw error;
    },

    // Work Sites
    getWorkSites: async (companyId: string): Promise<any[]> => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('work_sites')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true);

        if (error) {
            console.error('Error fetching work sites:', error);
            return [];
        }
        return data || [];
    },

    saveWorkSite: async (site: any) => {
        if (!supabase) return;
        const { error } = await supabase.from('work_sites').upsert(site);
        if (error) throw error;
    },

    deleteWorkSite: async (siteId: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('work_sites').update({ is_active: false }).eq('id', siteId);
        if (error) throw error;
    },

    // Export
    exportToCSV: (logs: WorkLog[], employees: User[]) => {
        const headers = ['Fecha', 'Empleado', 'Departamento', 'Entrada', 'Salida', 'Horas', 'Estado'];
        const rows = logs.map(log => {
            const emp = employees.find(e => e.id === log.user_id);
            return [
                log.date,
                emp?.full_name || 'Desconocido',
                emp?.department || '-',
                log.start_time,
                log.end_time || '',
                log.total_hours.toFixed(2),
                log.status
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "registro_jornada.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    // Project Management
    getProjectPhases: async (siteId: string) => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('work_site_phases')
            .select('*')
            .eq('work_site_id', siteId)
            .order('order_index', { ascending: true });
        if (error) { console.error(error); return []; }
        return data || [];
    },

    saveProjectPhase: async (phase: any) => {
        if (!supabase) return;
        const { data, error } = await supabase.from('work_site_phases').upsert(phase).select().single();
        if (error) throw error;
        return data;
    },

    deleteProjectPhase: async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('work_site_phases').delete().eq('id', id);
        if (error) throw error;
    },

    getProjectTasks: async (siteId: string) => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('work_site_tasks')
            .select('*')
            .eq('work_site_id', siteId)
            .order('created_at', { ascending: false });
        if (error) { console.error(error); return []; }
        return data || [];
    },

    saveProjectTask: async (task: any) => {
        if (!supabase) return;
        const { data, error } = await supabase.from('work_site_tasks').upsert(task).select().single();
        if (error) throw error;
        return data;
    },

    deleteProjectTask: async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('work_site_tasks').delete().eq('id', id);
        if (error) throw error;
    },

    getProjectExpenses: async (siteId: string) => {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('work_site_expenses')
            .select('*')
            .eq('work_site_id', siteId)
            .order('date', { ascending: false });
        if (error) { console.error(error); return []; }
        return data || [];
    },

    saveProjectExpense: async (expense: any) => {
        if (!supabase) return;
        const { data, error } = await supabase.from('work_site_expenses').upsert(expense).select().single();
        if (error) throw error;
        return data;
    },

    deleteProjectExpense: async (id: string) => {
        if (!supabase) return;
        const { error } = await supabase.from('work_site_expenses').delete().eq('id', id);
        if (error) throw error;
    },
};
