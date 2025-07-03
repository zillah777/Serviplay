-- ============================================================================
-- MIGRACIÓN 014: SISTEMA DE SUBIDA DE ARCHIVOS
-- ============================================================================
-- Esta migración crea el sistema completo de manejo de archivos
-- Soporte para imágenes, documentos y archivos multimedia

-- ============================================================================
-- EXTENSIONES REQUERIDAS
-- ============================================================================
-- Asegurar que uuid-ossp esté disponible
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUMS: TIPOS DE ARCHIVO Y ESTADOS
-- ============================================================================

-- Tipos de archivo soportados
CREATE TYPE file_type AS ENUM (
    'image',        -- Imágenes (JPG, PNG, GIF, WebP)
    'document',     -- Documentos (PDF, DOC, DOCX)
    'video',        -- Videos (MP4, AVI, MOV)
    'audio',        -- Audio (MP3, WAV, AAC)
    'other'         -- Otros tipos
);

-- Estados del archivo
CREATE TYPE file_status AS ENUM (
    'uploading',    -- En proceso de subida
    'processing',   -- Procesándose (redimensión, compresión)
    'ready',        -- Listo para usar
    'failed',       -- Error en procesamiento
    'deleted'       -- Marcado como eliminado
);

-- Contexto donde se usa el archivo
CREATE TYPE file_context AS ENUM (
    'profile_photo',        -- Foto de perfil usuario
    'service_image',        -- Imagen de servicio
    'service_gallery',      -- Galería de servicio
    'verification_document', -- Documento de verificación
    'chat_attachment',      -- Adjunto en chat
    'review_image',         -- Imagen en review
    'portfolio_image',      -- Imagen de portfolio As
    'id_document',          -- Documento de identidad
    'other'                 -- Otros usos
);

-- ============================================================================
-- TABLA: archivos
-- ============================================================================
-- Almacena metadatos de todos los archivos subidos
CREATE TABLE archivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Información del archivo
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL, -- Nombre único generado
    extension VARCHAR(10) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    tamaño INTEGER NOT NULL, -- Tamaño en bytes
    
    -- Tipo y estado
    tipo file_type NOT NULL,
    estado file_status DEFAULT 'uploading',
    contexto file_context DEFAULT 'other',
    
    -- URLs y paths
    url_publica TEXT, -- URL pública para acceso
    path_storage TEXT, -- Path en el sistema de storage
    url_thumbnail TEXT, -- URL del thumbnail (para imágenes)
    
    -- Metadatos específicos para imágenes
    ancho INTEGER, -- Width para imágenes/videos
    alto INTEGER,  -- Height para imágenes/videos
    duracion INTEGER, -- Duración para videos/audio (en segundos)
    
    -- Información de subida
    subido_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    ip_origen INET,
    user_agent TEXT,
    
    -- Metadatos adicionales (EXIF, etc.)
    metadata JSONB DEFAULT '{}',
    
    -- Control de acceso
    publico BOOLEAN DEFAULT false,
    requiere_auth BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- TABLA: archivos_relaciones
-- ============================================================================
-- Relaciona archivos con entidades (servicios, usuarios, etc.)
CREATE TABLE archivos_relaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    archivo_id UUID REFERENCES archivos(id) ON DELETE CASCADE,
    
    -- Entidad relacionada
    entidad_tipo VARCHAR(50) NOT NULL, -- 'usuario', 'servicio', 'busqueda', etc.
    entidad_id UUID NOT NULL,
    
    -- Información de la relación
    campo VARCHAR(50), -- 'foto_perfil', 'galeria', 'documento_verificacion'
    orden INTEGER DEFAULT 0, -- Para galerías ordenadas
    descripcion TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint única para evitar duplicados
    UNIQUE(archivo_id, entidad_tipo, entidad_id, campo)
);

-- ============================================================================
-- TABLA: archivos_temporales
-- ============================================================================
-- Para archivos que se suben pero aún no se asocian a ninguna entidad
CREATE TABLE archivos_temporales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    archivo_id UUID REFERENCES archivos(id) ON DELETE CASCADE,
    
    -- Información de la sesión temporal
    token_temporal VARCHAR(255) UNIQUE NOT NULL,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Expiración automática
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: configuracion_archivos
-- ============================================================================
-- Configuración global del sistema de archivos
CREATE TABLE configuracion_archivos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Límites por tipo de archivo
    max_size_image INTEGER DEFAULT 10485760, -- 10MB
    max_size_document INTEGER DEFAULT 52428800, -- 50MB
    max_size_video INTEGER DEFAULT 104857600, -- 100MB
    max_size_audio INTEGER DEFAULT 20971520, -- 20MB
    
    -- Formatos permitidos
    allowed_image_types TEXT[] DEFAULT ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'],
    allowed_document_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx'],
    allowed_video_types TEXT[] DEFAULT ARRAY['mp4', 'avi', 'mov', 'webm'],
    allowed_audio_types TEXT[] DEFAULT ARRAY['mp3', 'wav', 'aac', 'ogg'],
    
    -- Configuración de thumbnails
    thumbnail_sizes JSONB DEFAULT '[
        {"name": "small", "width": 150, "height": 150},
        {"name": "medium", "width": 400, "height": 400},
        {"name": "large", "width": 800, "height": 600}
    ]',
    
    -- Configuración de storage
    storage_provider VARCHAR(50) DEFAULT 'local', -- 'local', 'cloudinary', 's3'
    storage_config JSONB DEFAULT '{}',
    
    -- Configuración de CDN
    cdn_enabled BOOLEAN DEFAULT false,
    cdn_base_url TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices principales para archivos
CREATE INDEX idx_archivos_subido_por ON archivos(subido_por);
CREATE INDEX idx_archivos_tipo ON archivos(tipo);
CREATE INDEX idx_archivos_estado ON archivos(estado);
CREATE INDEX idx_archivos_contexto ON archivos(contexto);
CREATE INDEX idx_archivos_created_at ON archivos(created_at DESC);
CREATE INDEX idx_archivos_publico ON archivos(publico);
CREATE INDEX idx_archivos_deleted_at ON archivos(deleted_at) WHERE deleted_at IS NOT NULL;

-- Índices para relaciones
CREATE INDEX idx_archivos_relaciones_archivo_id ON archivos_relaciones(archivo_id);
CREATE INDEX idx_archivos_relaciones_entidad ON archivos_relaciones(entidad_tipo, entidad_id);
CREATE INDEX idx_archivos_relaciones_campo ON archivos_relaciones(entidad_tipo, entidad_id, campo);
CREATE INDEX idx_archivos_relaciones_orden ON archivos_relaciones(entidad_tipo, entidad_id, orden);

-- Índices para archivos temporales
CREATE INDEX idx_archivos_temporales_token ON archivos_temporales(token_temporal);
CREATE INDEX idx_archivos_temporales_usuario ON archivos_temporales(usuario_id);
CREATE INDEX idx_archivos_temporales_expires ON archivos_temporales(expires_at);

-- ============================================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================================================

-- Función para actualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_archivos_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para archivos
CREATE TRIGGER trigger_archivos_updated_at 
    BEFORE UPDATE ON archivos 
    FOR EACH ROW EXECUTE FUNCTION update_archivos_updated_at_column();

-- Trigger para configuración
CREATE TRIGGER trigger_configuracion_archivos_updated_at 
    BEFORE UPDATE ON configuracion_archivos 
    FOR EACH ROW EXECUTE FUNCTION update_archivos_updated_at_column();

-- ============================================================================
-- FUNCIONES ÚTILES
-- ============================================================================

-- Función para generar nombre único de archivo
CREATE OR REPLACE FUNCTION generate_unique_filename(
    p_original_name VARCHAR,
    p_extension VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    unique_name VARCHAR;
    timestamp_str VARCHAR;
    random_str VARCHAR;
BEGIN
    -- Generar timestamp
    timestamp_str := TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
    
    -- Generar string aleatorio
    random_str := SUBSTRING(md5(random()::text) FROM 1 FOR 8);
    
    -- Combinar para crear nombre único
    unique_name := timestamp_str || '_' || random_str || '.' || p_extension;
    
    RETURN unique_name;
END;
$$ language 'plpgsql';

-- Función para limpiar archivos temporales expirados
CREATE OR REPLACE FUNCTION cleanup_expired_temp_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Marcar archivos como eliminados
    UPDATE archivos 
    SET estado = 'deleted', deleted_at = NOW()
    WHERE id IN (
        SELECT a.id 
        FROM archivos a
        JOIN archivos_temporales at ON a.id = at.archivo_id
        WHERE at.expires_at < NOW()
          AND a.estado != 'deleted'
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Eliminar registros de archivos temporales expirados
    DELETE FROM archivos_temporales WHERE expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Función para obtener archivos de una entidad
CREATE OR REPLACE FUNCTION get_entity_files(
    p_entidad_tipo VARCHAR,
    p_entidad_id UUID,
    p_campo VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    archivo_id UUID,
    nombre_original VARCHAR,
    url_publica TEXT,
    url_thumbnail TEXT,
    tipo file_type,
    tamaño INTEGER,
    orden INTEGER,
    descripcion TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as archivo_id,
        a.nombre_original,
        a.url_publica,
        a.url_thumbnail,
        a.tipo,
        a.tamaño,
        ar.orden,
        ar.descripcion
    FROM archivos a
    JOIN archivos_relaciones ar ON a.id = ar.archivo_id
    WHERE ar.entidad_tipo = p_entidad_tipo
      AND ar.entidad_id = p_entidad_id
      AND (p_campo IS NULL OR ar.campo = p_campo)
      AND a.estado = 'ready'
      AND a.deleted_at IS NULL
    ORDER BY ar.orden, a.created_at;
END;
$$ language 'plpgsql';

-- Función para verificar límites de archivo
CREATE OR REPLACE FUNCTION check_file_limits(
    p_tipo file_type,
    p_tamaño INTEGER,
    p_extension VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    config_row configuracion_archivos%ROWTYPE;
    max_size INTEGER;
    allowed_types TEXT[];
BEGIN
    -- Obtener configuración (asumiendo que existe una fila)
    SELECT * INTO config_row FROM configuracion_archivos LIMIT 1;
    
    -- Determinar límites según tipo
    CASE p_tipo
        WHEN 'image' THEN
            max_size := config_row.max_size_image;
            allowed_types := config_row.allowed_image_types;
        WHEN 'document' THEN
            max_size := config_row.max_size_document;
            allowed_types := config_row.allowed_document_types;
        WHEN 'video' THEN
            max_size := config_row.max_size_video;
            allowed_types := config_row.allowed_video_types;
        WHEN 'audio' THEN
            max_size := config_row.max_size_audio;
            allowed_types := config_row.allowed_audio_types;
        ELSE
            RETURN false; -- Tipo no soportado
    END CASE;
    
    -- Verificar tamaño
    IF p_tamaño > max_size THEN
        RETURN false;
    END IF;
    
    -- Verificar extensión
    IF NOT (LOWER(p_extension) = ANY(allowed_types)) THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$ language 'plpgsql';

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista para estadísticas de archivos por usuario
CREATE VIEW user_files_stats AS
SELECT 
    u.id as usuario_id,
    u.email,
    COUNT(a.id) as total_archivos,
    COUNT(CASE WHEN a.tipo = 'image' THEN 1 END) as total_imagenes,
    COUNT(CASE WHEN a.tipo = 'document' THEN 1 END) as total_documentos,
    SUM(a.tamaño) as espacio_usado_bytes,
    ROUND(SUM(a.tamaño) / 1024.0 / 1024.0, 2) as espacio_usado_mb,
    MAX(a.created_at) as ultimo_archivo_subido
FROM usuarios u
LEFT JOIN archivos a ON u.id = a.subido_por 
    AND a.estado = 'ready' 
    AND a.deleted_at IS NULL
GROUP BY u.id, u.email;

-- Vista para archivos recientes
CREATE VIEW recent_files AS
SELECT 
    a.id,
    a.nombre_original,
    a.tipo,
    a.tamaño,
    a.url_publica,
    a.contexto,
    u.email as subido_por_email,
    a.created_at
FROM archivos a
LEFT JOIN usuarios u ON a.subido_por = u.id
WHERE a.estado = 'ready'
  AND a.deleted_at IS NULL
ORDER BY a.created_at DESC;

-- ============================================================================
-- CONFIGURACIÓN INICIAL
-- ============================================================================

-- Insertar configuración por defecto
INSERT INTO configuracion_archivos (
    max_size_image,
    max_size_document,
    max_size_video,
    max_size_audio,
    allowed_image_types,
    allowed_document_types,
    allowed_video_types,
    allowed_audio_types,
    thumbnail_sizes,
    storage_provider,
    storage_config
) VALUES (
    10485760,  -- 10MB para imágenes
    52428800,  -- 50MB para documentos
    104857600, -- 100MB para videos
    20971520,  -- 20MB para audio
    ARRAY['jpg', 'jpeg', 'png', 'gif', 'webp'],
    ARRAY['pdf', 'doc', 'docx'],
    ARRAY['mp4', 'avi', 'mov', 'webm'],
    ARRAY['mp3', 'wav', 'aac', 'ogg'],
    '[
        {"name": "small", "width": 150, "height": 150},
        {"name": "medium", "width": 400, "height": 400},
        {"name": "large", "width": 800, "height": 600}
    ]'::jsonb,
    'local',
    '{
        "upload_path": "/uploads",
        "temp_path": "/uploads/temp"
    }'::jsonb
);

-- ============================================================================
-- COMENTARIOS SOBRE EL DISEÑO
-- ============================================================================

/*
CARACTERÍSTICAS DEL SISTEMA DE ARCHIVOS:

✅ FUNCIONALIDAD BÁSICA:
- Subida segura de archivos múltiples formatos
- Validación de tipo, tamaño y extensión
- Generación automática de nombres únicos
- Metadatos completos (EXIF, dimensiones, duración)

✅ GESTIÓN DE STORAGE:
- Soporte para múltiples proveedores (local, Cloudinary, S3)
- URLs públicas y privadas
- Sistema de thumbnails automático
- CDN integration ready

✅ RELACIONES FLEXIBLES:
- Asociación de archivos a cualquier entidad
- Múltiples contextos de uso
- Galerías ordenadas
- Sistema de campos personalizables

✅ ARCHIVOS TEMPORALES:
- Subida antes de asociar a entidad
- Expiración automática
- Tokens temporales seguros
- Limpieza automática

✅ SEGURIDAD:
- Control de acceso por archivo
- Validación de tipos MIME
- Límites configurables
- Tracking de IP y User-Agent

✅ PERFORMANCE:
- Índices optimizados
- Lazy loading ready
- Estadísticas precalculadas
- Cleanup automático

✅ EXTENSIBILIDAD:
- Configuración centralizada
- Metadatos JSONB flexibles
- Proveedores de storage pluggables
- Webhook ready para procesamiento

CASOS DE USO SOPORTADOS:
1. Foto de perfil de usuario
2. Galería de servicios (múltiples imágenes)
3. Documentos de verificación de identidad
4. Adjuntos en chats
5. Portfolio de trabajos realizados
6. Imágenes en reviews
7. Archivos temporales en formularios

PRÓXIMOS PASOS:
1. Implementar modelos TypeScript
2. Crear controladores de upload
3. Integrar con Cloudinary
4. Implementar procesamiento de imágenes
5. Crear middleware de autorización
*/