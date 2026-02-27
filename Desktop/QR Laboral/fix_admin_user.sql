-- Force update the admin user based on email
-- This fixes the issue if the user exists but has empty name/wrong PIN
INSERT INTO public.users (email, name, role, department, pin)
VALUES ('superadmin@qrlaboral.com', 'Administrador', 'admin', 'Dirección', '1234')
ON CONFLICT (email) 
DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  pin = EXCLUDED.pin;
