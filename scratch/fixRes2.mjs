import fs from 'fs';
import path from 'path';

let c = fs.readFileSync('src/main.tsx', 'utf8');

// Replace DashboardPage usage
const replaceStr = `<DashboardPage onNavigate={(view: any) => {
            if (view === 'owner' && currentRole !== 'owner' && currentRole !== 'admin') {
              setAuthOutput({ goal: 'Open client account', conversationContext: [] })
            } else {
              setActiveView(view)
            }
          }} />`;

c = c.replace(replaceStr, '<OwnerPage />');
fs.writeFileSync('src/main.tsx', c);
