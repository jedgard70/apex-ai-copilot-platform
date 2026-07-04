import fs from 'fs';
import path from 'path';

const file = path.resolve('src/main.tsx');
let content = fs.readFileSync(file, 'utf8');

const oldRouting = `    >
      {activeView === 'dashboard' ? (
        currentRole.startsWith('cliente_') ? (
          <div className="h-full" style={{ background: '#0f172a', minHeight: '100vh' }}>
            <ClientDashboard email={accountState?.user?.email} onBack={() => setActiveView('chat')} />
          </div>
        ) : (
          <DashboardPage onNavigate={(view) => {
            if (view === 'owner' && currentRole !== 'owner' && currentRole !== 'admin') {
              setAuthOutput({ goal: 'Open client account', conversationContext: [] })
            } else {
              setActiveView(view)
            }
          }} />
        )
      ) : activeView === 'client-dashboard' ? (
        <div className="h-full" style={{ background: '#0f172a', minHeight: '100vh' }}>
          <ClientDashboard email={accountState?.user?.email} onBack={() => setActiveView('chat')} />
        </div>
      ) : activeView === 'owner' ? (
        <OwnerPage onNavigate={setActiveView} onOpenChat={handleCommand} />
      ) : activeView === 'provider-detail' ? (
        <ProviderDetailPanel onClear={() => setActiveView('dashboard')} />
      ) : (
        // ── Split 70/30 — Painel + Chat lado a lado ──`;

const newRouting = `    >
      {activeView === 'client-dashboard' || (activeView === 'dashboard' && currentRole.startsWith('cliente_')) ? (
        <div className="h-full" style={{ background: '#0f172a', minHeight: '100vh' }}>
          <ClientDashboard email={accountState?.user?.email} onBack={() => setActiveView('chat')} />
        </div>
      ) : activeView === 'provider-detail' ? (
        <ProviderDetailPanel onClear={() => setActiveView('dashboard')} />
      ) : (
        // ── Split 70/30 — Painel + Chat lado a lado ──`;

content = content.replace(oldRouting, newRouting);

// Also remove the imports
content = content.replace("import { DashboardPage } from './components/DashboardPage'\n", "");
content = content.replace("import { OwnerPage } from './components/OwnerPage'\n", "");

// The user also wants to inhibit automatic panel opening by AI intents.
// Inside handleCommand or the intent processor, we have many `setActiveView(...)`.
// But I will do that as a separate step or just do a regex replace if it's safe.
// Wait, the plan was to remove automatic panel switching. 
// "Inibir abertura automática de painéis pelas intents da IA em main.tsx"
// I will just do a regex replace for `setActiveView('someView')` that happen INSIDE the ai actions.

fs.writeFileSync(file, content);
console.log('Removed old Owner/Dashboard routing from main.tsx');
