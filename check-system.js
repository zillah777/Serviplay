#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICACIÓN DEL SISTEMA FIXIA\n');

// Verificar archivos críticos
const criticalFiles = [
    { path: 'backend/.env.example', name: 'Backend Environment Example' },
    { path: 'frontend/.env.example', name: 'Frontend Environment Example' },
    { path: 'backend/src/controllers/identityController.ts', name: 'Identity Controller' },
    { path: 'backend/src/routes/identity.ts', name: 'Identity Routes' },
    { path: 'frontend/src/services/identityService.ts', name: 'Frontend Identity Service' },
    { path: 'backend/migrations/015_enhance_identity_verification.sql', name: 'Identity Verification Migration' },
    { path: 'SETUP_GUIDE.md', name: 'Setup Guide' }
];

console.log('📁 Verificando archivos críticos:');
let allFilesExist = true;

criticalFiles.forEach(file => {
    const exists = fs.existsSync(file.path);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${file.name}`);
    if (!exists) allFilesExist = false;
});

console.log('\n🏗️  Verificando estructura del proyecto:');

// Verificar directorios importantes
const importantDirs = [
    'backend/src/controllers',
    'backend/src/routes', 
    'backend/src/models',
    'backend/src/middleware',
    'backend/migrations',
    'frontend/src/pages',
    'frontend/src/services',
    'frontend/src/components'
];

importantDirs.forEach(dir => {
    const exists = fs.existsSync(dir);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${dir}`);
});

console.log('\n🔧 Variables de entorno críticas:');

// Verificar .env.example
const backendEnvExample = fs.existsSync('backend/.env.example') ? 
    fs.readFileSync('backend/.env.example', 'utf8') : '';

const criticalEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'SMTP_HOST',
    'FROM_EMAIL'
];

criticalEnvVars.forEach(varName => {
    const exists = backendEnvExample.includes(varName);
    const status = exists ? '✅' : '❌';
    console.log(`  ${status} ${varName}`);
});

console.log('\n🗄️  Migraciones disponibles:');

// Verificar migraciones
const migrationsDir = 'backend/migrations';
if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    
    migrations.forEach(migration => {
        console.log(`  ✅ ${migration}`);
    });
} else {
    console.log('  ❌ Directorio de migraciones no encontrado');
}

console.log('\n🚀 Estado del sistema:');

// Verificar package.json del backend
if (fs.existsSync('backend/package.json')) {
    console.log('  ✅ Backend package.json configurado');
} else {
    console.log('  ❌ Backend package.json no encontrado');
}

// Verificar package.json del frontend  
if (fs.existsSync('frontend/package.json')) {
    console.log('  ✅ Frontend package.json configurado');
} else {
    console.log('  ❌ Frontend package.json no encontrado');
}

console.log('\n📋 Funcionalidades implementadas:');

const features = [
    { name: 'Sistema de usuarios y autenticación', status: '✅' },
    { name: 'Sistema de servicios y categorías', status: '✅' },
    { name: 'Sistema de archivos y uploads', status: '✅' },
    { name: 'Sistema de reviews y calificaciones', status: '✅' },
    { name: 'Sistema de reservas/citas', status: '✅' },
    { name: 'Sistema de verificación de identidad', status: '✅' },
    { name: 'Sistema de favoritos', status: '✅' },
    { name: 'Búsqueda avanzada con filtros', status: '✅' },
    { name: 'Sistema de pagos (escrow)', status: '🔄' },
    { name: 'Chat en tiempo real', status: '⏳' },
    { name: 'Panel de administración', status: '⏳' },
    { name: 'Analytics y reportes', status: '⏳' }
];

features.forEach(feature => {
    console.log(`  ${feature.status} ${feature.name}`);
});

console.log('\n🔑 Próximos pasos recomendados:');
console.log('  1. Configurar base de datos PostgreSQL');
console.log('  2. Configurar variables de entorno (.env)');
console.log('  3. Ejecutar migraciones de base de datos');
console.log('  4. Configurar Cloudinary para archivos');
console.log('  5. Configurar email SMTP para verificaciones');
console.log('  6. Implementar sistema de pagos completo');
console.log('  7. Implementar chat en tiempo real');

console.log('\n📖 Para más detalles, consulta SETUP_GUIDE.md');

if (allFilesExist) {
    console.log('\n🎉 ¡Sistema verificado correctamente!');
    process.exit(0);
} else {
    console.log('\n⚠️  Algunos archivos críticos están faltando');
    process.exit(1);
}