import fs from 'fs';
import path from 'path';

const file = path.resolve('src/components/MainPanelsRouter.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("<CodeEditorPanel onNavigate={setActiveView} />", `<CodeEditorPanel 
        onRunFile={() => {}} 
        hasNativeHandle={false} 
        onSaveNativeFile={() => {}} 
        onChangeContent={() => {}} 
      />`);

content = content.replace("<OwnerPage onNavigate={setActiveView} onOpenChat={() => {}} />", "<OwnerPage onNavigate={props.setActiveView} onOpenChat={() => {}} />");

fs.writeFileSync(file, content);
console.log('Fixed typescript errors in MainPanelsRouter');
