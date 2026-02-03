-- TEMPORAL: Desactivar RLS para probar
-- ⚠️ SOLO PARA TESTING - NO DEJAR EN PRODUCCIÓN

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';
