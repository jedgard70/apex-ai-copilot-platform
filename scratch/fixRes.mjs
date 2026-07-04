import fs from 'fs';
import path from 'path';

let c = fs.readFileSync('src/main.tsx', 'utf8');
c = c.replace(/import .*DashboardPage.*/g, '');
c = c.replace(/export type ChatIdentityContext/g, 'type ChatIdentityContext');
c = c.replace(/type ChatIdentityContext/g, 'export type ChatIdentityContext');
c = c.replace(/export type BusinessOutput/g, 'type BusinessOutput');
c = c.replace(/type BusinessOutput/g, 'export type BusinessOutput');
c = c.replace(/\\(view\\)/g, '(view: any)');
fs.writeFileSync('src/main.tsx', c);

let ce = fs.readFileSync('src/lib/CopilotEngine.ts', 'utf8');
ce = ce.replace(/import \{ isBim3DIntent \} from '\.\.\/main';/g, "import { isBim3DIntent } from './intentDetection';");
fs.writeFileSync('src/lib/CopilotEngine.ts', ce);
