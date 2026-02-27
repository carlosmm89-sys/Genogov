-- Crear perfil para carlosmm89@gmail.com después de crear el usuario en Dashboard
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
    user_id_var UUID;
    company_id_var UUID;
BEGIN
    -- 1. Obtener el ID del usuario de auth.users
    SELECT id INTO user_id_var
    FROM auth.users
    WHERE email = 'carlosmm89@gmail.com';

    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'Usuario con email carlosmm89@gmail.com no encontrado en auth.users';
    END IF;

    -- 2. Obtener el ID de la empresa KAROMA
    SELECT id INTO company_id_var
    FROM companies
    WHERE code = 'KAROMA' AND is_active = true
    LIMIT 1;

    -- Si no existe KAROMA, usar la primera empresa activa
    IF company_id_var IS NULL THEN
        SELECT id INTO company_id_var
        FROM companies
        WHERE is_active = true
        LIMIT 1;
    END IF;

    -- Si no hay empresas, crear una demo
    IF company_id_var IS NULL THEN
        company_id_var := '11111111-1111-1111-1111-111111111111';
        INSERT INTO companies (id, name, code, cif, is_active)
        VALUES (company_id_var, 'Empresa Demo', 'DEMO', 'B00000000', true)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- 3. Crear el perfil
    INSERT INTO profiles (
        id,
        email,
        full_name,
        username,
        role,
        company_id,
        department,
        position,
        phone
    ) VALUES (
        user_id_var,
        'carlosmm89@gmail.com',
        'Carlos Martínez',
        'carlos26',
        'SUPERADMIN',
        company_id_var,
        'Administración',
        'Administrador',
        '+34 600 000 000'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        username = EXCLUDED.username,
        role = EXCLUDED.role,
        company_id = EXCLUDED.company_id,
        department = EXCLUDED.department,
        position = EXCLUDED.position,
        phone = EXCLUDED.phone;

    RAISE NOTICE 'Perfil creado exitosamente para user_id: %', user_id_var;
END $$;

-- Verificar
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    c.name as company_name
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.email = 'carlosmm89@gmail.com';
