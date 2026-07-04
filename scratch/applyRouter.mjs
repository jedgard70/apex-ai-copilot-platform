import fs from 'fs';
import path from 'path';

const mainTsxPath = path.resolve('src/main.tsx');
let content = fs.readFileSync(mainTsxPath, 'utf8');

// 1. Remove renderPanelContent function
const start = content.indexOf('function renderPanelContent');
let braceCount = 0, end = -1, started = false;
for (let i = start; i < content.length; i++) {
  if (content[i] === '{') { braceCount++; started = true; }
  else if (content[i] === '}') { braceCount--; }
  if (started && braceCount === 0) { end = i + 1; break; }
}

content = content.substring(0, start) + content.substring(end);

// 2. Add import for MainPanelsRouter
content = `import { MainPanelsRouter } from './components/MainPanelsRouter';\n` + content;

// 3. Replace {renderPanelContent(activeView)} with MainPanelsRouter
const routerCall = `
          <MainPanelsRouter
            panelView={activeView}
            setActiveView={setActiveView}
            currentRole={currentRole}
            setCampaignAutomationOutput={setCampaignAutomationOutput}
            archVisOutput={archVisOutput}
            archVisRevisionConstraints={archVisRevisionConstraints}
            setArchVisRevisionConstraints={setArchVisRevisionConstraints}
            handleArchVisGeneration={handleArchVisGeneration}
            closeOtherPanels={closeOtherPanels}
            setDirectCutOutput={setDirectCutOutput}
            directCutOutput={directCutOutput}
            handleDirectCutGeneration={handleDirectCutGeneration}
            bim3DOutput={bim3DOutput}
            setBim3DOutput={setBim3DOutput}
            activeFile={activeFile}
            localFileHandles={localFileHandles}
            setActiveFile={setActiveFile}
            setShowTerminal={setShowTerminal}
            activeProject={activeProject}
            fileToRecord={fileToRecord}
            setActiveProject={setActiveProject}
            upsertProject={upsertProject}
          />
`;

content = content.replace('{renderPanelContent(activeView)}', routerCall);

fs.writeFileSync(mainTsxPath, content);
console.log('Successfully updated main.tsx');
