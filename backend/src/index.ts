import 'module-alias/register';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { FileCleanupService } from './middleware/fileCleanup';

// Routes
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import servicesRoutes from './routes/services';
import busquedasRoutes from './routes/busquedas';
import usersRoutes from './routes/users';
import matchesRoutes from './routes/matches';
import notificationsRoutes from './routes/notifications';
import paymentsRoutes from './routes/payments';
import webhooksRoutes from './routes/webhooks';
import chatRoutes from './routes/chat';
import favoritesRoutes from './routes/favorites';
import uploadRoutes from './routes/upload';
import reviewsRoutes from './routes/reviews';
import testUploadRoutes from './routes/test-upload';
import bookingsRoutes from './routes/bookings';
import { identityRoutes } from './routes/identity';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration with multiple allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://fixia.vercel.app',
  'https://fixia-git-main-zillah777s-projects.vercel.app',
  'https://fixia-zillah777s-projects.vercel.app',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    console.log(`🔍 CORS Check - Origin: ${origin}`);
    console.log(`🔍 Allowed origins:`, allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed for: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`❌ CORS blocked for: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting (disabled for development)
// app.use(rateLimiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos desde uploads (solo para desarrollo)
if (process.env.NODE_ENV === 'development') {
  const uploadsPath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsPath));
  console.log(`🗂️ Serving static files from: ${uploadsPath}`);
}

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV 
  });
});

// API routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/busquedas', busquedasRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/test-upload', testUploadRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/identity', identityRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

async function startServer() {
  try {
    // Connect to databases
    await connectDB();
    console.log('⚡ Skipping Redis connection for development');
    
    // Start file cleanup service
    FileCleanupService.start();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  FileCleanupService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received, shutting down gracefully');
  FileCleanupService.stop();
  process.exit(0);
});

startServer();