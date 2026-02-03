-- Eliminar el usuario "fantasma" que quedó en el sistema de autenticación
-- al borrar la empresa, para que puedas volver a registrarlo.

DELETE FROM auth.users WHERE email = 'info@clinicakaroma.com';
