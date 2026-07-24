import { useEffect, useState } from 'react'
import { getBrowserSupabaseClient } from '../lib/supabaseClient'

type PromptEntry = {
  id: string
  prompt_key: string
  content: string
  department: string | null
  updated_at: string
}

export function AIControlCenter() {
  const [prompts, setPrompts] = useState<PromptEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchPrompts()
  }, [])

  async function fetchPrompts() {
    try {
      setLoading(true)
      const { client: supabaseClient } = getBrowserSupabaseClient()
      if (!supabaseClient) throw new Error("Supabase not configured")

      const { data, error } = await supabaseClient
        .from('apex_prompts')
        .select('*')
        .order('department', { ascending: true })

      if (error) throw error
      setPrompts(data || [])
    } catch (err: any) {
      console.error(err)
      setMessage(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(id: string) {
    try {
      const { client: supabaseClient } = getBrowserSupabaseClient()
      if (!supabaseClient) return

      const { error } = await supabaseClient
        .from('apex_prompts')
        .update({ content: editContent, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      
      setMessage('Prompt salvo com sucesso!')
      setEditingId(null)
      fetchPrompts()
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err: any) {
      setMessage(`Erro ao salvar: ${err.message}`)
    }
  }

  if (loading) return <div className="p-6 text-[#c6c6ce]">Carregando prompts...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#e2e2e2] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#6C47FF]">psychology</span>
          Gestão de Prompts da IA
        </h2>
        {message && <div className="px-3 py-1 bg-[#6C47FF]/20 text-[#c9beff] rounded text-sm">{message}</div>}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {prompts.length === 0 ? (
          <div className="glass-card p-6 text-center text-[#c6c6ce]">
            Nenhum prompt encontrado no banco de dados. Rode o script SQL para inicializar.
          </div>
        ) : (
          prompts.map(prompt => (
            <div key={prompt.id} className="glass-card p-4 rounded-xl space-y-3" style={{ background: 'rgba(22, 33, 62, 0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{prompt.prompt_key}</h3>
                  <p className="text-[10px] tracking-widest text-[#6C47FF] uppercase">{prompt.department || 'GERAL'}</p>
                </div>
                {editingId !== prompt.id ? (
                  <button onClick={() => { setEditingId(prompt.id); setEditContent(prompt.content) }} className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors">Editar</button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded transition-colors">Cancelar</button>
                    <button onClick={() => handleSave(prompt.id)} className="text-xs px-3 py-1 bg-[#6C47FF] hover:bg-[#5b3ce0] text-white rounded transition-colors">Salvar</button>
                  </div>
                )}
              </div>
              
              {editingId === prompt.id ? (
                <textarea 
                  className="w-full h-32 bg-black/30 text-[#e2e2e2] p-3 rounded-lg border border-white/10 focus:border-[#6C47FF] focus:outline-none text-sm font-mono"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                />
              ) : (
                <div className="bg-black/20 p-3 rounded-lg border border-white/5 text-xs text-[#c6c6ce] whitespace-pre-wrap font-mono overflow-y-auto max-h-40">
                  {prompt.content}
                </div>
              )}
              
              <div className="text-[9px] text-[#6b7280] text-right">
                Última atualização: {new Date(prompt.updated_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
