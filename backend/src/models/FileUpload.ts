import { query } from '@/config/database';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export type FileType = 'image' | 'document' | 'video' | 'audio' | 'other';
export type FileStatus = 'uploading' | 'processing' | 'ready' | 'failed' | 'deleted';
export type FileContext = 
  | 'profile_photo' 
  | 'service_image' 
  | 'service_gallery' 
  | 'verification_document' 
  | 'chat_attachment' 
  | 'review_image' 
  | 'portfolio_image' 
  | 'id_document' 
  | 'other';

export interface Archivo {
  id: string;
  nombre_original: string;
  nombre_archivo: string;
  extension: string;
  mime_type: string;
  tamaño: number;
  tipo: FileType;
  estado: FileStatus;
  contexto: FileContext;
  url_publica?: string;
  path_storage?: string;
  url_thumbnail?: string;
  ancho?: number;
  alto?: number;
  duracion?: number;
  subido_por?: string;
  ip_origen?: string;
  user_agent?: string;
  metadata?: any;
  publico: boolean;
  requiere_auth: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface ArchivoRelacion {
  id: string;
  archivo_id: string;
  entidad_tipo: string;
  entidad_id: string;
  campo?: string;
  orden: number;
  descripcion?: string;
  created_at: Date;
}

export interface ArchivoTemporal {
  id: string;
  archivo_id: string;
  token_temporal: string;
  usuario_id: string;
  expires_at: Date;
  created_at: Date;
}

export interface ConfiguracionArchivos {
  id: string;
  max_size_image: number;
  max_size_document: number;
  max_size_video: number;
  max_size_audio: number;
  allowed_image_types: string[];
  allowed_document_types: string[];
  allowed_video_types: string[];
  allowed_audio_types: string[];
  thumbnail_sizes: any;
  storage_provider: string;
  storage_config: any;
  cdn_enabled: boolean;
  cdn_base_url?: string;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// MODELO: ARCHIVOS
// ============================================================================

export class ArchivosModel {
  
  // Crear nuevo archivo
  static async create(archivoData: {
    nombre_original: string;
    extension: string;
    mime_type: string;
    tamaño: number;
    tipo: FileType;
    contexto?: FileContext;
    subido_por?: string;
    ip_origen?: string;
    user_agent?: string;
    metadata?: any;
    publico?: boolean;
    ancho?: number;
    alto?: number;
    duracion?: number;
  }): Promise<Archivo> {
    // Generar nombre único
    const nombreArchivoResult = await query(
      'SELECT generate_unique_filename($1, $2) as nombre_archivo',
      [archivoData.nombre_original, archivoData.extension]
    );
    
    const nombreArchivo = nombreArchivoResult.rows[0].nombre_archivo;
    
    const result = await query(
      `INSERT INTO archivos (
        nombre_original, nombre_archivo, extension, mime_type, tamaño, tipo, 
        contexto, subido_por, ip_origen, user_agent, metadata, publico,
        ancho, alto, duracion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        archivoData.nombre_original,
        nombreArchivo,
        archivoData.extension,
        archivoData.mime_type,
        archivoData.tamaño,
        archivoData.tipo,
        archivoData.contexto || 'other',
        archivoData.subido_por || null,
        archivoData.ip_origen || null,
        archivoData.user_agent || null,
        archivoData.metadata || null,
        archivoData.publico || false,
        archivoData.ancho || null,
        archivoData.alto || null,
        archivoData.duracion || null
      ]
    );
    
    return result.rows[0];
  }
  
  // Actualizar archivo (principalmente URLs y estado)
  static async update(
    archivoId: string, 
    updates: Partial<Archivo>
  ): Promise<Archivo | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [archivoId, ...Object.values(updates)];
    
    const result = await query(
      `UPDATE archivos 
       SET ${setClause}, updated_at = NOW() 
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }
  
  // Obtener archivo por ID
  static async findById(archivoId: string): Promise<Archivo | null> {
    const result = await query(
      'SELECT * FROM archivos WHERE id = $1 AND deleted_at IS NULL',
      [archivoId]
    );
    
    return result.rows[0] || null;
  }
  
  // Obtener archivos por usuario
  static async findByUser(
    usuarioId: string,
    page: number = 1,
    limit: number = 20,
    filtros?: {
      tipo?: FileType;
      contexto?: FileContext;
      estado?: FileStatus;
    }
  ): Promise<{
    archivos: Archivo[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    
    let whereConditions = ['subido_por = $1', 'deleted_at IS NULL'];
    let params: any[] = [usuarioId];
    let paramCount = 1;
    
    if (filtros?.tipo) {
      paramCount++;
      whereConditions.push(`tipo = $${paramCount}`);
      params.push(filtros.tipo);
    }
    
    if (filtros?.contexto) {
      paramCount++;
      whereConditions.push(`contexto = $${paramCount}`);
      params.push(filtros.contexto);
    }
    
    if (filtros?.estado) {
      paramCount++;
      whereConditions.push(`estado = $${paramCount}`);
      params.push(filtros.estado);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM archivos WHERE ${whereClause}`,
      params
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener archivos con paginación
    params.push(limit, offset);
    const result = await query(
      `SELECT * FROM archivos 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );
    
    return {
      archivos: result.rows,
      total,
      hasMore: offset + limit < total
    };
  }
  
  // Marcar archivo como eliminado (soft delete)
  static async softDelete(archivoId: string): Promise<boolean> {
    const result = await query(
      `UPDATE archivos 
       SET estado = 'deleted', deleted_at = NOW() 
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id`,
      [archivoId]
    );
    
    return result.rows.length > 0;
  }
  
  // Verificar límites de archivo
  static async checkFileLimits(
    tipo: FileType,
    tamaño: number,
    extension: string
  ): Promise<boolean> {
    const result = await query(
      'SELECT check_file_limits($1, $2, $3) as is_valid',
      [tipo, tamaño, extension]
    );
    
    return result.rows[0].is_valid;
  }
  
  // Obtener estadísticas de usuario
  static async getUserStats(usuarioId: string): Promise<any> {
    const result = await query(
      'SELECT * FROM user_files_stats WHERE usuario_id = $1',
      [usuarioId]
    );
    
    return result.rows[0] || {
      usuario_id: usuarioId,
      total_archivos: 0,
      total_imagenes: 0,
      total_documentos: 0,
      espacio_usado_bytes: 0,
      espacio_usado_mb: 0,
      ultimo_archivo_subido: null
    };
  }
}

// ============================================================================
// MODELO: RELACIONES DE ARCHIVOS
// ============================================================================

export class ArchivosRelacionesModel {
  
  // Asociar archivo a entidad
  static async createRelation(relationData: {
    archivo_id: string;
    entidad_tipo: string;
    entidad_id: string;
    campo?: string;
    orden?: number;
    descripcion?: string;
  }): Promise<ArchivoRelacion> {
    const result = await query(
      `INSERT INTO archivos_relaciones 
       (archivo_id, entidad_tipo, entidad_id, campo, orden, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (archivo_id, entidad_tipo, entidad_id, campo) 
       DO UPDATE SET orden = EXCLUDED.orden, descripcion = EXCLUDED.descripcion
       RETURNING *`,
      [
        relationData.archivo_id,
        relationData.entidad_tipo,
        relationData.entidad_id,
        relationData.campo || null,
        relationData.orden || 0,
        relationData.descripcion || null
      ]
    );
    
    return result.rows[0];
  }
  
  // Obtener archivos de una entidad
  static async getEntityFiles(
    entidadTipo: string,
    entidadId: string,
    campo?: string
  ): Promise<any[]> {
    const result = await query(
      'SELECT * FROM get_entity_files($1, $2, $3)',
      [entidadTipo, entidadId, campo || null]
    );
    
    return result.rows;
  }
  
  // Remover relación archivo-entidad
  static async removeRelation(
    archivoId: string,
    entidadTipo: string,
    entidadId: string,
    campo?: string
  ): Promise<boolean> {
    let whereClause = 'archivo_id = $1 AND entidad_tipo = $2 AND entidad_id = $3';
    let params = [archivoId, entidadTipo, entidadId];
    
    if (campo) {
      whereClause += ' AND campo = $4';
      params.push(campo);
    }
    
    const result = await query(
      `DELETE FROM archivos_relaciones WHERE ${whereClause} RETURNING id`,
      params
    );
    
    return result.rows.length > 0;
  }
  
  // Reordenar archivos en galería
  static async reorderFiles(
    entidadTipo: string,
    entidadId: string,
    campo: string,
    reorderedItems: Array<{ archivo_id: string; orden: number }>
  ): Promise<boolean> {
    const client = await query('BEGIN');
    
    try {
      for (const item of reorderedItems) {
        await query(
          `UPDATE archivos_relaciones 
           SET orden = $1 
           WHERE archivo_id = $2 AND entidad_tipo = $3 AND entidad_id = $4 AND campo = $5`,
          [item.orden, item.archivo_id, entidadTipo, entidadId, campo]
        );
      }
      
      await query('COMMIT');
      return true;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
}

// ============================================================================
// MODELO: ARCHIVOS TEMPORALES
// ============================================================================

export class ArchivosTemporalesModel {
  
  // Crear archivo temporal
  static async create(archivoId: string, usuarioId: string): Promise<ArchivoTemporal> {
    // Generar token único
    const token = Buffer.from(`${archivoId}-${usuarioId}-${Date.now()}`).toString('base64url');
    
    const result = await query(
      `INSERT INTO archivos_temporales (archivo_id, token_temporal, usuario_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [archivoId, token, usuarioId]
    );
    
    return result.rows[0];
  }
  
  // Obtener archivo temporal por token
  static async findByToken(token: string): Promise<{
    archivo: Archivo;
    temporal: ArchivoTemporal;
  } | null> {
    const result = await query(
      `SELECT 
        at.*,
        a.*
       FROM archivos_temporales at
       JOIN archivos a ON at.archivo_id = a.id
       WHERE at.token_temporal = $1 
         AND at.expires_at > NOW()
         AND a.deleted_at IS NULL`,
      [token]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      temporal: {
        id: row.id,
        archivo_id: row.archivo_id,
        token_temporal: row.token_temporal,
        usuario_id: row.usuario_id,
        expires_at: row.expires_at,
        created_at: row.created_at
      },
      archivo: {
        id: row.archivo_id,
        nombre_original: row.nombre_original,
        nombre_archivo: row.nombre_archivo,
        extension: row.extension,
        mime_type: row.mime_type,
        tamaño: row.tamaño,
        tipo: row.tipo,
        estado: row.estado,
        contexto: row.contexto,
        url_publica: row.url_publica,
        path_storage: row.path_storage,
        url_thumbnail: row.url_thumbnail,
        ancho: row.ancho,
        alto: row.alto,
        duracion: row.duracion,
        subido_por: row.subido_por,
        ip_origen: row.ip_origen,
        user_agent: row.user_agent,
        metadata: row.metadata,
        publico: row.publico,
        requiere_auth: row.requiere_auth,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at
      }
    };
  }
  
  // Confirmar archivo temporal (mover a permanente)
  static async confirmFile(token: string): Promise<string | null> {
    const result = await query(
      `DELETE FROM archivos_temporales 
       WHERE token_temporal = $1 AND expires_at > NOW()
       RETURNING archivo_id`,
      [token]
    );
    
    return result.rows[0]?.archivo_id || null;
  }
  
  // Limpiar archivos temporales expirados
  static async cleanupExpired(): Promise<number> {
    const result = await query('SELECT cleanup_expired_temp_files() as deleted_count');
    return result.rows[0].deleted_count;
  }
}

// ============================================================================
// MODELO: CONFIGURACIÓN DE ARCHIVOS
// ============================================================================

export class ConfiguracionArchivosModel {
  
  // Obtener configuración actual
  static async getConfig(): Promise<ConfiguracionArchivos> {
    const result = await query('SELECT * FROM configuracion_archivos LIMIT 1');
    
    if (result.rows.length === 0) {
      throw new Error('Configuración de archivos no encontrada');
    }
    
    return result.rows[0];
  }
  
  // Actualizar configuración
  static async updateConfig(updates: Partial<ConfiguracionArchivos>): Promise<ConfiguracionArchivos> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const values = Object.values(updates);
    
    const result = await query(
      `UPDATE configuracion_archivos 
       SET ${setClause}, updated_at = NOW() 
       RETURNING *`,
      values
    );
    
    return result.rows[0];
  }
}