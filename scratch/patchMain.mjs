import fs from 'fs';
import path from 'path';

let c = fs.readFileSync('src/main.tsx', 'utf8');

// Add import
const importStr = "import { loadChatConversationsFromSupabase, saveMessageToSupabase } from './lib/chatHistoryService';\n";
const lastImportIdx = c.lastIndexOf('import ');
const nextLineIdx = c.indexOf('\n', lastImportIdx) + 1;
c = c.slice(0, nextLineIdx) + importStr + c.slice(nextLineIdx);

// Replace initializers to not block on localStorage for conversations
c = c.replace(/const \[conversations, setConversations\] = useState<ChatConversation\[\]>\(\(\) => \{[\s\S]*?\}\)/, `const [conversations, setConversations] = useState<ChatConversation[]>([])`);

c = c.replace(/const \[messages, setMessages\] = useState<Message\[\]>\(\(\) => \{[\s\S]*?return \[\s*\{\s*id: id\(\),\s*role: 'assistant',\s*text: "Sou a Apex AI. Como posso te ajudar\?",\s*\},\s*\]\s*\}\)/, `const [messages, setMessages] = useState<Message[]>([\n    {\n      id: id(),\n      role: 'assistant',\n      text: "Sou a Apex AI. Como posso te ajudar?",\n    }\n  ])`);

// Inject useEffect for loading from Supabase
const loadEffect = `
  useEffect(() => {
    async function loadSupabaseHistory() {
      const userId = accountState?.user?.id;
      if (!userId) return;
      
      const supaConvs = await loadChatConversationsFromSupabase(userId);
      if (supaConvs && supaConvs.length > 0) {
        setConversations(supaConvs);
        
        // Ensure active ID exists
        const activeId = localStorage.getItem('apex_active_conversation_id') || supaConvs[0].id;
        const active = supaConvs.find(c => c.id === activeId);
        
        if (active) {
          setActiveConversationId(active.id);
          if (active.messages?.length > 0) setMessages(active.messages);
        } else {
          setActiveConversationId(supaConvs[0].id);
          if (supaConvs[0].messages?.length > 0) setMessages(supaConvs[0].messages);
        }
      }
    }
    loadSupabaseHistory();
  }, [accountState?.user?.id]);
`;

// Insert after `const [messages, setMessages]`
const messagesIdx = c.indexOf(`const [messages, setMessages] = useState<Message[]>([`);
const endMessagesIdx = c.indexOf('])', messagesIdx) + 2;
c = c.slice(0, endMessagesIdx) + loadEffect + c.slice(endMessagesIdx);

// Replace the localStorage saving useEffect with the Supabase syncing useEffect
const syncEffect = `
  // Sync messages to Supabase and keep conversations list updated
  useEffect(() => {
    const userId = accountState?.user?.id;
    
    // Update conversations list in memory
    setConversations(prev => {
      const existing = prev.find(c => c.id === activeConversationId)
      if (existing) {
        if (existing.messages === messages) return prev
        const changed = prev.map(c => {
          if (c.id === activeConversationId) {
            let nextTitle = c.title
            if (c.title === 'Conversa Inicial' || c.title === 'Nova Conversa' || c.title === 'New Chat') {
              const firstUserMessage = messages.find(m => m.role === 'user')
              if (firstUserMessage) {
                const cleanText = firstUserMessage.text.replace(/^[A-Za-z0-9\\s]+:\\s*/, '')
                nextTitle = cleanText.slice(0, 24) + (cleanText.length > 24 ? '...' : '')
              }
            }
            return { ...c, title: nextTitle, messages }
          }
          return c
        })
        return changed
      }
      return prev
    })

    if (!userId) return;

    // Sync to Supabase
    const lastSavedKey = 'apex_last_saved_msg_ids_' + activeConversationId;
    const currentLocalStr = localStorage.getItem(lastSavedKey) || '[]';
    let lastSavedIds = [];
    try { lastSavedIds = JSON.parse(currentLocalStr); } catch {}
    
    messages.forEach(msg => {
      if (!lastSavedIds.includes(msg.id)) {
        saveMessageToSupabase(userId, activeConversationId, msg);
        lastSavedIds.push(msg.id);
      }
    });

    localStorage.setItem(lastSavedKey, JSON.stringify(lastSavedIds));
  }, [messages, activeConversationId, accountState?.user?.id])
`;

// Replace the old effect
const oldEffectRegex = /useEffect\(\(\) => \{\s*setConversations\(prev => \{[\s\S]*?\}, \[messages, activeConversationId\]\)/;
c = c.replace(oldEffectRegex, syncEffect.trim());

fs.writeFileSync('src/main.tsx', c);
