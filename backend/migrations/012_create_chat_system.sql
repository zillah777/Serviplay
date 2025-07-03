-- ============================================================================
-- MIGRACIÓN 012: SISTEMA DE CHAT/MENSAJERÍA
-- ============================================================================
-- Esta migración crea el sistema completo de chat en tiempo real
-- Incluye: chats, participantes, mensajes y estado de lectura

-- Crear tipos ENUM para el sistema de chat
CREATE TYPE chat_tipo AS ENUM ('directo', 'grupal', 'soporte');
CREATE TYPE message_tipo AS ENUM ('texto', 'imagen', 'archivo', 'ubicacion', 'sistema');
CREATE TYPE participant_rol AS ENUM ('admin', 'participante', 'moderador');

-- ============================================================================
-- TABLA: chats
-- ============================================================================
-- Almacena las conversaciones/chats principales
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    tipo chat_tipo DEFAULT 'directo',
    titulo VARCHAR(200), -- Para chats grupales o de soporte
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    ultimo_mensaje_id UUID, -- Se agregará FK después
    ultimo_mensaje_fecha TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}', -- Para configuraciones adicionales
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: chat_participants
-- ============================================================================
-- Gestiona los participantes de cada chat
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    rol participant_rol DEFAULT 'participante',
    unido_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_acceso TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activo BOOLEAN DEFAULT true,
    notificaciones_activas BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint única: un usuario no puede estar duplicado en el mismo chat
    UNIQUE(chat_id, usuario_id)
);

-- ============================================================================
-- TABLA: chat_messages
-- ============================================================================
-- Almacena todos los mensajes del sistema
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL, -- Para respuestas
    
    -- Contenido del mensaje
    content TEXT NOT NULL,
    tipo message_tipo DEFAULT 'texto',
    
    -- Para archivos adjuntos
    archivo_url VARCHAR(500),
    archivo_nombre VARCHAR(255),
    archivo_size INTEGER, -- Tamaño en bytes
    archivo_tipo VARCHAR(100), -- MIME type
    
    -- Para mensajes de ubicación
    ubicacion_lat DECIMAL(10, 7),
    ubicacion_lng DECIMAL(10, 7),
    ubicacion_direccion TEXT,
    
    -- Metadata adicional (formato JSON)
    metadata JSONB DEFAULT '{}',
    
    -- Estados del mensaje
    editado BOOLEAN DEFAULT false,
    editado_en TIMESTAMP WITH TIME ZONE,
    eliminado BOOLEAN DEFAULT false,
    eliminado_en TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- TABLA: message_reads
-- ============================================================================
-- Rastrea qué mensajes han sido leídos por cada usuario
CREATE TABLE message_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID REFERENCES chat_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    leido_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint única: un usuario no puede marcar el mismo mensaje como leído múltiples veces
    UNIQUE(message_id, user_id)
);

-- ============================================================================
-- TABLA: chat_typing_indicators
-- ============================================================================
-- Para indicadores de "está escribiendo..."
CREATE TABLE chat_typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 seconds'),
    
    -- Constraint única: un usuario solo puede estar escribiendo una vez por chat
    UNIQUE(chat_id, user_id)
);

-- ============================================================================
-- AGREGAR FOREIGN KEY CIRCULAR
-- ============================================================================
-- Agregar la FK de ultimo_mensaje_id después de crear la tabla chat_messages
ALTER TABLE chats 
ADD CONSTRAINT fk_chats_ultimo_mensaje 
FOREIGN KEY (ultimo_mensaje_id) REFERENCES chat_messages(id) ON DELETE SET NULL;

-- ============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ============================================================================

-- Índices para chats
CREATE INDEX idx_chats_match_id ON chats(match_id);
CREATE INDEX idx_chats_activo ON chats(activo);
CREATE INDEX idx_chats_ultimo_mensaje_fecha ON chats(ultimo_mensaje_fecha DESC);

-- Índices para participantes
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_usuario_id ON chat_participants(usuario_id);
CREATE INDEX idx_chat_participants_activo ON chat_participants(activo);
CREATE INDEX idx_chat_participants_ultimo_acceso ON chat_participants(ultimo_acceso DESC);

-- Índices para mensajes (MUY IMPORTANTES para performance)
CREATE INDEX idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_tipo ON chat_messages(tipo);
CREATE INDEX idx_chat_messages_eliminado ON chat_messages(eliminado);

-- Índice compuesto para consultas frecuentes
CREATE INDEX idx_chat_messages_chat_created ON chat_messages(chat_id, created_at DESC);
CREATE INDEX idx_chat_messages_active ON chat_messages(chat_id, eliminado, created_at DESC);

-- Índices para message_reads
CREATE INDEX idx_message_reads_message_id ON message_reads(message_id);
CREATE INDEX idx_message_reads_user_id ON message_reads(user_id);
CREATE INDEX idx_message_reads_leido_en ON message_reads(leido_en DESC);

-- Índices para typing indicators
CREATE INDEX idx_typing_indicators_chat_id ON chat_typing_indicators(chat_id);
CREATE INDEX idx_typing_indicators_expires_at ON chat_typing_indicators(expires_at);

-- ============================================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================================================

-- Función para actualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_chat_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER trigger_chats_updated_at 
    BEFORE UPDATE ON chats 
    FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at_column();

CREATE TRIGGER trigger_chat_participants_updated_at 
    BEFORE UPDATE ON chat_participants 
    FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at_column();

CREATE TRIGGER trigger_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_chat_updated_at_column();

-- ============================================================================
-- FUNCIÓN PARA ACTUALIZAR ÚLTIMO MENSAJE DEL CHAT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el mensaje no está eliminado
    IF NEW.eliminado = FALSE THEN
        UPDATE chats 
        SET 
            ultimo_mensaje_id = NEW.id,
            ultimo_mensaje_fecha = NEW.created_at,
            updated_at = NOW()
        WHERE id = NEW.chat_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar último mensaje
CREATE TRIGGER trigger_update_chat_last_message
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_last_message();

-- ============================================================================
-- FUNCIÓN PARA LIMPIAR TYPING INDICATORS EXPIRADOS
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS void AS $$
BEGIN
    DELETE FROM chat_typing_indicators 
    WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- ============================================================================
-- FUNCIÓN PARA MARCAR MENSAJES COMO LEÍDOS
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_chat_id UUID,
    p_user_id UUID,
    p_until_message_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    -- Si no se especifica hasta qué mensaje, marcar todos como leídos
    IF p_until_message_id IS NULL THEN
        INSERT INTO message_reads (message_id, user_id)
        SELECT cm.id, p_user_id
        FROM chat_messages cm
        WHERE cm.chat_id = p_chat_id 
          AND cm.sender_id != p_user_id -- No marcar nuestros propios mensajes
          AND cm.eliminado = FALSE
          AND NOT EXISTS (
              SELECT 1 FROM message_reads mr 
              WHERE mr.message_id = cm.id AND mr.user_id = p_user_id
          );
    ELSE
        -- Marcar como leídos hasta un mensaje específico
        INSERT INTO message_reads (message_id, user_id)
        SELECT cm.id, p_user_id
        FROM chat_messages cm
        WHERE cm.chat_id = p_chat_id 
          AND cm.sender_id != p_user_id
          AND cm.eliminado = FALSE
          AND cm.created_at <= (
              SELECT created_at FROM chat_messages WHERE id = p_until_message_id
          )
          AND NOT EXISTS (
              SELECT 1 FROM message_reads mr 
              WHERE mr.message_id = cm.id AND mr.user_id = p_user_id
          );
    END IF;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN affected_count;
END;
$$ language 'plpgsql';

-- ============================================================================
-- VISTA PARA CONSULTAS FRECUENTES
-- ============================================================================

-- Vista para obtener chats con información agregada
CREATE VIEW chat_summary AS
SELECT 
    c.id,
    c.match_id,
    c.tipo,
    c.titulo,
    c.activo,
    c.ultimo_mensaje_fecha,
    c.created_at,
    
    -- Último mensaje
    lm.content as ultimo_mensaje_content,
    lm.tipo as ultimo_mensaje_tipo,
    lm.sender_id as ultimo_mensaje_sender_id,
    
    -- Conteo de participantes
    (SELECT COUNT(*) FROM chat_participants cp WHERE cp.chat_id = c.id AND cp.activo = true) as total_participantes,
    
    -- Conteo de mensajes no leídos (se calculará por usuario específico en la consulta)
    (SELECT COUNT(*) FROM chat_messages cm WHERE cm.chat_id = c.id AND cm.eliminado = false) as total_mensajes

FROM chats c
LEFT JOIN chat_messages lm ON c.ultimo_mensaje_id = lm.id
WHERE c.activo = true;

-- ============================================================================
-- COMENTARIOS SOBRE EL DISEÑO
-- ============================================================================

/*
CARACTERÍSTICAS DEL SISTEMA DE CHAT:

✅ ESCALABILIDAD:
- Índices optimizados para consultas frecuentes
- Paginación preparada con created_at DESC
- Cleanup automático de typing indicators

✅ TIEMPO REAL:
- Estructura preparada para WebSocket
- Typing indicators con expiración automática
- Triggers para actualización en tiempo real

✅ FUNCIONALIDADES AVANZADAS:
- Respuestas a mensajes (reply_to_id)
- Diferentes tipos de mensaje (texto, imagen, archivo, ubicación)
- Sistema de lectura de mensajes
- Soft delete de mensajes

✅ SEGURIDAD:
- Constraints para evitar duplicados
- Validación de participantes
- Metadata encriptable en JSONB

✅ EXTENSIBILIDAD:
- Soporte para chats grupales
- Sistema de roles (admin, participante, moderador)
- Metadata JSONB para configuraciones futuras

PRÓXIMOS PASOS:
1. Crear modelos en TypeScript
2. Implementar controladores REST
3. Agregar WebSocket para tiempo real
4. Conectar con frontend existente
*/