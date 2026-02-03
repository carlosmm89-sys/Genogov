-- Asegurar que los códigos QR sean únicos en la base de datos
-- Esto evitará que dos empleados tengan el mismo código por accidente.

BEGIN;

-- Añadir restricción UNIQUE a la columna qr_code
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_qr_code_key UNIQUE (qr_code);

COMMIT;
