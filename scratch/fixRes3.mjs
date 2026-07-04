import fs from 'fs';

let c = fs.readFileSync('src/main.tsx', 'utf8');
c = c.replace(/<DashboardPage[\s\S]*?\/>/g, '<OwnerPage />');
fs.writeFileSync('src/main.tsx', c);
