import React, { useState, useEffect } from 'react'

export function ApexSquadsPanel() {
  const [squads, setSquads] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newSquadName, setNewSquadName] = useState('')
  const [newSquadGoal, setNewSquadGoal] = useState('')

  useEffect(() => {
    fetchSquads()
  }, [])

  const fetchSquads = async () => {
    try {
      const res = await fetch('/api/copilot/squads')
      if (res.ok) {
        const data = await res.json()
        setSquads(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const createSquad = async () => {
    if (!newSquadName || !newSquadGoal) return
    setLoading(true)
    try {
      await fetch('/api/copilot/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSquadName, goal: newSquadGoal, skill: 'marketing-automation' })
      })
      setNewSquadName('')
      setNewSquadGoal('')
      fetchSquads()
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const runSquad = async (id: string) => {
    try {
      await fetch(`/api/copilot/squads/${id}/run`, { method: 'POST' })
      fetchSquads()
    } catch (e) {
      console.error(e)
    }
  }

  const approveCheckpoint = async (id: string) => {
    try {
      await fetch(`/api/copilot/squads/${id}/approve`, { method: 'POST' })
      fetchSquads()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="p-6 bg-slate-900 text-slate-100 min-h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Apex Squads (Multi-Agent)</h2>
        <p className="text-slate-400">Orquestre equipes de IA especializadas para automatizar tarefas complexas de ponta a ponta.</p>
      </div>

      <div className="bg-slate-800 p-6 rounded-lg mb-8 border border-slate-700">
        <h3 className="text-xl font-semibold mb-4">Criar Novo Squad</h3>
        <div className="flex flex-col space-y-4 max-w-xl">
          <input 
            type="text" 
            placeholder="Nome do Squad (ex: Lançamento Alpha)" 
            className="p-3 bg-slate-900 border border-slate-700 rounded text-white"
            value={newSquadName}
            onChange={(e) => setNewSquadName(e.target.value)}
          />
          <textarea 
            placeholder="Descreva o objetivo... (ex: Criar campanha completa de marketing para construtora X)" 
            className="p-3 bg-slate-900 border border-slate-700 rounded text-white h-24"
            value={newSquadGoal}
            onChange={(e) => setNewSquadGoal(e.target.value)}
          />
          <button 
            onClick={createSquad}
            disabled={loading || !newSquadName}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded transition-colors disabled:opacity-50"
          >
            {loading ? 'Inicializando...' : 'Recrutar Squad'}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4">Seus Squads Ativos</h3>
        {squads.length === 0 ? (
          <p className="text-slate-400">Nenhum squad em operação.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {squads.map(squad => (
              <div key={squad.id} className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-white">{squad.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded font-bold uppercase ${squad.status === 'completed' ? 'bg-green-900 text-green-300' : squad.status === 'checkpoint_waiting' ? 'bg-yellow-900 text-yellow-300' : squad.status === 'running' ? 'bg-blue-900 text-blue-300' : 'bg-slate-700 text-slate-300'}`}>
                    {squad.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4 flex-grow">{squad.goal}</p>
                
                <div className="mb-4">
                  <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Agentes no Pipeline</h5>
                  <div className="space-y-2">
                    {squad.agents.map((agent: any, idx: number) => (
                      <div key={agent.id} className="flex items-center text-sm">
                        <div className={`w-3 h-3 rounded-full mr-3 ${agent.status === 'completed' ? 'bg-green-500' : agent.status === 'running' ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`}></div>
                        <span className={agent.status === 'completed' ? 'text-slate-300' : agent.status === 'running' ? 'text-white font-bold' : 'text-slate-500'}>
                          {idx + 1}. {agent.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {squad.status === 'checkpoint_waiting' && squad.checkpoints.length > 0 && (
                  <div className="bg-yellow-900/30 border border-yellow-700 p-3 rounded mb-4 text-sm text-yellow-200">
                    <span className="font-bold block mb-1">Ação Necessária:</span>
                    {squad.checkpoints[squad.checkpoints.length - 1].message}
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-700">
                  {squad.status === 'idle' && (
                    <button onClick={() => runSquad(squad.id)} className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-medium transition-colors">
                      Iniciar Execução
                    </button>
                  )}
                  {squad.status === 'running' && (
                    <button disabled className="w-full bg-slate-800 text-slate-400 border border-slate-700 py-2 rounded font-medium cursor-wait">
                      Processando...
                    </button>
                  )}
                  {squad.status === 'checkpoint_waiting' && (
                    <button onClick={() => approveCheckpoint(squad.id)} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded font-bold transition-colors">
                      Aprovar & Continuar
                    </button>
                  )}
                  {squad.status === 'completed' && (
                    <button disabled className="w-full bg-green-900/50 text-green-400 border border-green-800/50 py-2 rounded font-medium">
                      Concluído
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
