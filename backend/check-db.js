const { Pool } = require('pg');

async function checkDatabase() {
  console.log('🔍 Checking database connection...');
  
  // For migrations, use DATABASE_PUBLIC_URL or DATABASE_URL
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ No DATABASE_URL or DATABASE_PUBLIC_URL found');
    console.log('Available DB env vars:', Object.keys(process.env).filter(key => 
      key.includes('PG') || key.includes('DATABASE')));
    return;
  }
  
  console.log('🔗 Using database URL for check');
  console.log('DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'SET' : 'NOT SET');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Always use SSL for external connections
  });

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