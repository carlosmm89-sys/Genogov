import type { User, WorkLog } from '../types';
import { supabase } from './supabase';

// Helper to map DB response to Type
const mapUser = (data: any): User => ({
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    department: data.department,
    pin: data.pin,
    avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name)}&background=random`,
});

const mapLog = (data: any): WorkLog => ({
    id: data.id,
    userId: data.user_id,
    date: data.date,
    startTime: data.start_time,
    endTime: data.end_time,
    breaks: data.breaks || [],
    status: data.status,
    totalHours: data.total_hours || 0,
});

export const StorageService = {
    init: async () => {
        // Optional: Check connection or seed data if empty
    },

    getUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }
        return data.map(mapUser);
    },

    getLogs: async (): Promise<WorkLog[]> => {
        const { data, error } = await supabase.from('work_logs').select('*');
        if (error) {
            console.error('Error fetching logs:', error);
            return [];
        }
        return data.map(mapLog);
    },

    getUserByEmail: async (email: string): Promise<User | undefined> => {
        const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
        if (error || !data) return undefined;
        return mapUser(data);
    },

    getUserByPin: async (pin: string): Promise<User | undefined> => {
        const { data, error } = await supabase.from('users').select('*').eq('pin', pin).single();
        if (error || !data) return undefined;
        return mapUser(data);
    },

    saveLog: async (log: WorkLog) => {
        const dbLog = {
            id: log.id, // Supabase usually auto-generates IDs if UUID, but we can try to upsert if we manage IDs
            user_id: log.userId,
            date: log.date,
            start_time: log.startTime,
            end_time: log.endTime,
            breaks: log.breaks,
            status: log.status,
            total_hours: log.totalHours,
        };

        const { error } = await supabase.from('work_logs').upsert(dbLog);
        if (error) console.error('Error saving log:', error);
    },

    deleteUser: async (userId: string) => {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) console.error('Error deleting user:', error);
    },

    createUser: async (user: User) => {
        const dbUser = {
            id: user.id || crypto.randomUUID(),
            email: user.email,
            name: user.name,
            role: user.role,
            department: user.department,
            pin: user.pin,
            avatar: user.avatar
        };
        const { error } = await supabase.from('users').insert(dbUser);
        if (error) console.error('Error creating user:', error);
    },

    // Simple auth persistence (LocalStorage is fine for "session" simulation in this demo, 
    // or we could use Supabase Auth properly, but let's stick to the pin logic for now with local persistence of "who is logged in")
    getCurrentUser: (): User | null => {
        const data = localStorage.getItem('qrlaboral_current_user');
        return data ? JSON.parse(data) : null;
    },

    setCurrentUser: (user: User | null) => {
        if (user) {
            localStorage.setItem('qrlaboral_current_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('qrlaboral_current_user');
        }
    }
};
