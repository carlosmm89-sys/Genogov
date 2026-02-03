-- Script para añadir política más permisiva para lectura de perfiles
-- Ejecutar en Supabase SQL Editor

-- Eliminar política restrictiva anterior si existe
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;

-- Crear política que permite a usuarios autenticados leer cualquier perfil
-- (necesario para que la app funcione correctamente)
CREATE POLICY "Authenticated users can read profiles"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Verificar políticas
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
