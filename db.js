const { Pool } = require('pg');

// Debug: Check environment variables
console.log('🔍 Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);

// Database connection configuration
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Fallback configuration if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  console.log('⚠️ DATABASE_URL not found, using individual PG variables');
  connectionConfig.host = process.env.PGHOST || 'localhost';
  connectionConfig.port = process.env.PGPORT || 5432;
  connectionConfig.database = process.env.PGDATABASE || 'railway';
  connectionConfig.user = process.env.PGUSER || 'postgres';
  connectionConfig.password = process.env.PGPASSWORD;
  connectionConfig.ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
}

console.log('🔗 Connection config:', {
  host: connectionConfig.host,
  port: connectionConfig.port,
  database: connectionConfig.database,
  user: connectionConfig.user,
  ssl: !!connectionConfig.ssl,
  connectionString: !!connectionConfig.connectionString
});

const pool = new Pool(connectionConfig);

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database successfully');
    client.release();
  } catch (err) {
    console.error('❌ Database connection error:', err);
  }
}

// Initialize database (create tables if they don't exist)
async function initDatabase() {
  try {
    const client = await pool.connect();
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        user_type VARCHAR(20) DEFAULT 'client',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price DECIMAL(10,2),
        location VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS requests (
        id SERIAL PRIMARY KEY,
        service_id INTEGER REFERENCES services(id),
        client_id INTEGER REFERENCES users(id),
        provider_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'pending',
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized successfully');
    client.release();
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
}

module.exports = {
  pool,
  testConnection,
  initDatabase
};