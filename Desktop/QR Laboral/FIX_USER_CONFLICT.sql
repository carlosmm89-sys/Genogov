-- SCRIPT DE REPARACIÓN DE USUARIO CONFLICTIVO
-- -----------------------------------------------------
-- Problema: El usuario 'carlosmm89@gmail.com' existe en el sistema de autenticación (Auth)
-- pero fue eliminado incorrectamente de la base de datos pública (Profiles/Users), creando un estado "zombi".
-- Al intentar crearlo de nuevo, el sistema falla porque detecta el email duplicado o falta de referencias.

-- SOLUCIÓN:
-- Ejecuta este bloque de código en el Editor SQL de tu panel de Supabase.

-- IMPORTANTE: Esto eliminará el acceso del usuario para permitir crearlo desde cero. 
-- Si hay registros históricos (fichajes) asociados a este ID, intenta hacer un backup primero si son críticos.

BEGIN;

-- 1. Intentar limpiar el registro de autenticación para liberar el email
DELETE FROM auth.users 
WHERE email = 'carlosmm89@gmail.com';

COMMIT;

-- MODO DE USO:
-- 1. Copia este código.
-- 2. Ve a https://supabase.com/dashboard/project/_/sql (Tu editor SQL).
-- 3. Pega y ejecuta (Run).
-- 4. Vuelve al panel y crea el empleado de nuevo. Debería funcionar.
