-- TEMPORAL: Desactivar RLS completamente para todas las tablas
-- ⚠️ SOLO PARA TESTING - REACTIVAR DESPUÉS

-- Desactivar RLS en profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en companies (si tiene RLS)
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en work_sites (si existe y tiene RLS)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_sites') THEN
        ALTER TABLE work_sites DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Verificar que RLS está desactivado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'companies', 'work_sites')
ORDER BY tablename;
