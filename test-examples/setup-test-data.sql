-- Script para preparar datos de prueba
-- Ejecutar antes de probar el endpoint

-- 1. Limpiar datos existentes (opcional)
-- CUIDADO: Esto eliminará todos los datos de prueba
/*
DELETE FROM books.detalleplanlectura WHERE id_plan IN (SELECT id_plan FROM books.planlectura WHERE id IN (48, 49, 50, 51));
DELETE FROM books.progresolectura WHERE id_plan IN (SELECT id_plan FROM books.planlectura WHERE id IN (48, 49, 50, 51));
DELETE FROM books.planlectura WHERE id IN (48, 49, 50, 51);
DELETE FROM books.capitulo WHERE id_libro IN (SELECT id_libro FROM books.libro WHERE id IN (48, 49, 50, 51));
DELETE FROM books.libro WHERE id IN (48, 49, 50, 51);
DELETE FROM books.perfillectura WHERE id IN (48, 49, 50, 51);
DELETE FROM auth.user WHERE id IN (48, 49, 50, 51);
*/

-- 2. Crear usuarios de prueba
INSERT INTO auth.user (id, name, last_name, email, password_hash, created_at, updated_at) VALUES
(48, 'Juan', 'Pérez', 'juan.test@example.com', '$2b$10$example.hash.for.testing.purposes.only', NOW(), NOW()),
(49, 'María', 'García', 'maria.test@example.com', '$2b$10$example.hash.for.testing.purposes.only', NOW(), NOW()),
(50, 'Carlos', 'López', 'carlos.test@example.com', '$2b$10$example.hash.for.testing.purposes.only', NOW(), NOW()),
(51, 'Ana', 'Martínez', 'ana.test@example.com', '$2b$10$example.hash.for.testing.purposes.only', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar que los usuarios se crearon correctamente
SELECT id, name, last_name, email, created_at 
FROM auth.user 
WHERE id IN (48, 49, 50, 51)
ORDER BY id;

-- 4. Verificar que no tienen perfiles de lectura existentes
SELECT id 
FROM books.perfillectura 
WHERE id IN (48, 49, 50, 51);

-- Si la consulta anterior devuelve resultados, ejecutar:
-- DELETE FROM books.perfillectura WHERE id IN (48, 49, 50, 51);

-- 5. Verificar estructura de la tabla perfillectura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'books' 
  AND table_name = 'perfillectura'
ORDER BY ordinal_position;

-- 6. Verificar enums disponibles
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'PlanStatus'
);

SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid 
  FROM pg_type 
  WHERE typname = 'DayStatus'
);

-- Notas importantes:
-- - Los IDs 48-51 son para evitar conflictos con datos existentes
-- - El campo nivel_lectura en perfillectura debe ser INT (5=novato, 10=intermedio, 15=profesional, 20=experto)
-- - Asegúrate de que el token de OpenAI esté configurado en las variables de entorno
-- - La imagen Base64 en los ejemplos es una imagen de 1x1 pixel válida para pruebas
