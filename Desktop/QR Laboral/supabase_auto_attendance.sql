-- UNIFIED AUTO CLOCK-IN & CLOCK-OUT SCRIPT (V2 - SPLIT SHIFT SUPPORT)
-- Run this in Supabase SQL Editor to enable full automatic attendance

-- 1. Enable pg_cron if not enabled (Supabase UI preferred)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Function for Auto Clock-IN (Enhanced for Split Shifts)
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
  -- Get current day, time, and date in Europe/Madrid
  curr_dow := EXTRACT(ISODOW FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid'));
  curr_time_val := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::TIME;
  today_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::DATE;

  RAISE NOTICE 'Clock-IN Check at %, Day: %', CURRENT_TIMESTAMP, curr_dow;

  FOR schedule_record IN
    SELECT 
      ws.id AS schedule_id, ws.user_id, ws.start_time, ws.end_time,
      p.company_id, p.full_name
    FROM work_schedules ws
    INNER JOIN profiles p ON p.id = ws.user_id
    WHERE ws.auto_generate = true
      AND ws.day_of_week = curr_dow
  LOOP
    -- Check if start time matches (within 5-minute window)
    -- We use a window of +/- 5 minutes (300 seconds)
    IF ABS(EXTRACT(EPOCH FROM (curr_time_val - schedule_record.start_time::TIME))) <= 300 THEN
      
      -- CHECK SPECIFICALLY for a log that matches THIS schedule's start time
      -- This allows multiple logs per day (Morning & Afternoon)
      SELECT id INTO existing_log_id
      FROM work_logs
      WHERE user_id = schedule_record.user_id
        AND date = today_date
        -- Match start time with a small tolerance (e.g. 1 minute) to avoid duplicates
        AND ABS(EXTRACT(EPOCH FROM (start_time - schedule_record.start_time::TIME))) <= 60
      LIMIT 1;

      IF existing_log_id IS NULL THEN
        INSERT INTO work_logs (
          user_id, company_id, date, start_time,
          status, total_hours, breaks, method
        ) VALUES (
          schedule_record.user_id, schedule_record.company_id, today_date,
          schedule_record.start_time, 'WORKING', 0, '[]'::jsonb, 'AUTOMATIC'
        );
        RAISE NOTICE 'Clocked IN: % (Time: %)', schedule_record.full_name, schedule_record.start_time;
      ELSE
        RAISE NOTICE 'Skipping % (Log already exists for time %)', schedule_record.full_name, schedule_record.start_time;
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- 3. Function for Auto Clock-OUT (Enhanced for Split Shifts)
CREATE OR REPLACE FUNCTION check_auto_clock_out()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_record RECORD;
  curr_dow INTEGER;
  curr_time_val TIME;
  today_date DATE;
  sched_end_time TIME;
  total_hrs NUMERIC;
BEGIN
  -- Get current day, time, and date in Europe/Madrid
  curr_dow := EXTRACT(ISODOW FROM (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid'));
  curr_time_val := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::TIME;
  today_date := (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::DATE;

  RAISE NOTICE 'Clock-OUT Check at %', CURRENT_TIMESTAMP;

  -- Find open logs that should be closed
  FOR log_record IN
    SELECT 
      l.id, l.user_id, l.start_time,
      ws.end_time AS schedule_end_time,
      p.full_name
    FROM work_logs l
    INNER JOIN profiles p ON p.id = l.user_id
    INNER JOIN work_schedules ws ON ws.user_id = l.user_id
    WHERE l.date = today_date
      AND l.status = 'WORKING' -- Only active logs
      AND ws.day_of_week = curr_dow
      AND ws.auto_generate = true
      -- CRITICAL FIX: Match the Log's start time to the Schedule's start time
      -- This ensures we close the CORRECT shift (Morning vs Afternoon)
      -- Allow 1 min tolerance for floating point matching
      AND ABS(EXTRACT(EPOCH FROM (ws.start_time::TIME - l.start_time::TIME))) <= 60
  LOOP
    sched_end_time := log_record.schedule_end_time::TIME;

    -- Check if current time is PAST the scheduled end time
    -- Using >= covers cases where cron runs after sched_end_time
    IF curr_time_val >= sched_end_time THEN
      
      -- Calculate total hours
      total_hrs := EXTRACT(EPOCH FROM (sched_end_time - log_record.start_time::TIME)) / 3600;

      -- Update the log to complete it
      UPDATE work_logs
      SET 
        end_time = log_record.schedule_end_time,
        status = 'FINISHED',
        total_hours = ROUND(total_hrs::numeric, 2)
      WHERE id = log_record.id;

      RAISE NOTICE 'Clocked OUT: % at % (Total: %h)', 
        log_record.full_name, log_record.schedule_end_time, ROUND(total_hrs::numeric, 2);
    END IF;
  END LOOP;
END;
$$;

-- 4. Schedule Unified Cron Job
-- Runs every 5 minutes and calls both functions
SELECT cron.schedule(
  'auto-attendance-check', -- Name of the job
  '*/5 * * * *',           -- Every 5 minutes
  'SELECT check_auto_clock_in(); SELECT check_auto_clock_out();'
);
