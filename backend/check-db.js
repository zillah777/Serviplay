const { Pool } = require('pg');

async function checkDatabase() {
  console.log('🔍 Checking database connection...');
  
  // Use same connection strategy as main app
  const connectionConfig = {
    host: process.env.PGHOST || 'postgres.railway.internal',
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || 'railway',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
  
  console.log('🔗 Check DB connection config:', {
    host: connectionConfig.host,
    port: connectionConfig.port,
    database: connectionConfig.database,
    user: connectionConfig.user,
    ssl: !!connectionConfig.ssl
  });
  
  const pool = new Pool(connectionConfig);

  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT NOW()');
    console.log('⏰ Database time:', result.rows[0].now);
    
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();