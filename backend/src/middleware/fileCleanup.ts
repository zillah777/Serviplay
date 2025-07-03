import cron from 'node-cron';
import { ArchivosTemporalesModel } from '@/models/FileUpload';
import { StorageFactory } from '@/config/storage';

// ============================================================================
// MIDDLEWARE: LIMPIEZA AUTOMÁTICA DE ARCHIVOS
// ============================================================================

export class FileCleanupService {
  private static isRunning = false;

  // Iniciar servicio de limpieza automática
  static start() {
    if (this.isRunning) {
      console.log('🗑️ File cleanup service already running');
      return;
    }

    console.log('🗑️ Starting automatic file cleanup service...');
    
    // Ejecutar limpieza cada hora
    cron.schedule('0 * * * *', async () => {
      try {
        await this.cleanupExpiredFiles();
      } catch (error) {
        console.error('❌ Error in scheduled file cleanup:', error);
      }
    });

    // Ejecutar limpieza cada día a las 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.deepCleanup();
      } catch (error) {
        console.error('❌ Error in deep cleanup:', error);
      }
    });

    this.isRunning = true;
    console.log('✅ File cleanup service started');
  }

  // Limpieza de archivos temporales expirados
  static async cleanupExpiredFiles(): Promise<number> {
    try {
      console.log('🗑️ Running cleanup of expired temporary files...');
      
      const deletedCount = await ArchivosTemporalesModel.cleanupExpired();
      
      if (deletedCount > 0) {
        console.log(`✅ Cleaned up ${deletedCount} expired temporary files`);
      } else {
        console.log('✅ No expired temporary files to clean up');
      }
      
      return deletedCount;
    } catch (error) {
      console.error('❌ Error cleaning up expired files:', error);
      return 0;
    }
  }

  // Limpieza profunda (archivos huérfanos, etc.)
  static async deepCleanup(): Promise<void> {
    try {
      console.log('🗑️ Running deep cleanup...');
      
      // TODO: Implementar limpieza de archivos huérfanos
      // - Archivos en storage que no están en BD
      // - Archivos marcados como eliminados hace más de X días
      // - Archivos sin relaciones hace más de X días
      
      console.log('✅ Deep cleanup completed');
    } catch (error) {
      console.error('❌ Error in deep cleanup:', error);
    }
  }

  // Limpieza manual (para endpoints administrativos)
  static async manualCleanup(): Promise<{
    expiredFiles: number;
    message: string;
  }> {
    try {
      const expiredFiles = await this.cleanupExpiredFiles();
      await this.deepCleanup();
      
      return {
        expiredFiles,
        message: `Limpieza completada. ${expiredFiles} archivos temporales eliminados.`
      };
    } catch (error) {
      console.error('❌ Error in manual cleanup:', error);
      throw new Error('Error durante la limpieza manual');
    }
  }

  // Detener servicio
  static stop() {
    this.isRunning = false;
    console.log('🛑 File cleanup service stopped');
  }

  // Verificar si está ejecutándose
  static isServiceRunning(): boolean {
    return this.isRunning;
  }
}

// ============================================================================
// MIDDLEWARE PARA REQUESTS
// ============================================================================

// Middleware para verificar espacio disponible (opcional)
export const checkDiskSpace = async (req: any, res: any, next: any) => {
  try {
    // TODO: Implementar verificación de espacio en disco
    // Por ahora, continuar sin verificación
    next();
  } catch (error) {
    console.error('Error checking disk space:', error);
    next(); // Continuar aunque falle la verificación
  }
};

// Middleware para validar tamaño total de archivos en request múltiple
export const validateTotalFileSize = (maxTotalSizeMB: number = 200) => {
  return (req: any, res: any, next: any) => {
    if (!req.files || !Array.isArray(req.files)) {
      return next();
    }

    const totalSize = req.files.reduce((sum: number, file: Express.Multer.File) => {
      return sum + file.size;
    }, 0);

    const maxTotalSizeBytes = maxTotalSizeMB * 1024 * 1024;

    if (totalSize > maxTotalSizeBytes) {
      return res.status(400).json({
        error: 'El tamaño total de los archivos excede el límite permitido',
        details: {
          totalSize: Math.round(totalSize / 1024 / 1024 * 100) / 100,
          maxSize: maxTotalSizeMB,
          unit: 'MB'
        }
      });
    }

    next();
  };
};