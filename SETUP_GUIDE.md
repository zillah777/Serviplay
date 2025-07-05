# Fixia - Guía de Configuración Completa

## 🔧 Variables de Entorno Requeridas

### Backend (.env)

#### ✅ **Variables Ya Configuradas**
```bash
# Servidor
NODE_ENV=development
PORT=3001
API_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# Base de Datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/fixialo
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fixialo
DB_USER=usuario
DB_PASSWORD=contraseña

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_cambialo_en_produccion
JWT_REFRESH_SECRET=tu_jwt_refresh_secret_muy_seguro_aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Sesiones
SESSION_SECRET=tu_session_secret_muy_seguro_aqui

# CORS
CORS_ORIGIN=http://localhost:3000

# Cloudinary (para archivos)
CLOUDINARY_CLOUD_NAME=tu_cloudinary_cloud_name
CLOUDINARY_API_KEY=tu_cloudinary_api_key
CLOUDINARY_API_SECRET=tu_cloudinary_api_secret
```

#### 🆕 **Variables Nuevas Requeridas (para sistema de verificación de identidad)**
```bash
# ===========================================
# EMAIL CONFIGURATION (para notificaciones de verificación)
# ===========================================

# OPCIÓN 1: SMTP Simple (para desarrollo)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@fixia.com

# OPCIÓN 2: SendGrid (recomendado para producción)
SENDGRID_API_KEY=SG.tu-api-key-aqui
FROM_EMAIL=noreply@fixia.com
```

#### ⚠️ **Variables Opcionales (pero recomendadas)**
```bash
# Redis (para rate limiting y cache)
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Firebase (para push notifications)
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_AQUI\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto-firebase.iam.gserviceaccount.com

# MercadoPago (para pagos)
MERCADOPAGO_ACCESS_TOKEN=TEST-tu_access_token_aqui
MERCADOPAGO_PUBLIC_KEY=TEST-tu_public_key_aqui
MERCADOPAGO_WEBHOOK_SECRET=tu_webhook_secret_aqui

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Cifrado
ENCRYPTION_KEY=your-32-character-encryption-key

# Logs
ENABLE_REQUEST_LOGGING=true
ENABLE_QUERY_LOGGING=false
```

### Frontend (.env.local)

#### ✅ **Variables Ya Configuradas**
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_NAME=Fixia
NEXT_PUBLIC_APP_VERSION=1.0.0
```

#### ⚠️ **Variables Opcionales**
```bash
# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# MercadoPago
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=your-mercadopago-public-key

# Firebase (para push notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
```

## 🗄️ Base de Datos

### Estado Actual de Migraciones
Las siguientes migraciones ya están creadas y listas para ejecutar:

1. ✅ **000_create_functions.sql** - Funciones de base de datos
2. ✅ **001_create_users_tables.sql** - Sistema de usuarios
3. ✅ **002_create_services_tables.sql** - Sistema de servicios
4. ✅ **003_create_matching_system.sql** - Sistema de matchmaking
5. ✅ **004_create_payment_system.sql** - Sistema de pagos
6. ✅ **005_create_indexes.sql** - Índices de performance
7. ✅ **006_create_refresh_tokens.sql** - Tokens de refresh
8. ✅ **007_create_booking_system.sql** - Sistema de reservas
9. ✅ **008_create_subscriptions.sql** - Sistema de suscripciones
10. ✅ **009_create_pagos.sql** - Sistema de pagos mejorado
11. ✅ **010_cleanup_and_fix_all.sql** - Limpieza y correcciones
12. ✅ **011_add_missing_user_columns.sql** - Columnas faltantes de usuarios
13. ✅ **012_create_chat_system.sql** - Sistema de chat
14. ✅ **013_create_favorites_system.sql** - Sistema de favoritos
15. ✅ **014_create_file_uploads_system.sql** - Sistema de archivos
16. ✅ **015_enhance_identity_verification.sql** - Sistema de verificación de identidad

### Ejecutar Migraciones
```bash
cd backend
npm run migrate
```

## 🚀 Funcionalidades Implementadas

### ✅ **Completamente Funcionales**
1. **Sistema de Usuarios y Autenticación**
   - Registro, login, logout
   - JWT tokens con refresh
   - Perfiles de As y Exploradores
   - Verificación de email

2. **Sistema de Servicios**
   - Crear, editar, eliminar servicios
   - Categorías y subcategorías
   - Geolocalización
   - Búsqueda avanzada con filtros

3. **Sistema de Archivos**
   - Subida de archivos a Cloudinary
   - Gestión de archivos temporales
   - Limpieza automática de archivos

4. **Sistema de Reviews y Calificaciones**
   - Crear reseñas
   - Sistema de calificaciones de 1-5 estrella
   - Estadísticas de reviews

5. **Sistema de Reservas/Citas**
   - Crear, gestionar reservas
   - Estados de reserva
   - Notificaciones

6. **Sistema de Verificación de Identidad** 🆕
   - Subida de documentos (DNI, pasaporte, cédula)
   - Workflow de aprobación/rechazo
   - Notificaciones por email
   - Historial de verificaciones

7. **Sistema de Favoritos**
   - Guardar servicios favoritos
   - Gestión de favoritos

### 🔧 **Configuración Mínima Requerida**

Para que el sistema funcione básicamente, necesitas configurar:

#### **Variables Críticas:**
```bash
# Backend
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/fixialo
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
CLOUDINARY_CLOUD_NAME=tu_cloudinary_cloud_name
CLOUDINARY_API_KEY=tu_cloudinary_api_key
CLOUDINARY_API_SECRET=tu_cloudinary_api_secret

# Para verificación de identidad (emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@fixia.com

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📋 Lista de Tareas Pendientes

### 🔴 **Críticas (Próximas a implementar)**
1. **Sistema de Pagos Completo**
   - Escrow (dinero en garantía)
   - Liberación de pagos
   - Reembolsos
   - Integración completa con MercadoPago

2. **Chat en Tiempo Real**
   - WebSocket implementation
   - Mensajes entre As y Exploradores

### 🟡 **Importantes**
1. **Panel de Administración**
   - Gestión de usuarios
   - Gestión de servicios
   - Moderación de contenido

2. **Sistema de Comisiones**
   - Cálculo automático de comisiones
   - Pagos a la plataforma

### 🟢 **Futuras**
1. **Analytics y Reportes**
   - Dashboard administrativo
   - Métricas de uso
   - Reportes financieros

## 🧪 Testing

### Ejecutar Tests
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Verificar Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## 🔐 Seguridad

### Headers de Seguridad
- ✅ Helmet.js configurado
- ✅ CORS configurado
- ✅ Rate limiting implementado
- ✅ Validación de entrada de datos
- ✅ Sanitización de archivos

### Autenticación
- ✅ JWT con refresh tokens
- ✅ Middleware de autenticación
- ✅ Verificación de permisos

## 📝 Notas Importantes

1. **Base de Datos**: Todas las migraciones están preparadas pero necesitas una conexión activa a PostgreSQL para ejecutarlas.

2. **Cloudinary**: Es crítico para el sistema de archivos. Sin él, las subidas de documentos e imágenes no funcionarán.

3. **Email**: Necesario para el sistema de verificación de identidad. Puedes usar Gmail con password de aplicación para desarrollo.

4. **Redis**: Opcional pero recomendado para rate limiting y cache en producción.

---

**¿Necesitas ayuda configurando algún servicio específico?**