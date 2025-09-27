# 📋 Ejemplos de Prueba para el Endpoint POST /plan/createPlan

## 🎯 Endpoint
```
POST http://localhost:3000/plan/createPlan
Content-Type: application/json
```

## ✅ Ejemplo 1: Caso Exitoso - Usuario Novato

```json
{
  "idUsuario": 1,
  "nivelLectura": "novato",
  "tiempoLecturaDiario": 30,
  "horaioLectura": "2025-01-15T20:00:00Z",
  "fechaFin": "2025-03-15T23:59:59Z",
  "finesSemana": true,
  "tituloLibro": "Cien años de soledad",
  "autorLibro": "Gabriel García Márquez",
  "indiceBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

**Respuesta Esperada:**
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

## ✅ Ejemplo 2: Caso con Ajuste Automático - Usuario Intermedio

```json
{
  "idUsuario": 2,
  "nivelLectura": "intermedio",
  "tiempoLecturaDiario": 45,
  "horaioLectura": "2025-01-15T19:00:00Z",
  "fechaFin": "2025-02-01T23:59:59Z",
  "finesSemana": false,
  "tituloLibro": "Don Quijote de la Mancha",
  "autorLibro": "Miguel de Cervantes",
  "indiceBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

**Respuesta Esperada (Plan Ajustado):**
```json
{
  "mensaje": "Plan ajustado automáticamente (de 17 a 50 días)",
  "plan": {
    "id_plan": 2,
    "id": 2,
    "id_libro": 2,
    "fecha_inicio": "2025-01-15T00:00:00.000Z",
    "fecha_fin": "2025-03-06T00:00:00.000Z",
    "titulo": "Plan de Lectura",
    "estado": "ACTIVO",
    "progreso_porcentaje": 0.0
  },
  "estadisticas": {
    "totalPaginas": 500,
    "diasPlanificados": 50,
    "paginasPorDia": 10,
    "totalCapitulos": 25
  }
}
```

## ❌ Ejemplo 3: Error de Validación - Datos Inválidos

```json
{
  "idUsuario": 0,
  "nivelLectura": "super_experto",
  "tiempoLecturaDiario": -10,
  "horaioLectura": "fecha_invalida",
  "fechaFin": "2024-01-01T00:00:00Z",
  "finesSemana": "maybe",
  "tituloLibro": "",
  "autorLibro": "",
  "indiceBase64": "texto_no_base64"
}
```

**Respuesta Esperada (Error 400):**
```json
{
  "statusCode": 400,
  "message": [
    "El ID del usuario debe ser mayor a 0",
    "Nivel de lectura inválido. Debe ser: novato, intermedio, profesional o experto",
    "El tiempo mínimo de lectura es 5 minutos",
    "El horario de lectura debe ser una fecha válida",
    "La fecha de finalización debe ser posterior a la fecha actual",
    "La preferencia de fines de semana debe ser verdadero o falso",
    "El título del libro es requerido",
    "El autor del libro es requerido",
    "La imagen debe estar en formato Base64 válido"
  ],
  "error": "Bad Request"
}
```

## 🧪 Ejemplo 4: Imagen Base64 Real para Pruebas

Para pruebas más realistas, aquí tienes una imagen Base64 pequeña de 1x1 pixel:

```json
{
  "idUsuario": 3,
  "nivelLectura": "profesional",
  "tiempoLecturaDiario": 60,
  "horaioLectura": "2025-01-15T18:00:00Z",
  "fechaFin": "2025-04-15T23:59:59Z",
  "finesSemana": true,
  "tituloLibro": "El Principito",
  "autorLibro": "Antoine de Saint-Exupéry",
  "indiceBase64": "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA=="
}
```

## 🔧 Comandos de Prueba con cURL

### Caso Exitoso:
```bash
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

### Caso con Error:
```bash
curl -X POST http://localhost:3000/plan/createPlan \
  -H "Content-Type: application/json" \
  -d '{
    "idUsuario": 0,
    "nivelLectura": "invalido",
    "tiempoLecturaDiario": -10,
    "tituloLibro": "",
    "autorLibro": ""
  }'
```

## 📝 Notas Importantes

1. **Base64**: La imagen debe ser una imagen real en Base64. Los ejemplos usan una imagen de 1x1 pixel para pruebas.

2. **Fechas**: Asegúrate de que `fechaFin` sea posterior a la fecha actual.

3. **Usuario**: El `idUsuario` debe existir en la base de datos y no tener ya un perfil de lectura.

4. **OpenAI**: Necesitas tener configurado el token de OpenAI en las variables de entorno.

5. **Base de Datos**: Asegúrate de que la base de datos esté corriendo y las migraciones aplicadas.

## 🚀 Pasos para Probar

1. Inicia el servidor: `npm run start:dev`
2. Usa Postman, Insomnia o cURL para hacer las peticiones
3. Verifica los logs en la consola para debugging
4. Revisa la base de datos para confirmar que se crearon los registros

## 🔍 Debugging

Si hay errores, revisa:
- Logs del servidor en la consola
- Estado de la base de datos
- Configuración de variables de entorno
- Token de OpenAI válido
