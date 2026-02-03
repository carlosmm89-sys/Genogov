-- Recreate delete_company_rpc to handle cascading deletes properly
-- specifically targeting the 'work_sites' table which caused the foreign key error.

CREATE OR REPLACE FUNCTION delete_company_rpc(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    -- 1. Delete Work Sites / Centers
    -- Trying both potential table names to be safe. 
    -- If table doesn't exist, it will just throw an error if we don't catch it, 
    -- but usually widely known tables in this project are these.
    -- We use a precise deletion based on the error message: "work_sites"
    
    -- Check if table exists before deleting to avoid errors if schema drift occurred
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_sites') THEN
        DELETE FROM public.work_sites WHERE company_id = p_company_id;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_centers') THEN
        DELETE FROM public.work_centers WHERE company_id = p_company_id;
    END IF;

    -- 2. Delete Work Logs
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'work_logs') THEN
        DELETE FROM public.work_logs WHERE company_id = p_company_id;
    END IF;

    -- 3. Delete Profiles & Users
    -- This is critical. If we delete the profile, we should ideally handle the auth user too.
    -- However, we cannot delete from auth.users easily from here without special permissions or triggers.
    -- For now, we clear the profiles so the app user is "gone" from the system perspective.
    DELETE FROM public.profiles WHERE company_id = p_company_id;

    -- 4. Delete Company
    DELETE FROM public.companies WHERE id = p_company_id;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
