import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

export const connectDB = async (): Promise<Database> => {
  if (db) return db;

  try {
    const dbPath = path.join(__dirname, '../../data/serviplay.db');
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    console.log('✅ SQLite database connected successfully');
    return db;
  } catch (error) {
    console.error('❌ SQLite connection failed:', error);
    throw error;
  }
};

export const query = async (sql: string, params?: any[]): Promise<any> => {
  if (!db) {
    db = await connectDB();
  }

  try {
    const result = await db.all(sql, params);
    return { rows: result, rowCount: result.length };
  } catch (error) {
    console.error('❌ Database query error:', error);
    throw error;
  }
};

export const getDB = async (): Promise<Database> => {
  if (!db) {
    db = await connectDB();
  }
  return db;
};

// Initialize database with basic schema
export const initializeDB = async () => {
  const database = await connectDB();
  
  // Create basic tables
  await database.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      telefono VARCHAR(20),
      password_hash VARCHAR(255) NOT NULL,
      tipo_usuario VARCHAR(20) CHECK (tipo_usuario IN ('explorador', 'as')) NOT NULL,
      verificado BOOLEAN DEFAULT FALSE,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre VARCHAR(100) NOT NULL,
      descripcion TEXT,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS servicios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      categoria_id INTEGER NOT NULL,
      titulo VARCHAR(200) NOT NULL,
      descripcion TEXT,
      precio DECIMAL(10,2),
      ubicacion TEXT,
      disponible BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    );

    -- Insert basic test data
    INSERT OR IGNORE INTO categorias (nombre, descripcion) VALUES 
    ('Limpieza', 'Servicios de limpieza del hogar'),
    ('Plomería', 'Servicios de plomería y reparaciones'),
    ('Electricidad', 'Servicios eléctricos'),
    ('Jardinería', 'Cuidado de jardines y plantas'),
    ('Cocina', 'Servicios de cocina y gastronomía'),
    ('Tecnología', 'Reparación y soporte técnico');

    INSERT OR IGNORE INTO usuarios (nombre, email, password_hash, tipo_usuario) VALUES 
    ('Juan Pérez', 'juan@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBFkK5.j3T.AOu', 'as'),
    ('Ana García', 'ana@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBFkK5.j3T.AOu', 'explorador');
  `);

  console.log('✅ Database initialized with basic schema and test data');
};

export default db;