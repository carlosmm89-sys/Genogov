-- SOLUCIÓN AL PROBLEMA "USUARIO SIN PERFIL" / CARGA INFINITA
-- -------------------------------------------------------------
-- El problema es que, por seguridad (RLS), Supabase impide que un usuario (Tú, Admin) cree la ficha de OTRO usuario (el empleado).
-- Por eso se crea el login (Auth) pero no la ficha de datos (Profile), y al entrar se queda cargando o da error.

-- EJECUTA ESTE SCRIPT EN EL EDITOR SQL DE SUPABASE PARA DAR PERMISOS DE CREACIÓN DE EMPLEADOS:

-- 1. Habilitar inserción de perfiles para usuarios autenticados (Admins)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."profiles";
CREATE POLICY "Permitir crear perfiles a usuarios autenticados" 
ON "public"."profiles" 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. Asegurar que se puedan leer/actualizar
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles";
CREATE POLICY "Permitir ver perfiles a usuarios autenticados" 
ON "public"."profiles" 
FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."profiles";
CREATE POLICY "Permitir actualizar perfiles a usuarios autenticados" 
ON "public"."profiles" 
FOR UPDATE 
TO authenticated 
USING (true);
