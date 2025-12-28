// replace-colors.js - Automated Color Replacement Script
// Run: node replace-colors.js

const fs = require('fs');
const path = require('path');

// Color mapping: OLD → NEW
const colorReplacements = [
  // Hex colors
  { old: /#667eea/gi, new: '#D4AF37' },
  { old: /#764ba2/gi, new: '#B8860B' },
  { old: /#7c8ff5/gi, new: '#E5C158' },
  { old: /#5a67d8/gi, new: '#C9A961' },
  { old: /#4338ca/gi, new: '#B8860B' },
  { old: /#3730a3/gi, new: '#9A7B0A' },
  { old: /#c7d2fe/gi, new: '#F5E6C3' },
  { old: /#e0e7ff/gi, new: '#FFF4D6' },
  { old: /#f0f4ff/gi, new: '#FFF9E6' },
  
  // RGBA values - Purple/Blue to Gold
  { old: /rgba\(102,\s*126,\s*234,\s*0\.1\)/gi, new: 'rgba(212, 175, 55, 0.1)' },
  { old: /rgba\(102,\s*126,\s*234,\s*0\.15\)/gi, new: 'rgba(212, 175, 55, 0.15)' },
  { old: /rgba\(102,\s*126,\s*234,\s*0\.2\)/gi, new: 'rgba(212, 175, 55, 0.2)' },
  { old: /rgba\(102,\s*126,\s*234,\s*0\.3\)/gi, new: 'rgba(212, 175, 55, 0.3)' },
  { old: /rgba\(102,\s*126,\s*234,\s*0\.4\)/gi, new: 'rgba(212, 175, 55, 0.4)' },
  { old: /rgba\(102,\s*126,\s*234,\s*0\.5\)/gi, new: 'rgba(212, 175, 55, 0.5)' },
  { old: /rgba\(102,\s*126,\s*234,\s*0\.6\)/gi, new: 'rgba(212, 175, 55, 0.6)' },
  { old: /rgba\(102,\s*126,\s*234,\s*0\.8\)/gi, new: 'rgba(212, 175, 55, 0.8)' },
];

// Files to process
const filesToProcess = [
  'views/ai-influencer.ejs',
  'views/ai-influencer-history.ejs',
  'views/photo-product.ejs',
  'views/photo-product-history.ejs',
  'views/video-generation.ejs',
  'views/video-generation-history.ejs',
];

console.log('🎨 Starting Color Replacement...\n');

let totalReplacements = 0;
let processedFiles = 0;

filesToProcess.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  try {
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    // Read file content
    let content = fs.readFileSync(fullPath, 'utf8');
    let fileReplacements = 0;

    // Apply all color replacements
    colorReplacements.forEach(({ old, new: newColor }) => {
      const matches = content.match(old);
      if (matches) {
        content = content.replace(old, newColor);
        fileReplacements += matches.length;
      }
    });

    // Write back to file
    fs.writeFileSync(fullPath, content, 'utf8');
    
    console.log(`✅ ${filePath}`);
    console.log(`   Replacements: ${fileReplacements}\n`);
    
    totalReplacements += fileReplacements;
    processedFiles++;
    
  } catch (error) {
    console.log(`❌ Error processing ${filePath}:`);
    console.log(`   ${error.message}\n`);
  }
});

console.log('━'.repeat(50));
console.log(`\n🎉 Color Replacement Complete!`);
console.log(`📊 Summary:`);
console.log(`   Files processed: ${processedFiles}/${filesToProcess.length}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log(`\n💡 Next steps:`);
console.log(`   1. Review the updated files`);
console.log(`   2. Test in browser`);
console.log(`   3. Verify responsive design`);
console.log(`   4. Check all colors are gold/elegant`);
console.log(`\n✨ Theme changed from Purple/Blue → Gold/Elegant!`);