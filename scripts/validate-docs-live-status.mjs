import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const docsStateFile = path.join(projectRoot, 'docs', 'canonical', 'APEX_PLATFORM_CURRENT_STATE.md');

if (!fs.existsSync(docsStateFile)) {
  console.error(`❌ ERRO: O arquivo ${docsStateFile} não foi encontrado.`);
  process.exit(1);
}

const content = fs.readFileSync(docsStateFile, 'utf8');
const lines = content.split('\n');

let failed = false;
let verified = 0;

console.log('🔍 Iniciando Portão de Qualidade - Validação de Módulos LIVE...');

lines.forEach((line, index) => {
  // Matches markdown table rows like: | 1 | Chat | `server/api/copilot/chat.mjs` | ✅ LIVE |
  if (line.trim().startsWith('|') && line.includes('✅ LIVE')) {
    const columns = line.split('|').map(c => c.trim());
    if (columns.length >= 4) {
      const moduleName = columns[2];
      const componentPaths = columns[3]; // contains `path/to/file`

      // Extract text inside backticks for file paths
      const pathRegex = /`([^`]+)`/g;
      let match;
      while ((match = pathRegex.exec(componentPaths)) !== null) {
        let fileToCheck = match[1];

        // Se for um componente que pode estar em src/components/ e não tiver caminho completo:
        if (fileToCheck.endsWith('Panel.tsx') && !fileToCheck.includes('/')) {
            fileToCheck = `src/components/${fileToCheck}`;
        }

        // Handle modules and dependencies that are not local files (e.g., pdfjs-dist)
        // Also skip web routes that start with '/'
        if (!fileToCheck.includes('.') && !fileToCheck.includes('/')) {
          continue;
        }
        if (fileToCheck.startsWith('/')) {
            continue;
        }

        let fullPath = path.join(projectRoot, fileToCheck);
        
        // Handle missing extensions gracefully
        if (!fs.existsSync(fullPath)) {
            if (fs.existsSync(`${fullPath}.mjs`)) fullPath = `${fullPath}.mjs`;
            else if (fs.existsSync(`${fullPath}.tsx`)) fullPath = `${fullPath}.tsx`;
            else if (fs.existsSync(`${fullPath}.ts`)) fullPath = `${fullPath}.ts`;
        }

        if (!fs.existsSync(fullPath)) {
          console.error(`❌ Módulo [${moduleName}] declarado LIVE mas o arquivo não existe: ${fileToCheck}`);
          failed = true;
        } else {
          verified++;
        }
      }
    }
  }
});

if (failed) {
  console.error('\n🚨 PORTÃO DE QUALIDADE FALHOU! Existem módulos declarados como LIVE mas os arquivos de código correspondentes não existem. (Regra Absoluta 6)');
  process.exit(1);
} else {
  console.log(`\n✅ SUCESSO! Todos os ${verified} arquivos de código referenciados nos módulos LIVE foram encontrados no repositório.`);
  process.exit(0);
}
