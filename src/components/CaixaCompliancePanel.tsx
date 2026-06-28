import { useState } from 'react'
import { CheckCircle, AlertTriangle, FileText, UploadCloud, FileCheck2, Building, RefreshCw, Layers } from 'lucide-react'

type ComplianceItem = {
  id: string
  categoria: string
  requisito: string
  status: 'aprovado' | 'pendente' | 'reprovado'
  detalhe?: string
}

export function CaixaCompliancePanel() {
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [items, setItems] = useState<ComplianceItem[]>([
    { id: '1', categoria: 'Arquitetura', requisito: 'Área mínima útil (MCMV)', status: 'pendente' },
    { id: '2', categoria: 'Acessibilidade', requisito: 'Largura de portas internas (min 80cm)', status: 'pendente' },
    { id: '3', categoria: 'Engenharia', requisito: 'Especificação de materiais (PBQP-H)', status: 'pendente' },
    { id: '4', categoria: 'Documentação', requisito: 'Preenchimento automático PFUI (Caixa)', status: 'pendente' },
  ])

  const runCaixaScan = () => {
    setLoading(true)
    setTimeout(() => {
      setItems([
        { id: '1', categoria: 'Arquitetura', requisito: 'Área mínima útil (MCMV)', status: 'aprovado', detalhe: '42m² (Atende exigência Faixa 1 e 2)' },
        { id: '2', categoria: 'Acessibilidade', requisito: 'Largura de portas internas', status: 'reprovado', detalhe: 'Porta do banheiro BWC-01 está com 70cm (Mínimo exigido: 80cm)' },
        { id: '3', categoria: 'Engenharia', requisito: 'Especificação de materiais (PBQP-H)', status: 'aprovado', detalhe: 'Todos os materiais estruturais homologados.' },
        { id: '4', categoria: 'Documentação', requisito: 'Preenchimento PFUI (Caixa)', status: 'aprovado', detalhe: 'Planilha PFUI preenchida e pronta para assinatura.' },
      ])
      setAnalyzed(true)
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="h-full flex flex-col bg-[#0b1326] text-[#e2e8f0] p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#60a5fa] flex items-center gap-2">
            <Building size={24} />
            Módulo Caixa Econômica (MCMV)
          </h1>
          <p className="text-sm text-gray-400 mt-1">Validação automatizada de projetos via "Checklist Obras Financiadas".</p>
        </div>
        <button 
          onClick={runCaixaScan} 
          disabled={loading}
          className="flex items-center gap-2 bg-[#f59e0b] hover:bg-[#d97706] text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <FileCheck2 size={16} />}
          {loading ? 'Analisando Modelo BIM...' : 'Rodar Scan Caixa (MCMV)'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#171f33] p-4 rounded-xl border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <UploadCloud size={16} className="text-[#60a5fa]" /> Arquivos Base
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm p-2 bg-[#0b1326] rounded border border-white/10">
              <span className="flex items-center gap-2"><Layers size={14} className="text-[#ecb2ff]" /> ARQ_MCMV_LOTE01.rvt</span>
              <span className="text-green-400 text-xs font-semibold">Carregado</span>
            </div>
            <div className="flex justify-between items-center text-sm p-2 bg-[#0b1326] rounded border border-white/10">
              <span className="flex items-center gap-2"><FileText size={14} className="text-[#f59e0b]" /> MEMORIAL_DESCRITIVO_BASE.pdf</span>
              <span className="text-green-400 text-xs font-semibold">Carregado</span>
            </div>
          </div>
        </div>

        <div className="bg-[#171f33] p-4 rounded-xl border border-white/5">
          <h2 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <CheckCircle size={16} className="text-green-500" /> Status do Financiamento
          </h2>
          <div className="flex items-center gap-4 h-full pb-4">
             <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-white">{analyzed ? (items.every(i => i.status === 'aprovado') ? 'Apto' : 'Pendente') : '---'}</div>
                <div className="text-xs text-gray-400 mt-1">Status Geral</div>
             </div>
             <div className="w-px h-12 bg-white/10"></div>
             <div className="flex-1 text-center">
                <div className="text-3xl font-bold text-[#f59e0b]">{analyzed ? items.filter(i => i.status === 'reprovado').length : 0}</div>
                <div className="text-xs text-gray-400 mt-1">Erros Bloqueantes</div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#171f33] rounded-xl border border-white/5 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5">
          <h2 className="font-semibold text-gray-200">Relatório de Conformidade (PFUI)</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.map(item => (
            <div key={item.id} className={`p-3 rounded-lg border ${item.status === 'aprovado' ? 'bg-green-500/10 border-green-500/20' : item.status === 'reprovado' ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-800/50 border-gray-700'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.categoria}</span>
                  <h3 className="text-sm font-medium text-gray-200 mt-1">{item.requisito}</h3>
                  {item.detalhe && <p className="text-xs mt-2 text-gray-400">{item.detalhe}</p>}
                </div>
                <div>
                  {item.status === 'aprovado' && <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded font-semibold flex items-center gap-1"><CheckCircle size={12}/> Aprovado</span>}
                  {item.status === 'reprovado' && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-semibold flex items-center gap-1"><AlertTriangle size={12}/> Reprovado</span>}
                  {item.status === 'pendente' && <span className="bg-gray-700 text-gray-400 text-xs px-2 py-1 rounded font-semibold">Aguardando IA</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
