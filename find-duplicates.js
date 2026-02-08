const fs = require('fs');
const path = require('path');

function findDuplicates(dir) {
  const duplicates = [];
  
  function scanDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        scanDir(filePath);
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Check for duplicate function/const/interface declarations
        const declarations = new Map();
        
        lines.forEach((line, index) => {
          const trimmed = line.trim();
          
          // Check for export function/const/interface
          if (trimmed.match(/^(export\s+)?(async\s+)?function\s+(\w+)/)) {
            const match = trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
            if (match) {
              const name = match[1];
              if (declarations.has(name)) {
                duplicates.push({
                  file: filePath,
                  name: name,
                  line1: declarations.get(name),
                  line2: index + 1
                });
              } else {
                declarations.set(name, index + 1);
              }
            }
          }
          
          // Check for export const
          if (trimmed.match(/^(export\s+)?const\s+(\w+)/)) {
            const match = trimmed.match(/(?:export\s+)?const\s+(\w+)/);
            if (match) {
              const name = match[1];
              if (declarations.has(name)) {
                duplicates.push({
                  file: filePath,
                  name: name,
                  line1: declarations.get(name),
                  line2: index + 1
                });
              } else {
                declarations.set(name, index + 1);
              }
            }
          }
          
          // Check for export interface
          if (trimmed.match(/^(export\s+)?interface\s+(\w+)/)) {
            const match = trimmed.match(/(?:export\s+)?interface\s+(\w+)/);
            if (match) {
              const name = match[1];
              if (declarations.has(name)) {
                duplicates.push({
                  file: filePath,
                  name: name,
                  line1: declarations.get(name),
                  line2: index + 1
                });
              } else {
                declarations.set(name, index + 1);
              }
            }
          }
        });
      }
    }
  }
  
  scanDir(dir);
  return duplicates;
}

const duplicates = findDuplicates('src');

if (duplicates.length > 0) {
  console.log('Found duplicates:');
  duplicates.forEach(dup => {
    console.log(`  ${dup.file}: ${dup.name} at lines ${dup.line1} and ${dup.line2}`);
  });
  process.exit(1);
} else {
  console.log('✅ No duplicates found!');
  process.exit(0);
}

