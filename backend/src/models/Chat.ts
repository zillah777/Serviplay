import { query } from '@/config/database';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface Chat {
  id: string;
  match_id?: string;
  tipo: 'directo' | 'grupal' | 'soporte';
  titulo?: string;
  descripcion?: string;
  activo: boolean;
  ultimo_mensaje_id?: string;
  ultimo_mensaje_fecha?: Date;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface ChatParticipant {
  id: string;
  chat_id: string;
  usuario_id: string;
  rol: 'admin' | 'participante' | 'moderador';
  unido_en: Date;
  ultimo_acceso: Date;
  activo: boolean;
  notificaciones_activas: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  reply_to_id?: string;
  content: string;
  tipo: 'texto' | 'imagen' | 'archivo' | 'ubicacion' | 'sistema';
  archivo_url?: string;
  archivo_nombre?: string;
  archivo_size?: number;
  archivo_tipo?: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  ubicacion_direccion?: string;
  metadata?: any;
  editado: boolean;
  editado_en?: Date;
  eliminado: boolean;
  eliminado_en?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  leido_en: Date;
}

export interface TypingIndicator {
  id: string;
  chat_id: string;
  user_id: string;
  started_at: Date;
  expires_at: Date;
}

// ============================================================================
// MODELO: CHAT
// ============================================================================

export class ChatModel {
  
  // Crear un nuevo chat
  static async create(chatData: {
    match_id?: string;
    tipo?: 'directo' | 'grupal' | 'soporte';
    titulo?: string;
    descripcion?: string;
    participantes: string[]; // Array de user IDs
  }): Promise<Chat> {
    const client = await query('BEGIN');
    
    try {
      // Crear el chat
      const chatResult = await query(
        `INSERT INTO chats (match_id, tipo, titulo, descripcion)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [
          chatData.match_id || null,
          chatData.tipo || 'directo',
          chatData.titulo || null,
          chatData.descripcion || null
        ]
      );
      
      const chat = chatResult.rows[0];
      
      // Agregar participantes
      for (const userId of chatData.participantes) {
        await query(
          `INSERT INTO chat_participants (chat_id, usuario_id, rol)
           VALUES ($1, $2, $3)`,
          [chat.id, userId, 'participante']
        );
      }
      
      await query('COMMIT');
      return chat;
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
  
  // Obtener chat por ID con participantes
  static async findByIdWithParticipants(chatId: string): Promise<{
    chat: Chat;
    participantes: any[];
  } | null> {
    const result = await query(
      `SELECT 
        c.*,
        json_agg(
          json_build_object(
            'id', cp.id,
            'usuario_id', cp.usuario_id,
            'rol', cp.rol,
            'activo', cp.activo,
            'ultimo_acceso', cp.ultimo_acceso,
            'usuario', json_build_object(
              'id', u.id,
              'email', u.email,
              'tipo_usuario', u.tipo_usuario
            )
          )
        ) as participantes
       FROM chats c
       JOIN chat_participants cp ON c.id = cp.chat_id
       JOIN usuarios u ON cp.usuario_id = u.id
       WHERE c.id = $1 AND c.activo = true AND cp.activo = true
       GROUP BY c.id`,
      [chatId]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      chat: {
        id: row.id,
        match_id: row.match_id,
        tipo: row.tipo,
        titulo: row.titulo,
        descripcion: row.descripcion,
        activo: row.activo,
        ultimo_mensaje_id: row.ultimo_mensaje_id,
        ultimo_mensaje_fecha: row.ultimo_mensaje_fecha,
        metadata: row.metadata,
        created_at: row.created_at,
        updated_at: row.updated_at
      },
      participantes: row.participantes
    };
  }
  
  // Obtener chats de un usuario
  static async findByUserId(userId: string, page: number = 1, limit: number = 20): Promise<{
    chats: any[];
    total: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    
    // Contar total
    const countResult = await query(
      `SELECT COUNT(DISTINCT c.id) as total
       FROM chats c
       JOIN chat_participants cp ON c.id = cp.chat_id
       WHERE cp.usuario_id = $1 AND c.activo = true AND cp.activo = true`,
      [userId]
    );
    
    const total = parseInt(countResult.rows[0].total);
    
    // Obtener chats con información adicional
    const result = await query(
      `SELECT 
        c.*,
        lm.content as ultimo_mensaje_content,
        lm.tipo as ultimo_mensaje_tipo,
        lm.created_at as ultimo_mensaje_fecha,
        sender.email as ultimo_mensaje_sender_email,
        
        -- Contar mensajes no leídos para este usuario
        COALESCE((
          SELECT COUNT(*)
          FROM chat_messages cm
          WHERE cm.chat_id = c.id 
            AND cm.sender_id != $1
            AND cm.eliminado = false
            AND NOT EXISTS (
              SELECT 1 FROM message_reads mr 
              WHERE mr.message_id = cm.id AND mr.user_id = $1
            )
        ), 0) as mensajes_no_leidos,
        
        -- Información del otro participante (para chats directos)
        CASE 
          WHEN c.tipo = 'directo' THEN (
            SELECT json_build_object(
              'id', u2.id,
              'email', u2.email,
              'tipo_usuario', u2.tipo_usuario
            )
            FROM chat_participants cp2
            JOIN usuarios u2 ON cp2.usuario_id = u2.id
            WHERE cp2.chat_id = c.id AND cp2.usuario_id != $1 AND cp2.activo = true
            LIMIT 1
          )
          ELSE NULL
        END as otro_participante
        
       FROM chats c
       JOIN chat_participants cp ON c.id = cp.chat_id
       LEFT JOIN chat_messages lm ON c.ultimo_mensaje_id = lm.id
       LEFT JOIN usuarios sender ON lm.sender_id = sender.id
       
       WHERE cp.usuario_id = $1 AND c.activo = true AND cp.activo = true
       ORDER BY c.ultimo_mensaje_fecha DESC NULLS LAST, c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    
    return {
      chats: result.rows,
      total,
      hasMore: offset + limit < total
    };
  }
  
  // Verificar si un usuario es participante de un chat
  static async isParticipant(chatId: string, userId: string): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM chat_participants 
       WHERE chat_id = $1 AND usuario_id = $2 AND activo = true`,
      [chatId, userId]
    );
    
    return result.rows.length > 0;
  }
  
  // Buscar chat directo entre dos usuarios
  static async findDirectChatBetweenUsers(user1Id: string, user2Id: string): Promise<Chat | null> {
    const result = await query(
      `SELECT c.* 
       FROM chats c
       WHERE c.tipo = 'directo' 
         AND c.activo = true
         AND EXISTS (
           SELECT 1 FROM chat_participants cp1 
           WHERE cp1.chat_id = c.id AND cp1.usuario_id = $1 AND cp1.activo = true
         )
         AND EXISTS (
           SELECT 1 FROM chat_participants cp2 
           WHERE cp2.chat_id = c.id AND cp2.usuario_id = $2 AND cp2.activo = true
         )
         AND (
           SELECT COUNT(*) FROM chat_participants cp 
           WHERE cp.chat_id = c.id AND cp.activo = true
         ) = 2`,
      [user1Id, user2Id]
    );
    
    return result.rows[0] || null;
  }
  
  // Actualizar último acceso del usuario al chat
  static async updateLastAccess(chatId: string, userId: string): Promise<void> {
    await query(
      `UPDATE chat_participants 
       SET ultimo_acceso = NOW(), updated_at = NOW()
       WHERE chat_id = $1 AND usuario_id = $2`,
      [chatId, userId]
    );
  }
}

// ============================================================================
// MODELO: CHAT MESSAGES
// ============================================================================

export class ChatMessageModel {
  
  // Crear un nuevo mensaje
  static async create(messageData: {
    chat_id: string;
    sender_id: string;
    content: string;
    tipo?: 'texto' | 'imagen' | 'archivo' | 'ubicacion' | 'sistema';
    reply_to_id?: string;
    archivo_url?: string;
    archivo_nombre?: string;
    archivo_size?: number;
    archivo_tipo?: string;
    ubicacion_lat?: number;
    ubicacion_lng?: number;
    ubicacion_direccion?: string;
    metadata?: any;
  }): Promise<ChatMessage> {
    const result = await query(
      `INSERT INTO chat_messages (
        chat_id, sender_id, content, tipo, reply_to_id,
        archivo_url, archivo_nombre, archivo_size, archivo_tipo,
        ubicacion_lat, ubicacion_lng, ubicacion_direccion, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        messageData.chat_id,
        messageData.sender_id,
        messageData.content,
        messageData.tipo || 'texto',
        messageData.reply_to_id || null,
        messageData.archivo_url || null,
        messageData.archivo_nombre || null,
        messageData.archivo_size || null,
        messageData.archivo_tipo || null,
        messageData.ubicacion_lat || null,
        messageData.ubicacion_lng || null,
        messageData.ubicacion_direccion || null,
        messageData.metadata || null
      ]
    );
    
    return result.rows[0];
  }
  
  // Obtener mensajes de un chat con paginación
  static async findByChatId(
    chatId: string, 
    page: number = 1, 
    limit: number = 50,
    beforeMessageId?: string
  ): Promise<{
    messages: any[];
    hasMore: boolean;
  }> {
    let whereClause = 'cm.chat_id = $1 AND cm.eliminado = false';
    let params: any[] = [chatId];
    
    // Para paginación por cursor (antes de un mensaje específico)
    if (beforeMessageId) {
      whereClause += ` AND cm.created_at < (
        SELECT created_at FROM chat_messages WHERE id = $${params.length + 1}
      )`;
      params.push(beforeMessageId);
    }
    
    const result = await query(
      `SELECT 
        cm.*,
        sender.email as sender_email,
        sender.tipo_usuario as sender_tipo,
        
        -- Información del mensaje al que responde
        CASE 
          WHEN cm.reply_to_id IS NOT NULL THEN (
            SELECT json_build_object(
              'id', rm.id,
              'content', rm.content,
              'sender_email', ru.email,
              'created_at', rm.created_at
            )
            FROM chat_messages rm
            JOIN usuarios ru ON rm.sender_id = ru.id
            WHERE rm.id = cm.reply_to_id
          )
          ELSE NULL
        END as reply_to_message,
        
        -- Estado de lectura
        COALESCE((
          SELECT json_agg(
            json_build_object(
              'user_id', mr.user_id,
              'leido_en', mr.leido_en
            )
          )
          FROM message_reads mr
          WHERE mr.message_id = cm.id
        ), '[]') as read_by
        
       FROM chat_messages cm
       JOIN usuarios sender ON cm.sender_id = sender.id
       WHERE ${whereClause}
       ORDER BY cm.created_at DESC
       LIMIT $${params.length + 1}`,
      [...params, limit + 1] // +1 para saber si hay más mensajes
    );
    
    const messages = result.rows.slice(0, limit);
    const hasMore = result.rows.length > limit;
    
    return {
      messages: messages.reverse(), // Invertir para mostrar cronológicamente
      hasMore
    };
  }
  
  // Marcar mensaje como editado
  static async markAsEdited(messageId: string, newContent: string): Promise<boolean> {
    const result = await query(
      `UPDATE chat_messages 
       SET content = $1, editado = true, editado_en = NOW(), updated_at = NOW()
       WHERE id = $2 AND eliminado = false
       RETURNING id`,
      [newContent, messageId]
    );
    
    return result.rows.length > 0;
  }
  
  // Soft delete de mensaje
  static async softDelete(messageId: string): Promise<boolean> {
    const result = await query(
      `UPDATE chat_messages 
       SET eliminado = true, eliminado_en = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [messageId]
    );
    
    return result.rows.length > 0;
  }
  
  // Marcar mensajes como leídos
  static async markAsRead(chatId: string, userId: string, untilMessageId?: string): Promise<number> {
    const result = await query(
      'SELECT mark_messages_as_read($1, $2, $3) as affected_count',
      [chatId, userId, untilMessageId || null]
    );
    
    return result.rows[0].affected_count;
  }
}

// ============================================================================
// MODELO: TYPING INDICATORS
// ============================================================================

export class TypingIndicatorModel {
  
  // Iniciar indicador de "escribiendo"
  static async startTyping(chatId: string, userId: string): Promise<void> {
    await query(
      `INSERT INTO chat_typing_indicators (chat_id, user_id, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 seconds')
       ON CONFLICT (chat_id, user_id) 
       DO UPDATE SET 
         started_at = NOW(),
         expires_at = NOW() + INTERVAL '30 seconds'`,
      [chatId, userId]
    );
  }
  
  // Detener indicador de "escribiendo"
  static async stopTyping(chatId: string, userId: string): Promise<void> {
    await query(
      `DELETE FROM chat_typing_indicators 
       WHERE chat_id = $1 AND user_id = $2`,
      [chatId, userId]
    );
  }
  
  // Obtener usuarios que están escribiendo
  static async getTypingUsers(chatId: string): Promise<any[]> {
    const result = await query(
      `SELECT 
        ti.user_id,
        u.email,
        ti.started_at
       FROM chat_typing_indicators ti
       JOIN usuarios u ON ti.user_id = u.id
       WHERE ti.chat_id = $1 AND ti.expires_at > NOW()`,
      [chatId]
    );
    
    return result.rows;
  }
  
  // Limpiar indicadores expirados
  static async cleanupExpired(): Promise<void> {
    await query('SELECT cleanup_expired_typing_indicators()');
  }
}