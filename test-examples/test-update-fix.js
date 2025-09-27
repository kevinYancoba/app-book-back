/**
 * Script para probar la corrección del mapeo de campos en actualización de planes
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const PLAN_ID = 1; // Cambia este ID por el de tu plan de prueba

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

async function testUpdatePlan() {
  console.log('🧪 Probando corrección del mapeo de campos en actualización de planes');
  console.log('=' .repeat(70));

  try {
    // 1. Obtener plan actual
    console.log('\n📋 1. Obteniendo plan actual...');
    const currentPlan = await makeRequest('GET', `/plan/${PLAN_ID}`);
    
    if (currentPlan.statusCode !== 200) {
      console.log(`❌ No se pudo obtener el plan ${PLAN_ID}. Status: ${currentPlan.statusCode}`);
      console.log('💡 Asegúrate de que el plan existe o cambia el PLAN_ID en el script');
      return;
    }
    
    console.log('✅ Plan obtenido exitosamente');
    console.log(`📄 Título actual: "${currentPlan.data.titulo}"`);
    console.log(`📄 Páginas por día: ${currentPlan.data.paginas_por_dia}`);

    // 2. Actualizar plan con mapeo corregido
    console.log('\n🔄 2. Actualizando plan con nuevos datos...');
    const updateData = {
      titulo: 'Plan Actualizado - Mapeo Corregido',
      descripcion: 'Descripción actualizada para probar el mapeo de campos',
      fechaFin: '2025-06-15T23:59:59Z',
      incluirFinesSemana: false,
      paginasPorDia: 10,
      tiempoEstimadoDia: 50
    };

    const updateResponse = await makeRequest('PUT', `/plan/${PLAN_ID}`, updateData);
    
    if (updateResponse.statusCode === 200) {
      console.log('✅ Plan actualizado exitosamente');
      console.log(`📄 Nuevo título: "${updateResponse.data.titulo}"`);
      console.log(`📄 Nuevas páginas por día: ${updateResponse.data.paginas_por_dia}`);
      console.log(`📄 Incluir fines de semana: ${updateResponse.data.incluir_fines_semana}`);
    } else {
      console.log(`❌ Error al actualizar plan. Status: ${updateResponse.statusCode}`);
      console.log('📄 Respuesta:', JSON.stringify(updateResponse.data, null, 2));
      return;
    }

    // 3. Verificar que los cambios se guardaron
    console.log('\n🔍 3. Verificando que los cambios se guardaron...');
    const verifyPlan = await makeRequest('GET', `/plan/${PLAN_ID}`);
    
    if (verifyPlan.statusCode === 200) {
      const plan = verifyPlan.data;
      console.log('✅ Verificación exitosa');
      console.log(`📄 Título verificado: "${plan.titulo}"`);
      console.log(`📄 Páginas por día verificadas: ${plan.paginas_por_dia}`);
      console.log(`📄 Tiempo estimado verificado: ${plan.tiempo_estimado_dia}`);
      console.log(`📄 Fines de semana verificado: ${plan.incluir_fines_semana}`);
      
      // Verificar que los campos se mapearon correctamente
      const expectedTitle = 'Plan Actualizado - Mapeo Corregido';
      const expectedPages = 10;
      const expectedTime = 50;
      const expectedWeekends = false;
      
      let allCorrect = true;
      
      if (plan.titulo !== expectedTitle) {
        console.log(`❌ Título incorrecto. Esperado: "${expectedTitle}", Actual: "${plan.titulo}"`);
        allCorrect = false;
      }
      
      if (plan.paginas_por_dia !== expectedPages) {
        console.log(`❌ Páginas por día incorrectas. Esperado: ${expectedPages}, Actual: ${plan.paginas_por_dia}`);
        allCorrect = false;
      }
      
      if (plan.tiempo_estimado_dia !== expectedTime) {
        console.log(`❌ Tiempo estimado incorrecto. Esperado: ${expectedTime}, Actual: ${plan.tiempo_estimado_dia}`);
        allCorrect = false;
      }
      
      if (plan.incluir_fines_semana !== expectedWeekends) {
        console.log(`❌ Fines de semana incorrecto. Esperado: ${expectedWeekends}, Actual: ${plan.incluir_fines_semana}`);
        allCorrect = false;
      }
      
      if (allCorrect) {
        console.log('\n🎉 ¡TODOS LOS CAMPOS SE MAPEARON CORRECTAMENTE!');
        console.log('✅ La corrección del mapeo camelCase -> snake_case funciona perfectamente');
      } else {
        console.log('\n⚠️  Algunos campos no se mapearon correctamente');
      }
      
    } else {
      console.log(`❌ Error al verificar plan. Status: ${verifyPlan.statusCode}`);
    }

    // 4. Prueba de actualización parcial
    console.log('\n🔄 4. Probando actualización parcial...');
    const partialUpdate = {
      titulo: 'Título Parcialmente Actualizado'
    };

    const partialResponse = await makeRequest('PUT', `/plan/${PLAN_ID}`, partialUpdate);
    
    if (partialResponse.statusCode === 200) {
      console.log('✅ Actualización parcial exitosa');
      console.log(`📄 Solo el título cambió: "${partialResponse.data.titulo}"`);
    } else {
      console.log(`❌ Error en actualización parcial. Status: ${partialResponse.statusCode}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🏁 PRUEBA COMPLETADA');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
  }
}

// Verificar servidor y ejecutar
async function main() {
  console.log('🔍 Verificando servidor...');
  
  try {
    await makeRequest('GET', '/');
    console.log('✅ Servidor detectado');
    await testUpdatePlan();
  } catch (error) {
    console.log('❌ Servidor no disponible en http://localhost:3000');
    console.log('💡 Inicia el servidor con: npm run start:dev');
  }
}

if (require.main === module) {
  main();
}
