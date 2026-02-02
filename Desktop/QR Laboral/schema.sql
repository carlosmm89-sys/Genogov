-- Create users table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text not null,
  role text check (role in ('admin', 'employee')) not null,
  department text,
  pin text unique,
  avatar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create work_logs table
create table public.work_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  date date not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  breaks jsonb default '[]'::jsonb,
  status text check (status in ('active', 'paused', 'completed')) not null,
  total_hours numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.work_logs enable row level security;

-- Create policies (Simplified for demo: allow public access, secure this for production!)
create policy "Allow public access to users" on public.users for all using (true);
create policy "Allow public access to work_logs" on public.work_logs for all using (true);

-- Insert default admin user
insert into public.users (email, name, role, department, pin)
values ('superadmin@qrlaboral.com', 'Administrador', 'admin', 'Dirección', '1234');
