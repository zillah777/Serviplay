-- ============================================================================
-- MIGRACIÓN 013: SISTEMA DE FAVORITOS
-- ============================================================================
-- Esta migración crea el sistema completo de favoritos
-- Permite a los usuarios guardar servicios y crear listas personalizadas

-- ============================================================================
-- TABLA: favoritos
-- ============================================================================
-- Almacena los servicios marcados como favoritos por cada usuario
CREATE TABLE favoritos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    servicio_id UUID REFERENCES servicios(id) ON DELETE CASCADE,
    
    -- Nota personal opcional del usuario sobre este favorito
    nota_personal TEXT,
    
    -- Metadata adicional (ej: razón del favorito, tags personales)
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint única: un usuario no puede marcar el mismo servicio como favorito múltiples veces
    UNIQUE(usuario_id, servicio_id)
);

-- ============================================================================
-- TABLA: listas_favoritos
-- ============================================================================
-- Permite crear listas personalizadas de favoritos (ej: "Para el hogar", "Urgentes")
CREATE TABLE listas_favoritos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Información de la lista
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Color hex para la UI
    icono VARCHAR(50) DEFAULT 'star', -- Icono para la UI
    
    -- Configuración de privacidad
    publica BOOLEAN DEFAULT false,
    compartible BOOLEAN DEFAULT true, -- Si se puede compartir el link
    
    -- Orden de visualización
    orden INTEGER DEFAULT 0,
    
    -- Metadata adicional
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: favoritos_lista
-- ============================================================================
-- Tabla de relación muchos a muchos entre favoritos y listas
CREATE TABLE favoritos_lista (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lista_id UUID REFERENCES listas_favoritos(id) ON DELETE CASCADE,
    favorito_id UUID REFERENCES favoritos(id) ON DELETE CASCADE,
    
    -- Orden dentro de la lista
    orden INTEGER DEFAULT 0,
    
    -- Fecha de adición a la lista
    agregado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint única: un favorito no puede estar duplicado en la misma lista
    UNIQUE(lista_id, favorito_id)
);

-- ============================================================================
-- TABLA: favoritos_compartidos
-- ============================================================================
-- Para compartir listas de favoritos con otros usuarios
CREATE TABLE favoritos_compartidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lista_id UUID REFERENCES listas_favoritos(id) ON DELETE CASCADE,
    compartido_por UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    compartido_con UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Permisos del usuario compartido
    puede_editar BOOLEAN DEFAULT false,
    puede_agregar BOOLEAN DEFAULT false,
    
    -- Información de compartición
    mensaje TEXT, -- Mensaje opcional al compartir
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Opcional: fecha de expiración
    
    -- Constraint única: no se puede compartir la misma lista con el mismo usuario múltiples veces
    UNIQUE(lista_id, compartido_con)
);

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para favoritos
CREATE INDEX idx_favoritos_usuario_id ON favoritos(usuario_id);
CREATE INDEX idx_favoritos_servicio_id ON favoritos(servicio_id);
CREATE INDEX idx_favoritos_created_at ON favoritos(created_at DESC);
CREATE INDEX idx_favoritos_usuario_created ON favoritos(usuario_id, created_at DESC);

-- Índices para listas de favoritos
CREATE INDEX idx_listas_favoritos_usuario_id ON listas_favoritos(usuario_id);
CREATE INDEX idx_listas_favoritos_publica ON listas_favoritos(publica);
CREATE INDEX idx_listas_favoritos_orden ON listas_favoritos(usuario_id, orden);
CREATE INDEX idx_listas_favoritos_created_at ON listas_favoritos(created_at DESC);

-- Índices para la relación favoritos-lista
CREATE INDEX idx_favoritos_lista_lista_id ON favoritos_lista(lista_id);
CREATE INDEX idx_favoritos_lista_favorito_id ON favoritos_lista(favorito_id);
CREATE INDEX idx_favoritos_lista_orden ON favoritos_lista(lista_id, orden);

-- Índices para favoritos compartidos
CREATE INDEX idx_favoritos_compartidos_lista_id ON favoritos_compartidos(lista_id);
CREATE INDEX idx_favoritos_compartidos_compartido_con ON favoritos_compartidos(compartido_con);
CREATE INDEX idx_favoritos_compartidos_expires_at ON favoritos_compartidos(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================================================

-- Función para actualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_favorites_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER trigger_favoritos_updated_at 
    BEFORE UPDATE ON favoritos 
    FOR EACH ROW EXECUTE FUNCTION update_favorites_updated_at_column();

CREATE TRIGGER trigger_listas_favoritos_updated_at 
    BEFORE UPDATE ON listas_favoritos 
    FOR EACH ROW EXECUTE FUNCTION update_favorites_updated_at_column();

-- ============================================================================
-- FUNCIONES ÚTILES
-- ============================================================================

-- Función para verificar si un servicio es favorito de un usuario
CREATE OR REPLACE FUNCTION is_service_favorite(
    p_usuario_id UUID,
    p_servicio_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM favoritos 
        WHERE usuario_id = p_usuario_id AND servicio_id = p_servicio_id
    );
END;
$$ language 'plpgsql';

-- Función para obtener el conteo de favoritos de un servicio
CREATE OR REPLACE FUNCTION get_service_favorites_count(
    p_servicio_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    favorite_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO favorite_count
    FROM favoritos 
    WHERE servicio_id = p_servicio_id;
    
    RETURN COALESCE(favorite_count, 0);
END;
$$ language 'plpgsql';

-- Función para obtener servicios favoritos de un usuario con información completa
CREATE OR REPLACE FUNCTION get_user_favorites_with_details(
    p_usuario_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    favorito_id UUID,
    servicio_id UUID,
    servicio_titulo VARCHAR,
    servicio_categoria VARCHAR,
    servicio_precio_desde DECIMAL,
    servicio_precio_hasta DECIMAL,
    as_nombre VARCHAR,
    as_apellido VARCHAR,
    as_calificacion DECIMAL,
    nota_personal TEXT,
    fecha_agregado TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as favorito_id,
        s.id as servicio_id,
        s.titulo as servicio_titulo,
        c.nombre as servicio_categoria,
        s.precio_desde as servicio_precio_desde,
        s.precio_hasta as servicio_precio_hasta,
        pa.nombre as as_nombre,
        pa.apellido as as_apellido,
        COALESCE(AVG(cal.calificacion), 0) as as_calificacion,
        f.nota_personal,
        f.created_at as fecha_agregado
    FROM favoritos f
    JOIN servicios s ON f.servicio_id = s.id
    JOIN categorias c ON s.categoria_id = c.id
    JOIN perfiles_ases pa ON s.as_id = pa.id
    LEFT JOIN calificaciones cal ON pa.usuario_id = cal.calificado_id
    WHERE f.usuario_id = p_usuario_id
    GROUP BY f.id, s.id, c.nombre, pa.nombre, pa.apellido
    ORDER BY f.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ language 'plpgsql';

-- Función para limpiar favoritos compartidos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_shared_favorites()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM favoritos_compartidos 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ language 'plpgsql';

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista para obtener estadísticas de favoritos por usuario
CREATE VIEW user_favorites_stats AS
SELECT 
    u.id as usuario_id,
    u.email,
    COUNT(f.id) as total_favoritos,
    COUNT(DISTINCT lf.id) as total_listas,
    COUNT(DISTINCT fc.id) as listas_compartidas_conmigo,
    MAX(f.created_at) as ultimo_favorito_agregado
FROM usuarios u
LEFT JOIN favoritos f ON u.id = f.usuario_id
LEFT JOIN listas_favoritos lf ON u.id = lf.usuario_id
LEFT JOIN favoritos_compartidos fc ON u.id = fc.compartido_con
GROUP BY u.id, u.email;

-- Vista para obtener servicios más agregados a favoritos
CREATE VIEW popular_favorites AS
SELECT 
    s.id as servicio_id,
    s.titulo,
    c.nombre as categoria,
    COUNT(f.id) as veces_favorito,
    pa.nombre as as_nombre,
    pa.apellido as as_apellido
FROM servicios s
JOIN favoritos f ON s.id = f.servicio_id
JOIN categorias c ON s.categoria_id = c.id
JOIN perfiles_ases pa ON s.as_id = pa.id
GROUP BY s.id, s.titulo, c.nombre, pa.nombre, pa.apellido
ORDER BY veces_favorito DESC;

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Insertar lista por defecto para todos los usuarios existentes
-- (Se ejecutará solo si no existen listas para el usuario)
INSERT INTO listas_favoritos (usuario_id, nombre, descripcion, icono, orden)
SELECT 
    u.id,
    'Mis Favoritos',
    'Lista principal de servicios favoritos',
    'heart',
    0
FROM usuarios u
WHERE NOT EXISTS (
    SELECT 1 FROM listas_favoritos lf WHERE lf.usuario_id = u.id
);

-- ============================================================================
-- COMENTARIOS SOBRE EL DISEÑO
-- ============================================================================

/*
CARACTERÍSTICAS DEL SISTEMA DE FAVORITOS:

✅ FUNCIONALIDAD BÁSICA:
- Marcar/desmarcar servicios como favoritos
- Notas personales en cada favorito
- Verificación rápida si un servicio es favorito

✅ LISTAS PERSONALIZADAS:
- Crear listas temáticas (ej: "Para el hogar", "Urgentes")
- Organizar favoritos en categorías
- Personalización visual (color, icono)

✅ COMPARTIR FAVORITOS:
- Compartir listas con otros usuarios
- Permisos granulares (ver, editar, agregar)
- Sistema de expiración opcional

✅ PERFORMANCE:
- Índices optimizados para consultas frecuentes
- Funciones SQL para operaciones complejas
- Vistas para estadísticas rápidas

✅ EXTENSIBILIDAD:
- Metadata JSONB para futuras funcionalidades
- Sistema de orden personalizable
- Soporte para listas públicas

✅ INTEGRIDAD:
- Constraints para evitar duplicados
- Cascading deletes apropiados
- Validación de datos

CASOS DE USO SOPORTADOS:
1. Usuario marca servicio como favorito
2. Usuario crea lista "Plomeros de confianza"
3. Usuario comparte lista con familiares
4. As ve cuántas veces fue agregado a favoritos
5. Sistema muestra servicios más populares
6. Usuario organiza favoritos por prioridad

PRÓXIMOS PASOS:
1. Crear modelos TypeScript
2. Implementar controladores REST
3. Conectar con frontend existente
4. Agregar analytics de favoritos
*/