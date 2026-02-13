-- Enable pg_cron extension (run this in Supabase SQL Editor if needed, or use Extensions tab)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions to use pg_cron (skipped as Supabase handles this)
-- GRANT USAGE ON SCHEMA cron TO postgres;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create function to check and create automatic clock-ins
CREATE OR REPLACE FUNCTION check_auto_clock_in()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schedule_record RECORD;
  curr_dow INTEGER;
  curr_time_val TIME;
  today_date DATE;
  existing_log_id UUID;
BEGIN
  -- Get current day, time, and date in Europe/Madrid timezone
  curr_dow := EXTRACT(ISODOW FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid'));
  curr_time_val := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::TIME;
  today_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::DATE;

  -- Log execution
  RAISE NOTICE 'Auto clock-in check running at %, Day: %, Time: %', CURRENT_TIMESTAMP, curr_dow, curr_time_val;

  -- Find all schedules that should auto-generate and match current day
  FOR schedule_record IN
    SELECT 
      ws.id,
      ws.user_id,
      ws.start_time,
      ws.end_time,
      u.company_id,
      u.full_name
    FROM work_schedules ws
    INNER JOIN profiles u ON u.id = ws.user_id
    WHERE ws.auto_generate = true
      AND ws.day_of_week = curr_dow
  LOOP
    -- Check if start time matches (within 5-minute window)
    IF ABS(EXTRACT(EPOCH FROM (curr_time_val - schedule_record.start_time::TIME))) <= 300 THEN
      
      -- Check if log already exists for today
      SELECT id INTO existing_log_id
      FROM work_logs
      WHERE user_id = schedule_record.user_id
        AND date = today_date
      LIMIT 1;

      IF existing_log_id IS NULL THEN
        -- Create automatic clock-in
        INSERT INTO work_logs (
          user_id,
          company_id,
          date,
          start_time,
          status,
          total_hours,
          breaks,
          method
        ) VALUES (
          schedule_record.user_id,
          schedule_record.company_id,
          today_date,
          schedule_record.start_time,
          'WORKING',
          0,
          '[]'::jsonb,
          'AUTOMATIC'
        );

        RAISE NOTICE 'Created automatic clock-in for user % (%) at %', 
          schedule_record.full_name, 
          schedule_record.user_id, 
          schedule_record.start_time;
      ELSE
        RAISE NOTICE 'Log already exists for user % on %', 
          schedule_record.user_id, 
          today_date;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Schedule the function to run every 5 minutes
SELECT cron.schedule(
  'auto-clock-in-check',
  '*/5 * * * *',
  'SELECT check_auto_clock_in();'
);

-- Verify the cron job was created
SELECT * FROM cron.job;
