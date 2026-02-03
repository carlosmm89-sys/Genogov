-- Añadir columnas faltantes a la tabla profiles para evitar errores al guardar
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS dni TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS pin_code TEXT;

-- Verificar estructura final
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';
