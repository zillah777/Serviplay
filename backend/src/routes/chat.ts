import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '@/middleware/validation';
import { authenticateToken } from '@/middleware/auth';
import { rateLimiter } from '@/middleware/rateLimiter';
import {
  getUserChats,
  getOrCreateDirectChat,
  getChatDetails,
  getChatMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
  startTyping,
  stopTyping,
  getTypingUsers,
  createGroupChat,
  cleanupTypingIndicators
} from '@/controllers/chat';

const router = Router();

// ============================================================================
// MIDDLEWARE DE AUTENTICACIÓN PARA TODAS LAS RUTAS
// ============================================================================
router.use(authenticateToken);

// ============================================================================
// RUTAS DE CHATS
// ============================================================================

/**
 * GET /api/chats
 * Obtener lista de chats del usuario
 */
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número entero mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('El límite debe ser entre 1 y 50'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60, // 60 requests por minuto
    message: 'Demasiadas consultas de chats'
  }),
  getUserChats
);

/**
 * POST /api/chats/direct
 * Obtener o crear chat directo con otro usuario
 */
router.post(
  '/direct',
  [
    body('otherUserId')
      .isUUID()
      .withMessage('ID de usuario inválido'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // 10 chats directos por 5 minutos
    message: 'Demasiados intentos de crear chats'
  }),
  getOrCreateDirectChat
);

/**
 * POST /api/chats/group
 * Crear chat grupal (funcionalidad futura)
 */
router.post(
  '/group',
  [
    body('titulo')
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage('El título debe tener entre 1 y 200 caracteres'),
    body('descripcion')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La descripción no puede superar 500 caracteres'),
    body('participantes')
      .isArray({ min: 2 })
      .withMessage('Se requieren al menos 2 participantes'),
    body('participantes.*')
      .isUUID()
      .withMessage('IDs de participantes inválidos'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 3, // 3 chats grupales por 10 minutos
    message: 'Demasiados intentos de crear chats grupales'
  }),
  createGroupChat
);

/**
 * GET /api/chats/:chatId
 * Obtener detalles de un chat específico
 */
router.get(
  '/:chatId',
  [
    param('chatId')
      .isUUID()
      .withMessage('ID de chat inválido'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // 30 requests por minuto por chat
    message: 'Demasiadas consultas del chat'
  }),
  getChatDetails
);

// ============================================================================
// RUTAS DE MENSAJES
// ============================================================================

/**
 * GET /api/chats/:chatId/messages
 * Obtener mensajes de un chat
 */
router.get(
  '/:chatId/messages',
  [
    param('chatId')
      .isUUID()
      .withMessage('ID de chat inválido'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número entero mayor a 0'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser entre 1 y 100'),
    query('before')
      .optional()
      .isUUID()
      .withMessage('ID de mensaje antes inválido'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60, // 60 requests por minuto
    message: 'Demasiadas consultas de mensajes'
  }),
  getChatMessages
);

/**
 * POST /api/chats/:chatId/messages
 * Enviar mensaje
 */
router.post(
  '/:chatId/messages',
  [
    param('chatId')
      .isUUID()
      .withMessage('ID de chat inválido'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('El mensaje debe tener entre 1 y 5000 caracteres'),
    body('tipo')
      .optional()
      .isIn(['texto', 'imagen', 'archivo', 'ubicacion', 'sistema'])
      .withMessage('Tipo de mensaje inválido'),
    body('reply_to_id')
      .optional()
      .isUUID()
      .withMessage('ID de mensaje de respuesta inválido'),
    body('ubicacion_lat')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitud inválida'),
    body('ubicacion_lng')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitud inválida'),
    body('ubicacion_direccion')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('La dirección no puede superar 500 caracteres'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // 30 mensajes por minuto
    message: 'Demasiados mensajes enviados'
  }),
  sendMessage
);

/**
 * PUT /api/chats/:chatId/messages/:messageId
 * Editar mensaje
 */
router.put(
  '/:chatId/messages/:messageId',
  [
    param('chatId')
      .isUUID()
      .withMessage('ID de chat inválido'),
    param('messageId')
      .isUUID()
      .withMessage('ID de mensaje inválido'),
    body('content')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('El mensaje debe tener entre 1 y 5000 caracteres'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 20, // 20 ediciones por 5 minutos
    message: 'Demasiadas ediciones de mensajes'
  }),
  editMessage
);

/**
 * DELETE /api/chats/:chatId/messages/:messageId
 * Eliminar mensaje
 */
router.delete(
  '/:chatId/messages/:messageId',
  [
    param('chatId')
      .isUUID()
      .withMessage('ID de chat inválido'),
    param('messageId')
      .isUUID()
      .withMessage('ID de mensaje inválido'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutos
    max: 10, // 10 eliminaciones por 5 minutos
    message: 'Demasiadas eliminaciones de mensajes'
  }),
  deleteMessage
);

/**
 * POST /api/chats/:chatId/messages/read
 * Marcar mensajes como leídos
 */
router.post(
  '/:chatId/messages/read',
  [
    param('chatId')
      .isUUID()
      .withMessage('ID de chat inválido'),
    body('untilMessageId')
      .optional()
      .isUUID()
      .withMessage('ID de mensaje hasta inválido'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 30, // 30 marcados como leído por minuto
    message: 'Demasiadas actualizaciones de lectura'
  }),
  markMessagesAsRead
);

// ============================================================================
// RUTAS DE TYPING INDICATORS
// ============================================================================

/**
 * POST /api/chats/:chatId/typing/start
 * Iniciar indicador de escritura
 */
router.post(
  '/:chatId/typing/start',
  [
    param('chatId')
      .isUUID()
      .withMessage('ID de chat inválido'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60, // 60 indicadores por minuto
    message: 'Demasiados indicadores de escritura'
  }),
  startTyping
);

/**
 * POST /api/chats/:chatId/typing/stop
 * Detener indicador de escritura
 */
router.post(
  '/:chatId/typing/stop',
  [
    param('chatId')
      .isUUID()
      .withMessage('ID de chat inválido'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 60, // 60 indicadores por minuto
    message: 'Demasiados indicadores de escritura'
  }),
  stopTyping
);

/**
 * GET /api/chats/:chatId/typing
 * Obtener usuarios que están escribiendo
 */
router.get(
  '/:chatId/typing',
  [
    param('chatId')
      .isUUID()
      .withMessage('ID de chat inválido'),
    validateRequest
  ],
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 120, // 120 consultas por minuto
    message: 'Demasiadas consultas de escritura'
  }),
  getTypingUsers
);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN
// ============================================================================

/**
 * POST /api/chats/admin/cleanup-typing
 * Limpiar indicadores de escritura expirados (solo para tareas programadas)
 */
router.post(
  '/admin/cleanup-typing',
  rateLimiter({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 5, // 5 limpiezas por minuto
    message: 'Demasiadas limpiezas'
  }),
  cleanupTypingIndicators
);

export default router;