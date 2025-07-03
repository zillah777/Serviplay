import { Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { 
  FavoritosModel, 
  ListasFavoritosModel, 
  FavoritosCompartidosModel 
} from '@/models/Favorites';
import { validateUUID } from '@/utils/validation';

// ============================================================================
// CONTROLADOR: FAVORITOS BÁSICOS
// ============================================================================

export class FavoritesController {
  
  // Agregar servicio a favoritos
  static async addToFavorites(req: AuthRequest, res: Response) {
    try {
      const { servicio_id, nota_personal, metadata } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!servicio_id || !validateUUID(servicio_id)) {
        return res.status(400).json({ error: 'ID de servicio válido requerido' });
      }

      const favorito = await FavoritosModel.addToFavorites({
        usuario_id,
        servicio_id,
        nota_personal,
        metadata
      });

      res.status(201).json({
        message: 'Servicio agregado a favoritos',
        favorito
      });
    } catch (error) {
      console.error('Error adding to favorites:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Remover servicio de favoritos
  static async removeFromFavorites(req: AuthRequest, res: Response) {
    try {
      const { servicioId } = req.params;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(servicioId)) {
        return res.status(400).json({ error: 'ID de servicio inválido' });
      }

      const removed = await FavoritosModel.removeFromFavorites(usuario_id, servicioId);

      if (!removed) {
        return res.status(404).json({ error: 'Favorito no encontrado' });
      }

      res.json({ message: 'Servicio removido de favoritos' });
    } catch (error) {
      console.error('Error removing from favorites:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Verificar si un servicio es favorito
  static async checkIsFavorite(req: AuthRequest, res: Response) {
    try {
      const { servicioId } = req.params;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(servicioId)) {
        return res.status(400).json({ error: 'ID de servicio inválido' });
      }

      const isFavorite = await FavoritosModel.isFavorite(usuario_id, servicioId);

      res.json({ is_favorite: isFavorite });
    } catch (error) {
      console.error('Error checking favorite status:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener favoritos del usuario con detalles
  static async getUserFavorites(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      const filtros = {
        categoria: req.query.categoria as string,
        busqueda: req.query.busqueda as string,
        precio_min: req.query.precio_min ? parseFloat(req.query.precio_min as string) : undefined,
        precio_max: req.query.precio_max ? parseFloat(req.query.precio_max as string) : undefined
      };

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const result = await FavoritosModel.getUserFavoritesWithDetails(
        usuario_id, 
        page, 
        limit, 
        filtros
      );

      res.json({
        favoritos: result.favoritos,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting user favorites:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar nota personal de favorito
  static async updateFavoriteNote(req: AuthRequest, res: Response) {
    try {
      const { servicioId } = req.params;
      const { nota_personal } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(servicioId)) {
        return res.status(400).json({ error: 'ID de servicio inválido' });
      }

      if (!nota_personal || typeof nota_personal !== 'string') {
        return res.status(400).json({ error: 'Nota personal requerida' });
      }

      const updated = await FavoritosModel.updateNote(usuario_id, servicioId, nota_personal);

      if (!updated) {
        return res.status(404).json({ error: 'Favorito no encontrado' });
      }

      res.json({ message: 'Nota actualizada correctamente' });
    } catch (error) {
      console.error('Error updating favorite note:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener servicios más populares en favoritos
  static async getPopularFavorites(req: AuthRequest, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      
      const popularServices = await FavoritosModel.getPopularFavorites(limit);
      
      res.json({ servicios_populares: popularServices });
    } catch (error) {
      console.error('Error getting popular favorites:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

// ============================================================================
// CONTROLADOR: LISTAS DE FAVORITOS
// ============================================================================

export class FavoriteListsController {

  // Crear nueva lista de favoritos
  static async createList(req: AuthRequest, res: Response) {
    try {
      const { nombre, descripcion, color, icono, publica, compartible } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
        return res.status(400).json({ error: 'Nombre de lista requerido' });
      }

      if (nombre.length > 100) {
        return res.status(400).json({ error: 'Nombre de lista muy largo (máximo 100 caracteres)' });
      }

      const lista = await ListasFavoritosModel.create({
        usuario_id,
        nombre: nombre.trim(),
        descripcion,
        color,
        icono,
        publica,
        compartible
      });

      res.status(201).json({
        message: 'Lista de favoritos creada',
        lista
      });
    } catch (error) {
      console.error('Error creating favorite list:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener listas del usuario
  static async getUserLists(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const listas = await ListasFavoritosModel.getUserLists(usuario_id);

      res.json({ listas });
    } catch (error) {
      console.error('Error getting user lists:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener lista específica con permisos
  static async getListById(req: AuthRequest, res: Response) {
    try {
      const { listaId } = req.params;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(listaId)) {
        return res.status(400).json({ error: 'ID de lista inválido' });
      }

      const result = await ListasFavoritosModel.findByIdWithPermissions(listaId, usuario_id);

      if (!result) {
        return res.status(404).json({ error: 'Lista no encontrada' });
      }

      if (!result.permisos.puede_ver) {
        return res.status(403).json({ error: 'No tienes permisos para ver esta lista' });
      }

      res.json({
        lista: result.lista,
        permisos: result.permisos
      });
    } catch (error) {
      console.error('Error getting list by ID:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar lista
  static async updateList(req: AuthRequest, res: Response) {
    try {
      const { listaId } = req.params;
      const usuario_id = req.user?.id;
      const { nombre, descripcion, color, icono, publica, compartible } = req.body;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(listaId)) {
        return res.status(400).json({ error: 'ID de lista inválido' });
      }

      const updates: any = {};
      if (nombre !== undefined) {
        if (typeof nombre !== 'string' || nombre.trim().length === 0) {
          return res.status(400).json({ error: 'Nombre de lista inválido' });
        }
        updates.nombre = nombre.trim();
      }
      if (descripcion !== undefined) updates.descripcion = descripcion;
      if (color !== undefined) updates.color = color;
      if (icono !== undefined) updates.icono = icono;
      if (publica !== undefined) updates.publica = publica;
      if (compartible !== undefined) updates.compartible = compartible;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No hay campos para actualizar' });
      }

      const updatedList = await ListasFavoritosModel.update(listaId, usuario_id, updates);

      if (!updatedList) {
        return res.status(404).json({ error: 'Lista no encontrada o no tienes permisos' });
      }

      res.json({
        message: 'Lista actualizada correctamente',
        lista: updatedList
      });
    } catch (error) {
      console.error('Error updating list:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Eliminar lista
  static async deleteList(req: AuthRequest, res: Response) {
    try {
      const { listaId } = req.params;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(listaId)) {
        return res.status(400).json({ error: 'ID de lista inválido' });
      }

      const deleted = await ListasFavoritosModel.delete(listaId, usuario_id);

      if (!deleted) {
        return res.status(404).json({ error: 'Lista no encontrada o no tienes permisos' });
      }

      res.json({ message: 'Lista eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting list:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Agregar favorito a lista
  static async addFavoriteToList(req: AuthRequest, res: Response) {
    try {
      const { listaId } = req.params;
      const { favorito_id, orden } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(listaId) || !validateUUID(favorito_id)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      // Verificar permisos
      const listData = await ListasFavoritosModel.findByIdWithPermissions(listaId, usuario_id);
      if (!listData || !listData.permisos.puede_agregar) {
        return res.status(403).json({ error: 'No tienes permisos para agregar a esta lista' });
      }

      const favoritoLista = await ListasFavoritosModel.addFavoriteToList(
        listaId, 
        favorito_id, 
        orden
      );

      res.status(201).json({
        message: 'Favorito agregado a la lista',
        favorito_lista: favoritoLista
      });
    } catch (error) {
      console.error('Error adding favorite to list:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Remover favorito de lista
  static async removeFavoriteFromList(req: AuthRequest, res: Response) {
    try {
      const { listaId, favoritoId } = req.params;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(listaId) || !validateUUID(favoritoId)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      // Verificar permisos
      const listData = await ListasFavoritosModel.findByIdWithPermissions(listaId, usuario_id);
      if (!listData || !listData.permisos.puede_editar) {
        return res.status(403).json({ error: 'No tienes permisos para editar esta lista' });
      }

      const removed = await ListasFavoritosModel.removeFavoriteFromList(listaId, favoritoId);

      if (!removed) {
        return res.status(404).json({ error: 'Favorito no encontrado en la lista' });
      }

      res.json({ message: 'Favorito removido de la lista' });
    } catch (error) {
      console.error('Error removing favorite from list:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener favoritos de una lista
  static async getListFavorites(req: AuthRequest, res: Response) {
    try {
      const { listaId } = req.params;
      const usuario_id = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(listaId)) {
        return res.status(400).json({ error: 'ID de lista inválido' });
      }

      // Verificar permisos
      const listData = await ListasFavoritosModel.findByIdWithPermissions(listaId, usuario_id);
      if (!listData || !listData.permisos.puede_ver) {
        return res.status(403).json({ error: 'No tienes permisos para ver esta lista' });
      }

      const result = await ListasFavoritosModel.getListFavorites(listaId, page, limit);

      res.json({
        favoritos: result.favoritos,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting list favorites:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Reordenar favoritos en lista
  static async reorderListFavorites(req: AuthRequest, res: Response) {
    try {
      const { listaId } = req.params;
      const { reordered_items } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(listaId)) {
        return res.status(400).json({ error: 'ID de lista inválido' });
      }

      if (!Array.isArray(reordered_items)) {
        return res.status(400).json({ error: 'Items reordenados requeridos como array' });
      }

      // Verificar permisos
      const listData = await ListasFavoritosModel.findByIdWithPermissions(listaId, usuario_id);
      if (!listData || !listData.permisos.puede_editar) {
        return res.status(403).json({ error: 'No tienes permisos para editar esta lista' });
      }

      await ListasFavoritosModel.reorderListFavorites(listaId, reordered_items);

      res.json({ message: 'Lista reordenada correctamente' });
    } catch (error) {
      console.error('Error reordering list favorites:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

// ============================================================================
// CONTROLADOR: FAVORITOS COMPARTIDOS
// ============================================================================

export class SharedFavoritesController {

  // Compartir lista con otro usuario
  static async shareList(req: AuthRequest, res: Response) {
    try {
      const { listaId } = req.params;
      const { 
        compartido_con, 
        puede_editar, 
        puede_agregar, 
        mensaje, 
        expires_at 
      } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(listaId) || !validateUUID(compartido_con)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      if (usuario_id === compartido_con) {
        return res.status(400).json({ error: 'No puedes compartir una lista contigo mismo' });
      }

      // Verificar que el usuario es propietario de la lista
      const listData = await ListasFavoritosModel.findByIdWithPermissions(listaId, usuario_id);
      if (!listData || !listData.permisos.es_propietario) {
        return res.status(403).json({ error: 'Solo el propietario puede compartir la lista' });
      }

      if (!listData.lista.compartible) {
        return res.status(403).json({ error: 'Esta lista no es compartible' });
      }

      const sharedFavorite = await FavoritosCompartidosModel.shareList({
        lista_id: listaId,
        compartido_por: usuario_id,
        compartido_con,
        puede_editar,
        puede_agregar,
        mensaje,
        expires_at: expires_at ? new Date(expires_at) : undefined
      });

      res.status(201).json({
        message: 'Lista compartida correctamente',
        compartido: sharedFavorite
      });
    } catch (error) {
      console.error('Error sharing list:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener listas compartidas conmigo
  static async getSharedWithMe(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const sharedLists = await FavoritosCompartidosModel.getSharedWithMe(usuario_id);

      res.json({ listas_compartidas: sharedLists });
    } catch (error) {
      console.error('Error getting shared lists:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Revocar compartición
  static async revokeShare(req: AuthRequest, res: Response) {
    try {
      const { listaId, usuarioId } = req.params;
      const propietario_id = req.user?.id;

      if (!propietario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(listaId) || !validateUUID(usuarioId)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      // Verificar que el usuario es propietario de la lista
      const listData = await ListasFavoritosModel.findByIdWithPermissions(listaId, propietario_id);
      if (!listData || !listData.permisos.es_propietario) {
        return res.status(403).json({ error: 'Solo el propietario puede revocar comparticiones' });
      }

      const revoked = await FavoritosCompartidosModel.revokeShare(listaId, usuarioId);

      if (!revoked) {
        return res.status(404).json({ error: 'Compartición no encontrada' });
      }

      res.json({ message: 'Compartición revocada correctamente' });
    } catch (error) {
      console.error('Error revoking share:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}