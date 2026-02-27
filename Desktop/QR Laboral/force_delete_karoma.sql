-- Script de limpieza profunda para eliminar cualquier rastro de la empresa "Karoma"
-- que esté oculta o persistente en la base de datos.

DO $$
DECLARE
    v_company_id UUID;
BEGIN
    -- 1. Buscar la ID de la empresa conflictiva por su código
    SELECT id INTO v_company_id FROM public.companies WHERE code ILIKE 'Karoma' LIMIT 1;

    IF v_company_id IS NOT NULL THEN
        RAISE NOTICE 'Encontrada empresa Karoma con ID: %', v_company_id;

        -- 2. Eliminar Registros de Jornada (Logs)
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_logs') THEN
            DELETE FROM public.work_logs WHERE company_id = v_company_id;
        END IF;

        -- 3. Eliminar Perfiles (Profiles) - CRÍTICO hacerlo antes de los centros
        DELETE FROM public.profiles WHERE company_id = v_company_id;

        -- 4. Eliminar Centros (Work Sites / Centers) usando SQL Dinámico seguro
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_sites') THEN
            EXECUTE 'DELETE FROM public.work_sites WHERE company_id = $1' USING v_company_id;
        END IF;

        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_centers') THEN
            -- Intentar borrar solo si existe la columna, o forzar si la tabla está sucia
            BEGIN
                EXECUTE 'DELETE FROM public.work_centers WHERE company_id = $1' USING v_company_id;
            EXCEPTION WHEN OTHERS THEN
                NULL; -- Ignorar si falla por falta de columna, no es crítico para borrar la empresa
            END;
        END IF;

        -- 5. Eliminar finalmente la empresa
        DELETE FROM public.companies WHERE id = v_company_id;
        
        RAISE NOTICE '✅ Empresa Karoma eliminada correctamente.';
    ELSE
        RAISE NOTICE 'ℹ️ No se encontró ninguna empresa con el código Karoma en la tabla companies.';
    END IF;

END $$;
