-- Cambiar rol de SUPERADMIN a ADMIN (Administrador de Empresa)
UPDATE profiles
SET role = 'ADMIN' 
WHERE email = 'carlosmm89@gmail.com';

-- Si prefieres ser solo empleado básico (sin acceso a gestión), cambia 'ADMIN' por 'EMPLOYEE'
-- UPDATE profiles SET role = 'EMPLOYEE' WHERE email = 'carlosmm89@gmail.com';

-- Verificar el cambio
SELECT id, email, role, company_id 
FROM profiles 
WHERE email = 'carlosmm89@gmail.com';
