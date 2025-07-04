import { query } from '@/config/database';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export type BookingStatus = 
  | 'pendiente' 
  | 'confirmada' 
  | 'en_progreso' 
  | 'completada' 
  | 'cancelada' 
  | 'no_show' 
  | 'rechazada';

export type AvailabilityType = 
  | 'disponible' 
  | 'ocupado' 
  | 'bloqueado' 
  | 'descanso';

export type RecurrenceType = 
  | 'unica' 
  | 'diaria' 
  | 'semanal' 
  | 'quincenal' 
  | 'mensual';

export interface Reserva {
  id: string;
  explorador_id: string;
  as_id: string;
  servicio_id?: string;
  match_id?: string;
  fecha_servicio: string; // DATE
  hora_inicio: string; // TIME
  hora_fin: string; // TIME
  duracion_estimada: number; // minutos
  estado: BookingStatus;
  fecha_confirmacion?: Date;
  fecha_cancelacion?: Date;
  razon_cancelacion?: string;
  cancelado_por?: string;
  direccion_servicio: string;
  latitud_servicio?: number;
  longitud_servicio?: number;
  es_remoto: boolean;
  titulo_servicio: string;
  descripcion_trabajo?: string;
  precio_acordado: number;
  precio_por_hora?: number;
  hora_inicio_real?: Date;
  hora_fin_real?: Date;
  tiempo_total_minutos?: number;
  recordatorio_24h_enviado: boolean;
  recordatorio_1h_enviado: boolean;
  notificacion_inicio_enviada: boolean;
  calificacion_enviada: boolean;
  encuesta_completada: boolean;
  pago_requerido: boolean;
  pago_procesado: boolean;
  fecha_pago?: Date;
  metodo_pago?: string;
  notas_explorador?: string;
  notas_as?: string;
  instrucciones_especiales?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DisponibilidadAs {
  id: string;
  as_id: string;
  fecha: string; // DATE
  hora_inicio: string; // TIME
  hora_fin: string; // TIME
  estado: AvailabilityType;
  duracion_minutos: number;
  precio_por_hora?: number;
  servicios_incluidos?: string[];
  tipo_recurrencia: RecurrenceType;
  fecha_fin_recurrencia?: string;
  dias_semana?: number[];
  notas?: string;
  ubicacion_especifica?: string;
  es_remoto: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface BloqueoDisponibilidad {
  id: string;
  as_id: string;
  fecha_inicio: string;
  hora_inicio?: string;
  fecha_fin: string;
  hora_fin?: string;
  motivo: string;
  descripcion?: string;
  es_bloqueo_completo: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PlantillaHorario {
  id: string;
  as_id: string;
  nombre: string;
  descripcion?: string;
  es_plantilla_default: boolean;
  configuracion: any; // JSONB
  activa: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ConfiguracionRecordatorios {
  id: string;
  usuario_id: string;
  recordatorio_24h: boolean;
  recordatorio_2h: boolean;
  recordatorio_30m: boolean;
  via_whatsapp: boolean;
  via_push: boolean;
  via_email: boolean;
  recordatorio_nueva_reserva: boolean;
  recordatorio_cancelacion: boolean;
  created_at: Date;
  updated_at: Date;
}

// Interfaces para creación y filtros
export interface CreateReservaData {
  explorador_id: string;
  as_id: string;
  servicio_id?: string;
  match_id?: string;
  fecha_servicio: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_estimada: number;
  direccion_servicio: string;
  latitud_servicio?: number;
  longitud_servicio?: number;
  es_remoto?: boolean;
  titulo_servicio: string;
  descripcion_trabajo?: string;
  precio_acordado: number;
  precio_por_hora?: number;
  notas_explorador?: string;
  instrucciones_especiales?: string;
}

export interface CreateDisponibilidadData {
  as_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  duracion_minutos?: number;
  precio_por_hora?: number;
  servicios_incluidos?: string[];
  tipo_recurrencia?: RecurrenceType;
  fecha_fin_recurrencia?: string;
  dias_semana?: number[];
  notas?: string;
  ubicacion_especifica?: string;
  es_remoto?: boolean;
}

// =============================================================================
// MODELO: RESERVAS
// =============================================================================

export class ReservasModel {
  
  // Crear nueva reserva
  static async create(data: CreateReservaData): Promise<Reserva> {
    const result = await query(`
      INSERT INTO reservas (
        explorador_id, as_id, servicio_id, match_id,
        fecha_servicio, hora_inicio, hora_fin, duracion_estimada,
        direccion_servicio, latitud_servicio, longitud_servicio, es_remoto,
        titulo_servicio, descripcion_trabajo, precio_acordado, precio_por_hora,
        notas_explorador, instrucciones_especiales
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *
    `, [
      data.explorador_id, data.as_id, data.servicio_id, data.match_id,
      data.fecha_servicio, data.hora_inicio, data.hora_fin, data.duracion_estimada,
      data.direccion_servicio, data.latitud_servicio, data.longitud_servicio, data.es_remoto || false,
      data.titulo_servicio, data.descripcion_trabajo, data.precio_acordado, data.precio_por_hora,
      data.notas_explorador, data.instrucciones_especiales
    ]);
    
    return result.rows[0];
  }

  // Obtener reserva por ID
  static async findById(id: string): Promise<Reserva | null> {
    const result = await query('SELECT * FROM reservas WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  // Obtener reservas de un usuario (AS o Explorador)
  static async findByUser(
    userId: string, 
    role: 'as' | 'explorador',
    page: number = 1,
    limit: number = 20,
    estado?: BookingStatus
  ): Promise<{ reservas: Reserva[], total: number, hasMore: boolean }> {
    const offset = (page - 1) * limit;
    const field = role === 'as' ? 'as_id' : 'explorador_id';
    
    let whereClause = `${field} = $1`;
    const params = [userId];
    
    if (estado) {
      whereClause += ` AND estado = $${params.length + 1}`;
      params.push(estado);
    }
    
    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) FROM reservas WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);
    
    // Obtener reservas paginadas
    const result = await query(`
      SELECT r.*, 
             pa.nombre as as_nombre, pa.apellido as as_apellido, pa.telefono as as_telefono,
             pe.nombre as explorador_nombre, pe.apellido as explorador_apellido, pe.telefono as explorador_telefono,
             s.titulo as servicio_titulo
      FROM reservas r
      LEFT JOIN perfiles_ases pa ON r.as_id = pa.usuario_id
      LEFT JOIN perfiles_exploradores pe ON r.explorador_id = pe.usuario_id  
      LEFT JOIN servicios s ON r.servicio_id = s.id
      WHERE ${whereClause}
      ORDER BY fecha_servicio DESC, hora_inicio DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);
    
    return {
      reservas: result.rows,
      total,
      hasMore: offset + result.rows.length < total
    };
  }

  // Verificar disponibilidad para una nueva reserva
  static async checkAvailability(
    asId: string,
    fecha: string,
    horaInicio: string,
    horaFin: string,
    excludeReservaId?: string
  ): Promise<boolean> {
    let whereClause = `
      as_id = $1 
      AND fecha_servicio = $2 
      AND estado IN ('pendiente', 'confirmada', 'en_progreso')
      AND (hora_inicio < $4 AND hora_fin > $3)
    `;
    const params = [asId, fecha, horaInicio, horaFin];
    
    if (excludeReservaId) {
      whereClause += ` AND id != $${params.length + 1}`;
      params.push(excludeReservaId);
    }
    
    const result = await query(
      `SELECT COUNT(*) FROM reservas WHERE ${whereClause}`,
      params
    );
    
    return parseInt(result.rows[0].count) === 0;
  }

  // Actualizar estado de reserva
  static async updateStatus(
    reservaId: string,
    nuevoEstado: BookingStatus,
    cambiadoPor?: string,
    motivo?: string
  ): Promise<Reserva | null> {
    const updates = ['estado = $2'];
    const params = [reservaId, nuevoEstado];
    
    if (nuevoEstado === 'confirmada') {
      updates.push('fecha_confirmacion = NOW()');
    } else if (nuevoEstado === 'cancelada') {
      updates.push('fecha_cancelacion = NOW()');
      if (cambiadoPor) {
        updates.push(`cancelado_por = $${params.length + 1}`);
        params.push(cambiadoPor);
      }
      if (motivo) {
        updates.push(`razon_cancelacion = $${params.length + 1}`);
        params.push(motivo);
      }
    }
    
    const result = await query(`
      UPDATE reservas 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, params);
    
    return result.rows[0] || null;
  }

  // Iniciar servicio (marcar como en progreso)
  static async startService(reservaId: string): Promise<Reserva | null> {
    const result = await query(`
      UPDATE reservas 
      SET estado = 'en_progreso', 
          hora_inicio_real = NOW(),
          updated_at = NOW()
      WHERE id = $1 AND estado = 'confirmada'
      RETURNING *
    `, [reservaId]);
    
    return result.rows[0] || null;
  }

  // Finalizar servicio
  static async finishService(
    reservaId: string, 
    tiempoRealMinutos?: number
  ): Promise<Reserva | null> {
    const updates = [
      'estado = \'completada\'',
      'hora_fin_real = NOW()'
    ];
    const params = [reservaId];
    
    if (tiempoRealMinutos) {
      updates.push(`tiempo_total_minutos = $${params.length + 1}`);
      params.push(tiempoRealMinutos.toString());
    }
    
    const result = await query(`
      UPDATE reservas 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $1 AND estado = 'en_progreso'
      RETURNING *
    `, params);
    
    return result.rows[0] || null;
  }

  // Obtener reservas próximas para recordatorios
  static async getUpcomingReservations(
    hoursAhead: number = 24
  ): Promise<Reserva[]> {
    const result = await query(`
      SELECT * FROM reservas 
      WHERE estado IN ('confirmada', 'pendiente')
      AND fecha_servicio = CURRENT_DATE
      AND (CURRENT_TIMESTAMP + INTERVAL '${hoursAhead} hours') >= 
          (fecha_servicio + hora_inicio)::timestamp
      AND (fecha_servicio + hora_inicio)::timestamp > CURRENT_TIMESTAMP
      ORDER BY fecha_servicio, hora_inicio
    `);
    
    return result.rows;
  }

  // Marcar recordatorio como enviado
  static async markReminderSent(
    reservaId: string,
    reminderType: '24h' | '1h'
  ): Promise<void> {
    const field = reminderType === '24h' ? 'recordatorio_24h_enviado' : 'recordatorio_1h_enviado';
    
    await query(`
      UPDATE reservas 
      SET ${field} = TRUE, updated_at = NOW()
      WHERE id = $1
    `, [reservaId]);
  }

  // Obtener estadísticas de reservas de un AS
  static async getAsStats(asId: string, days: number = 30): Promise<any> {
    const result = await query(`
      SELECT 
        COUNT(*) as total_reservas,
        COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
        COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
        COUNT(*) FILTER (WHERE estado = 'no_show') as no_shows,
        AVG(precio_acordado) FILTER (WHERE estado = 'completada') as precio_promedio,
        SUM(precio_acordado) FILTER (WHERE estado = 'completada') as ingresos_totales,
        AVG(tiempo_total_minutos) FILTER (WHERE tiempo_total_minutos IS NOT NULL) as duracion_promedio
      FROM reservas 
      WHERE as_id = $1 
      AND created_at >= NOW() - INTERVAL '${days} days'
    `, [asId]);
    
    return result.rows[0];
  }
}

// =============================================================================
// MODELO: DISPONIBILIDAD
// =============================================================================

export class DisponibilidadModel {
  
  // Crear slot de disponibilidad
  static async create(data: CreateDisponibilidadData): Promise<DisponibilidadAs> {
    const result = await query(`
      INSERT INTO disponibilidad_ases (
        as_id, fecha, hora_inicio, hora_fin, duracion_minutos,
        precio_por_hora, servicios_incluidos, tipo_recurrencia,
        fecha_fin_recurrencia, dias_semana, notas, ubicacion_especifica, es_remoto
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING *
    `, [
      data.as_id, data.fecha, data.hora_inicio, data.hora_fin,
      data.duracion_minutos || 60, data.precio_por_hora, data.servicios_incluidos,
      data.tipo_recurrencia || 'unica', data.fecha_fin_recurrencia,
      data.dias_semana, data.notas, data.ubicacion_especifica, data.es_remoto || false
    ]);
    
    return result.rows[0];
  }

  // Obtener disponibilidad de un AS
  static async getAvailableSlots(
    asId: string,
    fechaInicio: string,
    fechaFin: string,
    servicioId?: string
  ): Promise<DisponibilidadAs[]> {
    let whereClause = `
      as_id = $1 
      AND fecha BETWEEN $2 AND $3 
      AND estado = 'disponible'
    `;
    const params = [asId, fechaInicio, fechaFin];
    
    if (servicioId) {
      whereClause += ` AND ($${params.length + 1} = ANY(servicios_incluidos) OR servicios_incluidos IS NULL)`;
      params.push(servicioId);
    }
    
    const result = await query(`
      SELECT * FROM disponibilidad_ases 
      WHERE ${whereClause}
      ORDER BY fecha, hora_inicio
    `, params);
    
    return result.rows;
  }

  // Bloquear slot (cambiar estado a ocupado)
  static async blockSlot(slotId: string): Promise<boolean> {
    const result = await query(`
      UPDATE disponibilidad_ases 
      SET estado = 'ocupado', updated_at = NOW()
      WHERE id = $1 AND estado = 'disponible'
    `, [slotId]);
    
    return result.rowCount > 0;
  }

  // Liberar slot (cambiar estado a disponible)
  static async freeSlot(slotId: string): Promise<boolean> {
    const result = await query(`
      UPDATE disponibilidad_ases 
      SET estado = 'disponible', updated_at = NOW()
      WHERE id = $1 AND estado = 'ocupado'
    `, [slotId]);
    
    return result.rowCount > 0;
  }

  // Crear bloqueo de disponibilidad
  static async createBlock(
    asId: string,
    fechaInicio: string,
    fechaFin: string,
    motivo: string,
    opciones: {
      horaInicio?: string;
      horaFin?: string;
      descripcion?: string;
      esBloqueoCompleto?: boolean;
    } = {}
  ): Promise<BloqueoDisponibilidad> {
    const result = await query(`
      INSERT INTO bloqueos_disponibilidad (
        as_id, fecha_inicio, fecha_fin, motivo,
        hora_inicio, hora_fin, descripcion, es_bloqueo_completo
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      asId, fechaInicio, fechaFin, motivo,
      opciones.horaInicio, opciones.horaFin, opciones.descripcion,
      opciones.esBloqueoCompleto ?? true
    ]);
    
    return result.rows[0];
  }

  // Eliminar bloqueo
  static async removeBlock(blockId: string): Promise<boolean> {
    const result = await query(`
      DELETE FROM bloqueos_disponibilidad WHERE id = $1
    `, [blockId]);
    
    return result.rowCount > 0;
  }
}

// =============================================================================
// MODELO: PLANTILLAS DE HORARIOS
// =============================================================================

export class PlantillasHorarioModel {
  
  // Crear plantilla
  static async create(
    asId: string,
    nombre: string,
    configuracion: any,
    opciones: {
      descripcion?: string;
      esDefault?: boolean;
    } = {}
  ): Promise<PlantillaHorario> {
    const result = await query(`
      INSERT INTO plantillas_horarios (
        as_id, nombre, descripcion, configuracion, es_plantilla_default
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      asId, nombre, opciones.descripcion, JSON.stringify(configuracion),
      opciones.esDefault || false
    ]);
    
    return result.rows[0];
  }

  // Obtener plantillas de un AS
  static async getByAs(asId: string): Promise<PlantillaHorario[]> {
    const result = await query(`
      SELECT * FROM plantillas_horarios 
      WHERE as_id = $1 AND activa = TRUE
      ORDER BY es_plantilla_default DESC, nombre
    `, [asId]);
    
    return result.rows;
  }

  // Aplicar plantilla (crear slots de disponibilidad)
  static async applyTemplate(
    templateId: string,
    fechaInicio: string,
    fechaFin: string
  ): Promise<void> {
    // Esta función requeriría lógica compleja para interpretar la configuración JSONB
    // y crear los slots correspondientes. Se implementaría según las necesidades específicas.
    throw new Error('Method not implemented - requires complex template parsing logic');
  }
}

// =============================================================================
// MODELO: CONFIGURACIÓN DE RECORDATORIOS
// =============================================================================

export class ConfiguracionRecordatoriosModel {
  
  // Obtener configuración de un usuario
  static async getByUser(userId: string): Promise<ConfiguracionRecordatorios | null> {
    const result = await query(`
      SELECT * FROM configuracion_recordatorios WHERE usuario_id = $1
    `, [userId]);
    
    return result.rows[0] || null;
  }

  // Actualizar configuración
  static async update(
    userId: string,
    config: Partial<Omit<ConfiguracionRecordatorios, 'id' | 'usuario_id' | 'created_at' | 'updated_at'>>
  ): Promise<ConfiguracionRecordatorios> {
    const fields = Object.keys(config).map((key, index) => `${key} = $${index + 2}`);
    const values = Object.values(config);
    
    const result = await query(`
      UPDATE configuracion_recordatorios 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE usuario_id = $1
      RETURNING *
    `, [userId, ...values]);
    
    return result.rows[0];
  }

  // Crear configuración inicial
  static async createDefault(userId: string): Promise<ConfiguracionRecordatorios> {
    const result = await query(`
      INSERT INTO configuracion_recordatorios (usuario_id)
      VALUES ($1)
      ON CONFLICT (usuario_id) DO UPDATE SET updated_at = NOW()
      RETURNING *
    `, [userId]);
    
    return result.rows[0];
  }
}