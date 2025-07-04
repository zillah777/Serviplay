import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { ConfiguracionArchivosModel, FileType } from '@/models/FileUpload';

// ============================================================================
// CONFIGURACIÓN DE CLOUDINARY
// ============================================================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// ============================================================================
// INTERFACES
// ============================================================================

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  error?: string;
}

export interface StorageProvider {
  upload(buffer: Buffer, filename: string, options?: any): Promise<UploadResult>;
  delete(publicId: string): Promise<boolean>;
  generateThumbnail?(publicId: string, size: { width: number; height: number }): Promise<string>;
}

// ============================================================================
// PROVEEDOR: CLOUDINARY
// ============================================================================

export class CloudinaryProvider implements StorageProvider {
  
  async upload(
    buffer: Buffer, 
    filename: string, 
    options: {
      folder?: string;
      type?: FileType;
      context?: string;
      transformation?: any;
    } = {}
  ): Promise<UploadResult> {
    try {
      const uploadOptions: any = {
        public_id: filename.split('.')[0], // Sin extensión
        folder: options.folder || 'fixia',
        resource_type: this.getResourceType(options.type || 'other'),
        context: options.context ? `context=${options.context}` : undefined,
        overwrite: false,
        unique_filename: true,
        use_filename: true,
      };

      // Agregar transformaciones para imágenes
      if (options.type === 'image') {
        uploadOptions.transformation = [
          {
            quality: 'auto',
            fetch_format: 'auto',
            ...options.transformation
          }
        ];
      }

      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      // Generar thumbnail para imágenes
      let thumbnailUrl;
      if (options.type === 'image') {
        thumbnailUrl = cloudinary.url(result.public_id, {
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'auto' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        });
      }

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        thumbnailUrl,
        width: result.width,
        height: result.height,
        size: result.bytes,
        format: result.format
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de subida'
      };
    }
  }

  async delete(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  async generateThumbnail(
    publicId: string, 
    size: { width: number; height: number }
  ): Promise<string> {
    return cloudinary.url(publicId, {
      transformation: [
        { 
          width: size.width, 
          height: size.height, 
          crop: 'fill', 
          gravity: 'auto' 
        },
        { quality: 'auto', fetch_format: 'auto' }
      ]
    });
  }

  private getResourceType(type: FileType): string {
    switch (type) {
      case 'image': return 'image';
      case 'video': return 'video';
      case 'audio': return 'video'; // Cloudinary trata audio como video
      default: return 'raw';
    }
  }
}

// ============================================================================
// PROVEEDOR: ALMACENAMIENTO LOCAL
// ============================================================================

export class LocalStorageProvider implements StorageProvider {
  private uploadPath: string;
  private baseUrl: string;

  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  async upload(
    buffer: Buffer, 
    filename: string, 
    options: {
      folder?: string;
      type?: FileType;
    } = {}
  ): Promise<UploadResult> {
    try {
      const folder = options.folder || 'general';
      const folderPath = path.join(this.uploadPath, folder);
      
      // Crear carpeta si no existe
      await fs.mkdir(folderPath, { recursive: true });
      
      const filePath = path.join(folderPath, filename);
      
      // Guardar archivo
      await fs.writeFile(filePath, buffer);
      
      const url = `${this.baseUrl}/uploads/${folder}/${filename}`;
      
      return {
        success: true,
        url,
        publicId: `${folder}/${filename}`,
        size: buffer.length
      };
    } catch (error) {
      console.error('Local storage upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de subida local'
      };
    }
  }

  async delete(publicId: string): Promise<boolean> {
    try {
      const filePath = path.join(this.uploadPath, publicId);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Local storage delete error:', error);
      return false;
    }
  }
}

// ============================================================================
// FACTORY DE STORAGE
// ============================================================================

export class StorageFactory {
  private static instance: StorageProvider | null = null;

  static async getProvider(): Promise<StorageProvider> {
    if (this.instance) return this.instance;

    try {
      // En desarrollo, usar siempre almacenamiento local
      if (process.env.NODE_ENV === 'development') {
        console.log('🗂️ Using local storage for development');
        this.instance = new LocalStorageProvider();
        return this.instance;
      }

      const config = await ConfiguracionArchivosModel.getConfig();
      
      switch (config.storage_provider) {
        case 'cloudinary':
          this.instance = new CloudinaryProvider();
          break;
        case 'local':
        default:
          this.instance = new LocalStorageProvider();
          break;
      }
      
      return this.instance;
    } catch (error) {
      console.warn('Could not load storage config, defaulting to local storage');
      this.instance = new LocalStorageProvider();
      return this.instance;
    }
  }

  static resetInstance() {
    this.instance = null;
  }
}

// ============================================================================
// CONFIGURACIÓN DE MULTER
// ============================================================================

// Almacenamiento en memoria para procesamiento
const memoryStorage = multer.memoryStorage();

// Filtro de archivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Obtener extensión del archivo
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  
  // Verificar tipo MIME y extensión
  const allowedMimes = [
    // Imágenes
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    // Documentos
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Videos
    'video/mp4', 'video/avi', 'video/quicktime', 'video/webm',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg'
  ];

  const allowedExtensions = [
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'pdf', 'doc', 'docx',
    'mp4', 'avi', 'mov', 'webm',
    'mp3', 'wav', 'aac', 'ogg'
  ];

  if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype} (.${ext})`));
  }
};

// Configuración de multer
export const uploadMiddleware = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo (se validará específicamente por tipo)
    files: 10 // Máximo 10 archivos por request
  }
});

// ============================================================================
// UTILIDADES
// ============================================================================

export const getFileType = (mimetype: string): FileType => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'audio';
  if (mimetype.includes('pdf') || mimetype.includes('document')) return 'document';
  return 'other';
};

export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase().slice(1);
};

export const sanitizeFilename = (filename: string): string => {
  // Remover caracteres especiales y espacios
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

export const generateUniqueFilename = (originalname: string): string => {
  const ext = getFileExtension(originalname);
  const sanitized = sanitizeFilename(path.basename(originalname, path.extname(originalname)));
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  return `${timestamp}_${random}_${sanitized}.${ext}`;
};