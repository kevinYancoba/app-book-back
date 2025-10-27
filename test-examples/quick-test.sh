#!/bin/bash

# Script de prueba rápida para el endpoint POST /plan/createPlan
# Asegúrate de que el servidor esté corriendo en puerto 3000

echo "🚀 Probando endpoint POST /plan/createPlan"
echo "============================================"

# URL del endpoint
URL="http://localhost:3000/plan/createPlan"

# Verificar si el servidor está corriendo
echo "🔍 Verificando si el servidor está corriendo..."
if curl -s --connect-timeout 5 http://localhost:3000 > /dev/null; then
    echo "✅ Servidor detectado en puerto 3000"
else
    echo "❌ Servidor no está corriendo en puerto 3000"
    echo "💡 Inicia el servidor con: npm run start:dev"
    exit 1
fi

echo ""
echo "📤 Enviando petición de prueba..."
echo "================================="

# Petición de prueba
curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "idUsuario": 48,
    "nivelLectura": "novato",
    "tiempoLecturaDiario": 30,
    "horaioLectura": "2025-01-15T20:00:00Z",
    "fechaFin": "2025-03-15T23:59:59Z",
    "finesSemana": true,
    "tituloLibro": "Cien años de soledad",
    "autorLibro": "Gabriel García Márquez",
    "indiceBase64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }' \
  -w "\n\n📊 Status Code: %{http_code}\n⏱️  Tiempo de respuesta: %{time_total}s\n" \
  -s

echo ""
echo "✅ Prueba completada"
echo ""
echo "💡 Consejos:"
echo "   - Si obtienes error 400, revisa las validaciones"
echo "   - Si obtienes error 500, revisa los logs del servidor"
echo "   - Si obtienes error de conexión, verifica que el servidor esté corriendo"
echo "   - Asegúrate de que el usuario ID 48 exista en la base de datos"
echo ""
echo "🔍 Para ver los logs del servidor, revisa la consola donde ejecutaste 'npm run start:dev'"
