import fs from 'fs';

let main = fs.readFileSync('src/main.tsx', 'utf8');
const importStr = "import { loadChatConversationsFromSupabase, saveMessageToSupabase } from './lib/chatHistoryService';\n";
main = main.replace(importStr, '');
main = importStr + main;
fs.writeFileSync('src/main.tsx', main);

let chs = fs.readFileSync('src/lib/chatHistoryService.ts', 'utf8');
chs = chs.replace("import { supabase } from './supabaseClient'", "import { getBrowserSupabaseClient } from './supabaseClient'");
chs = chs.replace(/await supabase/g, "await getBrowserSupabaseClient().client!");
fs.writeFileSync('src/lib/chatHistoryService.ts', chs);
