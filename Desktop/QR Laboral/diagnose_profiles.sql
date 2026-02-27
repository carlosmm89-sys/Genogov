-- Script de diagnóstico para verificar la estructura de la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que la tabla profiles existe
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%prof%'
ORDER BY table_name;

-- 2. Ver las columnas de la tabla profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Contar cuántos perfiles hay
SELECT COUNT(*) as total_profiles
FROM profiles;

-- 4. Ver el perfil de carlosmm89@gmail.com
SELECT *
FROM profiles
WHERE email = 'carlosmm89@gmail.com';

-- 5. Verificar RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';
