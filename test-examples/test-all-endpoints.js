/**
 * Script completo de prueba para todos los endpoints de planes
 * 
 * Para ejecutar:
 * 1. Asegúrate de que el servidor esté corriendo en puerto 3000
 * 2. Ejecuta: node test-examples/test-all-endpoints.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 48;
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

let createdPlanId = null;

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
  
  if (response.data) {
    console.log('📄 Respuesta:');
    console.log(JSON.stringify(response.data, null, 2));
  }
}

// Pruebas secuenciales
async function runTests() {
  console.log('🚀 Iniciando pruebas completas de endpoints de planes');
  console.log('=' .repeat(80));

  try {
    // 1. Crear un plan
    console.log('\n🔄 PASO 1: Crear plan de lectura');
    const createResponse = await makeRequest('POST', '/plan/createPlan', {
      idUsuario: TEST_USER_ID,
      nivelLectura: 'novato',
      tiempoLecturaDiario: 30,
      horaioLectura: '2025-01-15T20:00:00Z',
      fechaFin: '2025-03-15T23:59:59Z',
      finesSemana: true,
      tituloLibro: 'Libro de Prueba',
      autorLibro: 'Autor de Prueba',
      indiceBase64: TEST_IMAGE_BASE64
    });
    
    showResult('Crear Plan', createResponse, 201);
    
    if (createResponse.statusCode === 201 && createResponse.data.plan) {
      createdPlanId = createResponse.data.plan.id_plan;
      console.log(`✅ Plan creado con ID: ${createdPlanId}`);
    } else {
      console.log('❌ No se pudo crear el plan. Terminando pruebas.');
      return;
    }

    // 2. Obtener planes del usuario
    console.log('\n🔄 PASO 2: Obtener planes del usuario');
    const userPlansResponse = await makeRequest('GET', `/plan/user/${TEST_USER_ID}`);
    showResult('Obtener Planes del Usuario', userPlansResponse);

    // 3. Obtener detalles del plan
    console.log('\n🔄 PASO 3: Obtener detalles del plan');
    const planDetailsResponse = await makeRequest('GET', `/plan/${createdPlanId}`);
    showResult('Obtener Detalles del Plan', planDetailsResponse);

    // 4. Actualizar el plan
    console.log('\n🔄 PASO 4: Actualizar plan');
    const updateResponse = await makeRequest('PUT', `/plan/${createdPlanId}`, {
      titulo: 'Plan Actualizado',
      descripcion: 'Descripción actualizada del plan',
      paginasPorDia: 8,
      tiempoEstimadoDia: 45
    });
    showResult('Actualizar Plan', updateResponse);

    // 5. Cambiar estado a PAUSADO
    console.log('\n🔄 PASO 5: Pausar plan');
    const pauseResponse = await makeRequest('PATCH', `/plan/${createdPlanId}/status`, {
      estado: 'PAUSADO'
    });
    showResult('Pausar Plan', pauseResponse);

    // 6. Cambiar estado a ACTIVO
    console.log('\n🔄 PASO 6: Reactivar plan');
    const activateResponse = await makeRequest('PATCH', `/plan/${createdPlanId}/status`, {
      estado: 'ACTIVO'
    });
    showResult('Reactivar Plan', activateResponse);

    // 7. Pruebas de validación (errores esperados)
    console.log('\n🔄 PASO 7: Pruebas de validación');
    
    // Plan inexistente
    const notFoundResponse = await makeRequest('GET', '/plan/999999');
    showResult('Plan Inexistente (Error Esperado)', notFoundResponse, 404);

    // Datos inválidos
    const invalidUpdateResponse = await makeRequest('PUT', `/plan/${createdPlanId}`, {
      titulo: '',
      paginasPorDia: -5
    });
    showResult('Actualización Inválida (Error Esperado)', invalidUpdateResponse, 400);

    // Estado inválido
    const invalidStatusResponse = await makeRequest('PATCH', `/plan/${createdPlanId}/status`, {
      estado: 'ESTADO_INVALIDO'
    });
    showResult('Estado Inválido (Error Esperado)', invalidStatusResponse, 400);

    // 8. Eliminar plan (opcional)
    console.log('\n🔄 PASO 8: Eliminar plan (opcional)');
    console.log('⚠️  Comentado para preservar datos de prueba');
    /*
    const deleteResponse = await makeRequest('DELETE', `/plan/${createdPlanId}`);
    showResult('Eliminar Plan', deleteResponse);
    */

    console.log('\n' + '='.repeat(80));
    console.log('🎉 PRUEBAS COMPLETADAS');
    console.log('='.repeat(80));
    console.log(`📊 Plan de prueba creado con ID: ${createdPlanId}`);
    console.log('💡 Puedes usar este ID para pruebas adicionales');

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
    await runTests();
  } catch (error) {
    console.log('❌ Servidor no disponible en http://localhost:3000');
    console.log('💡 Inicia el servidor con: npm run start:dev');
  }
}

if (require.main === module) {
  main();
}
