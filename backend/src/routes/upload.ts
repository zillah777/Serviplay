import { Router } from 'express';
import { UploadController, FileRelationsController } from '@/controllers/uploadController';
import { authenticateToken } from '@/middleware/auth';
import { rateLimiter, createRateLimiter } from '@/middleware/rateLimiter';

// Rate limiter específico para uploads (más restrictivo)
const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  maxRequests: 10, // 10 uploads por minuto
  message: 'Demasiadas subidas de archivos, intenta de nuevo en un minuto.'
});
import { uploadMiddleware } from '@/config/storage';

const router = Router();

// Aplicar autenticación a todas las rutas de upload
router.use(authenticateToken);

// ============================================================================
// RUTAS: SUBIDA DE ARCHIVOS
// ============================================================================

// Subir archivo único
router.post(
  '/single',
  uploadRateLimiter,
  uploadMiddleware.single('file'),
  UploadController.uploadSingle
);

// Subir múltiples archivos
router.post(
  '/multiple',
  uploadRateLimiter,
  uploadMiddleware.array('files', 10), // Máximo 10 archivos
  UploadController.uploadMultiple
);

// Subir archivo temporal (sin asociar a entidad)
router.post(
  '/temporary',
  uploadRateLimiter,
  uploadMiddleware.single('file'),
  UploadController.uploadTemporary
);

// Confirmar archivo temporal y asociar a entidad
router.post(
  '/confirm/:token',
  rateLimiter,
  UploadController.confirmTemporaryFile
);

// ============================================================================
// RUTAS: GESTIÓN DE ARCHIVOS
// ============================================================================

// Obtener archivos del usuario
router.get('/my-files', UploadController.getUserFiles);

// Obtener estadísticas de archivos del usuario
router.get('/stats', UploadController.getUserStats);

// Eliminar archivo
router.delete('/:archivoId', UploadController.deleteFile);

// ============================================================================
// RUTAS: GESTIÓN DE RELACIONES
// ============================================================================

// Obtener archivos de una entidad específica
router.get('/entity/:entidadTipo/:entidadId', FileRelationsController.getEntityFiles);

// Asociar archivo existente a entidad
router.post('/associate', rateLimiter, FileRelationsController.associateFile);

// Remover asociación archivo-entidad
router.delete(
  '/associate/:archivoId/:entidadTipo/:entidadId',
  FileRelationsController.removeAssociation
);

// Reordenar archivos en galería de entidad
router.patch(
  '/reorder/:entidadTipo/:entidadId',
  rateLimiter,
  FileRelationsController.reorderFiles
);

export default router;