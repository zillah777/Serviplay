import { Response } from 'express';
import { AuthRequest } from '@/middleware/auth';
import { 
  ArchivosModel, 
  ArchivosRelacionesModel, 
  ArchivosTemporalesModel,
  FileType,
  FileContext
} from '@/models/FileUpload';
import { 
  StorageFactory, 
  getFileType, 
  getFileExtension, 
  generateUniqueFilename 
} from '@/config/storage';
import { validateUUID } from '@/utils/validation';

// ============================================================================
// CONTROLADOR: SUBIDA DE ARCHIVOS
// ============================================================================

export class UploadController {
  
  // Subir archivo único
  static async uploadSingle(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const { contexto, entidad_tipo, entidad_id, campo, descripcion } = req.body;
      
      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó archivo' });
      }

      const file = req.file;
      const tipo = getFileType(file.mimetype);
      const extension = getFileExtension(file.originalname);
      
      // Verificar límites de archivo
      const limitsValid = await ArchivosModel.checkFileLimits(tipo, file.size, extension);
      if (!limitsValid) {
        return res.status(400).json({ 
          error: 'El archivo excede los límites permitidos o el tipo no está soportado' 
        });
      }

      // Crear registro en base de datos
      const archivo = await ArchivosModel.create({
        nombre_original: file.originalname,
        extension,
        mime_type: file.mimetype,
        tamaño: file.size,
        tipo,
        contexto: contexto as FileContext || 'other',
        subido_por: usuario_id,
        ip_origen: req.ip,
        user_agent: req.get('User-Agent'),
        metadata: {}
      });

      // Subir a storage provider
      const storageProvider = await StorageFactory.getProvider();
      const uniqueFilename = generateUniqueFilename(file.originalname);
      
      const uploadResult = await storageProvider.upload(file.buffer, uniqueFilename, {
        folder: `${contexto || 'general'}/${usuario_id}`,
        type: tipo,
        context: contexto
      });

      if (!uploadResult.success) {
        // Eliminar registro si la subida falló
        await ArchivosModel.softDelete(archivo.id);
        return res.status(500).json({ 
          error: 'Error al subir archivo', 
          details: uploadResult.error 
        });
      }

      // Actualizar archivo con URLs y metadatos
      const updatedArchivo = await ArchivosModel.update(archivo.id, {
        url_publica: uploadResult.url,
        url_thumbnail: uploadResult.thumbnailUrl,
        path_storage: uploadResult.publicId,
        ancho: uploadResult.width,
        alto: uploadResult.height,
        estado: 'ready',
        metadata: {
          cloudinary_public_id: uploadResult.publicId,
          format: uploadResult.format
        }
      });

      // Asociar a entidad si se especificó
      let relacion = null;
      if (entidad_tipo && entidad_id && validateUUID(entidad_id)) {
        relacion = await ArchivosRelacionesModel.createRelation({
          archivo_id: archivo.id,
          entidad_tipo,
          entidad_id,
          campo,
          descripcion
        });
      }

      res.status(201).json({
        message: 'Archivo subido correctamente',
        archivo: updatedArchivo,
        relacion,
        upload_info: {
          size: uploadResult.size,
          format: uploadResult.format,
          dimensions: uploadResult.width && uploadResult.height 
            ? { width: uploadResult.width, height: uploadResult.height }
            : null
        }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Subir múltiples archivos
  static async uploadMultiple(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const { contexto, entidad_tipo, entidad_id, campo } = req.body;
      
      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No se proporcionaron archivos' });
      }

      const files = req.files as Express.Multer.File[];
      const results = [];
      const errors = [];

      // Procesar cada archivo
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const tipo = getFileType(file.mimetype);
          const extension = getFileExtension(file.originalname);
          
          // Verificar límites
          const limitsValid = await ArchivosModel.checkFileLimits(tipo, file.size, extension);
          if (!limitsValid) {
            errors.push({
              file: file.originalname,
              error: 'Archivo excede límites o tipo no soportado'
            });
            continue;
          }

          // Crear registro
          const archivo = await ArchivosModel.create({
            nombre_original: file.originalname,
            extension,
            mime_type: file.mimetype,
            tamaño: file.size,
            tipo,
            contexto: contexto as FileContext || 'other',
            subido_por: usuario_id,
            ip_origen: req.ip,
            user_agent: req.get('User-Agent')
          });

          // Subir archivo
          const storageProvider = await StorageFactory.getProvider();
          const uniqueFilename = generateUniqueFilename(file.originalname);
          
          const uploadResult = await storageProvider.upload(file.buffer, uniqueFilename, {
            folder: `${contexto || 'general'}/${usuario_id}`,
            type: tipo,
            context: contexto
          });

          if (!uploadResult.success) {
            await ArchivosModel.softDelete(archivo.id);
            errors.push({
              file: file.originalname,
              error: uploadResult.error || 'Error al subir archivo'
            });
            continue;
          }

          // Actualizar archivo
          const updatedArchivo = await ArchivosModel.update(archivo.id, {
            url_publica: uploadResult.url,
            url_thumbnail: uploadResult.thumbnailUrl,
            path_storage: uploadResult.publicId,
            ancho: uploadResult.width,
            alto: uploadResult.height,
            estado: 'ready',
            metadata: {
              cloudinary_public_id: uploadResult.publicId,
              format: uploadResult.format
            }
          });

          // Asociar a entidad si se especificó
          let relacion = null;
          if (entidad_tipo && entidad_id && validateUUID(entidad_id)) {
            relacion = await ArchivosRelacionesModel.createRelation({
              archivo_id: archivo.id,
              entidad_tipo,
              entidad_id,
              campo,
              orden: i // Usar índice como orden
            });
          }

          results.push({
            archivo: updatedArchivo,
            relacion,
            upload_info: {
              size: uploadResult.size,
              format: uploadResult.format,
              dimensions: uploadResult.width && uploadResult.height 
                ? { width: uploadResult.width, height: uploadResult.height }
                : null
            }
          });
        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          errors.push({
            file: file.originalname,
            error: 'Error interno al procesar archivo'
          });
        }
      }

      res.status(results.length > 0 ? 201 : 400).json({
        message: `Procesados ${results.length} de ${files.length} archivos`,
        archivos: results,
        errores: errors,
        stats: {
          total: files.length,
          exitosos: results.length,
          fallidos: errors.length
        }
      });
    } catch (error) {
      console.error('Error uploading multiple files:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Subir archivo temporal (sin asociar a entidad)
  static async uploadTemporary(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const { contexto } = req.body;
      
      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó archivo' });
      }

      const file = req.file;
      const tipo = getFileType(file.mimetype);
      const extension = getFileExtension(file.originalname);
      
      // Verificar límites
      const limitsValid = await ArchivosModel.checkFileLimits(tipo, file.size, extension);
      if (!limitsValid) {
        return res.status(400).json({ 
          error: 'El archivo excede los límites permitidos o el tipo no está soportado' 
        });
      }

      // Crear archivo
      const archivo = await ArchivosModel.create({
        nombre_original: file.originalname,
        extension,
        mime_type: file.mimetype,
        tamaño: file.size,
        tipo,
        contexto: contexto as FileContext || 'other',
        subido_por: usuario_id,
        ip_origen: req.ip,
        user_agent: req.get('User-Agent')
      });

      // Subir archivo
      const storageProvider = await StorageFactory.getProvider();
      const uniqueFilename = generateUniqueFilename(file.originalname);
      
      const uploadResult = await storageProvider.upload(file.buffer, uniqueFilename, {
        folder: `temp/${usuario_id}`,
        type: tipo,
        context: 'temporary'
      });

      if (!uploadResult.success) {
        await ArchivosModel.softDelete(archivo.id);
        return res.status(500).json({ 
          error: 'Error al subir archivo', 
          details: uploadResult.error 
        });
      }

      // Actualizar archivo
      const updatedArchivo = await ArchivosModel.update(archivo.id, {
        url_publica: uploadResult.url,
        url_thumbnail: uploadResult.thumbnailUrl,
        path_storage: uploadResult.publicId,
        ancho: uploadResult.width,
        alto: uploadResult.height,
        estado: 'ready'
      });

      // Crear registro temporal
      const temporal = await ArchivosTemporalesModel.create(archivo.id, usuario_id);

      res.status(201).json({
        message: 'Archivo temporal subido correctamente',
        archivo: updatedArchivo,
        token_temporal: temporal.token_temporal,
        expires_at: temporal.expires_at
      });
    } catch (error) {
      console.error('Error uploading temporary file:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Confirmar archivo temporal
  static async confirmTemporaryFile(req: AuthRequest, res: Response) {
    try {
      const { token } = req.params;
      const { entidad_tipo, entidad_id, campo, descripcion } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: 'Token temporal requerido' });
      }

      if (!entidad_tipo || !entidad_id || !validateUUID(entidad_id)) {
        return res.status(400).json({ error: 'Información de entidad inválida' });
      }

      // Verificar archivo temporal
      const tempData = await ArchivosTemporalesModel.findByToken(token);
      if (!tempData) {
        return res.status(404).json({ error: 'Archivo temporal no encontrado o expirado' });
      }

      // Confirmar archivo (elimina el registro temporal)
      const archivoId = await ArchivosTemporalesModel.confirmFile(token);
      if (!archivoId) {
        return res.status(404).json({ error: 'No se pudo confirmar el archivo temporal' });
      }

      // Crear relación con entidad
      const relacion = await ArchivosRelacionesModel.createRelation({
        archivo_id: archivoId,
        entidad_tipo,
        entidad_id,
        campo,
        descripcion
      });

      res.json({
        message: 'Archivo temporal confirmado y asociado correctamente',
        archivo_id: archivoId,
        relacion
      });
    } catch (error) {
      console.error('Error confirming temporary file:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener archivos del usuario
  static async getUserFiles(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      
      const filtros = {
        tipo: req.query.tipo as FileType,
        contexto: req.query.contexto as FileContext,
        estado: req.query.estado as any
      };

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const result = await ArchivosModel.findByUser(usuario_id, page, limit, filtros);
      
      res.json({
        archivos: result.archivos,
        pagination: {
          page,
          limit,
          total: result.total,
          hasMore: result.hasMore,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting user files:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Eliminar archivo
  static async deleteFile(req: AuthRequest, res: Response) {
    try {
      const { archivoId } = req.params;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(archivoId)) {
        return res.status(400).json({ error: 'ID de archivo inválido' });
      }

      // Verificar que el usuario es propietario del archivo
      const archivo = await ArchivosModel.findById(archivoId);
      if (!archivo) {
        return res.status(404).json({ error: 'Archivo no encontrado' });
      }

      if (archivo.subido_por !== usuario_id) {
        return res.status(403).json({ error: 'No tienes permisos para eliminar este archivo' });
      }

      // Eliminar del storage provider si tiene path_storage
      if (archivo.path_storage) {
        try {
          const storageProvider = await StorageFactory.getProvider();
          await storageProvider.delete(archivo.path_storage);
        } catch (error) {
          console.error('Error deleting from storage provider:', error);
          // Continuar con soft delete aunque falle la eliminación del storage
        }
      }

      // Soft delete en base de datos
      await ArchivosModel.softDelete(archivoId);

      res.json({ message: 'Archivo eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Obtener estadísticas de archivos del usuario
  static async getUserStats(req: AuthRequest, res: Response) {
    try {
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      const stats = await ArchivosModel.getUserStats(usuario_id);
      
      res.json({ estadisticas: stats });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

// ============================================================================
// CONTROLADOR: GESTIÓN DE RELACIONES
// ============================================================================

export class FileRelationsController {
  
  // Obtener archivos de una entidad
  static async getEntityFiles(req: AuthRequest, res: Response) {
    try {
      const { entidadTipo, entidadId } = req.params;
      const { campo } = req.query;

      if (!validateUUID(entidadId)) {
        return res.status(400).json({ error: 'ID de entidad inválido' });
      }

      const archivos = await ArchivosRelacionesModel.getEntityFiles(
        entidadTipo,
        entidadId,
        campo as string
      );

      res.json({ archivos });
    } catch (error) {
      console.error('Error getting entity files:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Asociar archivo existente a entidad
  static async associateFile(req: AuthRequest, res: Response) {
    try {
      const { archivo_id, entidad_tipo, entidad_id, campo, orden, descripcion } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(archivo_id) || !validateUUID(entidad_id)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      // Verificar que el usuario es propietario del archivo
      const archivo = await ArchivosModel.findById(archivo_id);
      if (!archivo || archivo.subido_por !== usuario_id) {
        return res.status(403).json({ error: 'No tienes permisos sobre este archivo' });
      }

      const relacion = await ArchivosRelacionesModel.createRelation({
        archivo_id,
        entidad_tipo,
        entidad_id,
        campo,
        orden,
        descripcion
      });

      res.status(201).json({
        message: 'Archivo asociado correctamente',
        relacion
      });
    } catch (error) {
      console.error('Error associating file:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Remover asociación archivo-entidad
  static async removeAssociation(req: AuthRequest, res: Response) {
    try {
      const { archivoId, entidadTipo, entidadId } = req.params;
      const { campo } = req.query;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(archivoId) || !validateUUID(entidadId)) {
        return res.status(400).json({ error: 'IDs inválidos' });
      }

      const removed = await ArchivosRelacionesModel.removeRelation(
        archivoId,
        entidadTipo,
        entidadId,
        campo as string
      );

      if (!removed) {
        return res.status(404).json({ error: 'Asociación no encontrada' });
      }

      res.json({ message: 'Asociación removida correctamente' });
    } catch (error) {
      console.error('Error removing association:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Reordenar archivos en galería
  static async reorderFiles(req: AuthRequest, res: Response) {
    try {
      const { entidadTipo, entidadId } = req.params;
      const { campo, reordered_items } = req.body;
      const usuario_id = req.user?.id;

      if (!usuario_id) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      if (!validateUUID(entidadId)) {
        return res.status(400).json({ error: 'ID de entidad inválido' });
      }

      if (!Array.isArray(reordered_items)) {
        return res.status(400).json({ error: 'Items reordenados requeridos como array' });
      }

      await ArchivosRelacionesModel.reorderFiles(
        entidadTipo,
        entidadId,
        campo,
        reordered_items
      );

      res.json({ message: 'Archivos reordenados correctamente' });
    } catch (error) {
      console.error('Error reordering files:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}