# 🧪 Guía de Pruebas para el Endpoint POST /plan/createPlan

## 📋 Preparación

### 1. Verificar Variables de Entorno
Asegúrate de tener configurado en tu `.env`:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/tu_base_datos"
OPEN_IA_TOKEN="tu_token_de_openai_aqui"
```

### 2. Iniciar la Base de Datos
```bash
# Si usas Docker
docker-compose up -d postgres

# O inicia tu instancia de PostgreSQL local
```

### 3. Aplicar Migraciones de Prisma
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Crear Usuarios de Prueba
Ejecuta este SQL en tu base de datos para crear usuarios de prueba:

```sql
-- Insertar usuarios de prueba en el esquema auth
INSERT INTO auth.user (id, name, last_name, email, password_hash, created_at, updated_at) VALUES
(1, 'Juan', 'Pérez', 'juan@test.com', '$2b$10$hash_ejemplo', NOW(), NOW()),
(2, 'María', 'García', 'maria@test.com', '$2b$10$hash_ejemplo', NOW(), NOW()),
(3, 'Carlos', 'López', 'carlos@test.com', '$2b$10$hash_ejemplo', NOW(), NOW()),
(4, 'Ana', 'Martínez', 'ana@test.com', '$2b$10$hash_ejemplo', NOW(), NOW());
```

### 5. Iniciar el Servidor
```bash
npm run start:dev
```

## 🚀 Métodos de Prueba

### Opción 1: Script Automático (Recomendado)
```bash
node test-examples/test-script.js
```

### Opción 2: VS Code REST Client
1. Instala la extensión "REST Client" en VS Code
2. Abre el archivo `test-examples/test-plan-endpoint.http`
3. Haz clic en "Send Request" sobre cada prueba

### Opción 3: Postman/Insomnia
1. Importa los ejemplos del archivo `plan-endpoint-examples.md`
2. Ejecuta las peticiones una por una

### Opción 4: cURL
```bash
# Prueba básica
curl -X POST http://localhost:3000/plan/createPlan \
  -H "Content-Type: application/json" \
  -d '{
    "idUsuario": 1,
    "nivelLectura": "novato",
    "tiempoLecturaDiario": 30,
    "horaioLectura": "2025-01-15T20:00:00Z",
    "fechaFin": "2025-03-15T23:59:59Z",
    "finesSemana": true,
    "tituloLibro": "Cien años de soledad",
    "autorLibro": "Gabriel García Márquez",
    "indiceBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

## 📊 Resultados Esperados

### ✅ Caso Exitoso
```json
{
  "mensaje": "Plan generado exitosamente",
  "plan": {
    "id_plan": 1,
    "id": 1,
    "id_libro": 1,
    "fecha_inicio": "2025-01-15T00:00:00.000Z",
    "fecha_fin": "2025-03-15T00:00:00.000Z",
    "titulo": "Plan de Lectura",
    "estado": "ACTIVO",
    "progreso_porcentaje": 0.0
  },
  "estadisticas": {
    "totalPaginas": 150,
    "diasPlanificados": 60,
    "paginasPorDia": 5,
    "totalCapitulos": 10
  }
}
```

### ❌ Caso con Errores de Validación
```json
{
  "statusCode": 400,
  "message": [
    "El ID del usuario debe ser mayor a 0",
    "Nivel de lectura inválido. Debe ser: novato, intermedio, profesional o experto",
    "El tiempo mínimo de lectura es 5 minutos"
  ],
  "error": "Bad Request"
}
```

## 🔍 Verificación en Base de Datos

Después de una prueba exitosa, verifica que se crearon los registros:

```sql
-- Verificar perfil de lectura
SELECT * FROM books.perfillectura WHERE id = 1;

-- Verificar libro creado
SELECT * FROM books.libro WHERE id = 1;

-- Verificar capítulos
SELECT * FROM books.capitulo WHERE id_libro = 1;

-- Verificar plan de lectura
SELECT * FROM books.planlectura WHERE id = 1;

-- Verificar detalles del plan
SELECT * FROM books.detalleplanlectura WHERE id_plan = 1;
```

## 🐛 Troubleshooting

### Error: "Usuario ya tiene un perfil de lectura"
- Elimina el perfil existente: `DELETE FROM books.perfillectura WHERE id = 1;`

### Error: "Token de OpenAI inválido"
- Verifica que `OPEN_IA_TOKEN` esté configurado correctamente
- Asegúrate de que el token tenga créditos disponibles

### Error: "Base de datos no conecta"
- Verifica que PostgreSQL esté corriendo
- Revisa la cadena de conexión en `DATABASE_URL`

### Error: "OCR no procesa la imagen"
- La imagen Base64 debe ser válida
- Verifica que OpenAI esté respondiendo correctamente

## 📝 Logs Importantes

Revisa estos logs en la consola del servidor:

```
[BooksService] Creando perfil para usuario 1
[BooksRepository] Creando perfil de lectura para usuario 1
[BooksRepository] Perfil de lectura creado exitosamente para usuario 1
[BooksRepository] Creando libro "Cien años de soledad" para usuario 1
[BooksService] Procesando OCR para libro: Cien años de soledad
[BooksService] OCR procesado exitosamente
[PlanService] Iniciando creación de plan para usuario 1
[PlanRepository] Creando plan de lectura para usuario 1, libro 1
[PlanService] Plan creado exitosamente con ID: 1
```

## ✅ Checklist de Pruebas

- [ ] Servidor iniciado correctamente
- [ ] Base de datos conectada
- [ ] Variables de entorno configuradas
- [ ] Usuarios de prueba creados
- [ ] Prueba exitosa con usuario novato
- [ ] Prueba con ajuste automático
- [ ] Prueba de validaciones (errores esperados)
- [ ] Verificación en base de datos
- [ ] Logs sin errores críticos

¡Una vez que todas las pruebas pasen, estaremos listos para continuar con la siguiente fase! 🎉
