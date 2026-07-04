import { getBrowserSupabaseClient } from './supabaseClient'
import type { Message } from '../main'

export type ChatConversation = {
  id: string
  title: string
  createdAt: string
  messages: Message[]
}

export async function loadChatConversationsFromSupabase(userId: string): Promise<ChatConversation[]> {
  const { data, error } = await getBrowserSupabaseClient().client!
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error || !data) {
    console.error('Error fetching chat history:', error)
    return []
  }

  const grouped = new Map<string, any[]>()
  for (const row of data) {
    if (!grouped.has(row.session_id)) {
      grouped.set(row.session_id, [])
    }
    grouped.get(row.session_id)!.push(row)
  }

  const conversations: ChatConversation[] = []
  for (const [sessionId, rows] of grouped.entries()) {
    const messages = rows.map(r => ({
      id: r.id,
      role: r.role,
      text: r.content
    }))
    
    // Derive title from first user message
    const firstUserMsg = rows.find(r => r.role === 'user')
    let title = 'Nova conversa'
    if (firstUserMsg && firstUserMsg.content) {
      title = firstUserMsg.content.substring(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '')
    }

    conversations.push({
      id: sessionId,
      title,
      createdAt: rows[0].created_at,
      messages
    })
  }

  return conversations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function saveMessageToSupabase(userId: string, sessionId: string, message: Message) {
  const { error } = await getBrowserSupabaseClient().client!
    .from('chat_history')
    .insert({
      id: message.id.length === 36 ? message.id : undefined, // fallback to UUID generation if id is not UUID
      session_id: sessionId,
      user_id: userId,
      role: message.role,
      content: message.text
    })
  
  if (error) {
    console.error('Error saving message to Supabase:', error)
  }
}
