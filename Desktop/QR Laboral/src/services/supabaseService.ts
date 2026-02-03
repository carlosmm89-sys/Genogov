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
            redirectTo: 'https://www.qrlaboral.com/reset-password'
        });
    },

    // Función para actualizar contraseña directamente usando la API REST
    // Esto evita problemas de CORS con updateUser()
    updatePasswordDirect: async (newPassword: string, accessToken: string) => {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'apikey': SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ password: newPassword })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update password');
        }

        return response.json();
    },

    getProfile: async (userId: string): Promise<User | null> => {
        if (!supabase) return null;

        try {
            // Intento 1: Cliente estándar Supabase
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (!error && data) {
                return data as User;
            }

            console.warn('⚠️ Fallo cliente Supabase, intentando fallback fetch...', error);

            // Intento 2: Fetch directo (Bypass para errores 520/CORS/Red)
            // Esto funciona porque RLS está desactivado o la Anon Key tiene permisos públicos
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

            const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*&limit=1`, {
                method: 'GET',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const results = await response.json();
                if (results && results.length > 0) {
                    console.log('✅ Perfil recuperado vía fallback fetch');
                    return results[0] as User;
                }
            } else {
                console.error('❌ Fallback fetch falló:', response.status, response.statusText);
            }

        } catch (err) {
            console.error('🔥 Error crítico en getProfile:', err);
        }

        return null;
    },

    getCompany: async (companyId: string): Promise<Company | null> => {
        if (!supabase) return null;

        try {
            // Intento 1
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', companyId)
                .single();

            if (!error && data) return data as Company;

            // Intento 2: Fallback Fetch
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/companies?id=eq.${companyId}&select=*&limit=1`, {
                    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
                });
                if (response.ok) {
                    const results = await response.json();
                    if (results?.[0]) {
                        console.log('✅ Empresa recuperada vía fallback fetch');
                        return results[0] as Company;
                    }
                }
            }
        } catch (e) { console.error('Error getCompany', e); }
        return null;
    },

    // Logs
    getLogs: async (userId?: string, companyId?: string): Promise<WorkLog[]> => {
        if (!supabase) return [];

        try {
            // Intento 1
            let query = supabase.from('work_logs').select('*').order('date', { ascending: false });
            if (userId) query = query.eq('user_id', userId);
            else if (companyId) query = query.eq('company_id', companyId);

            const { data, error } = await query;
            if (!error && data) return data as WorkLog[];

            // Intento 2: Fallback
            console.warn('⚠️ Fallo getLogs Supabase, intentando fallback...');
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                let url = `${SUPABASE_URL}/rest/v1/work_logs?select=*&order=date.desc`;
                if (userId) url += `&user_id=eq.${userId}`;
                else if (companyId) url += `&company_id=eq.${companyId}`;

                const response = await fetch(url, {
                    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
                });

                if (response.ok) {
                    const results = await response.json();
                    if (results) {
                        console.log('✅ Logs recuperados vía fallback fetch');
                        return results as WorkLog[];
                    }
                }
            }
        } catch (e) { console.error('Error getLogs', e); }
        return [];
    },

    saveLog: async (log: Partial<WorkLog>) => {
        if (!supabase) return;

        try {
            // Intento 1
            const { data, error } = await supabase.from('work_logs').upsert(log).select().single();
            if (!error && data) return data;

            console.warn('⚠️ Fallo saveLog Supabase, intentando versión REST...');

            // Intento 2: Fetch directo (POST con Upsert)
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                // Truco para UPSERT vía REST: añadir parámetro on_conflict
                // LIMPIEZA: Eliminar campos que no existen en la BBDD (como user_agent)
                const { user_agent, ...cleanLog } = log as any;

                let url = `${SUPABASE_URL}/rest/v1/work_logs`;
                if (cleanLog.id) {
                    // Si tiene ID, es mejor usar PATCH para actualizar específicamente ese registro
                    url += `?id=eq.${cleanLog.id}`;
                } else {
                    // Si no tiene ID, es un INSERT nuevo. 
                    // Para upsert genérico usamos POST con Prefer: resolution=merge-duplicates
                }

                const method = cleanLog.id ? 'PATCH' : 'POST';
                const headers: any = {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation' // Necesario para que devuelva el objeto creado
                };

                if (!cleanLog.id) {
                    headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
                }

                const response = await fetch(url, {
                    method: method,
                    headers: headers,
                    body: JSON.stringify(cleanLog)
                });

                if (response.ok) {
                    const savedData = await response.json();
                    console.log('✅ Fichaje guardado vía fallback REST', savedData);
                    return savedData?.[0];
                } else {
                    const errorText = await response.text();
                    console.error('❌ Fallback saveLog falló:', response.status, errorText);
                    throw new Error(`Error al guardar: ${response.status} ${errorText}`);
                }
            }
        } catch (e) {
            console.error('Error saveLog', e);
            throw e;
        }
    },

    getCurrentLog: async (userId: string): Promise<WorkLog | null> => {
        if (!supabase) return null;
        const today = new Date().toISOString().split('T')[0];

        try {
            // Intento 1
            const { data, error } = await supabase
                .from('work_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today)
                .neq('status', 'FINISHED')
                .limit(1)
                .maybeSingle();

            if (!error && data !== undefined) return data;

            // Intento 2: Fallback
            console.warn('⚠️ Fallo getCurrentLog client, probando fallback...');
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                // Corrección: Asegurar codificación correcta de parámetros
                const url = `${SUPABASE_URL}/rest/v1/work_logs?user_id=eq.${userId}&date=eq.${today}&status=neq.FINISHED&select=*&limit=1`;

                const response = await fetch(url, {
                    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
                });

                if (response.ok) {
                    const results = await response.json();
                    if (results && results.length > 0) {
                        console.log('✅ Estado actual recuperado vía fallback', results[0]);
                        return results[0] as WorkLog;
                    } else {
                        return null;
                    }
                } else {
                    console.error('❌ Fallback getCurrentLog status:', response.status);
                }
            }
        } catch (e) { console.error('Error getCurrentLog', e); }
        return null;
    },

    // Users
    getUsers: async (): Promise<User[]> => {
        if (!supabase) return [];

        try {
            // Intento 1
            const { data, error } = await supabase.from('profiles').select('*');
            if (!error && data) return data as User[];

            console.warn('⚠️ Fallo getUsers Supabase client, probando fallback...');

            // Intento 2: Fallback Fetch
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
                    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
                });
                if (response.ok) {
                    const results = await response.json();
                    if (results) {
                        console.log(`✅ ${results.length} Usuarios recuperados vía fallback fetch`);
                        return results as User[];
                    }
                }
            }
        } catch (e) { console.error('Error getUsers', e); }
        return [];
    },

    saveUser: async (user: User) => {
        if (!supabase) return;
        console.log('Attempting to save user:', user);

        try {
            // Intento 1: Cliente Supabase
            // Primero intentamos guardar tal cual. Si falla por columnas extra, el fallback lo limpiará.
            const { error } = await supabase.from('profiles').upsert(user);

            if (!error) {
                console.log('✅ Usuario guardado correctamente (Supabase Client)');
                return;
            }

            console.warn('⚠️ Fallo saveUser Client:', error.message);
            console.warn('Intentando Fallback REST...');

            // Intento 2: Fallback Fetch (Blindado)
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                // LIMPIEZA: Eliminamos campos que sabemos que podrían NO existir o ser virtuales
                // Si la BBDD se queja de 'dni', 'is_active', etc, los filtramos aquí si no son vitales
                // Ojo: Si 'dni' es vital, DEBE existir en la BBDD. Aquí asumimos que si falla, intentamos salvar lo básico.

                // NOTA: Para no perder datos, lo ideal es que la BBDD tenga las columnas.
                // Pero para evitar el 'Crash', eliminaremos campos conflictivos conocidos si el error lo sugiere.
                // En este caso, enviamos el objeto limpio de propiedades undefined.

                const cleanUser = Object.fromEntries(
                    Object.entries(user).filter(([_, v]) => v !== undefined && v !== null)
                );

                // Si hay campos específicos que dan error y no están en BBDD, añádelos a la desestructuración:
                // const { campo_malo, ...dataToSend } = cleanUser; 
                const dataToSend = cleanUser;

                let url = `${SUPABASE_URL}/rest/v1/profiles`;
                if (user.id) url += `?id=eq.${user.id}`;

                const method = user.id ? 'PATCH' : 'POST';
                const headers: any = {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                };

                if (!user.id) headers['Prefer'] = 'return=representation,resolution=merge-duplicates';

                const response = await fetch(url, {
                    method: method,
                    headers: headers,
                    body: JSON.stringify(dataToSend)
                });

                if (response.ok) {
                    console.log('✅ Usuario guardado vía Fallback REST');
                } else {
                    const errText = await response.text();
                    console.error('❌ Fallback saveUser falló:', response.status, errText);
                    throw new Error(`Error guardando usuario: ${errText}`);
                }
            }

        } catch (e) {
            console.error('Error saving user to Supabase:', e);
            throw e;
        }
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

        try {
            // Intento 1
            const { data, error } = await supabase
                .from('work_sites')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true);

            if (!error && data) return data;

            // Intento 2: Fallback Fetch
            const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
            const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

            if (SUPABASE_URL && SUPABASE_ANON_KEY) {
                const response = await fetch(`${SUPABASE_URL}/rest/v1/work_sites?company_id=eq.${companyId}&is_active=eq.true&select=*`, {
                    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
                });
                if (response.ok) {
                    const results = await response.json();
                    if (results) {
                        console.log('✅ Centros recuperados vía fallback fetch');
                        return results;
                    }
                }
            }
        } catch (e) { console.error('Error getWorkSites', e); }
        return [];
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

    // Auth Tools
    resetPasswordEmail: async (email: string) => {
        if (!supabase) return;
        // Usamos redirectTo para que al pinchar vaya a la página de actualizar password (si existiera) o al home
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
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
