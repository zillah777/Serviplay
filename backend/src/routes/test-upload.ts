import { Router } from 'express';
import { uploadMiddleware, StorageFactory, getFileType, generateUniqueFilename } from '@/config/storage';
import { authenticateToken } from '@/middleware/auth';
import { AuthRequest } from '@/middleware/auth';

const router = Router();

// Ruta de prueba para upload completo con storage
router.post('/single', 
  authenticateToken,
  uploadMiddleware.single('file'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      const tipo = getFileType(file.mimetype);
      const uniqueFilename = generateUniqueFilename(file.originalname);
      
      // Obtener proveedor de storage
      const storageProvider = await StorageFactory.getProvider();
      
      // Subir archivo
      const uploadResult = await storageProvider.upload(file.buffer, uniqueFilename, {
        folder: `test/${req.user?.id}`,
        type: tipo,
        context: 'test'
      });

      if (!uploadResult.success) {
        return res.status(500).json({ 
          error: 'Upload failed', 
          details: uploadResult.error 
        });
      }
      
      res.json({
        message: 'File uploaded successfully to storage',
        fileInfo: {
          originalName: file.originalname,
          uniqueName: uniqueFilename,
          mimetype: file.mimetype,
          size: file.size,
          type: tipo
        },
        uploadResult: {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          thumbnailUrl: uploadResult.thumbnailUrl,
          format: uploadResult.format,
          dimensions: uploadResult.width && uploadResult.height 
            ? { width: uploadResult.width, height: uploadResult.height }
            : null
        },
        user: req.user?.email
      });
    } catch (error) {
      console.error('Test upload error:', error);
      res.status(500).json({ error: 'Upload test failed' });
    }
  }
);

// Ruta simple que solo recibe el archivo sin subirlo
router.post('/buffer', 
  authenticateToken,
  uploadMiddleware.single('file'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const file = req.file;
      
      res.json({
        message: 'File received successfully (buffer only)',
        fileInfo: {
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: `Buffer of ${file.buffer.length} bytes`
        },
        user: req.user?.email
      });
    } catch (error) {
      console.error('Test buffer error:', error);
      res.status(500).json({ error: 'Buffer test failed' });
    }
  }
);

export default router;