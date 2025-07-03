import { Request, Response, NextFunction } from 'express';
import { ChatModel, ChatMessageModel, TypingIndicatorModel } from '@/models/Chat';
import { createError, asyncHandler } from '@/middleware/errorHandler';
import { AuthRequest } from '@/middleware/auth';

// ============================================================================
// CONTROLADORES DE CHAT
// ============================================================================

// Obtener chats del usuario
export const getUserChats = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

  const result = await ChatModel.findByUserId(userId, page, limit);

  res.json({
    success: true,
    data: {
      chats: result.chats,
      pagination: {
        page,
        limit,
        total: result.total,
        hasMore: result.hasMore,
        totalPages: Math.ceil(result.total / limit)
      }
    }
  });
});

// Obtener o crear chat directo entre dos usuarios
export const getOrCreateDirectChat = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { otherUserId } = req.body;

  if (!otherUserId) {
    throw createError('Se requiere el ID del otro usuario', 400);
  }

  if (userId === otherUserId) {
    throw createError('No puedes crear un chat contigo mismo', 400);
  }

  // Buscar chat existente
  let chat = await ChatModel.findDirectChatBetweenUsers(userId, otherUserId);

  // Si no existe, crear uno nuevo
  if (!chat) {
    chat = await ChatModel.create({
      tipo: 'directo',
      participantes: [userId, otherUserId]
    });
  }

  // Obtener chat con participantes
  const chatWithParticipants = await ChatModel.findByIdWithParticipants(chat.id);

  res.json({
    success: true,
    data: chatWithParticipants
  });
});

// Obtener detalles de un chat específico
export const getChatDetails = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { chatId } = req.params;

  // Verificar que el usuario es participante
  const isParticipant = await ChatModel.isParticipant(chatId, userId);
  if (!isParticipant) {
    throw createError('No tienes acceso a este chat', 403);
  }

  const chatWithParticipants = await ChatModel.findByIdWithParticipants(chatId);
  if (!chatWithParticipants) {
    throw createError('Chat no encontrado', 404);
  }

  // Actualizar último acceso
  await ChatModel.updateLastAccess(chatId, userId);

  res.json({
    success: true,
    data: chatWithParticipants
  });
});

// ============================================================================
// CONTROLADORES DE MENSAJES
// ============================================================================

// Obtener mensajes de un chat
export const getChatMessages = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { chatId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const beforeMessageId = req.query.before as string;

  // Verificar acceso al chat
  const isParticipant = await ChatModel.isParticipant(chatId, userId);
  if (!isParticipant) {
    throw createError('No tienes acceso a este chat', 403);
  }

  const result = await ChatMessageModel.findByChatId(chatId, page, limit, beforeMessageId);

  res.json({
    success: true,
    data: {
      messages: result.messages,
      hasMore: result.hasMore
    }
  });
});

// Enviar mensaje
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { chatId } = req.params;
  const { 
    content, 
    tipo = 'texto',
    reply_to_id,
    ubicacion_lat,
    ubicacion_lng,
    ubicacion_direccion,
    metadata
  } = req.body;

  // Validaciones
  if (!content || content.trim().length === 0) {
    throw createError('El contenido del mensaje es requerido', 400);
  }

  if (content.length > 5000) {
    throw createError('El mensaje es demasiado largo (máximo 5000 caracteres)', 400);
  }

  // Verificar acceso al chat
  const isParticipant = await ChatModel.isParticipant(chatId, userId);
  if (!isParticipant) {
    throw createError('No tienes acceso a este chat', 403);
  }

  // Crear mensaje
  const message = await ChatMessageModel.create({
    chat_id: chatId,
    sender_id: userId,
    content: content.trim(),
    tipo,
    reply_to_id,
    ubicacion_lat,
    ubicacion_lng,
    ubicacion_direccion,
    metadata
  });

  // Detener indicador de escritura
  await TypingIndicatorModel.stopTyping(chatId, userId);

  // TODO: Emitir evento WebSocket para tiempo real
  // socketService.emitToChat(chatId, 'new_message', message);

  res.status(201).json({
    success: true,
    data: message
  });
});

// Editar mensaje
export const editMessage = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { messageId } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    throw createError('El contenido del mensaje es requerido', 400);
  }

  if (content.length > 5000) {
    throw createError('El mensaje es demasiado largo (máximo 5000 caracteres)', 400);
  }

  // TODO: Verificar que el usuario es el autor del mensaje
  // Esta verificación requiere una consulta adicional

  const updated = await ChatMessageModel.markAsEdited(messageId, content.trim());
  if (!updated) {
    throw createError('Mensaje no encontrado o no se puede editar', 404);
  }

  // TODO: Emitir evento WebSocket
  // socketService.emitToChat(chatId, 'message_edited', { messageId, content });

  res.json({
    success: true,
    message: 'Mensaje editado correctamente'
  });
});

// Eliminar mensaje
export const deleteMessage = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { messageId } = req.params;

  // TODO: Verificar que el usuario es el autor del mensaje

  const deleted = await ChatMessageModel.softDelete(messageId);
  if (!deleted) {
    throw createError('Mensaje no encontrado', 404);
  }

  // TODO: Emitir evento WebSocket
  // socketService.emitToChat(chatId, 'message_deleted', { messageId });

  res.json({
    success: true,
    message: 'Mensaje eliminado correctamente'
  });
});

// Marcar mensajes como leídos
export const markMessagesAsRead = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { chatId } = req.params;
  const { untilMessageId } = req.body;

  // Verificar acceso al chat
  const isParticipant = await ChatModel.isParticipant(chatId, userId);
  if (!isParticipant) {
    throw createError('No tienes acceso a este chat', 403);
  }

  const affectedCount = await ChatMessageModel.markAsRead(chatId, userId, untilMessageId);

  // TODO: Emitir evento WebSocket
  // socketService.emitToChat(chatId, 'messages_read', { userId, untilMessageId });

  res.json({
    success: true,
    data: {
      messagesMarked: affectedCount
    }
  });
});

// ============================================================================
// CONTROLADORES DE TYPING INDICATORS
// ============================================================================

// Iniciar indicador de escritura
export const startTyping = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { chatId } = req.params;

  // Verificar acceso al chat
  const isParticipant = await ChatModel.isParticipant(chatId, userId);
  if (!isParticipant) {
    throw createError('No tienes acceso a este chat', 403);
  }

  await TypingIndicatorModel.startTyping(chatId, userId);

  // TODO: Emitir evento WebSocket
  // socketService.emitToChat(chatId, 'user_typing', { userId, typing: true });

  res.json({
    success: true,
    message: 'Indicador de escritura activado'
  });
});

// Detener indicador de escritura
export const stopTyping = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { chatId } = req.params;

  await TypingIndicatorModel.stopTyping(chatId, userId);

  // TODO: Emitir evento WebSocket
  // socketService.emitToChat(chatId, 'user_typing', { userId, typing: false });

  res.json({
    success: true,
    message: 'Indicador de escritura desactivado'
  });
});

// Obtener usuarios escribiendo
export const getTypingUsers = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { chatId } = req.params;

  // Verificar acceso al chat
  const isParticipant = await ChatModel.isParticipant(chatId, userId);
  if (!isParticipant) {
    throw createError('No tienes acceso a este chat', 403);
  }

  const typingUsers = await TypingIndicatorModel.getTypingUsers(chatId);

  res.json({
    success: true,
    data: {
      typingUsers: typingUsers.filter(user => user.user_id !== userId) // Excluir al usuario actual
    }
  });
});

// ============================================================================
// CONTROLADORES DE ADMINISTRACIÓN
// ============================================================================

// Crear chat grupal (para futuro)
export const createGroupChat = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const { titulo, descripcion, participantes } = req.body;

  if (!titulo || titulo.trim().length === 0) {
    throw createError('El título es requerido para chats grupales', 400);
  }

  if (!participantes || !Array.isArray(participantes) || participantes.length < 2) {
    throw createError('Se requieren al menos 2 participantes adicionales', 400);
  }

  // Agregar al creador como participante
  const allParticipants = [userId, ...participantes];

  const chat = await ChatModel.create({
    tipo: 'grupal',
    titulo: titulo.trim(),
    descripcion: descripcion?.trim(),
    participantes: allParticipants
  });

  const chatWithParticipants = await ChatModel.findByIdWithParticipants(chat.id);

  res.status(201).json({
    success: true,
    data: chatWithParticipants
  });
});

// Limpiar indicadores de escritura expirados (tarea programada)
export const cleanupTypingIndicators = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  await TypingIndicatorModel.cleanupExpired();

  res.json({
    success: true,
    message: 'Indicadores de escritura limpiados'
  });
});