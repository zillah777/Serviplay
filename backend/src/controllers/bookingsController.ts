import { Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { 
  ReservasModel, 
  DisponibilidadModel, 
  PlantillasHorarioModel,
  ConfiguracionRecordatoriosModel,
  BookingStatus,
  CreateReservaData,
  CreateDisponibilidadData
} from '@/models/Bookings';
import { validateUUID } from '@/utils/validation';
import { NotificationService } from '@/services/NotificationService';

// =============================================================================
// CONTROLADOR: RESERVAS
// =============================================================================

export class ReservasController {
  
  // Crear nueva reserva
  static async create(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const {
        as_id,
        servicio_id,
        match_id,
        fecha_servicio,
        hora_inicio,
        hora_fin,
        duracion_estimada,
        direccion_servicio,
        latitud_servicio,
        longitud_servicio,
        es_remoto,
        titulo_servicio,
        descripcion_trabajo,
        precio_acordado,
        precio_por_hora,
        notas_explorador,
        instrucciones_especiales
      } = req.body;

      // Validaciones básicas
      if (!as_id || !validateUUID(as_id)) {
        return res.status(400).json({ error: 'ID de AS inválido' });
      }

      if (!fecha_servicio || !hora_inicio || !hora_fin) {
        return res.status(400).json({ error: 'Fecha y horas son requeridas' });
      }

      if (!titulo_servicio || !precio_acordado) {
        return res.status(400).json({ error: 'Título del servicio y precio son requeridos' });
      }

      // Verificar que el usuario es diferente al AS
      if (usuario_id === as_id) {
        return res.status(400).json({ error: 'No puedes reservar tu propio servicio' });
      }

      // Verificar disponibilidad del AS
      const isAvailable = await ReservasModel.checkAvailability(
        as_id, fecha_servicio, hora_inicio, hora_fin
      );

      if (!isAvailable) {
        return res.status(409).json({ 
          error: 'El AS no está disponible en el horario seleccionado' 
        });
      }

      // Crear datos de la reserva
      const reservaData: CreateReservaData = {
        explorador_id: usuario_id,
        as_id,
        servicio_id,
        match_id,
        fecha_servicio,
        hora_inicio,
        hora_fin,
        duracion_estimada: duracion_estimada || 60,
        direccion_servicio,
        latitud_servicio,
        longitud_servicio,
        es_remoto: es_remoto || false,
        titulo_servicio,
        descripcion_trabajo,
        precio_acordado: parseFloat(precio_acordado),
        precio_por_hora: precio_por_hora ? parseFloat(precio_por_hora) : undefined,
        notas_explorador,
        instrucciones_especiales
      };

      // Crear la reserva
      const reserva = await ReservasModel.create(reservaData);

      // Enviar notificación al AS
      try {
        await NotificationService.crearNotificacion({
          usuario_id: as_id,
          tipo: 'match',
          titulo: 'Nueva reserva recibida',
          mensaje: `${titulo_servicio} para el ${fecha_servicio} a las ${hora_inicio}`,
          datos_extra: {
            reserva_id: reserva.id,
            tipo_notificacion: 'nueva_reserva'
          }
        });
      } catch (notifError) {
        console.error('Error enviando notificación de nueva reserva:', notifError);
        // No fallar la reserva por error de notificación
      }

      res.status(201).json({
        message: 'Reserva creada exitosamente',
        reserva,
        next_steps: [
          'El AS recibirá una notificación de tu reserva',
          'Recibirás confirmación cuando el AS acepte',
          'Podrás ver el estado en tu panel de reservas'
        ]
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener reservas del usuario
  static async getUserReservations(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const { role = 'explorador', page = 1, limit = 20, estado } = req.query;
      const parsedPage = parseInt(page as string) || 1;
      const parsedLimit = Math.min(parseInt(limit as string) || 20, 50);

      if (role !== 'as' && role !== 'explorador') {
        return res.status(400).json({ error: 'Rol inválido' });
      }

      const result = await ReservasModel.findByUser(
        usuario_id,
        role as 'as' | 'explorador',
        parsedPage,
        parsedLimit,
        estado as BookingStatus
      );

      res.json({
        reservas: result.reservas,
        pagination: {
          page: parsedPage,
          limit: parsedLimit,
          total: result.total,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.total / parsedLimit)
        }
      });
    } catch (error) {
      console.error('Error getting user reservations:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener detalles de una reserva
  static async getReservationDetails(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const { reservaId } = req.params;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(reservaId)) {
        return res.status(400).json({ error: 'ID de reserva inválido' });
      }

      const reserva = await ReservasModel.findById(reservaId);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      // Verificar que el usuario tiene acceso a esta reserva
      if (reserva.explorador_id !== usuario_id && reserva.as_id !== usuario_id) {
        return res.status(403).json({ error: 'No tienes acceso a esta reserva' });
      }

      res.json({ reserva });
    } catch (error) {
      console.error('Error getting reservation details:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Confirmar reserva (AS acepta)
  static async confirmReservation(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const { reservaId } = req.params;
      const { notas_as } = req.body;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(reservaId)) {
        return res.status(400).json({ error: 'ID de reserva inválido' });
      }

      // Obtener reserva actual
      const reserva = await ReservasModel.findById(reservaId);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      // Verificar que el usuario es el AS de esta reserva
      if (reserva.as_id !== usuario_id) {
        return res.status(403).json({ error: 'Solo el AS puede confirmar esta reserva' });
      }

      // Verificar que la reserva está pendiente
      if (reserva.estado !== 'pendiente') {
        return res.status(400).json({ 
          error: `No se puede confirmar una reserva en estado: ${reserva.estado}` 
        });
      }

      // Verificar disponibilidad nuevamente
      const isStillAvailable = await ReservasModel.checkAvailability(
        reserva.as_id, 
        reserva.fecha_servicio, 
        reserva.hora_inicio, 
        reserva.hora_fin,
        reservaId // Excluir esta reserva de la verificación
      );

      if (!isStillAvailable) {
        return res.status(409).json({ 
          error: 'Ya no estás disponible en este horario' 
        });
      }

      // Confirmar la reserva
      const reservaConfirmada = await ReservasModel.updateStatus(
        reservaId, 
        'confirmada',
        usuario_id
      );

      // Agregar notas del AS si se proporcionaron
      if (notas_as && reservaConfirmada) {
        // Actualizar notas por separado (simplificado)
        // En una implementación completa, se agregaría al método updateStatus
      }

      // Notificar al explorador
      try {
        await NotificationService.crearNotificacion({
          usuario_id: reserva.explorador_id,
          tipo: 'match',
          titulo: 'Reserva confirmada',
          mensaje: `Tu reserva para ${reserva.titulo_servicio} ha sido confirmada`,
          datos_extra: {
            reserva_id: reservaId,
            tipo_notificacion: 'reserva_confirmada'
          }
        });
      } catch (notifError) {
        console.error('Error enviando notificación de confirmación:', notifError);
      }

      res.json({
        message: 'Reserva confirmada exitosamente',
        reserva: reservaConfirmada,
        next_steps: [
          'El cliente ha sido notificado',
          'Recibirás recordatorios antes del servicio',
          'Puedes iniciar el servicio desde tu panel cuando llegue el momento'
        ]
      });
    } catch (error) {
      console.error('Error confirming reservation:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Cancelar reserva
  static async cancelReservation(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const { reservaId } = req.params;
      const { motivo } = req.body;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(reservaId)) {
        return res.status(400).json({ error: 'ID de reserva inválido' });
      }

      if (!motivo) {
        return res.status(400).json({ error: 'Motivo de cancelación requerido' });
      }

      // Obtener reserva actual
      const reserva = await ReservasModel.findById(reservaId);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      // Verificar que el usuario tiene derecho a cancelar
      if (reserva.explorador_id !== usuario_id && reserva.as_id !== usuario_id) {
        return res.status(403).json({ error: 'No tienes permisos para cancelar esta reserva' });
      }

      // Verificar que la reserva se puede cancelar
      if (!['pendiente', 'confirmada'].includes(reserva.estado)) {
        return res.status(400).json({ 
          error: `No se puede cancelar una reserva en estado: ${reserva.estado}` 
        });
      }

      // Cancelar la reserva
      const reservaCancelada = await ReservasModel.updateStatus(
        reservaId,
        'cancelada',
        usuario_id,
        motivo
      );

      // Notificar a la otra parte
      const otherUserId = reserva.explorador_id === usuario_id 
        ? reserva.as_id 
        : reserva.explorador_id;

      const userRole = reserva.explorador_id === usuario_id ? 'cliente' : 'proveedor';

      try {
        await NotificationService.crearNotificacion({
          usuario_id: otherUserId,
          tipo: 'match',
          titulo: 'Reserva cancelada',
          mensaje: `El ${userRole} ha cancelado la reserva: ${motivo}`,
          datos_extra: {
            reserva_id: reservaId,
            tipo_notificacion: 'reserva_cancelada',
            cancelado_por: userRole
          }
        });
      } catch (notifError) {
        console.error('Error enviando notificación de cancelación:', notifError);
      }

      res.json({
        message: 'Reserva cancelada exitosamente',
        reserva: reservaCancelada
      });
    } catch (error) {
      console.error('Error canceling reservation:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Iniciar servicio
  static async startService(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const { reservaId } = req.params;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(reservaId)) {
        return res.status(400).json({ error: 'ID de reserva inválido' });
      }

      // Obtener reserva actual
      const reserva = await ReservasModel.findById(reservaId);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      // Verificar que el usuario es el AS
      if (reserva.as_id !== usuario_id) {
        return res.status(403).json({ error: 'Solo el AS puede iniciar el servicio' });
      }

      // Verificar que la reserva está confirmada
      if (reserva.estado !== 'confirmada') {
        return res.status(400).json({ 
          error: `No se puede iniciar un servicio en estado: ${reserva.estado}` 
        });
      }

      // Iniciar el servicio
      const reservaIniciada = await ReservasModel.startService(reservaId);

      // Notificar al explorador
      try {
        await NotificationService.crearNotificacion({
          usuario_id: reserva.explorador_id,
          tipo: 'match',
          titulo: 'Servicio iniciado',
          mensaje: `El servicio ${reserva.titulo_servicio} ha comenzado`,
          datos_extra: {
            reserva_id: reservaId,
            tipo_notificacion: 'servicio_iniciado'
          }
        });
      } catch (notifError) {
        console.error('Error enviando notificación de inicio:', notifError);
      }

      res.json({
        message: 'Servicio iniciado exitosamente',
        reserva: reservaIniciada
      });
    } catch (error) {
      console.error('Error starting service:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Finalizar servicio
  static async finishService(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const { reservaId } = req.params;
      const { tiempo_real_minutos, notas_finales } = req.body;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(reservaId)) {
        return res.status(400).json({ error: 'ID de reserva inválido' });
      }

      // Obtener reserva actual
      const reserva = await ReservasModel.findById(reservaId);
      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      // Verificar que el usuario es el AS
      if (reserva.as_id !== usuario_id) {
        return res.status(403).json({ error: 'Solo el AS puede finalizar el servicio' });
      }

      // Verificar que el servicio está en progreso
      if (reserva.estado !== 'en_progreso') {
        return res.status(400).json({ 
          error: `No se puede finalizar un servicio en estado: ${reserva.estado}` 
        });
      }

      // Finalizar el servicio
      const reservaFinalizada = await ReservasModel.finishService(
        reservaId,
        tiempo_real_minutos
      );

      // Notificar al explorador
      try {
        await NotificationService.crearNotificacion({
          usuario_id: reserva.explorador_id,
          tipo: 'match',
          titulo: 'Servicio completado',
          mensaje: `El servicio ${reserva.titulo_servicio} ha sido completado`,
          datos_extra: {
            reserva_id: reservaId,
            tipo_notificacion: 'servicio_completado'
          }
        });
      } catch (notifError) {
        console.error('Error enviando notificación de finalización:', notifError);
      }

      res.json({
        message: 'Servicio completado exitosamente',
        reserva: reservaFinalizada,
        next_steps: [
          'El cliente ha sido notificado',
          'Ambos pueden calificarse mutuamente',
          'El pago será procesado automáticamente'
        ]
      });
    } catch (error) {
      console.error('Error finishing service:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener estadísticas de reservas (para AS)
  static async getAsStats(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const { days = 30 } = req.query;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const stats = await ReservasModel.getAsStats(usuario_id, parseInt(days as string));

      res.json({ estadisticas: stats });
    } catch (error) {
      console.error('Error getting AS stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

// =============================================================================
// CONTROLADOR: DISPONIBILIDAD
// =============================================================================

export class DisponibilidadController {
  
  // Crear slot de disponibilidad
  static async createSlot(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const {
        fecha,
        hora_inicio,
        hora_fin,
        duracion_minutos,
        precio_por_hora,
        servicios_incluidos,
        tipo_recurrencia,
        fecha_fin_recurrencia,
        dias_semana,
        notas,
        ubicacion_especifica,
        es_remoto
      } = req.body;

      // Validaciones básicas
      if (!fecha || !hora_inicio || !hora_fin) {
        return res.status(400).json({ error: 'Fecha y horas son requeridas' });
      }

      const slotData: CreateDisponibilidadData = {
        as_id: usuario_id,
        fecha,
        hora_inicio,
        hora_fin,
        duracion_minutos,
        precio_por_hora: precio_por_hora ? parseFloat(precio_por_hora) : undefined,
        servicios_incluidos,
        tipo_recurrencia,
        fecha_fin_recurrencia,
        dias_semana,
        notas,
        ubicacion_especifica,
        es_remoto
      };

      const slot = await DisponibilidadModel.create(slotData);

      res.status(201).json({
        message: 'Slot de disponibilidad creado exitosamente',
        slot
      });
    } catch (error) {
      console.error('Error creating availability slot:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener disponibilidad de un AS
  static async getAvailability(req: AuthRequest, res: Response) {
    try {
      const { asId } = req.params;
      const { fecha_inicio, fecha_fin, servicio_id } = req.query;

      if (!validateUUID(asId)) {
        return res.status(400).json({ error: 'ID de AS inválido' });
      }

      if (!fecha_inicio || !fecha_fin) {
        return res.status(400).json({ error: 'Fechas de inicio y fin requeridas' });
      }

      const slots = await DisponibilidadModel.getAvailableSlots(
        asId,
        fecha_inicio as string,
        fecha_fin as string,
        servicio_id as string
      );

      res.json({ slots_disponibles: slots });
    } catch (error) {
      console.error('Error getting availability:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Crear bloqueo de disponibilidad
  static async createBlock(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const {
        fecha_inicio,
        fecha_fin,
        motivo,
        hora_inicio,
        hora_fin,
        descripcion,
        es_bloqueo_completo
      } = req.body;

      if (!fecha_inicio || !fecha_fin || !motivo) {
        return res.status(400).json({ error: 'Fecha inicio, fecha fin y motivo son requeridos' });
      }

      const bloqueo = await DisponibilidadModel.createBlock(
        usuario_id,
        fecha_inicio,
        fecha_fin,
        motivo,
        {
          horaInicio: hora_inicio,
          horaFin: hora_fin,
          descripcion,
          esBloqueoCompleto: es_bloqueo_completo
        }
      );

      res.status(201).json({
        message: 'Bloqueo de disponibilidad creado exitosamente',
        bloqueo
      });
    } catch (error) {
      console.error('Error creating availability block:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

// =============================================================================
// CONTROLADOR: CONFIGURACIÓN DE RECORDATORIOS
// =============================================================================

export class RecordatoriosController {
  
  // Obtener configuración de recordatorios
  static async getConfig(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      let config = await ConfiguracionRecordatoriosModel.getByUser(usuario_id);
      
      if (!config) {
        // Crear configuración por defecto si no existe
        config = await ConfiguracionRecordatoriosModel.createDefault(usuario_id);
      }

      res.json({ configuracion: config });
    } catch (error) {
      console.error('Error getting reminder config:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Actualizar configuración de recordatorios
  static async updateConfig(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const {
        recordatorio_24h,
        recordatorio_2h,
        recordatorio_30m,
        via_whatsapp,
        via_push,
        via_email,
        recordatorio_nueva_reserva,
        recordatorio_cancelacion
      } = req.body;

      // Filtrar solo campos válidos
      const configUpdate: any = {};
      if (typeof recordatorio_24h === 'boolean') configUpdate.recordatorio_24h = recordatorio_24h;
      if (typeof recordatorio_2h === 'boolean') configUpdate.recordatorio_2h = recordatorio_2h;
      if (typeof recordatorio_30m === 'boolean') configUpdate.recordatorio_30m = recordatorio_30m;
      if (typeof via_whatsapp === 'boolean') configUpdate.via_whatsapp = via_whatsapp;
      if (typeof via_push === 'boolean') configUpdate.via_push = via_push;
      if (typeof via_email === 'boolean') configUpdate.via_email = via_email;
      if (typeof recordatorio_nueva_reserva === 'boolean') configUpdate.recordatorio_nueva_reserva = recordatorio_nueva_reserva;
      if (typeof recordatorio_cancelacion === 'boolean') configUpdate.recordatorio_cancelacion = recordatorio_cancelacion;

      const config = await ConfiguracionRecordatoriosModel.update(usuario_id, configUpdate);

      res.json({
        message: 'Configuración actualizada exitosamente',
        configuracion: config
      });
    } catch (error) {
      console.error('Error updating reminder config:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}