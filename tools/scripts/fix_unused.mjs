import fs from 'fs';
import path from 'path';

const log = fs.readFileSync('C:\\Users\\apexg\\.gemini\\antigravity\\brain\\1db6ae66-7ff0-45f3-ac5b-a5726a0552c8\\.system_generated\\tasks\\task-38.log', 'utf8');
const lines = log.split('\n');

const fixes = {}; // file -> [ {line, symbol, type} ]

for (const line of lines) {
  const match = line.match(/^(.+?)\((\d+),\d+\): error TS6133: '(.+?)' is declared but its value is never read\./);
  if (match) {
    const file = match[1];
    const lineNum = parseInt(match[2]);
    const symbol = match[3];
    if (!fixes[file]) fixes[file] = [];
    fixes[file].push({ lineNum, symbol });
  }
}

for (const file of Object.keys(fixes)) {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) continue;
  
  let contentLines = fs.readFileSync(filePath, 'utf8').split('\n');
  const fileFixes = fixes[file].sort((a,b) => b.lineNum - a.lineNum); // process bottom up to avoid line shift
  
  for (const fix of fileFixes) {
    const i = fix.lineNum - 1;
    let line = contentLines[i];
    
    // Check if it's an import
    if (line.includes('import')) {
      // Remove symbol from { symbol, other }
      let regex = new RegExp(`\\b${fix.symbol}\\b\\s*,?`);
      line = line.replace(regex, '');
      // cleanup empty {}
      line = line.replace(/\{\s*,\s*\}/, '{}');
      line = line.replace(/\{\s*\}/, '');
      // cleanup dangling comma
      line = line.replace(/,\s*\}/, '}').replace(/\{\s*,/, '{');
      // If import is now empty, remove it completely
      if (line.match(/import\s+(from\s+)?['"][^'"]+['"]/)) {
        contentLines[i] = '// ' + contentLines[i]; // comment out
      } else {
        contentLines[i] = line;
      }
    } else {
      if (line.includes('const {') || line.includes('let {') || line.includes('var {') || line.match(/\bfunction\b|\=\s*\(\s*\{/)) {
        let regex = new RegExp(`\\b${fix.symbol}\\b\\s*(:\\s*[^,}]+)?\\s*,?`);
        line = line.replace(regex, '');
        line = line.replace(/,\s*\}/, '}').replace(/\{\s*,/, '{');
        contentLines[i] = line;
      } else if (line.match(new RegExp(`const\\s+${fix.symbol}\\s*=`))) {
        contentLines[i] = '// ' + contentLines[i];
      }
    }
  }
  
  fs.writeFileSync(filePath, contentLines.join('\n'));
}

console.log('Done applying automatic fixes.');
