import { useEffect, useState } from 'react'

interface DatasetOption {
  name: string
  examples?: number
  path?: string
  url?: string
}

interface TrainStatus {
  status: string
  message: string
  notebook?: string
  export?: string
  options?: DatasetOption[]
}

const OLLAMA_COMMANDS = [
  'ollama create apex-ai -f Modelfile',
  'ollama run apex-ai "Quem é você?"',
  'ollama serve   # expõe http://localhost:11434 para o site e apps',
]

const COLAB_URL =
  'https://colab.research.google.com/github/jedgard70/apex-ai-copilot-platform/blob/main/notebooks/fine_tune_gemma_apex_colab.ipynb'

export function ModelTrainingPage() {
  const [status, setStatus] = useState<TrainStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/copilot/train-gemma')
      .then(r => r.json())
      .then(data => {
        if (active) {
          setStatus(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const trainCount = status?.options?.find(o => /treino/i.test(o.name))?.examples ?? 0
  const testCount = status?.options?.find(o => /teste/i.test(o.name))?.examples ?? 0

  const copyCommands = () => {
    navigator.clipboard?.writeText(OLLAMA_COMMANDS.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const steps = [
    {
      icon: 'dataset',
      title: '1. Dataset pronto',
      body: loading
        ? 'Carregando contagem do dataset...'
        : `${trainCount} exemplos de treino + ${testCount} de teste separado, gerados de training_data/. Regenerar: node scripts/generate_apex_dataset.mjs`,
      done: trainCount > 0,
    },
    {
      icon: 'rocket_launch',
      title: '2. Treinar no Google Colab (grátis, GPU T4)',
      body: 'Abre o notebook fine_tune_gemma_apex_colab.ipynb no Colab. Faz LoRA no Gemma 2 2B usando uma base ABERTA (sem token, sem lock-in).',
      done: false,
    },
    {
      icon: 'package_2',
      title: '3. Exportar GGUF portável',
      body: 'O notebook funde o LoRA e converte para apex-ai.gguf (Q4_K_M) — um arquivo único que roda em qualquer máquina. Avalia no conjunto de teste separado.',
      done: false,
    },
    {
      icon: 'computer',
      title: '4. Rodar LOCAL via Ollama',
      body: 'Baixe apex-ai.gguf + Modelfile, crie o modelo local. Serve o Apex Desktop (.exe), o site e os apps de celular — sem API paga por token.',
      done: false,
    },
    {
      icon: 'check_circle',
      title: '5. Aparece no seletor de modelos',
      body: 'O modelo "Apex AI (modelo próprio, local/Ollama)" já está no seletor. Aponte APEX_LOCAL_URL para o Ollama (padrão http://localhost:11434).',
      done: true,
    },
  ]

  return (
    <div className="h-full bg-[#0B1221] text-[#e2e2e2] overflow-hidden flex flex-col">
      {/* Top bar */}
      <header className="h-16 sticky top-0 z-40 bg-[#121414] flex items-center justify-between px-8 border-b border-[#45464d] shrink-0">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#6C47FF]">model_training</span>
          <h2 className="text-xl font-semibold text-[#e2e2e2]">Model Training — Apex AI (Gemma próprio, sem lock-in)</h2>
        </div>
        <a
          href={COLAB_URL}
          target="_blank"
          rel="noreferrer"
          className="bg-[#6C47FF] text-white px-6 py-2 rounded-full font-bold text-sm hover:opacity-80 transition-opacity"
        >
          Abrir notebook no Colab ↗
        </a>
      </header>

      <div className="flex-1 overflow-y-auto p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Resumo honesto */}
          <section
            className="p-6 rounded-2xl"
            style={{ background: 'rgba(22,33,62,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-[#6C47FF] text-3xl">info</span>
              <div>
                <h3 className="font-bold text-lg mb-2">Como o modelo Apex é treinado</h3>
                <p className="text-sm text-[#c6c6ce] leading-relaxed">
                  Fine-tuning do <strong className="text-[#e2e2e2]">Gemma 2 2B</strong> com o dataset da Apex,
                  exportado em <strong className="text-[#e2e2e2]">GGUF portável</strong>. Roda 100% local
                  (desktop, site e apps) via Ollama —{' '}
                  <strong className="text-[#e2e2e2]">sem depender de nenhum provedor pago</strong>. O treino
                  real acontece no Google Colab (GPU grátis); este painel mostra o passo a passo real, sem
                  dados fictícios.
                </p>
              </div>
            </div>
          </section>

          {/* Métricas reais do dataset */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: 'EXEMPLOS DE TREINO', value: loading ? '…' : String(trainCount), accent: true, sub: '' },
              { label: 'TESTE (SEPARADO)', value: loading ? '…' : String(testCount), accent: false, sub: '' },
              { label: 'FORMATO DE EXPORTAÇÃO', value: 'GGUF', accent: false, sub: 'Ollama / llama.cpp' },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl"
                style={{ background: 'rgba(22,33,62,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <p className="text-[#c6c6ce] text-[10px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <span className={`text-3xl font-bold ${stat.accent ? 'text-[#6C47FF]' : ''}`}>{stat.value}</span>
                  {stat.sub ? <span className="text-xs text-[#c6c6ce]">{stat.sub}</span> : null}
                </div>
              </div>
            ))}
          </div>

          {/* Passo a passo real */}
          <section className="space-y-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-xl"
                style={{ background: 'rgba(22,33,62,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div
                  className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${
                    step.done ? 'bg-[#6C47FF] text-white' : 'bg-[#333535] border border-[#45464d] text-[#c6c6ce]'
                  }`}
                >
                  <span className="material-symbols-outlined">{step.icon}</span>
                </div>
                <div>
                  <h4 className="font-bold text-[#e2e2e2] mb-1">{step.title}</h4>
                  <p className="text-sm text-[#c6c6ce] leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Comandos Ollama reais */}
          <section className="p-6 rounded-2xl" style={{ background: 'rgba(12,15,15,0.9)', border: '1px solid #45464d' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#bbc5eb]">Rodar local (depois de baixar apex-ai.gguf + Modelfile)</h3>
              <button
                onClick={copyCommands}
                className="text-xs bg-[#6C47FF]/15 border border-[#6C47FF]/30 text-[#6C47FF] px-3 py-1 rounded-full font-bold hover:bg-[#6C47FF]/25 transition-all"
              >
                {copied ? 'Copiado ✓' : 'Copiar comandos'}
              </button>
            </div>
            <pre className="font-mono text-[12px] leading-relaxed text-[#c6c6ce] whitespace-pre-wrap">{OLLAMA_COMMANDS.join('\n')}</pre>
          </section>

          {status?.notebook ? (
            <p className="text-xs text-[#c6c6ce] text-center">
              Notebook: <span className="text-[#bbc5eb]">{status.notebook}</span> · Export:{' '}
              <span className="text-[#bbc5eb]">{status.export}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
