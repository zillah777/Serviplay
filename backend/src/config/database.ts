import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';
const isRailway = process.env.DATABASE_URL?.includes('railway');

const poolConfig = {
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'fixia_user'}:${process.env.DB_PASSWORD || 'fixia_pass'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}/${process.env.DB_NAME || 'fixia_db'}`,
  max: isDevelopment ? 10 : 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: isDevelopment ? 5000 : 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  ssl: isRailway || isProduction ? { 
    rejectUnauthorized: false,
    // Agregar opciones adicionales para Railway
    sslmode: 'require'
  } : false,
};

// En desarrollo, usar configuración más tolerante
if (isDevelopment) {
  poolConfig.idleTimeoutMillis = 10000;
  poolConfig.connectionTimeoutMillis = 3000;
}

const pool = new Pool(poolConfig);

export const connectDB = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL connected successfully');
      
      // Test the connection with a simple query
      await client.query('SELECT NOW()');
      client.release();
      return;
    } catch (error) {
      console.error(`❌ PostgreSQL connection attempt ${i + 1}/${retries} failed:`, error);
      
      if (i === retries - 1) {
        if (isDevelopment) {
          console.log('🔧 Running in development mode - continuing without database');
          return;
        }
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
};

export const query = async (text: string, params?: any[], retries = 2) => {
  const start = Date.now();
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      
      if (isDevelopment && duration > 1000) {
        console.log('🐌 Slow query detected:', { 
          text: text.substring(0, 100) + '...', 
          duration, 
          rows: res.rowCount 
        });
      }
      
      return res;
    } catch (error: any) {
      console.error(`❌ Database query error (attempt ${i + 1}/${retries}):`, {
        error: error.message,
        query: text.substring(0, 100) + '...'
      });
      
      // Check if it's a connection error that might benefit from retry
      const isConnectionError = error.code === 'ECONNRESET' || 
                               error.code === 'ECONNREFUSED' || 
                               error.message?.includes('connection');
      
      if (i === retries - 1 || !isConnectionError) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

export const getClient = () => pool.connect();

export default pool;