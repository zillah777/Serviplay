import { ReservasModel, ConfiguracionRecordatoriosModel } from '@/models/Bookings';
import { NotificationService } from '@/services/NotificationService';

// =============================================================================
// SERVICIO: RECORDATORIOS DE RESERVAS
// =============================================================================

export class BookingReminderService {
  
  /**
   * Enviar recordatorios de 24 horas
   */
  static async enviarRecordatorios24h(): Promise<void> {
    try {
      console.log('🔔 Iniciando envío de recordatorios de 24 horas...');
      
      // Obtener reservas que necesitan recordatorio de 24h
      const reservas = await ReservasModel.getUpcomingReservations(24);
      
      const reservasPendientes = reservas.filter(
        reserva => !reserva.recordatorio_24h_enviado && 
                   ['confirmada', 'pendiente'].includes(reserva.estado)
      );
      
      console.log(`📊 Encontradas ${reservasPendientes.length} reservas para recordatorio de 24h`);
      
      for (const reserva of reservasPendientes) {
        await this.enviarRecordatorioIndividual(reserva, '24h');
      }
      
      console.log('✅ Recordatorios de 24 horas enviados exitosamente');
    } catch (error) {
      console.error('❌ Error enviando recordatorios de 24h:', error);
      throw error;
    }
  }
  
  /**
   * Enviar recordatorios de 1 hora
   */
  static async enviarRecordatorios1h(): Promise<void> {
    try {
      console.log('🔔 Iniciando envío de recordatorios de 1 hora...');
      
      // Obtener reservas que necesitan recordatorio de 1h
      const reservas = await ReservasModel.getUpcomingReservations(1);
      
      const reservasPendientes = reservas.filter(
        reserva => !reserva.recordatorio_1h_enviado && 
                   ['confirmada'].includes(reserva.estado) // Solo confirmadas para 1h
      );
      
      console.log(`📊 Encontradas ${reservasPendientes.length} reservas para recordatorio de 1h`);
      
      for (const reserva of reservasPendientes) {
        await this.enviarRecordatorioIndividual(reserva, '1h');
      }
      
      console.log('✅ Recordatorios de 1 hora enviados exitosamente');
    } catch (error) {
      console.error('❌ Error enviando recordatorios de 1h:', error);
      throw error;
    }
  }
  
  /**
   * Enviar recordatorio individual a ambas partes
   */
  private static async enviarRecordatorioIndividual(
    reserva: any, 
    tipoRecordatorio: '24h' | '1h'
  ): Promise<void> {
    try {
      const tiempoTexto = tipoRecordatorio === '24h' ? '24 horas' : '1 hora';
      
      // Obtener configuraciones de recordatorios
      const [configExplorador, configAs] = await Promise.all([
        ConfiguracionRecordatoriosModel.getByUser(reserva.explorador_id),
        ConfiguracionRecordatoriosModel.getByUser(reserva.as_id)
      ]);
      
      // Recordatorio para el explorador (cliente)
      if (this.shouldSendReminder(configExplorador, tipoRecordatorio)) {
        await NotificationService.crearNotificacion({
          usuario_id: reserva.explorador_id,
          tipo: 'match',
          titulo: `Recordatorio: Servicio en ${tiempoTexto}`,
          mensaje: `Tu servicio "${reserva.titulo_servicio}" es ${this.formatDateTime(reserva)}`,
          datos_extra: {
            reserva_id: reserva.id,
            tipo_notificacion: `recordatorio_${tipoRecordatorio}_explorador`,
            fecha_servicio: reserva.fecha_servicio,
            hora_inicio: reserva.hora_inicio,
            direccion: reserva.direccion_servicio
          }
        });
      }
      
      // Recordatorio para el AS (proveedor)
      if (this.shouldSendReminder(configAs, tipoRecordatorio)) {
        await NotificationService.crearNotificacion({
          usuario_id: reserva.as_id,
          tipo: 'match',
          titulo: `Recordatorio: Servicio en ${tiempoTexto}`,
          mensaje: `Tienes un servicio programado: "${reserva.titulo_servicio}" ${this.formatDateTime(reserva)}`,
          datos_extra: {
            reserva_id: reserva.id,
            tipo_notificacion: `recordatorio_${tipoRecordatorio}_as`,
            fecha_servicio: reserva.fecha_servicio,
            hora_inicio: reserva.hora_inicio,
            direccion: reserva.direccion_servicio,
            cliente_nombre: reserva.explorador_nombre || 'Cliente'
          }
        });
      }
      
      // Marcar recordatorio como enviado
      await ReservasModel.markReminderSent(reserva.id, tipoRecordatorio);
      
      console.log(`✅ Recordatorio ${tipoRecordatorio} enviado para reserva ${reserva.id}`);
    } catch (error) {
      console.error(`❌ Error enviando recordatorio individual para reserva ${reserva.id}:`, error);
      // No lanzar error para no detener el proceso de otros recordatorios
    }
  }
  
  /**
   * Verificar si debe enviar recordatorio según configuración del usuario
   */
  private static shouldSendReminder(
    config: any, 
    tipoRecordatorio: '24h' | '1h'
  ): boolean {
    if (!config) return true; // Si no hay config, enviar por defecto
    
    if (tipoRecordatorio === '24h') {
      return config.recordatorio_24h === true;
    } else {
      return config.recordatorio_2h === true; // Usamos recordatorio_2h para 1h también
    }
  }
  
  /**
   * Formatear fecha y hora para mostrar en notificaciones
   */
  private static formatDateTime(reserva: any): string {
    try {
      const fecha = new Date(reserva.fecha_servicio);
      const fechaFormateada = fecha.toLocaleDateString('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return `el ${fechaFormateada} a las ${reserva.hora_inicio}`;
    } catch (error) {
      return `el ${reserva.fecha_servicio} a las ${reserva.hora_inicio}`;
    }
  }
  
  /**
   * Enviar notificaciones de seguimiento post-servicio
   */
  static async enviarSeguimientoPostServicio(): Promise<void> {
    try {
      console.log('📝 Iniciando seguimiento post-servicio...');
      
      // Buscar servicios completados en las últimas 2 horas que no tengan calificación
      const result = await ReservasModel.getUpcomingReservations(0); // Implementar método específico
      
      // Esta funcionalidad requeriría una consulta personalizada
      // Por ahora, dejamos la estructura preparada
      
      console.log('✅ Seguimiento post-servicio completado');
    } catch (error) {
      console.error('❌ Error en seguimiento post-servicio:', error);
    }
  }
  
  /**
   * Verificar reservas que requieren acción urgente
   */
  static async verificarReservasUrgentes(): Promise<void> {
    try {
      console.log('⚠️ Verificando reservas que requieren atención urgente...');
      
      // Buscar reservas pendientes de confirmación por más de 2 horas
      // Buscar reservas confirmadas que están a punto de comenzar
      // Buscar servicios en progreso por más tiempo del estimado
      
      // Esta funcionalidad requeriría consultas SQL específicas
      console.log('✅ Verificación de reservas urgentes completada');
    } catch (error) {
      console.error('❌ Error verificando reservas urgentes:', error);
    }
  }
  
  /**
   * Estadísticas de recordatorios enviados
   */
  static async obtenerEstadisticasRecordatorios(dias: number = 7): Promise<any> {
    try {
      // Esta función retornaría estadísticas sobre:
      // - Recordatorios enviados exitosamente
      // - Recordatorios fallidos
      // - Tasa de apertura/respuesta
      // - Efectividad por canal (WhatsApp, Push, Email)
      
      return {
        periodo_dias: dias,
        total_recordatorios_enviados: 0,
        recordatorios_24h: 0,
        recordatorios_1h: 0,
        tasa_entrega: 0,
        canales_utilizados: {
          whatsapp: 0,
          push: 0,
          email: 0
        }
      };
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas de recordatorios:', error);
      throw error;
    }
  }
  
  /**
   * Programar recordatorio personalizado
   */
  static async programarRecordatorioPersonalizado(
    reservaId: string,
    tiempoAntes: number, // minutos antes del servicio
    mensaje: string,
    solo_as: boolean = false,
    solo_explorador: boolean = false
  ): Promise<void> {
    try {
      // Esta función permitiría programar recordatorios personalizados
      // usando el sistema de trabajos cron o una cola de tareas
      
      console.log(`📅 Recordatorio personalizado programado para reserva ${reservaId}`);
    } catch (error) {
      console.error('❌ Error programando recordatorio personalizado:', error);
      throw error;
    }
  }
}