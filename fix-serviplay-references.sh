#!/bin/bash

# Script para corregir todas las referencias de "serviplay" a "fixia"
echo "🔧 Corrigiendo referencias de 'serviplay' a 'fixia'..."

# Función para reemplazar en archivos
replace_in_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "📝 Procesando: $file"
        # Usar sed para reemplazar serviplay por fixia (case insensitive)
        sed -i 's/serviplay/fixia/gi' "$file" 2>/dev/null || \
        sed -i '' 's/serviplay/fixia/gi' "$file" 2>/dev/null
        
        # Reemplazar Serviplay por Fixia
        sed -i 's/Serviplay/Fixia/g' "$file" 2>/dev/null || \
        sed -i '' 's/Serviplay/Fixia/g' "$file" 2>/dev/null
        
        # Reemplazar SERVIPLAY por FIXIA
        sed -i 's/SERVIPLAY/FIXIA/g' "$file" 2>/dev/null || \
        sed -i '' 's/SERVIPLAY/FIXIA/g' "$file" 2>/dev/null
    fi
}

# Archivos de configuración del backend
replace_in_file "backend/.env"
replace_in_file "backend/.env.production"
replace_in_file "backend/.env.example"

# Archivos de configuración del frontend
replace_in_file "frontend/.env.local"
replace_in_file "frontend/.env.production"

# Archivos de documentación
replace_in_file "deploy-guide.md"
replace_in_file "FCM_SETUP.md"

# Archivos del frontend que pueden contener referencias
find frontend/src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
    if [ -f "$file" ]; then
        replace_in_file "$file"
    fi
done

# Archivos de configuración del frontend
find frontend -name "*.json" -o -name "*.md" | while read file; do
    if [ -f "$file" ] && [[ ! "$file" =~ node_modules ]]; then
        replace_in_file "$file"
    fi
done

echo "✅ Correcciones completadas!"
echo "📋 Archivos procesados:"
echo "   - Configuraciones de entorno (.env)"
echo "   - Documentación (.md)"
echo "   - Código fuente (.ts, .tsx, .js, .jsx)"
echo "   - Archivos de configuración (.json)"
echo ""
echo "⚠️  NOTA: Recuerda actualizar las variables de entorno en Railway:"
echo "   - CORS_ORIGIN=https://fixia.vercel.app"
echo "   - FRONTEND_URL=https://fixia.vercel.app"
echo "   - JWT_SECRET=fixia-super-secret-jwt-key-production-2024"
echo "   - REFRESH_TOKEN_SECRET=fixia-super-secret-refresh-token-key-production-2024"
echo "   - SESSION_SECRET=fixia-session-secret-production-2024"