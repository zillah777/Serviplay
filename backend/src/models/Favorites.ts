import { query } from '@/config/database';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface Favorito {
  id: string;
  usuario_id: string;
  servicio_id: string;
  nota_personal?: string;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface ListaFavoritos {
  id: string;
  usuario_id: string;
  nombre: string;
  descripcion?: string;
  color: string;
  icono: string;
  publica: boolean;
  compartible: boolean;
  orden: number;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface FavoritoLista {
  id: string;
  lista_id: string;
  favorito_id: string;
  orden: number;
  agregado_en: Date;
}

export interface FavoritoCompartido {
  id: string;
  lista_id: string;
  compartido_por: string;
  compartido_con: string;
  puede_editar: boolean;
  puede_agregar: boolean;
  mensaje?: string;
  created_at: Date;
  expires_at?: Date;
}

// ============================================================================
// MODELO: FAVORITOS
// ============================================================================

export class FavoritosModel {
  
  // Agregar servicio a favoritos
  static async addToFavorites(favoritoData: {
    usuario_id: string;
    servicio_id: string;
    nota_personal?: string;
    metadata?: any;
  }): Promise<Favorito> {
    const result = await query(
      `INSERT INTO favoritos (usuario_id, servicio_id, nota_personal, metadata)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (usuario_id, servicio_id) 
       DO UPDATE SET 
         nota_personal = EXCLUDED.nota_personal,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()
       RETURNING *`,
      [
        favoritoData.usuario_id,
        favoritoData.servicio_id,
        favoritoData.nota_personal || null,
        favoritoData.metadata || null
      ]
    );
    
    return result.rows[0];
  }
  
  // Remover servicio de favoritos
  static async removeFromFavorites(usuarioId: string, servicioId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM favoritos 
       WHERE usuario_id = $1 AND servicio_id = $2
       RETURNING id`,
      [usuarioId, servicioId]
    );
    
    return result.rows.length > 0;
  }
  
  // Verificar si un servicio es favorito
  static async isFavorite(usuarioId: string, servicioId: string): Promise<boolean> {
    const result = await query(
      'SELECT is_service_favorite($1, $2) as is_favorite',
      [usuarioId, servicioId]
    );
    
    return result.rows[0].is_favorite;
  }
  
  // Obtener favoritos de un usuario con detalles completos
  static async getUserFavoritesWithDetails(
    usuarioId: string,
    page: number = 1,
    limit: number = 20,
    filtros?: {
      categoria?: string;
      busqueda?: string;
      precio_min?: number;
      precio_max?: number;
    }
  ): Promise<{
    favoritos: any[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    
    // Construir WHERE clause dinámico
    let whereConditions = ['f.usuario_id = $1'];
    let params: any[] = [usuarioId];
    let paramCount = 1;
    
    if (filtros?.categoria) {
      paramCount++;
      whereConditions.push(`c.nombre ILIKE $${paramCount}`);
      params.push(`%${filtros.categoria}%`);
    }
    
    if (filtros?.busqueda) {
      paramCount++;
      whereConditions.push(`(s.titulo ILIKE $${paramCount} OR s.descripcion ILIKE $${paramCount})`);
      params.push(`%${filtros.busqueda}%`);
    }
    
    if (filtros?.precio_min) {
      paramCount++;
      whereConditions.push(`s.precio_desde >= $${paramCount}`);
      params.push(filtros.precio_min);
    }
    
    if (filtros?.precio_max) {
      paramCount++;
      whereConditions.push(`s.precio_hasta <= $${paramCount}`);
      params.push(filtros.precio_max);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM favoritos f
       JOIN servicios s ON f.servicio_id = s.id
       JOIN categorias c ON s.categoria_id = c.id
       WHERE ${whereClause}`,
      params
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener favoritos con paginación
    params.push(limit, offset);
    const result = await query(
      `SELECT 
        f.id as favorito_id,
        f.servicio_id,
        f.nota_personal,
        f.created_at as fecha_agregado,
        
        -- Información del servicio
        s.titulo,
        s.descripcion,
        s.precio_desde,
        s.precio_hasta,
        s.disponible,
        s.destacado,
        
        -- Categoría
        c.nombre as categoria,
        c.icono as categoria_icono,
        
        -- Información del As
        pa.nombre as as_nombre,
        pa.apellido as as_apellido,
        pa.foto_perfil as as_foto,
        pa.identidad_verificada as as_verificado,
        
        -- Calificación promedio del As
        COALESCE(ROUND(AVG(cal.calificacion), 1), 0) as as_calificacion,
        COUNT(cal.id) as total_calificaciones,
        
        -- Conteo de favoritos del servicio
        get_service_favorites_count(s.id) as veces_favorito,
        
        -- Ubicación
        pa.localidad,
        pa.provincia
        
       FROM favoritos f
       JOIN servicios s ON f.servicio_id = s.id
       JOIN categorias c ON s.categoria_id = c.id
       JOIN perfiles_ases pa ON s.as_id = pa.id
       LEFT JOIN calificaciones cal ON pa.usuario_id = cal.calificado_id
       WHERE ${whereClause}
       GROUP BY f.id, s.id, c.nombre, c.icono, pa.nombre, pa.apellido, pa.foto_perfil, 
                pa.identidad_verificada, pa.localidad, pa.provincia
       ORDER BY f.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );
    
    return {
      favoritos: result.rows,
      total,
      hasMore: offset + limit < total
    };
  }
  
  // Obtener favoritos de un usuario (solo IDs)
  static async getUserFavoriteIds(usuarioId: string): Promise<string[]> {
    const result = await query(
      `SELECT servicio_id FROM favoritos WHERE usuario_id = $1`,
      [usuarioId]
    );
    
    return result.rows.map(row => row.servicio_id);
  }
  
  // Obtener conteo de favoritos de un servicio
  static async getServiceFavoritesCount(servicioId: string): Promise<number> {
    const result = await query(
      'SELECT get_service_favorites_count($1) as count',
      [servicioId]
    );
    
    return result.rows[0].count;
  }
  
  // Actualizar nota personal de un favorito
  static async updateNote(usuarioId: string, servicioId: string, nota: string): Promise<boolean> {
    const result = await query(
      `UPDATE favoritos 
       SET nota_personal = $1, updated_at = NOW()
       WHERE usuario_id = $2 AND servicio_id = $3
       RETURNING id`,
      [nota, usuarioId, servicioId]
    );
    
    return result.rows.length > 0;
  }
  
  // Obtener servicios más populares en favoritos
  static async getPopularFavorites(limit: number = 10): Promise<any[]> {
    const result = await query(
      `SELECT * FROM popular_favorites LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  }
}

// ============================================================================
// MODELO: LISTAS DE FAVORITOS
// ============================================================================

export class ListasFavoritosModel {
  
  // Crear nueva lista de favoritos
  static async create(listaData: {
    usuario_id: string;
    nombre: string;
    descripcion?: string;
    color?: string;
    icono?: string;
    publica?: boolean;
    compartible?: boolean;
  }): Promise<ListaFavoritos> {
    const result = await query(
      `INSERT INTO listas_favoritos 
       (usuario_id, nombre, descripcion, color, icono, publica, compartible, orden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 
         COALESCE((SELECT MAX(orden) + 1 FROM listas_favoritos WHERE usuario_id = $1), 0)
       )
       RETURNING *`,
      [
        listaData.usuario_id,
        listaData.nombre,
        listaData.descripcion || null,
        listaData.color || '#3B82F6',
        listaData.icono || 'star',
        listaData.publica || false,
        listaData.compartible || true
      ]
    );
    
    return result.rows[0];
  }
  
  // Obtener listas de un usuario
  static async getUserLists(usuarioId: string): Promise<any[]> {
    const result = await query(
      `SELECT 
        lf.*,
        COUNT(fl.favorito_id) as total_favoritos
       FROM listas_favoritos lf
       LEFT JOIN favoritos_lista fl ON lf.id = fl.lista_id
       WHERE lf.usuario_id = $1
       GROUP BY lf.id
       ORDER BY lf.orden, lf.created_at`,
      [usuarioId]
    );
    
    return result.rows;
  }
  
  // Obtener lista por ID con permisos
  static async findByIdWithPermissions(listaId: string, usuarioId: string): Promise<{
    lista: ListaFavoritos;
    permisos: {
      es_propietario: boolean;
      puede_ver: boolean;
      puede_editar: boolean;
      puede_agregar: boolean;
    };
  } | null> {
    const result = await query(
      `SELECT 
        lf.*,
        CASE WHEN lf.usuario_id = $2 THEN true ELSE false END as es_propietario,
        CASE 
          WHEN lf.usuario_id = $2 THEN true
          WHEN lf.publica = true THEN true
          WHEN EXISTS (
            SELECT 1 FROM favoritos_compartidos fc 
            WHERE fc.lista_id = lf.id AND fc.compartido_con = $2
            AND (fc.expires_at IS NULL OR fc.expires_at > NOW())
          ) THEN true
          ELSE false
        END as puede_ver,
        COALESCE(fc.puede_editar, false) as puede_editar_compartida,
        COALESCE(fc.puede_agregar, false) as puede_agregar_compartida
       FROM listas_favoritos lf
       LEFT JOIN favoritos_compartidos fc ON lf.id = fc.lista_id AND fc.compartido_con = $2
       WHERE lf.id = $1`,
      [listaId, usuarioId]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      lista: {
        id: row.id,
        usuario_id: row.usuario_id,
        nombre: row.nombre,
        descripcion: row.descripcion,
        color: row.color,
        icono: row.icono,
        publica: row.publica,
        compartible: row.compartible,
        orden: row.orden,
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.updated_at
      },
      permisos: {
        es_propietario: row.es_propietario,
        puede_ver: row.puede_ver,
        puede_editar: row.es_propietario || row.puede_editar_compartida,
        puede_agregar: row.es_propietario || row.puede_agregar_compartida
      }
    };
  }
  
  // Actualizar lista
  static async update(
    listaId: string, 
    usuarioId: string,
    updates: Partial<ListaFavoritos>
  ): Promise<ListaFavoritos | null> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(', ');
    
    const values = [listaId, usuarioId, ...Object.values(updates)];
    
    const result = await query(
      `UPDATE listas_favoritos 
       SET ${setClause}, updated_at = NOW() 
       WHERE id = $1 AND usuario_id = $2
       RETURNING *`,
      values
    );
    
    return result.rows[0] || null;
  }
  
  // Eliminar lista
  static async delete(listaId: string, usuarioId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM listas_favoritos 
       WHERE id = $1 AND usuario_id = $2
       RETURNING id`,
      [listaId, usuarioId]
    );
    
    return result.rows.length > 0;
  }
  
  // Agregar favorito a lista
  static async addFavoriteToList(
    listaId: string, 
    favoritoId: string,
    orden?: number
  ): Promise<FavoritoLista> {
    const result = await query(
      `INSERT INTO favoritos_lista (lista_id, favorito_id, orden)
       VALUES ($1, $2, COALESCE($3, 
         (SELECT COALESCE(MAX(orden) + 1, 0) FROM favoritos_lista WHERE lista_id = $1)
       ))
       ON CONFLICT (lista_id, favorito_id) 
       DO UPDATE SET orden = EXCLUDED.orden
       RETURNING *`,
      [listaId, favoritoId, orden || null]
    );
    
    return result.rows[0];
  }
  
  // Remover favorito de lista
  static async removeFavoriteFromList(listaId: string, favoritoId: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM favoritos_lista 
       WHERE lista_id = $1 AND favorito_id = $2
       RETURNING id`,
      [listaId, favoritoId]
    );
    
    return result.rows.length > 0;
  }
  
  // Obtener favoritos de una lista
  static async getListFavorites(listaId: string, page: number = 1, limit: number = 20): Promise<{
    favoritos: any[];
    total: number;
  }> {
    const offset = (page - 1) * limit;
    
    // Contar total
    const countResult = await query(
      `SELECT COUNT(*) as total FROM favoritos_lista WHERE lista_id = $1`,
      [listaId]
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener favoritos
    const result = await query(
      `SELECT 
        fl.orden,
        fl.agregado_en,
        f.id as favorito_id,
        f.servicio_id,
        f.nota_personal,
        
        -- Información del servicio
        s.titulo,
        s.descripcion,
        s.precio_desde,
        s.precio_hasta,
        c.nombre as categoria,
        
        -- Información del As
        pa.nombre as as_nombre,
        pa.apellido as as_apellido,
        pa.foto_perfil as as_foto
        
       FROM favoritos_lista fl
       JOIN favoritos f ON fl.favorito_id = f.id
       JOIN servicios s ON f.servicio_id = s.id
       JOIN categorias c ON s.categoria_id = c.id
       JOIN perfiles_ases pa ON s.as_id = pa.id
       WHERE fl.lista_id = $1
       ORDER BY fl.orden, fl.agregado_en DESC
       LIMIT $2 OFFSET $3`,
      [listaId, limit, offset]
    );
    
    return {
      favoritos: result.rows,
      total
    };
  }
  
  // Reordenar favoritos en lista
  static async reorderListFavorites(
    listaId: string,
    reorderedItems: Array<{ favorito_id: string; orden: number }>
  ): Promise<boolean> {
    const client = await query('BEGIN');
    
    try {
      for (const item of reorderedItems) {
        await query(
          `UPDATE favoritos_lista 
           SET orden = $1 
           WHERE lista_id = $2 AND favorito_id = $3`,
          [item.orden, listaId, item.favorito_id]
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
// MODELO: FAVORITOS COMPARTIDOS
// ============================================================================

export class FavoritosCompartidosModel {
  
  // Compartir lista con otro usuario
  static async shareList(shareData: {
    lista_id: string;
    compartido_por: string;
    compartido_con: string;
    puede_editar?: boolean;
    puede_agregar?: boolean;
    mensaje?: string;
    expires_at?: Date;
  }): Promise<FavoritoCompartido> {
    const result = await query(
      `INSERT INTO favoritos_compartidos 
       (lista_id, compartido_por, compartido_con, puede_editar, puede_agregar, mensaje, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (lista_id, compartido_con)
       DO UPDATE SET 
         puede_editar = EXCLUDED.puede_editar,
         puede_agregar = EXCLUDED.puede_agregar,
         mensaje = EXCLUDED.mensaje,
         expires_at = EXCLUDED.expires_at
       RETURNING *`,
      [
        shareData.lista_id,
        shareData.compartido_por,
        shareData.compartido_con,
        shareData.puede_editar || false,
        shareData.puede_agregar || false,
        shareData.mensaje || null,
        shareData.expires_at || null
      ]
    );
    
    return result.rows[0];
  }
  
  // Obtener listas compartidas conmigo
  static async getSharedWithMe(usuarioId: string): Promise<any[]> {
    const result = await query(
      `SELECT 
        fc.*,
        lf.nombre as lista_nombre,
        lf.descripcion as lista_descripcion,
        lf.color as lista_color,
        lf.icono as lista_icono,
        u.email as compartido_por_email,
        COUNT(fl.favorito_id) as total_favoritos
       FROM favoritos_compartidos fc
       JOIN listas_favoritos lf ON fc.lista_id = lf.id
       JOIN usuarios u ON fc.compartido_por = u.id
       LEFT JOIN favoritos_lista fl ON lf.id = fl.lista_id
       WHERE fc.compartido_con = $1
         AND (fc.expires_at IS NULL OR fc.expires_at > NOW())
       GROUP BY fc.id, lf.id, u.email
       ORDER BY fc.created_at DESC`,
      [usuarioId]
    );
    
    return result.rows;
  }
  
  // Revocar compartición
  static async revokeShare(listaId: string, compartidoCon: string): Promise<boolean> {
    const result = await query(
      `DELETE FROM favoritos_compartidos 
       WHERE lista_id = $1 AND compartido_con = $2
       RETURNING id`,
      [listaId, compartidoCon]
    );
    
    return result.rows.length > 0;
  }
  
  // Limpiar compartidos expirados
  static async cleanupExpired(): Promise<number> {
    const result = await query('SELECT cleanup_expired_shared_favorites() as deleted_count');
    return result.rows[0].deleted_count;
  }
}