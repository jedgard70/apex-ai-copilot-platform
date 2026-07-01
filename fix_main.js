const fs = require('fs');
const path = 'src/main.tsx';
let data = fs.readFileSync(path, 'utf8');
const regexModels = /const DIRECT_GEMINI_MODELS = \[/;
const insertModels = "const APEX_OWN_MODELS = [
  { id: 'apex-ai', name: 'Apex AI (Modelo Principal)' }
]

const DIRECT_GEMINI_MODELS = [;
data = data.replace(regexModels, insertModels);
const regexStatic = /function buildStaticModelCatalog\(\): ModelOption\[\] \{\s*return \[/m;
const insertStatic = "function buildStaticModelCatalog(): ModelOption[] {
  return [
    ...APEX_OWN_MODELS.map(model => ({
      id: composeModelValue('apex-local', model.id),
      name: model.name,
      provider: 'apex-local',
      modelId: model.id,
    })),;
data = data.replace(regexStatic, insertStatic);
fs.writeFileSync(path, data);
