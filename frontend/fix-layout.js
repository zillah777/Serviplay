#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Starting automatic layout fixes...');

// Patterns to replace
const replacements = [
  {
    pattern: /max-w-7xl mx-auto px-4/g,
    replacement: 'container mx-auto',
    description: 'Replace max-w-7xl containers with responsive container'
  },
  {
    pattern: /max-w-6xl mx-auto px-4/g,
    replacement: 'container mx-auto',
    description: 'Replace max-w-6xl containers with responsive container'
  },
  {
    pattern: /max-w-5xl mx-auto px-4/g,
    replacement: 'container mx-auto',
    description: 'Replace max-w-5xl containers with responsive container'
  },
  {
    pattern: /max-w-4xl mx-auto px-4/g,
    replacement: 'container mx-auto',
    description: 'Replace max-w-4xl containers with responsive container'
  },
  {
    pattern: /className="([^"]*?)min-h-screen([^"]*?)"/g,
    replacement: 'className="$1min-h-screen no-overflow$2"',
    description: 'Add no-overflow to min-h-screen containers'
  },
  {
    pattern: /className="([^"]*?)bg-white([^"]*?)shadow([^"]*?)"/g,
    replacement: 'className="$1bg-white$2shadow no-overflow$3"',
    description: 'Add no-overflow to white background containers with shadows'
  },
  {
    pattern: /className="([^"]*?)fixed([^"]*?)"/g,
    replacement: 'className="$1fixed no-overflow$2"',
    description: 'Add no-overflow to fixed positioned elements'
  }
];

// Files to process
const filePatterns = [
  'src/pages/**/*.tsx',
  'src/components/**/*.tsx'
];

let totalChanges = 0;
let filesProcessed = 0;

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let fileChanges = 0;

    replacements.forEach(({ pattern, replacement, description }) => {
      const matches = newContent.match(pattern);
      if (matches) {
        newContent = newContent.replace(pattern, replacement);
        fileChanges += matches.length;
        console.log(`  ✅ ${description}: ${matches.length} changes`);
      }
    });

    if (fileChanges > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`📝 Updated ${filePath} (${fileChanges} changes)`);
      totalChanges += fileChanges;
    }

    filesProcessed++;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Process all files
filePatterns.forEach(pattern => {
  const files = glob.sync(pattern, { cwd: process.cwd() });
  console.log(`\n📁 Processing pattern: ${pattern} (${files.length} files)`);
  
  files.forEach(file => {
    console.log(`\n🔍 Processing: ${file}`);
    processFile(file);
  });
});

console.log(`\n🎉 Layout fixes completed!`);
console.log(`📊 Summary:`);
console.log(`  - Files processed: ${filesProcessed}`);
console.log(`  - Total changes: ${totalChanges}`);
console.log(`\n🚀 Run 'npm run dev' to see the changes!`);