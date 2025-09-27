/**
 * Script automático para probar el sistema de tracking de progreso
 * 
 * Para ejecutar:
 * 1. Asegúrate de que el servidor esté corriendo en puerto 3000
 * 2. Asegúrate de tener un plan creado (ID 1)
 * 3. Ejecuta: node test-examples/test-progress-automation.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_PLAN_ID = 1; // Cambia este ID por el de tu plan de prueba

let createdProgressIds = [];

// Función para hacer peticiones HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Función para mostrar resultados
function showResult(testName, response, expectedStatus = 200) {
  console.log(`\n📋 ${testName}`);
  console.log('-'.repeat(60));
  console.log(`📥 Status: ${response.statusCode}`);
  
  if (response.statusCode === expectedStatus) {
    console.log('✅ ÉXITO');
  } else {
    console.log(`❌ ERROR - Esperado: ${expectedStatus}, Recibido: ${response.statusCode}`);
  }
  
  if (response.data && typeof response.data === 'object') {
    console.log('📄 Respuesta:');
    console.log(JSON.stringify(response.data, null, 2));
  }
}

// Obtener fecha en formato YYYY-MM-DD
function getDateString(daysOffset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
}

// Pruebas secuenciales
async function runProgressTests() {
  console.log('🚀 Iniciando pruebas del sistema de tracking de progreso');
  console.log('=' .repeat(80));

  try {
    // 1. Registrar progreso diario - Día completado
    console.log('\n🔄 PASO 1: Registrar progreso diario completado');
    const progressDay1 = await makeRequest('POST', '/plan/progress/daily', {
      planId: TEST_PLAN_ID,
      fecha: getDateString(-2), // Hace 2 días
      capitulosLeidos: [1, 2],
      paginasLeidas: 25,
      tiempoInvertidoMin: 60,
      estadoDia: 'COMPLETADO',
      porcentajeDia: 100.0,
      notasDia: 'Excelente día de lectura. Primeros capítulos muy interesantes.'
    });
    
    showResult('Registrar Progreso Día Completado', progressDay1, 201);

    // 2. Registrar progreso diario - Día parcial
    console.log('\n🔄 PASO 2: Registrar progreso diario parcial');
    const progressDay2 = await makeRequest('POST', '/plan/progress/daily', {
      planId: TEST_PLAN_ID,
      fecha: getDateString(-1), // Ayer
      paginasLeidas: 12,
      tiempoInvertidoMin: 30,
      estadoDia: 'PARCIAL',
      porcentajeDia: 60.0,
      notasDia: 'Solo pude leer la mitad del tiempo planificado.'
    });
    
    showResult('Registrar Progreso Día Parcial', progressDay2, 201);

    // 3. Registrar progreso diario - Hoy
    console.log('\n🔄 PASO 3: Registrar progreso de hoy');
    const progressToday = await makeRequest('POST', '/plan/progress/daily', {
      planId: TEST_PLAN_ID,
      fecha: getDateString(0), // Hoy
      tiempoInvertidoMin: 45,
      estadoDia: 'PENDIENTE',
      porcentajeDia: 0.0,
      notasDia: 'Sesión de preparación y revisión.'
    });
    
    showResult('Registrar Progreso Hoy', progressToday, 201);

    // 4. Obtener historial de progreso
    console.log('\n🔄 PASO 4: Obtener historial de progreso');
    const historyResponse = await makeRequest('GET', `/plan/${TEST_PLAN_ID}/progress/history`);
    showResult('Obtener Historial de Progreso', historyResponse);

    if (historyResponse.statusCode === 200 && historyResponse.data.progreso) {
      console.log(`📊 Total de días registrados: ${historyResponse.data.progreso.length}`);
      console.log(`📊 Estadísticas:`, historyResponse.data.estadisticas);
    }

    // 5. Actualizar progreso específico
    if (historyResponse.statusCode === 200 && historyResponse.data.progreso.length > 0) {
      const firstProgressId = historyResponse.data.progreso[0].id_progreso;
      
      console.log('\n🔄 PASO 5: Actualizar progreso específico');
      const updateResponse = await makeRequest('PUT', `/plan/progress/${firstProgressId}`, {
        tiempoInvertidoMin: 75,
        notasDia: 'Tiempo corregido - incluye tiempo de notas y reflexión.'
      });
      
      showResult('Actualizar Progreso Específico', updateResponse);
    }

    // 6. Marcar capítulos como leídos (necesitamos IDs de detalles reales)
    console.log('\n🔄 PASO 6: Obtener detalles del plan para marcar capítulos');
    const planDetailsResponse = await makeRequest('GET', `/plan/${TEST_PLAN_ID}`);
    
    if (planDetailsResponse.statusCode === 200 && planDetailsResponse.data.detalles) {
      const detalles = planDetailsResponse.data.detalles;
      const unreadDetails = detalles.filter(d => !d.leido).slice(0, 2); // Primeros 2 no leídos
      
      if (unreadDetails.length > 0) {
        console.log('\n🔄 PASO 7: Marcar capítulos como leídos');
        const markResponse = await makeRequest('POST', `/plan/${TEST_PLAN_ID}/chapters/mark-read`, {
          detalleIds: unreadDetails.map(d => d.id_detalle),
          tiempoRealMinutos: 45,
          dificultadPercibida: 2,
          notas: 'Capítulos completados durante las pruebas automáticas.'
        });
        
        showResult('Marcar Capítulos como Leídos', markResponse);
      } else {
        console.log('⚠️  No hay capítulos sin leer disponibles para marcar');
      }
    }

    // 7. Pruebas de validación (errores esperados)
    console.log('\n🔄 PASO 8: Pruebas de validación');
    
    // Fecha futura
    const futureProgressResponse = await makeRequest('POST', '/plan/progress/daily', {
      planId: TEST_PLAN_ID,
      fecha: getDateString(30), // 30 días en el futuro
      paginasLeidas: 10
    });
    showResult('Progreso Fecha Futura (Error Esperado)', futureProgressResponse, 400);

    // Estado completado con porcentaje bajo
    const invalidProgressResponse = await makeRequest('POST', '/plan/progress/daily', {
      planId: TEST_PLAN_ID,
      fecha: getDateString(-3),
      estadoDia: 'COMPLETADO',
      porcentajeDia: 50.0
    });
    showResult('Estado Inconsistente (Error Esperado)', invalidProgressResponse, 400);

    // Plan inexistente
    const invalidPlanResponse = await makeRequest('GET', '/plan/999/progress/history');
    showResult('Plan Inexistente (Error Esperado)', invalidPlanResponse, 404);

    console.log('\n' + '='.repeat(80));
    console.log('🎉 PRUEBAS DE PROGRESO COMPLETADAS');
    console.log('='.repeat(80));
    console.log(`📊 Plan de prueba usado: ${TEST_PLAN_ID}`);
    console.log('💡 Revisa el historial de progreso para ver todos los datos registrados');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error.message);
  }
}

// Verificar servidor y ejecutar
async function main() {
  console.log('🔍 Verificando servidor...');
  
  try {
    await makeRequest('GET', '/');
    console.log('✅ Servidor detectado');
    await runProgressTests();
  } catch (error) {
    console.log('❌ Servidor no disponible en http://localhost:3000');
    console.log('💡 Inicia el servidor con: npm run start:dev');
  }
}

if (require.main === module) {
  main();
}
