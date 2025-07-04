-- Enhance identity verification system
-- Migration: 015_enhance_identity_verification.sql

-- Add verification fields to perfiles_ases if they don't exist
DO $$ 
BEGIN
    -- Add new columns to perfiles_ases
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_ases' AND column_name = 'estado_verificacion'
    ) THEN
        ALTER TABLE perfiles_ases ADD COLUMN estado_verificacion VARCHAR(20) DEFAULT 'not_started';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_ases' AND column_name = 'fecha_solicitud_verificacion'
    ) THEN
        ALTER TABLE perfiles_ases ADD COLUMN fecha_solicitud_verificacion TIMESTAMP;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_ases' AND column_name = 'tipo_documento'
    ) THEN
        ALTER TABLE perfiles_ases ADD COLUMN tipo_documento VARCHAR(20);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_ases' AND column_name = 'notas_verificacion'
    ) THEN
        ALTER TABLE perfiles_ases ADD COLUMN notas_verificacion TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_ases' AND column_name = 'notas_rechazo'
    ) THEN
        ALTER TABLE perfiles_ases ADD COLUMN notas_rechazo TEXT;
    END IF;

    -- Add new columns to perfiles_exploradores
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_exploradores' AND column_name = 'identidad_verificada'
    ) THEN
        ALTER TABLE perfiles_exploradores ADD COLUMN identidad_verificada BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_exploradores' AND column_name = 'fecha_verificacion'
    ) THEN
        ALTER TABLE perfiles_exploradores ADD COLUMN fecha_verificacion TIMESTAMP;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_exploradores' AND column_name = 'estado_verificacion'
    ) THEN
        ALTER TABLE perfiles_exploradores ADD COLUMN estado_verificacion VARCHAR(20) DEFAULT 'not_started';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_exploradores' AND column_name = 'fecha_solicitud_verificacion'
    ) THEN
        ALTER TABLE perfiles_exploradores ADD COLUMN fecha_solicitud_verificacion TIMESTAMP;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_exploradores' AND column_name = 'tipo_documento'
    ) THEN
        ALTER TABLE perfiles_exploradores ADD COLUMN tipo_documento VARCHAR(20);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_exploradores' AND column_name = 'notas_verificacion'
    ) THEN
        ALTER TABLE perfiles_exploradores ADD COLUMN notas_verificacion TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_exploradores' AND column_name = 'notas_rechazo'
    ) THEN
        ALTER TABLE perfiles_exploradores ADD COLUMN notas_rechazo TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_exploradores' AND column_name = 'foto_dni_frente'
    ) THEN
        ALTER TABLE perfiles_exploradores ADD COLUMN foto_dni_frente UUID REFERENCES file_uploads(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'perfiles_exploradores' AND column_name = 'foto_dni_dorso'
    ) THEN
        ALTER TABLE perfiles_exploradores ADD COLUMN foto_dni_dorso UUID REFERENCES file_uploads(id);
    END IF;
END $$;

-- Create verification history table
CREATE TABLE IF NOT EXISTS verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_verificacion VARCHAR(50) NOT NULL, -- 'identity', 'address', 'professional'
    estado VARCHAR(20) NOT NULL, -- 'pending', 'approved', 'rejected'
    fecha_solicitud TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP,
    documentos_subidos JSONB, -- Store file IDs and metadata
    notas TEXT,
    procesado_por UUID REFERENCES usuarios(id), -- Admin who processed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for verification history
CREATE INDEX IF NOT EXISTS idx_verification_history_usuario_id ON verification_history(usuario_id);
CREATE INDEX IF NOT EXISTS idx_verification_history_tipo ON verification_history(tipo_verificacion);
CREATE INDEX IF NOT EXISTS idx_verification_history_estado ON verification_history(estado);
CREATE INDEX IF NOT EXISTS idx_verification_history_fecha ON verification_history(fecha_solicitud);

-- Add constraints for verification status
DO $$
BEGIN
    -- Add check constraint for verification status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'perfiles_ases' AND constraint_name = 'chk_estado_verificacion_ases'
    ) THEN
        ALTER TABLE perfiles_ases 
        ADD CONSTRAINT chk_estado_verificacion_ases 
        CHECK (estado_verificacion IN ('not_started', 'pending', 'approved', 'rejected'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'perfiles_exploradores' AND constraint_name = 'chk_estado_verificacion_exploradores'
    ) THEN
        ALTER TABLE perfiles_exploradores 
        ADD CONSTRAINT chk_estado_verificacion_exploradores 
        CHECK (estado_verificacion IN ('not_started', 'pending', 'approved', 'rejected'));
    END IF;

    -- Add check constraint for document types
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'perfiles_ases' AND constraint_name = 'chk_tipo_documento_ases'
    ) THEN
        ALTER TABLE perfiles_ases 
        ADD CONSTRAINT chk_tipo_documento_ases 
        CHECK (tipo_documento IN ('dni', 'passport', 'cedula'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'perfiles_exploradores' AND constraint_name = 'chk_tipo_documento_exploradores'
    ) THEN
        ALTER TABLE perfiles_exploradores 
        ADD CONSTRAINT chk_tipo_documento_exploradores 
        CHECK (tipo_documento IN ('dni', 'passport', 'cedula'));
    END IF;

    -- Add check constraint for verification history
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'verification_history' AND constraint_name = 'chk_verification_history_estado'
    ) THEN
        ALTER TABLE verification_history 
        ADD CONSTRAINT chk_verification_history_estado 
        CHECK (estado IN ('pending', 'approved', 'rejected'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'verification_history' AND constraint_name = 'chk_verification_history_tipo'
    ) THEN
        ALTER TABLE verification_history 
        ADD CONSTRAINT chk_verification_history_tipo 
        CHECK (tipo_verificacion IN ('identity', 'address', 'professional', 'phone', 'email'));
    END IF;
END $$;

-- Create view for identity verification summary
CREATE OR REPLACE VIEW identity_verification_summary AS
SELECT 
    u.id as usuario_id,
    u.email,
    u.tipo_usuario,
    u.nombre,
    u.apellido,
    CASE 
        WHEN u.tipo_usuario = 'as' THEN pa.identidad_verificada
        ELSE pe.identidad_verificada
    END as identidad_verificada,
    CASE 
        WHEN u.tipo_usuario = 'as' THEN pa.estado_verificacion
        ELSE pe.estado_verificacion
    END as estado_verificacion,
    CASE 
        WHEN u.tipo_usuario = 'as' THEN pa.fecha_verificacion
        ELSE pe.fecha_verificacion
    END as fecha_verificacion,
    CASE 
        WHEN u.tipo_usuario = 'as' THEN pa.fecha_solicitud_verificacion
        ELSE pe.fecha_solicitud_verificacion
    END as fecha_solicitud_verificacion,
    CASE 
        WHEN u.tipo_usuario = 'as' THEN pa.tipo_documento
        ELSE pe.tipo_documento
    END as tipo_documento,
    CASE 
        WHEN u.tipo_usuario = 'as' THEN pa.notas_verificacion
        ELSE pe.notas_verificacion
    END as notas_verificacion,
    CASE 
        WHEN u.tipo_usuario = 'as' THEN pa.notas_rechazo
        ELSE pe.notas_rechazo
    END as notas_rechazo
FROM usuarios u
LEFT JOIN perfiles_ases pa ON u.id = pa.usuario_id AND u.tipo_usuario = 'as'
LEFT JOIN perfiles_exploradores pe ON u.id = pe.usuario_id AND u.tipo_usuario = 'explorador';

-- Create function to update verification timestamps
CREATE OR REPLACE FUNCTION update_verification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
DO $$
BEGIN
    -- Drop triggers if they exist
    DROP TRIGGER IF EXISTS update_perfiles_ases_verification_timestamp ON perfiles_ases;
    DROP TRIGGER IF EXISTS update_perfiles_exploradores_verification_timestamp ON perfiles_exploradores;
    DROP TRIGGER IF EXISTS update_verification_history_timestamp ON verification_history;

    -- Create new triggers
    CREATE TRIGGER update_perfiles_ases_verification_timestamp
        BEFORE UPDATE ON perfiles_ases
        FOR EACH ROW
        WHEN (OLD.estado_verificacion IS DISTINCT FROM NEW.estado_verificacion)
        EXECUTE FUNCTION update_verification_timestamp();

    CREATE TRIGGER update_perfiles_exploradores_verification_timestamp
        BEFORE UPDATE ON perfiles_exploradores
        FOR EACH ROW
        WHEN (OLD.estado_verificacion IS DISTINCT FROM NEW.estado_verificacion)
        EXECUTE FUNCTION update_verification_timestamp();

    CREATE TRIGGER update_verification_history_timestamp
        BEFORE UPDATE ON verification_history
        FOR EACH ROW
        EXECUTE FUNCTION update_verification_timestamp();
END $$;

-- Insert sample verification types for reference
CREATE TABLE IF NOT EXISTS verification_types (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    requerido BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    orden_display INTEGER DEFAULT 0
);

INSERT INTO verification_types (id, nombre, descripcion, requerido, orden_display) VALUES
('identity', 'Verificación de Identidad', 'Verificación de documento nacional de identidad', true, 1),
('phone', 'Verificación de Teléfono', 'Verificación de número de teléfono móvil', true, 2),
('email', 'Verificación de Email', 'Verificación de dirección de correo electrónico', true, 3),
('address', 'Verificación de Domicilio', 'Verificación de dirección de residencia', false, 4),
('professional', 'Verificación Profesional', 'Verificación de títulos y certificaciones', false, 5)
ON CONFLICT (id) DO NOTHING;

-- Add comments to tables
COMMENT ON TABLE verification_history IS 'Historial de todas las verificaciones realizadas por usuarios';
COMMENT ON COLUMN verification_history.documentos_subidos IS 'JSON con IDs y metadata de archivos subidos';
COMMENT ON TABLE verification_types IS 'Tipos de verificación disponibles en el sistema';
COMMENT ON VIEW identity_verification_summary IS 'Vista unificada del estado de verificación de identidad para todos los usuarios';

-- Grant permissions (adjust as needed for your user roles)
-- GRANT SELECT, INSERT, UPDATE ON verification_history TO app_user;
-- GRANT SELECT ON verification_types TO app_user;
-- GRANT SELECT ON identity_verification_summary TO app_user;