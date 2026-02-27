-- Versión 4: Manejo Robusto de Columnas inexistentes con SQL Dinámico
DROP FUNCTION IF EXISTS delete_company_rpc(UUID);

CREATE OR REPLACE FUNCTION delete_company_rpc(p_company_id UUID)
RETURNS VOID AS $$
DECLARE
    v_has_col BOOLEAN;
BEGIN
    -- 1. Eliminar Registros de Jornada (Work Logs)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_logs') THEN
        DELETE FROM public.work_logs WHERE company_id = p_company_id;
    END IF;

    -- 2. Eliminar Perfiles (Profiles) - Antes que los centros para liberar la FK
    DELETE FROM public.profiles WHERE company_id = p_company_id;

    -- 3. Eliminar Centros de Trabajo (Solo si tienen la columna company_id)
    
    -- Chequeo para WORK_SITES
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_sites') THEN
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_sites' AND column_name='company_id') INTO v_has_col;
        
        IF v_has_col THEN
            EXECUTE 'DELETE FROM public.work_sites WHERE company_id = $1' USING p_company_id;
        END IF;
    END IF;

    -- Chequeo para WORK_CENTERS (La tabla problemática que a veces no tiene company_id)
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_centers') THEN
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_centers' AND column_name='company_id') INTO v_has_col;
        
        IF v_has_col THEN
            EXECUTE 'DELETE FROM public.work_centers WHERE company_id = $1' USING p_company_id;
        END IF;
    END IF;

    -- 4. Finalmente, eliminar la empresa
    DELETE FROM public.companies WHERE id = p_company_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
