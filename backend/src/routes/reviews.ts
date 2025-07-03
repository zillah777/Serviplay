import { Router } from 'express';
import { ReviewsController } from '@/controllers/reviewsController';
import { authenticateToken } from '@/middleware/auth';
import { rateLimiter, createRateLimiter } from '@/middleware/rateLimiter';
import { validate, createReviewSchema, updateReviewSchema, reportReviewSchema } from '@/utils/validation';

const router = Router();

// Rate limiter específico para reviews (más restrictivo para creación)
const reviewRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 5, // 5 reviews por minuto
  message: 'Demasiadas calificaciones enviadas, intenta de nuevo en un minuto.'
});

// ============================================================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================================================

// Obtener calificaciones públicas recientes
router.get('/public/recent', ReviewsController.getRecentPublicReviews);

// Obtener calificaciones públicas de un usuario específico
router.get('/public/user/:userId', ReviewsController.getUserReviews);

// Obtener estadísticas públicas de un usuario
router.get('/public/stats/:userId', ReviewsController.getUserStats);

// ============================================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================================================

// Aplicar autenticación a todas las rutas siguientes
router.use(authenticateToken);

// ============================================================================
// GESTIÓN DE CALIFICACIONES
// ============================================================================

// Crear nueva calificación
router.post(
  '/', 
  reviewRateLimiter, 
  validate(createReviewSchema), 
  ReviewsController.createReview
);

// Obtener calificación específica por ID
router.get('/:reviewId', ReviewsController.getReviewById);

// Actualizar calificación propia
router.patch(
  '/:reviewId', 
  reviewRateLimiter, 
  validate(updateReviewSchema), 
  ReviewsController.updateReview
);

// Eliminar calificación propia
router.delete('/:reviewId', ReviewsController.deleteReview);

// ============================================================================
// CALIFICACIONES POR USUARIO
// ============================================================================

// Obtener calificaciones recibidas por un usuario específico
router.get('/user/:userId/received', ReviewsController.getUserReviews);

// Obtener estadísticas detalladas de un usuario
router.get('/user/:userId/stats', ReviewsController.getUserStats);

// ============================================================================
// GESTIÓN PERSONAL DE CALIFICACIONES
// ============================================================================

// Obtener mis calificaciones dadas
router.get('/my/given', ReviewsController.getReviewsGivenByUser);

// Obtener calificaciones pendientes por hacer
router.get('/my/pending', ReviewsController.getPendingReviews);

// Obtener resumen para dashboard personal
router.get('/my/dashboard', ReviewsController.getDashboardSummary);

// ============================================================================
// MODERACIÓN
// ============================================================================

// Reportar calificación inapropiada
router.post(
  '/:reviewId/report', 
  rateLimiter, 
  validate(reportReviewSchema), 
  ReviewsController.reportReview
);

export default router;