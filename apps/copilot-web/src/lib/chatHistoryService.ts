import { getBrowserSupabaseClient } from './supabaseClient'
import type { Message } from '../main'

export type ChatConversation = {
  id: string
  title: string
  createdAt: string
  messages: Message[]
}

export async function loadChatConversationsFromSupabase(userId: string): Promise<ChatConversation[]> {
  const client = getBrowserSupabaseClient().client
  if (!client) return []

  const { data, error } = await client
    .from('chat_history')
    .select('id,session_id,role,content,created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error || !data) {
    console.error('Error fetching chat history:', error)
    return []
  }

  const grouped = new Map<string, ChatConversation & { hasTitle: boolean }>()
  for (const row of data) {
    let conversation = grouped.get(row.session_id)
    if (!conversation) {
      conversation = {
        id: row.session_id,
        title: 'Nova conversa',
        createdAt: row.created_at,
        messages: [],
        hasTitle: false
      }
      grouped.set(row.session_id, conversation)
    }

    conversation.messages.push({
      id: row.id,
      role: row.role,
      text: row.content
    })
    if (!conversation.hasTitle && row.role === 'user' && row.content) {
      conversation.title = row.content.substring(0, 30) + (row.content.length > 30 ? '...' : '')
      conversation.hasTitle = true
    }
  }

  const conversations = Array.from(grouped.values()).map(({ hasTitle, ...conversation }) => conversation)
  return conversations.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function saveMessageToSupabase(userId: string, sessionId: string, message: Message) {
  const client = getBrowserSupabaseClient().client
  if (!client) return

  const { error } = await client
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
