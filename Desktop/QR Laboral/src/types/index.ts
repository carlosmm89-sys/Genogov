export type Role = 'ADMIN' | 'EMPLOYEE' | 'SUPERADMIN';

export interface User {
    id: string;
    company_id: string;
    username: string;
    full_name: string;
    role: Role;
    department: string;
    position: string;
    qr_code?: string;
    work_site_id?: string; // Optional: if assigned to specific project/site
    created_at?: string;
    email?: string; // Should be mandatory for auth sync really
    avatar_url?: string;
    is_external?: boolean; // New field for external employees
}

export interface WorkSite {
    id: string;
    company_id: string;
    name: string; // e.g., "Obra C/ Mayor"
    address?: string;
    location_lat: number;
    location_lng: number;
    location_radius: number; // default 500m
    is_active: boolean;
    plus_code?: string;
    // Project Management Fields
    project_type?: 'STANDARD' | 'CONSTRUCTION' | 'EVENT' | 'OTHER';
    project_status?: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    budget_estimated?: number;
    start_date?: string; // ISO
    end_date_estimated?: string; // ISO
    description?: string;
}

export interface ProjectPhase {
    id: string;
    work_site_id: string;
    name: string;
    description?: string;
    order_index: number;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    start_date?: string;
    end_date?: string;
}

export interface ProjectTask {
    id: string;
    phase_id: string;
    work_site_id: string;
    title: string;
    description?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'VALIDATED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    assigned_to?: string;
    due_date?: string;
    attachment_url?: string;
    created_at: string;
}

export interface ProjectExpense {
    id: string;
    work_site_id: string;
    description: string;
    amount: number;
    date: string;
    category: 'GENERAL' | 'MATERIAL' | 'LABOR' | 'PERMITS' | 'OTHER';
    receipt_url?: string;
    created_by?: string;
}

export type LogStatus = 'WORKING' | 'PAUSED' | 'FINISHED';

export interface WorkLog {
    id: string;
    user_id: string;
    company_id: string;
    date: string;
    start_time: string;
    end_time?: string;
    total_hours: number;
    status: LogStatus;
    breaks?: Array<{ start: string; end?: string }>; // ISO strings
    ip_address?: string; // New field for IP
    user_agent?: string; // New field for User Agent
}

export interface Company {
    id: string;
    name: string;
    code: string;
    location_lat?: number;
    location_lng?: number;
    location_radius?: number; // in meters, default 500
    logo_url?: string;
    favicon_url?: string;
    primary_color?: string;
    is_active?: boolean;
    cif?: string;
    plus_code?: string;
    domain?: string; // White label domain
    smtp_settings?: {
        host?: string;
        port?: number;
        user?: string;
        password?: string;
        encryption?: 'ssl' | 'tls' | 'none';
        from_email?: string;
        from_name?: string;
    };
}
