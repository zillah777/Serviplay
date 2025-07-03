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

// GET /api/chats - Obtener lista de chats del usuario
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número entero mayor a 0'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('El límite debe ser entre 1 y 50'),
    validateRequest
  ],
  rateLimiter,
  getUserChats
);

// POST /api/chats/direct - Obtener o crear chat directo con otro usuario
router.post(
  '/direct',
  [
    body('otherUserId').isUUID().withMessage('ID de usuario inválido'),
    validateRequest
  ],
  rateLimiter,
  getOrCreateDirectChat
);

// POST /api/chats/group - Crear chat grupal
router.post(
  '/group',
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Nombre del grupo requerido (1-100 caracteres)'),
    body('participants').isArray({ min: 1, max: 50 }).withMessage('Participantes requeridos (1-50)'),
    body('participants.*').isUUID().withMessage('ID de participante inválido'),
    validateRequest
  ],
  rateLimiter,
  createGroupChat
);

// GET /api/chats/:chatId - Obtener detalles de un chat específico
router.get(
  '/:chatId',
  [
    param('chatId').isUUID().withMessage('ID de chat inválido'),
    validateRequest
  ],
  rateLimiter,
  getChatDetails
);

// GET /api/chats/:chatId/messages - Obtener mensajes de un chat
router.get(
  '/:chatId/messages',
  [
    param('chatId').isUUID().withMessage('ID de chat inválido'),
    query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe ser entre 1 y 100'),
    query('before').optional().isUUID().withMessage('ID de mensaje before inválido'),
    validateRequest
  ],
  rateLimiter,
  getChatMessages
);

// POST /api/chats/:chatId/messages - Enviar mensaje
router.post(
  '/:chatId/messages',
  [
    param('chatId').isUUID().withMessage('ID de chat inválido'),
    body('content').trim().isLength({ min: 1, max: 4000 }).withMessage('Contenido del mensaje requerido (1-4000 caracteres)'),
    body('type').optional().isIn(['text', 'image', 'file', 'system']).withMessage('Tipo de mensaje inválido'),
    body('replyToId').optional().isUUID().withMessage('ID de mensaje de respuesta inválido'),
    validateRequest
  ],
  rateLimiter,
  sendMessage
);

// PUT /api/chats/:chatId/messages/:messageId - Editar mensaje
router.put(
  '/:chatId/messages/:messageId',
  [
    param('chatId').isUUID().withMessage('ID de chat inválido'),
    param('messageId').isUUID().withMessage('ID de mensaje inválido'),
    body('content').trim().isLength({ min: 1, max: 4000 }).withMessage('Contenido del mensaje requerido (1-4000 caracteres)'),
    validateRequest
  ],
  rateLimiter,
  editMessage
);

// DELETE /api/chats/:chatId/messages/:messageId - Eliminar mensaje
router.delete(
  '/:chatId/messages/:messageId',
  [
    param('chatId').isUUID().withMessage('ID de chat inválido'),
    param('messageId').isUUID().withMessage('ID de mensaje inválido'),
    validateRequest
  ],
  rateLimiter,
  deleteMessage
);

// POST /api/chats/:chatId/read - Marcar mensajes como leídos
router.post(
  '/:chatId/read',
  [
    param('chatId').isUUID().withMessage('ID de chat inválido'),
    body('messageIds').optional().isArray().withMessage('IDs de mensajes debe ser un array'),
    body('messageIds.*').optional().isUUID().withMessage('ID de mensaje inválido'),
    validateRequest
  ],
  rateLimiter,
  markMessagesAsRead
);

// POST /api/chats/:chatId/typing/start - Iniciar indicador de escritura
router.post(
  '/:chatId/typing/start',
  [
    param('chatId').isUUID().withMessage('ID de chat inválido'),
    validateRequest
  ],
  rateLimiter,
  startTyping
);

// POST /api/chats/:chatId/typing/stop - Detener indicador de escritura
router.post(
  '/:chatId/typing/stop',
  [
    param('chatId').isUUID().withMessage('ID de chat inválido'),
    validateRequest
  ],
  rateLimiter,
  stopTyping
);

// GET /api/chats/:chatId/typing - Obtener usuarios escribiendo
router.get(
  '/:chatId/typing',
  [
    param('chatId').isUUID().withMessage('ID de chat inválido'),
    validateRequest
  ],
  rateLimiter,
  getTypingUsers
);

// POST /api/chats/cleanup - Limpiar indicadores de escritura expirados
router.post(
  '/cleanup',
  rateLimiter,
  cleanupTypingIndicators
);

export default router;