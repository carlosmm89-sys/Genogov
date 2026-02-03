-- Script para eliminar completamente el usuario problemático y empezar de cero
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar el perfil de la tabla profiles
DELETE FROM profiles
WHERE email = 'carlosmm89@gmail.com';

-- 2. Eliminar el usuario de auth.users (requiere permisos de admin)
-- Nota: Esto se debe hacer desde Supabase Dashboard → Authentication → Users
-- Busca carlosmm89@gmail.com y elimínalo manualmente

-- 3. Verificar que se eliminó
SELECT COUNT(*) as profiles_count
FROM profiles
WHERE email = 'carlosmm89@gmail.com';

SELECT COUNT(*) as auth_users_count
FROM auth.users
WHERE email = 'carlosmm89@gmail.com';

-- Ambos deben devolver 0
