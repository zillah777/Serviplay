const { Pool } = require('pg');

// Configuración de la base de datos desde el .env
const pool = new Pool({
  connectionString: 'postgresql://postgres:OQkVkAgvDYBfYWVyUCirqljWSlPmagNy@mainline.proxy.rlwy.net:18109/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTables() {
  try {
    console.log('🔗 Conectando a PostgreSQL...');
    
    // Verificar conexión
    const client = await pool.connect();
    console.log('✅ Conexión exitosa!');
    
    // Listar todas las tablas
    console.log('\n📋 Listando todas las tablas:');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No se encontraron tablas en el esquema public');
    } else {
      console.log('📋 Tablas encontradas:');
      tablesResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    }
    
    // Verificar esquemas disponibles
    console.log('\n🗂️ Esquemas disponibles:');
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      ORDER BY schema_name;
    `);
    
    schemasResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.schema_name}`);
    });
    
    // Verificar si hay tablas en otros esquemas
    console.log('\n🔍 Tablas en todos los esquemas:');
    const allTablesResult = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name;
    `);
    
    if (allTablesResult.rows.length === 0) {
      console.log('❌ No se encontraron tablas en ningún esquema');
      console.log('\n💡 Esto indica que las migraciones no se han ejecutado correctamente');
    } else {
      console.log('📋 Todas las tablas por esquema:');
      allTablesResult.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_schema}.${row.table_name}`);
      });
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error al conectar:', error.message);
    
    // Información adicional sobre el error
    if (error.code) {
      console.error('📝 Código de error:', error.code);
    }
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Soluciones posibles:');
      console.log('1. Verificar que tienes conexión a internet');
      console.log('2. Verificar que la URL de Railway es correcta');
      console.log('3. Verificar que el servicio de Railway está activo');
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 El servidor rechaza la conexión:');
      console.log('1. Verificar credenciales de la base de datos');
      console.log('2. Verificar que el servicio PostgreSQL está ejecutándose');
    }
  } finally {
    await pool.end();
  }
}

checkTables();