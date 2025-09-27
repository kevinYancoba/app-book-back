/**
 * Script automático para probar el Dashboard de Progreso
 * 
 * Para ejecutar:
 * 1. Asegúrate de que el servidor esté corriendo en puerto 3000
 * 2. Asegúrate de tener datos de progreso para el usuario
 * 3. Ejecuta: node test-examples/test-dashboard-automation.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = 48; // Cambia este ID por el de tu usuario de prueba

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
  console.log(`\n📊 ${testName}`);
  console.log('-'.repeat(70));
  console.log(`📥 Status: ${response.statusCode}`);
  
  if (response.statusCode === expectedStatus) {
    console.log('✅ ÉXITO');
  } else {
    console.log(`❌ ERROR - Esperado: ${expectedStatus}, Recibido: ${response.statusCode}`);
  }
  
  if (response.data && typeof response.data === 'object') {
    // Mostrar solo un resumen de los datos más importantes
    if (response.data.metricas) {
      console.log('📈 Métricas principales:');
      console.log(`   - Páginas leídas: ${response.data.metricas.metricas?.totalPaginasLeidas || 'N/A'}`);
      console.log(`   - Tiempo invertido: ${response.data.metricas.metricas?.totalTiempoInvertido || 'N/A'} min`);
      console.log(`   - Velocidad promedio: ${response.data.metricas.metricas?.velocidadLecturaPromedio || 'N/A'} pág/h`);
    }
    
    if (response.data.alertasRecomendaciones) {
      const alertas = response.data.alertasRecomendaciones.alertas || [];
      const recomendaciones = response.data.alertasRecomendaciones.recomendaciones || [];
      const logros = response.data.alertasRecomendaciones.logros || [];
      
      console.log(`🚨 Alertas: ${alertas.length}`);
      console.log(`💡 Recomendaciones: ${recomendaciones.length}`);
      console.log(`🏆 Logros: ${logros.length}`);
    }
    
    if (response.data.planesActivos) {
      console.log(`📚 Planes activos: ${response.data.planesActivos.length}`);
    }
  }
}

// Función para mostrar resumen de métricas
function showMetricsSummary(data) {
  if (!data) return;
  
  console.log('\n📊 RESUMEN DE MÉTRICAS:');
  console.log('='.repeat(50));
  
  if (data.metricas?.metricas) {
    const m = data.metricas.metricas;
    console.log(`📖 Total páginas leídas: ${m.totalPaginasLeidas || 0}`);
    console.log(`⏱️  Total tiempo invertido: ${m.totalTiempoInvertido || 0} minutos`);
    console.log(`📈 Velocidad promedio: ${(m.velocidadLecturaPromedio || 0).toFixed(1)} páginas/hora`);
    console.log(`📚 Libros completados: ${m.totalLibrosLeidos || 0}`);
    console.log(`🎯 Planes activos: ${m.planesActivos || 0}`);
  }
  
  if (data.rendimiento?.consistencia) {
    const c = data.rendimiento.consistencia;
    console.log(`🔥 Racha actual: ${c.rachaActual || 0} días`);
    console.log(`🏅 Mejor racha: ${c.mejorRacha || 0} días`);
    console.log(`📊 Consistencia: ${(c.porcentajeConsistencia || 0).toFixed(1)}%`);
  }
}

// Pruebas secuenciales
async function runDashboardTests() {
  console.log('🚀 Iniciando pruebas del Dashboard de Progreso');
  console.log('=' .repeat(80));

  try {
    // 1. Dashboard rápido
    console.log('\n🔄 PASO 1: Dashboard rápido diario');
    const quickDashboard = await makeRequest('GET', `/reports/dashboard/quick/${TEST_USER_ID}`);
    showResult('Dashboard Rápido', quickDashboard);
    
    if (quickDashboard.statusCode === 200) {
      console.log('📋 Tareas de hoy:', quickDashboard.data.tareasHoy?.length || 0);
      console.log('⚠️  Alertas:', quickDashboard.data.alertas?.length || 0);
    }

    // 2. Dashboard completo - Semanal
    console.log('\n🔄 PASO 2: Dashboard completo semanal');
    const weeklyDashboard = await makeRequest('GET', `/reports/dashboard/complete?userId=${TEST_USER_ID}&period=WEEK`);
    showResult('Dashboard Semanal', weeklyDashboard);
    
    if (weeklyDashboard.statusCode === 200) {
      showMetricsSummary(weeklyDashboard.data);
    }

    // 3. Dashboard completo - Mensual
    console.log('\n🔄 PASO 3: Dashboard completo mensual');
    const monthlyDashboard = await makeRequest('GET', `/reports/dashboard/complete?userId=${TEST_USER_ID}&period=MONTH`);
    showResult('Dashboard Mensual', monthlyDashboard);

    // 4. Análisis de tendencias
    console.log('\n🔄 PASO 4: Análisis de tendencias');
    const trendsAnalysis = await makeRequest('GET', `/reports/analytics/trends/${TEST_USER_ID}?period=WEEK`);
    showResult('Análisis de Tendencias', trendsAnalysis);
    
    if (trendsAnalysis.statusCode === 200 && trendsAnalysis.data.tendencias) {
      const t = trendsAnalysis.data.tendencias;
      console.log(`📈 Datos de tendencia: ${t.tendenciaDiaria?.length || 0} días`);
      if (t.patronesSemana) {
        console.log(`🗓️  Mejor día: ${t.patronesSemana.mejorDiaSemana}`);
        console.log(`📉 Peor día: ${t.patronesSemana.peorDiaSemana}`);
      }
    }

    // 5. Análisis de rendimiento
    console.log('\n🔄 PASO 5: Análisis de rendimiento');
    const performanceAnalysis = await makeRequest('GET', `/reports/analytics/performance/${TEST_USER_ID}?period=WEEK`);
    showResult('Análisis de Rendimiento', performanceAnalysis);

    // 6. Alertas y recomendaciones
    console.log('\n🔄 PASO 6: Alertas y recomendaciones');
    const alertsResponse = await makeRequest('GET', `/reports/alerts/${TEST_USER_ID}`);
    showResult('Alertas y Recomendaciones', alertsResponse);
    
    if (alertsResponse.statusCode === 200) {
      const alerts = alertsResponse.data;
      console.log(`🚨 Total alertas: ${alerts.alertas?.length || 0}`);
      console.log(`💡 Total recomendaciones: ${alerts.recomendaciones?.length || 0}`);
      console.log(`🏆 Total logros: ${alerts.logros?.length || 0}`);
      
      // Mostrar alertas importantes
      if (alerts.alertas && alerts.alertas.length > 0) {
        console.log('\n🚨 Alertas importantes:');
        alerts.alertas.slice(0, 3).forEach((alert, index) => {
          console.log(`   ${index + 1}. [${alert.severidad}] ${alert.mensaje}`);
        });
      }
    }

    // 7. Resumen ejecutivo
    console.log('\n🔄 PASO 7: Resumen ejecutivo');
    const executiveSummary = await makeRequest('GET', `/reports/summary/${TEST_USER_ID}`);
    showResult('Resumen Ejecutivo', executiveSummary);
    
    if (executiveSummary.statusCode === 200) {
      const summary = executiveSummary.data;
      console.log('\n📋 RESUMEN EJECUTIVO:');
      console.log(`📅 Hoy: ${summary.resumenDiario?.paginasLeidasHoy || 0} páginas`);
      console.log(`📊 Semana: ${summary.resumenSemanal?.paginasTotales || 0} páginas totales`);
      console.log(`🎯 Consistencia semanal: ${(summary.resumenSemanal?.consistencia || 0).toFixed(1)}%`);
    }

    // 8. Pruebas de validación (errores esperados)
    console.log('\n🔄 PASO 8: Pruebas de validación');
    
    // Usuario inexistente
    const invalidUserResponse = await makeRequest('GET', '/reports/dashboard/quick/999999');
    showResult('Usuario Inexistente (Manejo de Error)', invalidUserResponse, 500);

    // Sin userId
    const noUserResponse = await makeRequest('GET', '/reports/dashboard/complete');
    showResult('Sin UserID (Error Esperado)', noUserResponse, 400);

    console.log('\n' + '='.repeat(80));
    console.log('🎉 PRUEBAS DEL DASHBOARD COMPLETADAS');
    console.log('='.repeat(80));
    console.log(`📊 Usuario de prueba: ${TEST_USER_ID}`);
    console.log('💡 Revisa los dashboards para ver análisis detallados de progreso');

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
    await runDashboardTests();
  } catch (error) {
    console.log('❌ Servidor no disponible en http://localhost:3000');
    console.log('💡 Inicia el servidor con: npm run start:dev');
  }
}

if (require.main === module) {
  main();
}
