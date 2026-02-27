-- Script para crear perfil de usuario después de password reset
-- Ejecutar en Supabase SQL Editor

-- 1. Obtener el ID de la empresa existente (o usar una por defecto)
DO $$
DECLARE
    company_id_var UUID;
    user_id UUID;
BEGIN
    -- Buscar empresa por código KAROMA (o la primera empresa activa)
    SELECT id INTO company_id_var
    FROM companies
    WHERE code = 'KAROMA' AND is_active = true
    LIMIT 1;

    -- Si no existe, usar la primera empresa activa
    IF company_id_var IS NULL THEN
        SELECT id INTO company_id_var
        FROM companies
        WHERE is_active = true
        LIMIT 1;
    END IF;

    -- Si aún no hay empresa, crear una
    IF company_id_var IS NULL THEN
        company_id_var := '11111111-1111-1111-1111-111111111111';
        INSERT INTO companies (id, name, code, cif, is_active)
        VALUES (
            company_id_var,
            'Empresa Demo',
            'DEMO',
            'B00000000',
            true
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Buscar el usuario por email
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'carlosmm89@gmail.com';

    -- Si el usuario existe, crear o actualizar su perfil
    IF user_id IS NOT NULL THEN
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
        )
        VALUES (
            user_id,
            'carlosmm89@gmail.com',
            'Carlos Martínez',
            'carlos26',
            'SUPERADMIN',
            company_id_var,
            'Administración',
            'Administrador',
            '+34 600 000 000'
        )
        ON CONFLICT (id) 
        DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            username = EXCLUDED.username,
            role = EXCLUDED.role,
            company_id = EXCLUDED.company_id,
            department = EXCLUDED.department,
            position = EXCLUDED.position,
            phone = EXCLUDED.phone;

        RAISE NOTICE 'Perfil creado/actualizado para usuario: % con empresa: %', user_id, company_id_var;
    ELSE
        RAISE EXCEPTION 'Usuario con email carlosmm89@gmail.com no encontrado en auth.users';
    END IF;
END $$;

-- 2. Verificar que el perfil se creó correctamente
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    c.name as company_name,
    c.is_active as company_is_active
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.email = 'carlosmm89@gmail.com';
