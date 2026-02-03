-- Primero eliminamos la versión antigua para evitar el error de "return type"
DROP FUNCTION IF EXISTS delete_company_rpc(UUID);

-- Ahora la recreamos correctamente
CREATE OR REPLACE FUNCTION delete_company_rpc(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Eliminar Centros de Trabajo / Work Sites
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_sites') THEN
        DELETE FROM public.work_sites WHERE company_id = p_company_id;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_centers') THEN
        DELETE FROM public.work_centers WHERE company_id = p_company_id;
    END IF;

    -- 2. Eliminar Registros de Jornada (Work Logs)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_logs') THEN
        DELETE FROM public.work_logs WHERE company_id = p_company_id;
    END IF;

    -- 3. Eliminar Perfiles de Usuario (Profiles)
    DELETE FROM public.profiles WHERE company_id = p_company_id;

    -- 4. Finalmente, eliminar la empresa (Companies)
    DELETE FROM public.companies WHERE id = p_company_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
