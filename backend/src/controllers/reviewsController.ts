import { Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { CalificacionesModel } from '@/models/Reviews';
import { validateUUID } from '@/utils/validation';

// ============================================================================
// CONTROLADOR: CALIFICACIONES/REVIEWS
// ============================================================================

export class ReviewsController {
  
  // Crear nueva calificación
  static async createReview(req: AuthRequest, res: Response) {
    try {
      const {
        match_id,
        calificado_id,
        puntuacion,
        comentario,
        puntualidad,
        calidad,
        comunicacion,
        precio_justo,
        publica
      } = req.body;
      
      const calificador_id = req.user?.id;

      if (!calificador_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Validaciones básicas
      if (!validateUUID(match_id) || !validateUUID(calificado_id)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      if (!puntuacion || puntuacion < 1 || puntuacion > 5) {
        return res.status(400).json({ error: 'Puntuación debe estar entre 1 y 5' });
      }

      if (!puntualidad || !calidad || !comunicacion || !precio_justo) {
        return res.status(400).json({ error: 'Todos los aspectos de calificación son requeridos' });
      }

      if ([puntualidad, calidad, comunicacion, precio_justo].some(val => val < 1 || val > 5)) {
        return res.status(400).json({ error: 'Todos los aspectos deben estar entre 1 y 5' });
      }

      if (calificador_id === calificado_id) {
        return res.status(400).json({ error: 'No puedes calificarte a ti mismo' });
      }

      // Verificar si ya existe calificación
      const existeCalificacion = await CalificacionesModel.existsForMatch(
        match_id,
        calificador_id,
        calificado_id
      );

      if (existeCalificacion) {
        return res.status(409).json({ error: 'Ya has calificado a este usuario para este servicio' });
      }

      // Crear calificación
      const calificacion = await CalificacionesModel.create({
        match_id,
        calificador_id,
        calificado_id,
        puntuacion,
        comentario: comentario?.trim() || null,
        puntualidad,
        calidad,
        comunicacion,
        precio_justo,
        publica: publica !== false // Default true
      });

      res.status(201).json({
        message: 'Calificación creada exitosamente',
        calificacion
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener calificación por ID
  static async getReviewById(req: AuthRequest, res: Response) {
    try {
      const { reviewId } = req.params;

      if (!validateUUID(reviewId)) {
        return res.status(400).json({ error: 'ID de calificación inválido' });
      }

      const calificacion = await CalificacionesModel.findById(reviewId);

      if (!calificacion) {
        return res.status(404).json({ error: 'Calificación no encontrada' });
      }

      // Verificar permisos de acceso
      const usuario_id = req.user?.id;
      const canView = calificacion.publica || 
                     calificacion.calificador_id === usuario_id || 
                     calificacion.calificado_id === usuario_id;

      if (!canView) {
        return res.status(403).json({ error: 'No tienes permisos para ver esta calificación' });
      }

      res.json({ calificacion });
    } catch (error) {
      console.error('Error getting review:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener calificaciones recibidas por un usuario
  static async getUserReviews(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      const filtros = {
        solo_publicas: req.query.solo_publicas === 'true',
        puntuacion_min: req.query.puntuacion_min ? parseInt(req.query.puntuacion_min as string) : undefined,
        con_comentario: req.query.con_comentario === 'true'
      };

      if (!validateUUID(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
      }

      // Si no es el propio usuario, solo mostrar calificaciones públicas
      const requestingUserId = req.user?.id;
      if (requestingUserId !== userId) {
        filtros.solo_publicas = true;
      }

      const result = await CalificacionesModel.getReceivedByUser(userId, page, limit, filtros);

      res.json({
        calificaciones: result.calificaciones,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting user reviews:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener calificaciones dadas por un usuario
  static async getReviewsGivenByUser(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const result = await CalificacionesModel.getGivenByUser(usuario_id, page, limit);

      res.json({
        calificaciones: result.calificaciones,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting given reviews:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener estadísticas de calificaciones de un usuario
  static async getUserStats(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;

      if (!validateUUID(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
      }

      const estadisticas = await CalificacionesModel.getUserStats(userId);

      res.json({ estadisticas });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener calificaciones pendientes del usuario
  static async getPendingReviews(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const pendientes = await CalificacionesModel.getPendingReviews(usuario_id);

      res.json({
        calificaciones_pendientes: pendientes,
        total: pendientes.length
      });
    } catch (error) {
      console.error('Error getting pending reviews:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar calificación
  static async updateReview(req: AuthRequest, res: Response) {
    try {
      const { reviewId } = req.params;
      const {
        puntuacion,
        comentario,
        puntualidad,
        calidad,
        comunicacion,
        precio_justo,
        publica
      } = req.body;

      const calificador_id = req.user?.id;

      if (!calificador_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(reviewId)) {
        return res.status(400).json({ error: 'ID de calificación inválido' });
      }

      // Preparar updates
      const updates: any = {};
      if (puntuacion !== undefined) {
        if (puntuacion < 1 || puntuacion > 5) {
          return res.status(400).json({ error: 'Puntuación debe estar entre 1 y 5' });
        }
        updates.puntuacion = puntuacion;
      }

      if (comentario !== undefined) {
        updates.comentario = comentario?.trim() || null;
      }

      if (puntualidad !== undefined) {
        if (puntualidad < 1 || puntualidad > 5) {
          return res.status(400).json({ error: 'Puntualidad debe estar entre 1 y 5' });
        }
        updates.puntualidad = puntualidad;
      }

      if (calidad !== undefined) {
        if (calidad < 1 || calidad > 5) {
          return res.status(400).json({ error: 'Calidad debe estar entre 1 y 5' });
        }
        updates.calidad = calidad;
      }

      if (comunicacion !== undefined) {
        if (comunicacion < 1 || comunicacion > 5) {
          return res.status(400).json({ error: 'Comunicación debe estar entre 1 y 5' });
        }
        updates.comunicacion = comunicacion;
      }

      if (precio_justo !== undefined) {
        if (precio_justo < 1 || precio_justo > 5) {
          return res.status(400).json({ error: 'Precio justo debe estar entre 1 y 5' });
        }
        updates.precio_justo = precio_justo;
      }

      if (publica !== undefined) {
        updates.publica = publica;
      }

      const calificacionActualizada = await CalificacionesModel.update(
        reviewId,
        calificador_id,
        updates
      );

      if (!calificacionActualizada) {
        return res.status(404).json({ 
          error: 'Calificación no encontrada o no tienes permisos para actualizarla' 
        });
      }

      res.json({
        message: 'Calificación actualizada exitosamente',
        calificacion: calificacionActualizada
      });
    } catch (error) {
      console.error('Error updating review:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Eliminar calificación
  static async deleteReview(req: AuthRequest, res: Response) {
    try {
      const { reviewId } = req.params;
      const calificador_id = req.user?.id;

      if (!calificador_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(reviewId)) {
        return res.status(400).json({ error: 'ID de calificación inválido' });
      }

      const eliminada = await CalificacionesModel.delete(reviewId, calificador_id);

      if (!eliminada) {
        return res.status(404).json({ 
          error: 'Calificación no encontrada o no tienes permisos para eliminarla' 
        });
      }

      res.json({ message: 'Calificación eliminada exitosamente' });
    } catch (error) {
      console.error('Error deleting review:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener calificaciones públicas recientes (para homepage, etc.)
  static async getRecentPublicReviews(req: AuthRequest, res: Response) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      const calificaciones = await CalificacionesModel.getRecentPublicReviews(limit);

      res.json({ calificaciones_recientes: calificaciones });
    } catch (error) {
      console.error('Error getting recent public reviews:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Reportar calificación inapropiada
  static async reportReview(req: AuthRequest, res: Response) {
    try {
      const { reviewId } = req.params;
      const { razon } = req.body;
      const reportado_por = req.user?.id;

      if (!reportado_por) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(reviewId)) {
        return res.status(400).json({ error: 'ID de calificación inválido' });
      }

      if (!razon || typeof razon !== 'string' || razon.trim().length === 0) {
        return res.status(400).json({ error: 'Razón del reporte es requerida' });
      }

      // Verificar que la calificación existe
      const calificacion = await CalificacionesModel.findById(reviewId);
      if (!calificacion) {
        return res.status(404).json({ error: 'Calificación no encontrada' });
      }

      // No permitir reportar propias calificaciones
      if (calificacion.calificador_id === reportado_por) {
        return res.status(400).json({ error: 'No puedes reportar tu propia calificación' });
      }

      await CalificacionesModel.reportReview(reviewId, reportado_por, razon.trim());

      res.json({ message: 'Calificación reportada exitosamente. Revisaremos tu reporte.' });
    } catch (error) {
      console.error('Error reporting review:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener resumen de calificaciones para el dashboard
  static async getDashboardSummary(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // Obtener estadísticas propias
      const estadisticas = await CalificacionesModel.getUserStats(usuario_id);
      
      // Obtener calificaciones pendientes
      const pendientes = await CalificacionesModel.getPendingReviews(usuario_id);
      
      // Obtener últimas calificaciones recibidas
      const ultimasRecibidas = await CalificacionesModel.getReceivedByUser(usuario_id, 1, 5);

      res.json({
        resumen: {
          estadisticas,
          calificaciones_pendientes: pendientes.length,
          ultimas_calificaciones: ultimasRecibidas.calificaciones
        }
      });
    } catch (error) {
      console.error('Error getting dashboard summary:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}