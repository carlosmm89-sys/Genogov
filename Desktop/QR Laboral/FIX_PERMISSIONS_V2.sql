-- SCRIPT DE PERMISOS V2 (LIMPIEZA Y RECREACIÓN)
-- Ejecuta esto para solucionar el error "policy already exists".
-- Borrará las políticas existentes (ya sean las antiguas o las nuevas mal configuradas) y las creará correctamente.

-- 1. INSERTAR (Permitir al Admin crear empleados)
DROP POLICY IF EXISTS "Permitir crear perfiles a usuarios autenticados" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "public"."profiles";

CREATE POLICY "Permitir crear perfiles a usuarios autenticados" 
ON "public"."profiles" 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 2. LEER (Permitir ver la lista de empleados)
DROP POLICY IF EXISTS "Permitir ver perfiles a usuarios autenticados" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles";

CREATE POLICY "Permitir ver perfiles a usuarios autenticados" 
ON "public"."profiles" 
FOR SELECT 
TO authenticated 
USING (true);

-- 3. ACTUALIZAR (Permitir modificar empleados)
DROP POLICY IF EXISTS "Permitir actualizar perfiles a usuarios autenticados" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."profiles";

CREATE POLICY "Permitir actualizar perfiles a usuarios autenticados" 
ON "public"."profiles" 
FOR UPDATE 
TO authenticated 
USING (true);
