-- Forzar cambio a rol EMPLEADO para ver la interfaz de fichaje
UPDATE profiles
SET role = 'EMPLOYEE'
WHERE email = 'carlosmm89@gmail.com';

-- Verificar el cambio (debe salir 'EMPLOYEE')
SELECT id, email, role FROM profiles WHERE email = 'carlosmm89@gmail.com';
