-- =============================================================================
-- MIGRACIÓN 007: SISTEMA DE RESERVAS Y CITAS
-- =============================================================================

-- Crear tipos personalizados para el sistema de reservas
CREATE TYPE booking_status AS ENUM (
    'pendiente',      -- Reserva creada, esperando confirmación del AS
    'confirmada',     -- AS confirmó la reserva
    'en_progreso',    -- Servicio está siendo ejecutado
    'completada',     -- Servicio terminado exitosamente
    'cancelada',      -- Cancelada por cualquiera de las partes
    'no_show',        -- Cliente no se presentó
    'rechazada'       -- AS rechazó la reserva
);

CREATE TYPE availability_type AS ENUM (
    'disponible',     -- Slot disponible para reservar
    'ocupado',        -- Slot ya reservado
    'bloqueado',      -- AS bloqueó el slot (no disponible)
    'descanso'        -- Período de descanso del AS
);

CREATE TYPE recurrence_type AS ENUM (
    'unica',          -- Sin repetición
    'diaria',         -- Se repite diariamente
    'semanal',        -- Se repite semanalmente
    'quincenal',      -- Se repite cada 15 días
    'mensual'         -- Se repite mensualmente
);

-- =============================================================================
-- TABLA: DISPONIBILIDAD DE ASES
-- =============================================================================
CREATE TABLE disponibilidad_ases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    as_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Fecha y hora del slot
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    
    -- Estado del slot
    estado availability_type DEFAULT 'disponible',
    
    -- Configuración del slot
    duracion_minutos INTEGER NOT NULL DEFAULT 60,
    precio_por_hora DECIMAL(10,2),
    servicios_incluidos UUID[], -- IDs de servicios que puede ofrecer en este slot
    
    -- Recurrencia
    tipo_recurrencia recurrence_type DEFAULT 'unica',
    fecha_fin_recurrencia DATE, -- Para slots recurrentes
    dias_semana INTEGER[], -- Para recurrencia semanal [0=Domingo, 1=Lunes, etc.]
    
    -- Metadatos
    notas TEXT,
    ubicacion_especifica TEXT, -- Si es diferente a la ubicación del perfil
    es_remoto BOOLEAN DEFAULT FALSE,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Restricciones
    CONSTRAINT valid_time_range CHECK (hora_fin > hora_inicio),
    CONSTRAINT valid_duration CHECK (duracion_minutos > 0 AND duracion_minutos <= 480)
);

-- =============================================================================
-- TABLA: RESERVAS/CITAS
-- =============================================================================
CREATE TABLE reservas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Participantes
    explorador_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    as_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    servicio_id UUID REFERENCES servicios(id),
    match_id UUID REFERENCES matches(id), -- Relación con el match original
    
    -- Detalles de la reserva
    fecha_servicio DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_estimada INTEGER NOT NULL, -- En minutos
    
    -- Estado y flujo
    estado booking_status DEFAULT 'pendiente',
    fecha_confirmacion TIMESTAMP,
    fecha_cancelacion TIMESTAMP,
    razon_cancelacion TEXT,
    cancelado_por UUID REFERENCES usuarios(id),
    
    -- Ubicación del servicio
    direccion_servicio TEXT NOT NULL,
    latitud_servicio DECIMAL(10, 7),
    longitud_servicio DECIMAL(10, 7),
    es_remoto BOOLEAN DEFAULT FALSE,
    
    -- Detalles del servicio
    titulo_servicio VARCHAR(200) NOT NULL,
    descripcion_trabajo TEXT,
    precio_acordado DECIMAL(10,2) NOT NULL,
    precio_por_hora DECIMAL(10,2),
    
    -- Seguimiento del tiempo
    hora_inicio_real TIMESTAMP, -- Cuando realmente empezó el trabajo
    hora_fin_real TIMESTAMP,    -- Cuando realmente terminó
    tiempo_total_minutos INTEGER, -- Tiempo real trabajado
    
    -- Recordatorios y notificaciones
    recordatorio_24h_enviado BOOLEAN DEFAULT FALSE,
    recordatorio_1h_enviado BOOLEAN DEFAULT FALSE,
    notificacion_inicio_enviada BOOLEAN DEFAULT FALSE,
    
    -- Evaluación post-servicio
    calificacion_enviada BOOLEAN DEFAULT FALSE,
    encuesta_completada BOOLEAN DEFAULT FALSE,
    
    -- Pagos
    pago_requerido BOOLEAN DEFAULT TRUE,
    pago_procesado BOOLEAN DEFAULT FALSE,
    fecha_pago TIMESTAMP,
    metodo_pago VARCHAR(50),
    
    -- Notas adicionales
    notas_explorador TEXT,
    notas_as TEXT,
    instrucciones_especiales TEXT,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Restricciones
    CONSTRAINT valid_reservation_time CHECK (hora_fin > hora_inicio),
    CONSTRAINT valid_duration_check CHECK (duracion_estimada > 0),
    CONSTRAINT valid_price CHECK (precio_acordado >= 0),
    CONSTRAINT different_users CHECK (explorador_id != as_id)
);

-- =============================================================================
-- TABLA: HISTORIAL DE ESTADOS DE RESERVAS
-- =============================================================================
CREATE TABLE reservas_historial (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reserva_id UUID NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    
    estado_anterior booking_status,
    estado_nuevo booking_status NOT NULL,
    
    cambiado_por UUID REFERENCES usuarios(id),
    motivo TEXT,
    detalles JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- TABLA: BLOQUEOS TEMPORALES DE DISPONIBILIDAD
-- =============================================================================
CREATE TABLE bloqueos_disponibilidad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    as_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Período bloqueado
    fecha_inicio DATE NOT NULL,
    hora_inicio TIME,
    fecha_fin DATE NOT NULL,
    hora_fin TIME,
    
    -- Información del bloqueo
    motivo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    es_bloqueo_completo BOOLEAN DEFAULT TRUE, -- Si bloquea todo el día o solo un horario
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- TABLA: PLANTILLAS DE HORARIOS
-- =============================================================================
CREATE TABLE plantillas_horarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    as_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    es_plantilla_default BOOLEAN DEFAULT FALSE,
    
    -- Configuración de la plantilla (JSONB)
    configuracion JSONB NOT NULL,
    -- Ejemplo de configuración:
    -- {
    --   "lunes": {"activo": true, "inicio": "09:00", "fin": "18:00", "descansos": [{"inicio": "12:00", "fin": "13:00"}]},
    --   "martes": {"activo": true, "inicio": "09:00", "fin": "18:00", "descansos": []},
    --   ...
    --   "duracion_slot": 60,
    --   "buffer_entre_slots": 15
    -- }
    
    activa BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- TABLA: CONFIGURACIÓN DE RECORDATORIOS
-- =============================================================================
CREATE TABLE configuracion_recordatorios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Configuración de recordatorios
    recordatorio_24h BOOLEAN DEFAULT TRUE,
    recordatorio_2h BOOLEAN DEFAULT TRUE,
    recordatorio_30m BOOLEAN DEFAULT FALSE,
    
    -- Métodos de notificación
    via_whatsapp BOOLEAN DEFAULT TRUE,
    via_push BOOLEAN DEFAULT TRUE,
    via_email BOOLEAN DEFAULT FALSE,
    
    -- Configuración para AS
    recordatorio_nueva_reserva BOOLEAN DEFAULT TRUE,
    recordatorio_cancelacion BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(usuario_id)
);

-- =============================================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================================================

-- Índices para disponibilidad_ases
CREATE INDEX idx_disponibilidad_as_fecha ON disponibilidad_ases(as_id, fecha, hora_inicio);
CREATE INDEX idx_disponibilidad_estado ON disponibilidad_ases(estado);
CREATE INDEX idx_disponibilidad_recurrencia ON disponibilidad_ases(tipo_recurrencia, fecha_fin_recurrencia);
CREATE INDEX idx_disponibilidad_servicios ON disponibilidad_ases USING GIN(servicios_incluidos);

-- Índices para reservas
CREATE INDEX idx_reservas_explorador ON reservas(explorador_id, fecha_servicio DESC);
CREATE INDEX idx_reservas_as ON reservas(as_id, fecha_servicio DESC);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_reservas_fecha_servicio ON reservas(fecha_servicio, hora_inicio);
CREATE INDEX idx_reservas_ubicacion ON reservas(latitud_servicio, longitud_servicio);
CREATE INDEX idx_reservas_match ON reservas(match_id);
CREATE INDEX idx_reservas_servicio ON reservas(servicio_id);

-- Índices para búsquedas por fechas
CREATE INDEX idx_reservas_recordatorios_24h ON reservas(fecha_servicio, hora_inicio) 
WHERE recordatorio_24h_enviado = FALSE AND estado IN ('confirmada', 'pendiente');

CREATE INDEX idx_reservas_recordatorios_1h ON reservas(fecha_servicio, hora_inicio) 
WHERE recordatorio_1h_enviado = FALSE AND estado IN ('confirmada', 'pendiente');

-- Índices para bloqueos
CREATE INDEX idx_bloqueos_as_fechas ON bloqueos_disponibilidad(as_id, fecha_inicio, fecha_fin);

-- Índices para plantillas
CREATE INDEX idx_plantillas_as ON plantillas_horarios(as_id, activa);

-- =============================================================================
-- TRIGGERS PARA AUDITORÍA
-- =============================================================================

-- Trigger para actualizar updated_at en disponibilidad_ases
CREATE OR REPLACE FUNCTION update_disponibilidad_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_disponibilidad_updated_at
    BEFORE UPDATE ON disponibilidad_ases
    FOR EACH ROW
    EXECUTE FUNCTION update_disponibilidad_updated_at();

-- Trigger para actualizar updated_at en reservas
CREATE OR REPLACE FUNCTION update_reservas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_reservas_updated_at
    BEFORE UPDATE ON reservas
    FOR EACH ROW
    EXECUTE FUNCTION update_reservas_updated_at();

-- Trigger para registrar cambios de estado en reservas
CREATE OR REPLACE FUNCTION log_reserva_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo registrar si el estado realmente cambió
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO reservas_historial (reserva_id, estado_anterior, estado_nuevo, created_at)
        VALUES (NEW.id, OLD.estado, NEW.estado, NOW());
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_log_reserva_status_change
    AFTER UPDATE ON reservas
    FOR EACH ROW
    EXECUTE FUNCTION log_reserva_status_change();

-- =============================================================================
-- FUNCIONES ÚTILES
-- =============================================================================

-- Función para verificar disponibilidad de un AS en una fecha/hora específica
CREATE OR REPLACE FUNCTION check_as_availability(
    p_as_id UUID,
    p_fecha DATE,
    p_hora_inicio TIME,
    p_hora_fin TIME
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
    blocked_count INTEGER;
BEGIN
    -- Verificar conflictos con reservas existentes
    SELECT COUNT(*) INTO conflict_count
    FROM reservas
    WHERE as_id = p_as_id
    AND fecha_servicio = p_fecha
    AND estado IN ('pendiente', 'confirmada', 'en_progreso')
    AND (
        (hora_inicio < p_hora_fin AND hora_fin > p_hora_inicio)
    );
    
    -- Verificar bloqueos de disponibilidad
    SELECT COUNT(*) INTO blocked_count
    FROM bloqueos_disponibilidad
    WHERE as_id = p_as_id
    AND p_fecha BETWEEN fecha_inicio AND fecha_fin
    AND (
        es_bloqueo_completo = TRUE
        OR (
            p_hora_inicio < hora_fin AND p_hora_fin > hora_inicio
        )
    );
    
    RETURN (conflict_count = 0 AND blocked_count = 0);
END;
$$ LANGUAGE plpgsql;

-- Función para obtener slots disponibles de un AS en un rango de fechas
CREATE OR REPLACE FUNCTION get_available_slots(
    p_as_id UUID,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS TABLE (
    fecha DATE,
    hora_inicio TIME,
    hora_fin TIME,
    precio_por_hora DECIMAL,
    duracion_minutos INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.fecha,
        d.hora_inicio,
        d.hora_fin,
        d.precio_por_hora,
        d.duracion_minutos
    FROM disponibilidad_ases d
    WHERE d.as_id = p_as_id
    AND d.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
    AND d.estado = 'disponible'
    AND check_as_availability(p_as_id, d.fecha, d.hora_inicio, d.hora_fin)
    ORDER BY d.fecha, d.hora_inicio;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INSERTAR CONFIGURACIONES INICIALES
-- =============================================================================

-- Insertar configuración de recordatorios por defecto para usuarios existentes
INSERT INTO configuracion_recordatorios (usuario_id)
SELECT id FROM usuarios
ON CONFLICT (usuario_id) DO NOTHING;

-- =============================================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =============================================================================

COMMENT ON TABLE disponibilidad_ases IS 'Gestiona los slots de tiempo disponibles para cada AS';
COMMENT ON TABLE reservas IS 'Registro completo de todas las reservas/citas del sistema';
COMMENT ON TABLE reservas_historial IS 'Auditoría de cambios de estado en las reservas';
COMMENT ON TABLE bloqueos_disponibilidad IS 'Períodos donde el AS no está disponible';
COMMENT ON TABLE plantillas_horarios IS 'Plantillas de horarios reutilizables para los AS';
COMMENT ON TABLE configuracion_recordatorios IS 'Preferencias de notificaciones de cada usuario';

COMMENT ON COLUMN reservas.precio_acordado IS 'Precio final acordado para el servicio completo';
COMMENT ON COLUMN reservas.precio_por_hora IS 'Precio por hora si es aplicable';
COMMENT ON COLUMN reservas.duracion_estimada IS 'Duración estimada en minutos';
COMMENT ON COLUMN reservas.tiempo_total_minutos IS 'Tiempo real trabajado registrado por el sistema';