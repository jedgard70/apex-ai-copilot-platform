import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/MainPanelsRouter.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import { GlobalPermitsPanel }')) {
  content = content.replace("import { CodeEditorPanel } from './CodeEditorPanel'", "import { CodeEditorPanel } from './CodeEditorPanel'\nimport GlobalPermitsPanel from './GlobalPermitsPanel'\nimport { OwnerPage } from './OwnerPage'");
}

const newCases = `
    case 'editor':
      return <CodeEditorPanel onNavigate={setActiveView} />
    case 'permits':
      return <GlobalPermitsPanel />
    case 'owner':
    case 'dashboard':
      return <OwnerPage onNavigate={setActiveView} onOpenChat={() => {}} />
`;

if (!content.includes("case 'permits':")) {
  content = content.replace("    default:", newCases + "\n    default:");
}

fs.writeFileSync(file, content);
console.log('MainPanelsRouter updated');
