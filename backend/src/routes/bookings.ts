import { Router } from 'express';
import { 
  ReservasController, 
  DisponibilidadController, 
  RecordatoriosController 
} from '@/controllers/bookingsController';
import { authenticateToken } from '@/middleware/auth';
import { rateLimiter, createRateLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Rate limiter más restrictivo para creación de reservas
const createReservationLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 5, // 5 reservas por minuto máximo
  message: 'Demasiadas reservas creadas, intenta de nuevo en un minuto.'
});

// Rate limiter para operaciones de disponibilidad
const availabilityLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 30, // 30 consultas por minuto
  message: 'Demasiadas consultas de disponibilidad, intenta de nuevo en un minuto.'
});

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// =============================================================================
// RUTAS: GESTIÓN DE RESERVAS
// =============================================================================

// Crear nueva reserva
router.post(
  '/reservations',
  createReservationLimiter,
  ReservasController.create
);

// Obtener reservas del usuario
router.get(
  '/reservations',
  rateLimiter,
  ReservasController.getUserReservations
);

// Obtener detalles de una reserva específica
router.get(
  '/reservations/:reservaId',
  rateLimiter,
  ReservasController.getReservationDetails
);

// Confirmar reserva (AS acepta)
router.patch(
  '/reservations/:reservaId/confirm',
  rateLimiter,
  ReservasController.confirmReservation
);

// Cancelar reserva
router.patch(
  '/reservations/:reservaId/cancel',
  rateLimiter,
  ReservasController.cancelReservation
);

// Iniciar servicio
router.patch(
  '/reservations/:reservaId/start',
  rateLimiter,
  ReservasController.startService
);

// Finalizar servicio
router.patch(
  '/reservations/:reservaId/finish',
  rateLimiter,
  ReservasController.finishService
);

// Obtener estadísticas de reservas (para AS)
router.get(
  '/stats',
  rateLimiter,
  ReservasController.getAsStats
);

// =============================================================================
// RUTAS: GESTIÓN DE DISPONIBILIDAD
// =============================================================================

// Crear slot de disponibilidad
router.post(
  '/availability/slots',
  rateLimiter,
  DisponibilidadController.createSlot
);

// Obtener disponibilidad de un AS
router.get(
  '/availability/:asId',
  availabilityLimiter,
  DisponibilidadController.getAvailability
);

// Crear bloqueo de disponibilidad
router.post(
  '/availability/blocks',
  rateLimiter,
  DisponibilidadController.createBlock
);

// =============================================================================
// RUTAS: CONFIGURACIÓN DE RECORDATORIOS
// =============================================================================

// Obtener configuración de recordatorios
router.get(
  '/reminders/config',
  rateLimiter,
  RecordatoriosController.getConfig
);

// Actualizar configuración de recordatorios
router.patch(
  '/reminders/config',
  rateLimiter,
  RecordatoriosController.updateConfig
);

export default router;