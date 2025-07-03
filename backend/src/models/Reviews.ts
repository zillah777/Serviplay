import { query } from '@/config/database';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface Calificacion {
  id: string;
  match_id: string;
  calificador_id: string;
  calificado_id: string;
  puntuacion: number;
  comentario?: string;
  puntualidad: number;
  calidad: number;
  comunicacion: number;
  precio_justo: number;
  publica: boolean;
  created_at: Date;
}

export interface CalificacionCompleta extends Calificacion {
  calificador_nombre: string;
  calificador_apellido: string;
  calificador_foto?: string;
  calificado_nombre: string;
  calificado_apellido: string;
  servicio_titulo?: string;
  busqueda_titulo?: string;
  match_fecha_contacto?: Date;
}

export interface EstadisticasCalificacion {
  usuario_id: string;
  total_calificaciones: number;
  promedio_general: number;
  promedio_puntualidad: number;
  promedio_calidad: number;
  promedio_comunicacion: number;
  promedio_precio_justo: number;
  distribucion_estrellas: {
    cinco: number;
    cuatro: number;
    tres: number;
    dos: number;
    una: number;
  };
  total_comentarios: number;
  ultima_calificacion: Date | null;
}

// ============================================================================
// MODELO: CALIFICACIONES
// ============================================================================

export class CalificacionesModel {
  
  // Crear nueva calificación
  static async create(calificacionData: {
    match_id: string;
    calificador_id: string;
    calificado_id: string;
    puntuacion: number;
    comentario?: string;
    puntualidad: number;
    calidad: number;
    comunicacion: number;
    precio_justo: number;
    publica?: boolean;
  }): Promise<Calificacion> {
    const result = await query(
      `INSERT INTO calificaciones (
        match_id, calificador_id, calificado_id, puntuacion, comentario,
        puntualidad, calidad, comunicacion, precio_justo, publica
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        calificacionData.match_id,
        calificacionData.calificador_id,
        calificacionData.calificado_id,
        calificacionData.puntuacion,
        calificacionData.comentario || null,
        calificacionData.puntualidad,
        calificacionData.calidad,
        calificacionData.comunicacion,
        calificacionData.precio_justo,
        calificacionData.publica !== false // Default true
      ]
    );
    
    return result.rows[0];
  }
  
  // Verificar si ya existe calificación entre usuarios para un match
  static async existsForMatch(
    matchId: string,
    calificadorId: string,
    calificadoId: string
  ): Promise<boolean> {
    const result = await query(
      `SELECT id FROM calificaciones 
       WHERE match_id = $1 AND calificador_id = $2 AND calificado_id = $3`,
      [matchId, calificadorId, calificadoId]
    );
    
    return result.rows.length > 0;
  }
  
  // Obtener calificación por ID
  static async findById(calificacionId: string): Promise<CalificacionCompleta | null> {
    const result = await query(
      `SELECT 
        c.*,
        
        -- Información del calificador
        u1.nombre as calificador_nombre,
        u1.apellido as calificador_apellido,
        CASE 
          WHEN pa1.id IS NOT NULL THEN pa1.foto_perfil
          WHEN pe1.id IS NOT NULL THEN pe1.foto_perfil
          ELSE NULL
        END as calificador_foto,
        
        -- Información del calificado
        u2.nombre as calificado_nombre,
        u2.apellido as calificado_apellido,
        
        -- Información del match/servicio
        s.titulo as servicio_titulo,
        bs.titulo as busqueda_titulo,
        m.fecha_contacto as match_fecha_contacto
        
       FROM calificaciones c
       JOIN usuarios u1 ON c.calificador_id = u1.id
       JOIN usuarios u2 ON c.calificado_id = u2.id
       LEFT JOIN matches m ON c.match_id = m.id
       LEFT JOIN servicios s ON m.servicio_id = s.id
       LEFT JOIN busquedas_servicios bs ON m.busqueda_id = bs.id
       LEFT JOIN perfiles_ases pa1 ON u1.id = pa1.usuario_id
       LEFT JOIN perfiles_exploradores pe1 ON u1.id = pe1.usuario_id
       WHERE c.id = $1`,
      [calificacionId]
    );
    
    return result.rows[0] || null;
  }
  
  // Obtener calificaciones recibidas por un usuario
  static async getReceivedByUser(
    usuarioId: string,
    page: number = 1,
    limit: number = 20,
    filtros?: {
      solo_publicas?: boolean;
      puntuacion_min?: number;
      con_comentario?: boolean;
    }
  ): Promise<{
    calificaciones: CalificacionCompleta[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    
    let whereConditions = ['c.calificado_id = $1'];
    let params: any[] = [usuarioId];
    let paramCount = 1;
    
    if (filtros?.solo_publicas) {
      whereConditions.push('c.publica = true');
    }
    
    if (filtros?.puntuacion_min) {
      paramCount++;
      whereConditions.push(`c.puntuacion >= $${paramCount}`);
      params.push(filtros.puntuacion_min);
    }
    
    if (filtros?.con_comentario) {
      whereConditions.push('c.comentario IS NOT NULL AND LENGTH(c.comentario) > 0');
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM calificaciones c WHERE ${whereClause}`,
      params
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener calificaciones con información completa
    params.push(limit, offset);
    const result = await query(
      `SELECT 
        c.*,
        
        -- Información del calificador
        u1.nombre as calificador_nombre,
        u1.apellido as calificador_apellido,
        CASE 
          WHEN pa1.id IS NOT NULL THEN pa1.foto_perfil
          WHEN pe1.id IS NOT NULL THEN pe1.foto_perfil
          ELSE NULL
        END as calificador_foto,
        
        -- Información del calificado
        u2.nombre as calificado_nombre,
        u2.apellido as calificado_apellido,
        
        -- Información del match/servicio
        s.titulo as servicio_titulo,
        bs.titulo as busqueda_titulo,
        m.fecha_contacto as match_fecha_contacto
        
       FROM calificaciones c
       JOIN usuarios u1 ON c.calificador_id = u1.id
       JOIN usuarios u2 ON c.calificado_id = u2.id
       LEFT JOIN matches m ON c.match_id = m.id
       LEFT JOIN servicios s ON m.servicio_id = s.id
       LEFT JOIN busquedas_servicios bs ON m.busqueda_id = bs.id
       LEFT JOIN perfiles_ases pa1 ON u1.id = pa1.usuario_id
       LEFT JOIN perfiles_exploradores pe1 ON u1.id = pe1.usuario_id
       WHERE ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );
    
    return {
      calificaciones: result.rows,
      total,
      hasMore: offset + limit < total
    };
  }
  
  // Obtener calificaciones dadas por un usuario
  static async getGivenByUser(
    usuarioId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    calificaciones: CalificacionCompleta[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    
    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM calificaciones c WHERE c.calificador_id = $1`,
      [usuarioId]
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener calificaciones
    const result = await query(
      `SELECT 
        c.*,
        
        -- Información del calificador
        u1.nombre as calificador_nombre,
        u1.apellido as calificador_apellido,
        
        -- Información del calificado
        u2.nombre as calificado_nombre,
        u2.apellido as calificado_apellido,
        CASE 
          WHEN pa2.id IS NOT NULL THEN pa2.foto_perfil
          WHEN pe2.id IS NOT NULL THEN pe2.foto_perfil
          ELSE NULL
        END as calificado_foto,
        
        -- Información del match/servicio
        s.titulo as servicio_titulo,
        bs.titulo as busqueda_titulo,
        m.fecha_contacto as match_fecha_contacto
        
       FROM calificaciones c
       JOIN usuarios u1 ON c.calificador_id = u1.id
       JOIN usuarios u2 ON c.calificado_id = u2.id
       LEFT JOIN matches m ON c.match_id = m.id
       LEFT JOIN servicios s ON m.servicio_id = s.id
       LEFT JOIN busquedas_servicios bs ON m.busqueda_id = bs.id
       LEFT JOIN perfiles_ases pa2 ON u2.id = pa2.usuario_id
       LEFT JOIN perfiles_exploradores pe2 ON u2.id = pe2.usuario_id
       WHERE c.calificador_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [usuarioId, limit, offset]
    );
    
    return {
      calificaciones: result.rows,
      total,
      hasMore: offset + limit < total
    };
  }
  
  // Obtener estadísticas completas de un usuario
  static async getUserStats(usuarioId: string): Promise<EstadisticasCalificacion> {
    const result = await query(
      `SELECT 
        COUNT(*) as total_calificaciones,
        COALESCE(ROUND(AVG(puntuacion), 2), 0) as promedio_general,
        COALESCE(ROUND(AVG(puntualidad), 2), 0) as promedio_puntualidad,
        COALESCE(ROUND(AVG(calidad), 2), 0) as promedio_calidad,
        COALESCE(ROUND(AVG(comunicacion), 2), 0) as promedio_comunicacion,
        COALESCE(ROUND(AVG(precio_justo), 2), 0) as promedio_precio_justo,
        
        -- Distribución de estrellas
        COUNT(CASE WHEN puntuacion = 5 THEN 1 END) as cinco_estrellas,
        COUNT(CASE WHEN puntuacion = 4 THEN 1 END) as cuatro_estrellas,
        COUNT(CASE WHEN puntuacion = 3 THEN 1 END) as tres_estrellas,
        COUNT(CASE WHEN puntuacion = 2 THEN 1 END) as dos_estrellas,
        COUNT(CASE WHEN puntuacion = 1 THEN 1 END) as una_estrella,
        
        COUNT(CASE WHEN comentario IS NOT NULL AND LENGTH(comentario) > 0 THEN 1 END) as total_comentarios,
        MAX(created_at) as ultima_calificacion
        
       FROM calificaciones 
       WHERE calificado_id = $1`,
      [usuarioId]
    );
    
    const row = result.rows[0];
    
    return {
      usuario_id: usuarioId,
      total_calificaciones: parseInt(row.total_calificaciones),
      promedio_general: parseFloat(row.promedio_general),
      promedio_puntualidad: parseFloat(row.promedio_puntualidad),
      promedio_calidad: parseFloat(row.promedio_calidad),
      promedio_comunicacion: parseFloat(row.promedio_comunicacion),
      promedio_precio_justo: parseFloat(row.promedio_precio_justo),
      distribucion_estrellas: {
        cinco: parseInt(row.cinco_estrellas),
        cuatro: parseInt(row.cuatro_estrellas),
        tres: parseInt(row.tres_estrellas),
        dos: parseInt(row.dos_estrellas),
        una: parseInt(row.una_estrella)
      },
      total_comentarios: parseInt(row.total_comentarios),
      ultima_calificacion: row.ultima_calificacion
    };
  }
  
  // Obtener calificaciones pendientes para un usuario
  static async getPendingReviews(usuarioId: string): Promise<any[]> {
    const result = await query(
      `SELECT 
        m.id as match_id,
        s.titulo as servicio_titulo,
        bs.titulo as busqueda_titulo,
        
        -- Información del otro usuario (el que hay que calificar)
        CASE 
          WHEN m.as_id = (
            SELECT pa.id FROM perfiles_ases pa WHERE pa.usuario_id = $1
          ) THEN pe.usuario_id
          ELSE pa.usuario_id
        END as usuario_a_calificar_id,
        
        CASE 
          WHEN m.as_id = (
            SELECT pa.id FROM perfiles_ases pa WHERE pa.usuario_id = $1
          ) THEN u_exp.nombre
          ELSE u_as.nombre
        END as usuario_a_calificar_nombre,
        
        CASE 
          WHEN m.as_id = (
            SELECT pa.id FROM perfiles_ases pa WHERE pa.usuario_id = $1
          ) THEN u_exp.apellido
          ELSE u_as.apellido
        END as usuario_a_calificar_apellido,
        
        m.fecha_contacto,
        m.estado as match_estado
        
       FROM matches m
       JOIN servicios s ON m.servicio_id = s.id
       JOIN busquedas_servicios bs ON m.busqueda_id = bs.id
       JOIN perfiles_ases pa ON m.as_id = pa.id
       JOIN perfiles_exploradores pe ON m.explorador_id = pe.id
       JOIN usuarios u_as ON pa.usuario_id = u_as.id
       JOIN usuarios u_exp ON pe.usuario_id = u_exp.id
       
       WHERE (pa.usuario_id = $1 OR pe.usuario_id = $1)
         AND m.estado = 'completado'
         AND NOT EXISTS (
           SELECT 1 FROM calificaciones c 
           WHERE c.match_id = m.id 
           AND c.calificador_id = $1
         )
       
       ORDER BY m.fecha_contacto DESC`,
      [usuarioId]
    );
    
    return result.rows;
  }
  
  // Actualizar calificación
  static async update(
    calificacionId: string,
    calificadorId: string,
    updates: Partial<Calificacion>
  ): Promise<Calificacion | null> {
    const allowedUpdates = ['puntuacion', 'comentario', 'puntualidad', 'calidad', 'comunicacion', 'precio_justo', 'publica'];
    const updateFields = Object.keys(updates).filter(key => allowedUpdates.includes(key));
    
    if (updateFields.length === 0) {
      throw new Error('No hay campos válidos para actualizar');
    }
    
    const setClause = updateFields.map((key, index) => `${key} = $${index + 3}`).join(', ');
    const values = [calificacionId, calificadorId, ...updateFields.map(key => (updates as any)[key])];
    
    const result = await query(
      `UPDATE calificaciones 
       SET ${setClause}
       WHERE id = $1 AND calificador_id = $2
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }
  
  // Eliminar calificación (solo el calificador puede eliminar)
  static async delete(calificacionId: string, calificadorId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM calificaciones 
       WHERE id = $1 AND calificador_id = $2
       RETURNING id`,
      [calificacionId, calificadorId]
    );
    
    return result.rows.length > 0;
  }
  
  // Obtener calificaciones más recientes del sistema (para admin/public)
  static async getRecentPublicReviews(limit: number = 10): Promise<CalificacionCompleta[]> {
    const result = await query(
      `SELECT 
        c.*,
        u1.nombre as calificador_nombre,
        u1.apellido as calificador_apellido,
        u2.nombre as calificado_nombre,
        u2.apellido as calificado_apellido,
        s.titulo as servicio_titulo
        
       FROM calificaciones c
       JOIN usuarios u1 ON c.calificador_id = u1.id
       JOIN usuarios u2 ON c.calificado_id = u2.id
       LEFT JOIN matches m ON c.match_id = m.id
       LEFT JOIN servicios s ON m.servicio_id = s.id
       
       WHERE c.publica = true 
         AND c.comentario IS NOT NULL 
         AND LENGTH(c.comentario) > 0
       ORDER BY c.created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  }
  
  // Reportar calificación inapropiada
  static async reportReview(
    calificacionId: string,
    reportadoPor: string,
    razon: string
  ): Promise<boolean> {
    // TODO: Implementar sistema de reportes
    // Por ahora, podríamos agregar a una tabla de reportes
    console.log(`Review ${calificacionId} reported by ${reportadoPor} for: ${razon}`);
    return true;
  }
}