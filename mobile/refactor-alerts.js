const fs = require('fs');
const path = require('path');
const { readdirSync, statSync, readFileSync, writeFileSync } = fs;

function getAllFiles(dirPath, arrayOfFiles) {
  const files = readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles(path.join(__dirname, 'src', 'screens'));
let modifiedCount = 0;

files.forEach(file => {
  let content = readFileSync(file, 'utf8');
  let original = content;

  if (content.match(/import\s+{([^}]*)\bAlert\b([^}]*)}\s+from\s+['"]react-native['"]/)) {
    content = content.replace(/(import\s+{)([^}]*)(\bAlert\b)([^}]*)(}\s+from\s+['"]react-native['"])/g, (match, p1, p2, p3, p4, p5) => {
      let rest = (p2 + p4).replace(/,\s*,/g, ',').replace(/^\s*,\s*/, '').replace(/\s*,\s*$/, '').trim();
      if (!rest) return ''; 
      return p1 + ' ' + rest + ' ' + p5;
    });

    content = content.replace(/import\s+{\s*}\s+from\s+['"]react-native['"];?\n/g, '');

    const relativeDir = path.relative(path.dirname(file), path.join(__dirname, 'src', 'components'));
    const importPath = relativeDir.replace(/\\/g, '/') + '/PremiumAlert';
    
    content = 'import { PremiumAlert as Alert } from "' + importPath + '";\n' + content;
  }

  if (original !== content) {
    writeFileSync(file, content);
    modifiedCount++;
    console.log('Modified', file);
  }
});

console.log('Total files modified:', modifiedCount);
