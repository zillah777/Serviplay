import { Router } from 'express';
import { 
  FavoritesController, 
  FavoriteListsController, 
  SharedFavoritesController 
} from '@/controllers/favoritesController';
import { authenticateToken } from '@/middleware/auth';
import { rateLimiter } from '@/middleware/rateLimiter';

const router = Router();

// Aplicar autenticación a todas las rutas de favoritos
router.use(authenticateToken);

// ============================================================================
// RUTAS: FAVORITOS BÁSICOS
// ============================================================================

// Agregar servicio a favoritos
router.post('/', rateLimiter, FavoritesController.addToFavorites);

// Remover servicio de favoritos
router.delete('/:servicioId', FavoritesController.removeFromFavorites);

// Verificar si un servicio es favorito
router.get('/check/:servicioId', FavoritesController.checkIsFavorite);

// Obtener favoritos del usuario con detalles y filtros
router.get('/', FavoritesController.getUserFavorites);

// Actualizar nota personal de favorito
router.patch('/:servicioId/note', rateLimiter, FavoritesController.updateFavoriteNote);

// Obtener servicios más populares en favoritos (ruta pública relativa)
router.get('/popular', FavoritesController.getPopularFavorites);

// ============================================================================
// RUTAS: LISTAS DE FAVORITOS
// ============================================================================

// Crear nueva lista de favoritos
router.post('/lists', rateLimiter, FavoriteListsController.createList);

// Obtener listas del usuario
router.get('/lists', FavoriteListsController.getUserLists);

// Obtener lista específica con permisos
router.get('/lists/:listaId', FavoriteListsController.getListById);

// Actualizar lista
router.patch('/lists/:listaId', rateLimiter, FavoriteListsController.updateList);

// Eliminar lista
router.delete('/lists/:listaId', FavoriteListsController.deleteList);

// Agregar favorito a lista
router.post('/lists/:listaId/favorites', rateLimiter, FavoriteListsController.addFavoriteToList);

// Remover favorito de lista
router.delete('/lists/:listaId/favorites/:favoritoId', FavoriteListsController.removeFavoriteFromList);

// Obtener favoritos de una lista
router.get('/lists/:listaId/favorites', FavoriteListsController.getListFavorites);

// Reordenar favoritos en lista
router.patch('/lists/:listaId/reorder', rateLimiter, FavoriteListsController.reorderListFavorites);

// ============================================================================
// RUTAS: FAVORITOS COMPARTIDOS
// ============================================================================

// Compartir lista con otro usuario
router.post('/lists/:listaId/share', rateLimiter, SharedFavoritesController.shareList);

// Obtener listas compartidas conmigo
router.get('/shared', SharedFavoritesController.getSharedWithMe);

// Revocar compartición
router.delete('/lists/:listaId/share/:usuarioId', SharedFavoritesController.revokeShare);

export default router;