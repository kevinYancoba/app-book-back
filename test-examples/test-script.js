/**
 * Script de prueba para el endpoint POST /plan/createPlan
 * 
 * Para ejecutar:
 * 1. Asegúrate de que el servidor esté corriendo en puerto 3000
 * 2. Ejecuta: node test-examples/test-script.js
 */

const https = require('http');

const BASE_URL = 'http://localhost:3000';

// Imagen Base64 de 1x1 pixel para pruebas
const TEST_IMAGE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Casos de prueba
const testCases = [
  {
    name: '✅ Caso 1: Usuario Novato - Éxito esperado',
    data: {
      idUsuario: 48, // Cambiado para evitar conflictos
      nivelLectura: 'novato',
      tiempoLecturaDiario: 30,
      horaioLectura: '2025-01-15T20:00:00Z',
      fechaFin: '2025-03-15T23:59:59Z',
      finesSemana: true,
      tituloLibro: 'Cien años de soledad',
      autorLibro: 'Gabriel García Márquez',
      indiceBase64: TEST_IMAGE_BASE64
    },
    expectedStatus: 201
  },
  {
    name: '✅ Caso 2: Usuario Intermedio - Con ajuste automático',
    data: {
      idUsuario: 49, // Cambiado para evitar conflictos
      nivelLectura: 'intermedio',
      tiempoLecturaDiario: 45,
      horaioLectura: '2025-01-15T19:00:00Z',
      fechaFin: '2025-02-01T23:59:59Z',
      finesSemana: false,
      tituloLibro: 'Don Quijote de la Mancha',
      autorLibro: 'Miguel de Cervantes',
      indiceBase64: TEST_IMAGE_BASE64
    },
    expectedStatus: 201
  },
  {
    name: '❌ Caso 3: Datos inválidos - Error esperado',
    data: {
      idUsuario: 0,
      nivelLectura: 'super_experto',
      tiempoLecturaDiario: -10,
      horaioLectura: 'fecha_invalida',
      fechaFin: '2024-01-01T00:00:00Z',
      finesSemana: 'maybe',
      tituloLibro: '',
      autorLibro: '',
      indiceBase64: 'texto_no_base64'
    },
    expectedStatus: 400
  }
];

// Función para hacer peticiones HTTP
function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/plan/createPlan',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
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

    req.write(postData);
    req.end();
  });
}

// Función principal de pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas del endpoint POST /plan/createPlan\n');
  console.log('📍 URL Base:', BASE_URL);
  console.log('⏰ Fecha actual:', new Date().toISOString());
  console.log('=' .repeat(80));

  let passedTests = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n${i + 1}. ${testCase.name}`);
    console.log('-'.repeat(60));

    try {
      console.log('📤 Enviando petición...');
      const response = await makeRequest(testCase.data);
      
      console.log(`📥 Status Code: ${response.statusCode}`);
      console.log('📄 Respuesta:');
      console.log(JSON.stringify(response.data, null, 2));

      // Verificar si el status code es el esperado
      if (response.statusCode === testCase.expectedStatus) {
        console.log('✅ PRUEBA PASADA');
        passedTests++;
      } else {
        console.log(`❌ PRUEBA FALLIDA - Esperado: ${testCase.expectedStatus}, Recibido: ${response.statusCode}`);
      }

    } catch (error) {
      console.log('❌ ERROR EN LA PETICIÓN:', error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(80));
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`❌ Pruebas fallidas: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
  } else {
    console.log('\n⚠️  Algunas pruebas fallaron. Revisa los logs del servidor.');
  }
}

// Verificar si el servidor está corriendo
function checkServer() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      resolve(false);
    });

    req.end();
  });
}

// Ejecutar pruebas
async function main() {
  console.log('🔍 Verificando si el servidor está corriendo...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ El servidor no está corriendo en http://localhost:3000');
    console.log('💡 Inicia el servidor con: npm run start:dev');
    process.exit(1);
  }
  
  console.log('✅ Servidor detectado, iniciando pruebas...\n');
  await runTests();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests, makeRequest };
