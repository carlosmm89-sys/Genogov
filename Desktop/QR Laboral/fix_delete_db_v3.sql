-- Versión 3: Corrigiendo el orden de eliminación por dependencias (Foreign Keys)
DROP FUNCTION IF EXISTS delete_company_rpc(UUID);

CREATE OR REPLACE FUNCTION delete_company_rpc(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Eliminar Registros de Jornada (Suelen depender de Profiles y Company)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_logs') THEN
        DELETE FROM public.work_logs WHERE company_id = p_company_id;
    END IF;

    -- 2. Eliminar Perfiles de Usuario (Profiles)
    -- IMPORTANTE: Los perfiles referencian a 'work_sites', por eso deben borrarse ANTES que los work_sites.
    DELETE FROM public.profiles WHERE company_id = p_company_id;

    -- 3. Ahora sí, eliminar Centros de Trabajo / Work Sites
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_sites') THEN
        DELETE FROM public.work_sites WHERE company_id = p_company_id;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_centers') THEN
        DELETE FROM public.work_centers WHERE company_id = p_company_id;
    END IF;

    -- 4. Finalmente, eliminar la empresa
    DELETE FROM public.companies WHERE id = p_company_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
