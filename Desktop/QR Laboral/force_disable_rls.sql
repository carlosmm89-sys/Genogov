-- Verificar estado de RLS y re-desactivar si es necesario
-- Ejecutar en Supabase SQL Editor

-- 1. Ver estado actual de RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'companies', 'work_sites')
ORDER BY tablename;

-- 2. Forzar desactivación de RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;

-- 3. Eliminar TODAS las políticas RLS de profiles
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "SuperAdmin can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update company profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can delete company members" ON profiles;
DROP POLICY IF EXISTS "Admin can insert company profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "SuperAdmin Standard Access" ON profiles;
DROP POLICY IF EXISTS "SuperAdmin can insert profiles" ON profiles;
DROP POLICY IF EXISTS "SuperAdmin can update profiles" ON profiles;
DROP POLICY IF EXISTS "SuperAdmin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Public Scan Access" ON profiles;

-- 4. Verificar que no quedan políticas
SELECT policyname
FROM pg_policies
WHERE tablename = 'profiles';

-- 5. Verificar de nuevo el estado de RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';
