import { useState, useEffect } from 'react'
import { getBrowserSupabaseClient } from '../lib/supabaseClient'
import { PremiumPanelLayout } from './PremiumPanelLayout'
import {
  Brain,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface AiPersona {
  id: string
  name: string
  system_prompt: string
  is_active: boolean
}

export function AiControlPanel() {
  const [personas, setPersonas] = useState<AiPersona[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPersona, setSelectedPersona] = useState<AiPersona | null>(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [editName, setEditName] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  useEffect(() => {
    fetchPersonas()
  }, [])

  async function fetchPersonas() {
    setLoading(true)
    const { client } = getBrowserSupabaseClient()
    if (!client) {
      setLoading(false)
      return
    }
    const { data, error } = await client
      .from('ai_personas')
      .select('*')
      .order('name')

    if (!error && data) {
      setPersonas(data)
      const active = data.find((p: AiPersona) => p.is_active)
      if (active) {
        setSelectedPersona(active)
        setEditPrompt(active.system_prompt)
        setEditName(active.name)
      } else if (data.length > 0) {
        setSelectedPersona(data[0])
        setEditPrompt(data[0].system_prompt)
        setEditName(data[0].name)
      }
    }
    setLoading(false)
  }

  function handleSelect(p: AiPersona) {
    setSelectedPersona(p)
    setEditPrompt(p.system_prompt)
    setEditName(p.name)
    setSaveStatus('idle')
  }

  async function handleSave() {
    if (!selectedPersona) return
    setSaveStatus('saving')

    const { client } = getBrowserSupabaseClient()
    if (!client) {
      setSaveStatus('error')
      return
    }

    const { error } = await client
      .from('ai_personas')
      .update({
        name: editName,
        system_prompt: editPrompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedPersona.id)

    if (error) {
      console.error(error)
      setSaveStatus('error')
    } else {
      setSaveStatus('saved')
      fetchPersonas()
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  async function handleCreateNew() {
    const newName = `Nova Persona ${personas.length + 1}`
    const { client } = getBrowserSupabaseClient()
    if (!client) return

    const { data, error } = await client
      .from('ai_personas')
      .insert({
        name: newName,
        system_prompt: 'Você é um assistente prestativo.',
        is_active: false
      })
      .select()
      .single()

    if (!error && data) {
      fetchPersonas()
      handleSelect(data)
    }
  }

  async function handleActivate(id: string) {
    const { client } = getBrowserSupabaseClient()
    if (!client) return
    // Desativa todos
    await client.from('ai_personas').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000')
    // Ativa o alvo
    await client.from('ai_personas').update({ is_active: true }).eq('id', id)
    fetchPersonas()
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta persona?')) return
    const { client } = getBrowserSupabaseClient()
    if (!client) return
    await client.from('ai_personas').delete().eq('id', id)
    fetchPersonas()
  }

  return (
    <PremiumPanelLayout title="Ai Control" subtitle="Gerenciamento do módulo">
      <div className="flex h-full w-full text-gray-200">
        {/* Sidebar de Personas */}
      <div className="w-64 border-r border-white/10 p-4 flex flex-col gap-4 bg-white/5 backdrop-blur-xl">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold">Personas de IA</h2>
        </div>
        
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 justify-center py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Persona
        </button>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 mt-4 pr-1 custom-scrollbar">
          {loading ? (
            <div className="text-sm text-gray-500 text-center py-4">Carregando...</div>
          ) : (
            personas.map(p => (
              <div 
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedPersona?.id === p.id 
                    ? 'border-indigo-500/50 bg-indigo-500/10' 
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-medium text-sm truncate pr-2">{p.name}</div>
                  {p.is_active && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                </div>
                {!p.is_active && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleActivate(p.id); }}
                    className="mt-2 text-xs text-gray-400 hover:text-indigo-400 transition-colors"
                  >
                    Ativar
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Principal */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-transparent pointer-events-none" />
        
        {selectedPersona ? (
          <div className="flex flex-col h-full z-10">
            <div className="flex justify-between items-center mb-6">
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="bg-transparent text-2xl font-bold focus:outline-none border-b border-transparent focus:border-indigo-500/50 px-2 py-1 transition-all"
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(selectedPersona.id)}
                  disabled={selectedPersona.is_active}
                  className={`p-2 rounded-lg border transition-all ${
                    selectedPersona.is_active 
                      ? 'border-white/5 text-gray-600 cursor-not-allowed' 
                      : 'border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50'
                  }`}
                  title={selectedPersona.is_active ? "Não é possível excluir a persona ativa" : "Excluir persona"}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium shadow-lg shadow-indigo-500/20"
                >
                  {saveStatus === 'saving' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saveStatus === 'saved' ? 'Salvo!' : 'Salvar Prompt'}
                </button>
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-[#0a0a0b]/80 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/10">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">System Prompt (Instruções de Comportamento)</span>
                {selectedPersona.is_active && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full border border-emerald-400/20">
                    <CheckCircle2 className="w-3 h-3" />
                    Em Uso pelo Chat
                  </span>
                )}
              </div>
              <textarea
                value={editPrompt}
                onChange={e => setEditPrompt(e.target.value)}
                className="flex-1 bg-transparent p-4 text-sm font-mono leading-relaxed text-gray-300 focus:outline-none resize-none custom-scrollbar"
                placeholder="Escreva aqui como a IA deve se comportar..."
                spellCheck={false}
              />
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-white/5 p-3 rounded-lg border border-white/5">
              <AlertTriangle className="w-4 h-4 text-amber-500/70" />
              <p>
                Qualquer alteração feita e salva aqui será aplicada <strong className="text-gray-300">imediatamente</strong> na próxima mensagem que você enviar no chat.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 z-10">
            <Brain className="w-16 h-16 mb-4 opacity-20" />
            <p>Selecione ou crie uma persona ao lado</p>
          </div>
        )}
      </div>
    </div>
    </PremiumPanelLayout>
  )
}
