#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Pattern to find old logo implementations
const oldLogoPattern = /<div className="w-\d+ h-\d+ bg-gradient-to-r from-primary-blue to-secondary-green rounded-2xl shadow-lg flex items-center justify-center">\s*<span className="text-white font-bold text-\w+">S<\/span>\s*<\/div>/g;

const oldLogoWithTextPattern = /<Link.*?className="flex items-center space-x-2">\s*<div className="w-\d+ h-\d+ bg-gradient-to-r from-primary-blue to-secondary-green rounded-2xl shadow-lg flex items-center justify-center">\s*<span className="text-white font-bold text-\w+">S<\/span>\s*<\/div>\s*<span className="font-display text-\w+ font-bold text-neutral-900">\s*\{APP_CONFIG\.NAME\}\s*<\/span>\s*<\/Link>/g;

// Files to update
const filesToUpdate = [
  'src/components/common/Header.tsx',
  'src/components/common/Layout.tsx',
  'src/pages/index.tsx',
  'src/pages/about.tsx',
  'src/pages/auth/login.tsx',
  'src/pages/auth/register.tsx',
  'src/pages/auth/forgot-password.tsx',
  'src/pages/auth/reset-password.tsx',
  'src/pages/become-as.tsx',
  'src/pages/categories.tsx',
  'src/pages/contact.tsx',
  'src/pages/dashboard.tsx',
  'src/pages/help.tsx',
  'src/pages/how-it-works.tsx',
  'src/pages/onboarding.tsx',
  'src/pages/pricing.tsx',
  'src/pages/privacy.tsx',
  'src/pages/profile/[id].tsx',
  'src/pages/security.tsx',
  'src/pages/services/new.tsx',
  'src/pages/settings.tsx',
  'src/pages/terms.tsx',
  'src/pages/verification.tsx',
  'src/pages/verify-email.tsx'
];

let updatedFiles = 0;
let totalChanges = 0;

console.log('🔄 Actualizando logos en todos los archivos...\n');

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileChanges = 0;

    // Check if file already imports Logo
    const hasLogoImport = content.includes('from \'@/components/common/Logo\'');

    // Pattern 1: Simple logo icon (buscar tanto S como F)
    const simpleLogoPattern = /<div className="w-(\d+) h-\1 bg-gradient-to-r from-primary-blue to-secondary-green rounded-2xl shadow-lg flex items-center justify-center">\s*<span className="text-white font-bold text-\w+">[SF]<\/span>\s*<\/div>/g;
    
    let match;
    while ((match = simpleLogoPattern.exec(content)) !== null) {
      const size = parseInt(match[1]);
      let logoSize = 'md';
      if (size <= 8) logoSize = 'sm';
      else if (size >= 16) logoSize = 'lg';
      
      const replacement = `<LogoIcon size="${logoSize}" />`;
      content = content.replace(match[0], replacement);
      fileChanges++;
    }

    // Pattern 2: Logo with text (more complex, buscar tanto S como F)
    const logoWithTextPattern = /<div className="flex items-center space-x-2(?:[^"]*)?">[\s\S]*?<div className="w-(\d+) h-\1 bg-gradient-to-r from-primary-blue to-secondary-green rounded-2xl shadow-lg flex items-center justify-center">[\s\S]*?<span className="text-white font-bold[^"]*">[SF]<\/span>[\s\S]*?<\/div>[\s\S]*?<span className="font-display[^"]*font-bold[^"]*">[\s\S]*?\{APP_CONFIG\.NAME\}[\s\S]*?<\/span>[\s\S]*?<\/div>/g;
    
    while ((match = logoWithTextPattern.exec(content)) !== null) {
      const replacement = `<LogoWithText />`;
      content = content.replace(match[0], replacement);
      fileChanges++;
    }

    // Add import if needed and changes were made
    if (fileChanges > 0 && !hasLogoImport) {
      // Find the last import statement
      const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?\s*\n/g;
      let lastImportMatch;
      let lastImport;
      
      while ((lastImportMatch = importRegex.exec(content)) !== null) {
        lastImport = lastImportMatch;
      }
      
      if (lastImport) {
        const insertPosition = lastImport.index + lastImport[0].length;
        const logoImport = "import { LogoIcon, LogoWithText } from '@/components/common/Logo';\n";
        content = content.slice(0, insertPosition) + logoImport + content.slice(insertPosition);
      }
    }

    // Write file if changes were made
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ ${filePath} - ${fileChanges} cambios`);
      updatedFiles++;
      totalChanges += fileChanges;
    }
  } else {
    console.log(`⚠️  ${filePath} - archivo no encontrado`);
  }
});

console.log(`\n🎉 Actualización completada:`);
console.log(`   📁 Archivos actualizados: ${updatedFiles}`);
console.log(`   🔄 Total de cambios: ${totalChanges}`);

if (updatedFiles > 0) {
  console.log('\n✅ Todos los logos han sido actualizados al nuevo componente Logo.');
  console.log('💡 Recuerda ejecutar npm run build para verificar que todo compile correctamente.');
} else {
  console.log('\n💡 No se encontraron logos antiguos para actualizar.');
}