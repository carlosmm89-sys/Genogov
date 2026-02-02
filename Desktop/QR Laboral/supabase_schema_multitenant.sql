-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. CLEANUP (Nuclear option to fix "Column does not exist" errors from partial runs)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.get_my_claims();
DROP TABLE IF EXISTS public.work_logs CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- 1. Create Tables
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'EMPLOYEE')) DEFAULT 'EMPLOYEE',
    full_name TEXT,
    department TEXT,
    position TEXT,
    qr_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.work_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL, -- Denormalized for easier RLS
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    total_hours NUMERIC DEFAULT 0,
    status TEXT CHECK (status IN ('WORKING', 'PAUSED', 'FINISHED')) DEFAULT 'WORKING',
    breaks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Helper function to get current user's profile
CREATE OR REPLACE FUNCTION public.get_my_claims()
RETURNS TABLE (current_company_id UUID, claimed_role TEXT) AS $$
BEGIN
    RETURN QUERY SELECT company_id, role FROM public.profiles WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- COMPANIES
-- Allow anyone to read companies (needed for joining? or maybe restrict)
-- Let's restrict: Only members of the company can see it.
CREATE POLICY "Members can view their own company" ON public.companies
FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- PROFILES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Admins can view all profiles in their company
CREATE POLICY "Admins can view company profiles" ON public.profiles
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles viewer 
        WHERE viewer.id = auth.uid() 
        AND viewer.role = 'ADMIN' 
        AND viewer.company_id = public.profiles.company_id
    )
);

-- Profiles Update: Users update own? Maybe not appropriate for SaaS (Admin controls). 
-- Let's allow Admins to update profiles in their company.
CREATE POLICY "Admins can update company profiles" ON public.profiles
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.profiles viewer 
        WHERE viewer.id = auth.uid() 
        AND viewer.role = 'ADMIN' 
        AND viewer.company_id = public.profiles.company_id
    )
);

-- WORK_LOGS
-- Users see their own logs
CREATE POLICY "Users view own logs" ON public.work_logs
FOR SELECT USING (auth.uid() = user_id);

-- Admins see company logs
CREATE POLICY "Admins view company logs" ON public.work_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles viewer 
        WHERE viewer.id = auth.uid() 
        AND viewer.role = 'ADMIN' 
        AND viewer.company_id = public.work_logs.company_id
    )
);

-- Create/Update
-- Users can insert/update their own logs
CREATE POLICY "Users manage own logs" ON public.work_logs
FOR ALL USING (auth.uid() = user_id);

-- 4. Triggers needed?
-- Maybe to auto-calculate total_hours on update, but frontend can handle for now or simpler without trigger logic complexity yet.


-- 5. Automations (Triggers)
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_company_id UUID;
BEGIN
  -- Intentar buscar una empresa por defecto (o crearla si no existe - simplificado para este MVP)
  SELECT id INTO default_company_id FROM public.companies WHERE code = 'DEMO-101' LIMIT 1;
  
  -- Si no existe la empresa demo, la creamos al vuelo (bootstrapping)
  IF default_company_id IS NULL THEN
    INSERT INTO public.companies (name, code) VALUES ('Empresa Demo S.L.', 'DEMO-101')
    RETURNING id INTO default_company_id;
  END IF;

  INSERT INTO public.profiles (id, company_id, role, full_name, department, position)
  VALUES (
    new.id, 
    default_company_id,
    COALESCE((new.raw_user_meta_data->>'role')::text, 'EMPLOYEE'), -- Permitir definir rol desde metadata
    COALESCE(new.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    'General',
    'Empleado'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Initial Seed Data (Safe to run multiple times due to constraints)
INSERT INTO public.companies (name, code)
VALUES ('Empresa Demo S.L.', 'DEMO-101')
ON CONFLICT (code) DO NOTHING;
