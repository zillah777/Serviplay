const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  // For migrations, use DATABASE_PUBLIC_URL or DATABASE_URL
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ No DATABASE_URL or DATABASE_PUBLIC_URL found');
    console.log('Available DB env vars:', Object.keys(process.env).filter(key => 
      key.includes('PG') || key.includes('DATABASE')));
    return;
  }
  
  console.log('🔗 Using database URL for migrations');
  console.log('DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'SET' : 'NOT SET');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false } // Always use SSL for external connections
  });

  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Database connection established');
    client.release();
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pgmigrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    
    console.log(`📁 Found ${files.length} migration files`);

    for (const file of files) {
      // Check if migration already ran
      const result = await pool.query('SELECT * FROM pgmigrations WHERE name = $1', [file]);
      
      if (result.rows.length === 0) {
        console.log(`▶️  Running migration: ${file}`);
        
        // Read and execute migration
        const migrationSQL = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await pool.query(migrationSQL);
        
        // Record migration as completed
        await pool.query('INSERT INTO pgmigrations (name) VALUES ($1)', [file]);
        
        console.log(`✅ Completed migration: ${file}`);
      } else {
        console.log(`⏭️  Skipping already run migration: ${file}`);
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();