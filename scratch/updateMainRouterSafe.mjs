import fs from 'fs';
import path from 'path';

const file = path.resolve('src/main.tsx');
const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

let newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes("import { DashboardPage } from './components/DashboardPage'")) continue;
  if (line.includes("import { OwnerPage } from './components/OwnerPage'")) continue;

  if (line.includes("{activeView === 'dashboard' ? (")) {
    skip = true;
    newLines.push("      {activeView === 'client-dashboard' || (activeView === 'dashboard' && currentRole.startsWith('cliente_')) ? (");
    newLines.push('        <div className="h-full" style={{ background: \'#0f172a\', minHeight: \'100vh\' }}>');
    newLines.push('          <ClientDashboard email={accountState?.user?.email} onBack={() => setActiveView(\'chat\')} />');
    newLines.push('        </div>');
    newLines.push("      ) : activeView === 'provider-detail' ? (");
    newLines.push("        <ProviderDetailPanel onClear={() => setActiveView('dashboard')} />");
    newLines.push("      ) : (");
    newLines.push("        // ── Split 70/30 — Painel + Chat lado a lado ──");
    continue;
  }

  if (skip) {
    if (line.includes("// ── Split 70/30 — Painel + Chat lado a lado ──")) {
      skip = false;
    }
    continue;
  }

  newLines.push(line);
}

fs.writeFileSync(file, newLines.join('\n'));
console.log('Fixed main.tsx routing safely');
