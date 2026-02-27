-- Script para habilitar políticas RLS en la tabla profiles
-- Ejecutar en Supabase SQL Editor

-- 1. Habilitar RLS en la tabla profiles (si no está habilitado)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Crear política para permitir que usuarios autenticados lean sus propios perfiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 3. Crear política para permitir que usuarios autenticados actualicen sus propios perfiles
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Crear política para permitir inserción de perfiles (para nuevos usuarios)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 5. Verificar que las políticas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';
