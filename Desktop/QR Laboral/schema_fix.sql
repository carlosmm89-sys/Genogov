-- 1. Create users table if it doesn't exist
create table if not exists public.users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  name text not null,
  role text check (role in ('admin', 'employee')) not null,
  department text,
  pin text unique,
  avatar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create work_logs table if it doesn't exist
create table if not exists public.work_logs (
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

-- 3. Enable RLS (safe to run multiple times)
alter table public.users enable row level security;
alter table public.work_logs enable row level security;

-- 4. Drop existing policies to avoid errors, then recreate them
drop policy if exists "Allow public access to users" on public.users;
create policy "Allow public access to users" on public.users for all using (true);

drop policy if exists "Allow public access to work_logs" on public.work_logs;
create policy "Allow public access to work_logs" on public.work_logs for all using (true);

-- 5. Insert default admin user if not exists
insert into public.users (email, name, role, department, pin)
values ('superadmin@qrlaboral.com', 'Administrador', 'admin', 'Dirección', '1234')
on conflict (email) do nothing;
