
export type Role = 'ADMIN' | 'EMPLOYEE';

export interface User {
  id: string;
  company_id: string;
  username: string;
  full_name: string;
  role: Role;
  department: string;
  position: string;
  qr_code?: string;
}

export type LogStatus = 'WORKING' | 'PAUSED' | 'FINISHED';

export interface WorkLog {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time?: string;
  total_hours: number;
  status: LogStatus;
  breaks: Array<{ start: string; end?: string }>;
}

export interface Company {
  id: string;
  name: string;
  code: string;
}
