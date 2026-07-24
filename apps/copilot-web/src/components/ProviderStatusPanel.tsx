import { useEffect, useState, useCallback } from 'react'
import { X, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Settings, ExternalLink, Zap, Mic, Image as ImageIcon, Video, MessageSquare, Activity } from 'lucide-react'
import { PremiumPanelLayout } from './PremiumPanelLayout'

type ProviderStatus = {
  id: string
  name: string
  status: 'ok' | 'warning' | 'needs-topup' | 'error' | 'unconfigured'
  message: string
  balance?: string | null
  topUpUrl?: string
  capabilities?: string[]
  latencyMs?: number
  models?: string[]
}

type Summary = {
  total: number
  healthy: number
  warnings: number
  needsAttention: number
  unconfigured: number
  overallStatus: 'ok' | 'attention'
}

type StatusData = {
  providers: ProviderStatus[]
  summary: Summary
  checkedAt: string
}

type Props = { onClear: () => void }

const CATEGORY_MAP: Record<string, { label: string; icon: React.ReactNode; ids: string[] }> = {
  llm:   { label: 'LLM / Chat',        icon: <MessageSquare size={12} />, ids: ['openai','anthropic','groq','gemini','ollama','apex-engine'] },
  image: { label: 'Imagens',           icon: <ImageIcon size={12} />,     ids: ['fal','huggingface','ideogram'] },
  video: { label: 'Vídeo',             icon: <Video size={12} />,         ids: ['replicate','kling','runway','higgsfield'] },
  audio: { label: 'Áudio / Voz',       icon: <Mic size={12} />,           ids: ['elevenlabs'] },
  infra: { label: 'Infraestrutura',    icon: <Zap size={12} />,           ids: ['supabase','firebase','stripe','github','brave-search','authkey','ffmpeg','aps'] },
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ok:            { label: 'Online',          color: '#22c55e', bg: '#22c55e12', border: '#22c55e30' },
  warning:       { label: 'Atenção',         color: '#f59e0b', bg: '#f59e0b12', border: '#f59e0b30' },
  'needs-topup': { label: 'Sem saldo',       color: '#ef4444', bg: '#ef444412', border: '#ef444430' },
  error:         { label: 'Erro',            color: '#ef4444', bg: '#ef444412', border: '#ef444430' },
  unconfigured:  { label: 'Não configurado', color: '#6b7280', bg: '#6b728012', border: '#6b728030' },
}

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.unconfigured
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: cfg.color, flexShrink: 0,
      boxShadow: status === 'ok' ? `0 0 6px ${cfg.color}80` : 'none',
    }} />
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.unconfigured
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      <StatusDot status={status} />
      {cfg.label}
    </span>
  )
}

function CapTag({ label }: { label: string }) {
  return (
    <span style={{
      fontSize: 10, padding: '1px 6px', borderRadius: 8,
      background: '#ffffff0a', color: '#94a3b8', border: '1px solid #ffffff10',
    }}>
      {label}
    </span>
  )
}

function ProviderCard({ p }: { p: ProviderStatus }) {
  const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.unconfigured
  const isOk = p.status === 'ok'
  return (
    <div style={{
      background: '#0b0e14', border: `1px solid ${isOk ? '#ffffff0d' : cfg.border}`,
      borderRadius: 10, padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 8,
      borderLeft: `3px solid ${cfg.color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusDot status={p.status} />
        <span style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0', flex: 1 }}>{p.name}</span>
        {p.latencyMs !== undefined && (
          <span style={{ fontSize: 10, color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Activity size={9} />{p.latencyMs}ms
          </span>
        )}
        <StatusBadge status={p.status} />
        {p.topUpUrl && (
          <a href={p.topUpUrl} target="_blank" rel="noreferrer" title="Painel do provedor"
            style={{ color: '#475569', display: 'flex', alignItems: 'center', lineHeight: 1 }}>
            <ExternalLink size={12} />
          </a>
        )}
      </div>

      <p style={{ fontSize: 11.5, color: isOk ? '#64748b' : cfg.color, margin: 0, lineHeight: 1.5 }}>
        {p.message}
      </p>

      {p.capabilities && p.capabilities.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {p.capabilities.map(c => <CapTag key={c} label={c} />)}
        </div>
      )}

      {(p.status === 'needs-topup' || p.status === 'error') && p.topUpUrl && (
        <a href={p.topUpUrl} target="_blank" rel="noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11,
          color: '#ef4444', background: '#ef444412', border: '1px solid #ef444430',
          borderRadius: 6, padding: '4px 10px', textDecoration: 'none', fontWeight: 600, width: 'fit-content',
        }}>
          <ExternalLink size={11} /> Resolver agora
        </a>
      )}
    </div>
  )
}

function CategorySection({ cat, providers }: { cat: typeof CATEGORY_MAP[string]; providers: ProviderStatus[] }) {
  if (!providers.length) return null
  const ok = providers.filter(p => p.status === 'ok').length
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 6, borderBottom: '1px solid #ffffff09' }}>
        <span style={{ color: '#475569' }}>{cat.icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {cat.label}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: ok === providers.length ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>
          {ok}/{providers.length} online
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {providers.map(p => <ProviderCard key={p.id} p={p} />)}
      </div>
    </div>
  )
}

function SummaryBar({ s, checkedAt }: { s: Summary; checkedAt: string }) {
  const time = (() => { try { return new Date(checkedAt).toLocaleTimeString('pt-BR') } catch { return checkedAt } })()
  const items = [
    { label: 'Online',       value: s.healthy,           color: '#22c55e', icon: <CheckCircle2 size={16} /> },
    { label: 'Alertas',      value: s.warnings ?? 0,     color: '#f59e0b', icon: <AlertTriangle size={16} /> },
    { label: 'Com erro',     value: s.needsAttention,    color: '#ef4444', icon: <XCircle size={16} /> },
    { label: 'Não config.',  value: s.unconfigured,      color: '#6b7280', icon: <Settings size={16} /> },
  ]
  const health = s.total > 0 ? Math.round((s.healthy / s.total) * 100) : 0
  return (
    <div style={{ background: '#0b0e14', border: '1px solid #ffffff0d', borderRadius: 12, padding: 14 }}>
      {/* health bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 11, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Saúde geral
        </span>
        <div style={{ flex: 1, height: 6, background: '#ffffff0a', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${health}%`, background: health > 70 ? '#22c55e' : health > 40 ? '#f59e0b' : '#ef4444', borderRadius: 3, transition: 'width .6s ease' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: health > 70 ? '#22c55e' : '#f59e0b' }}>{health}%</span>
      </div>

      {/* counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {items.map(item => (
          <div key={item.label} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            background: '#ffffff06', borderRadius: 8, padding: '10px 6px',
          }}>
            <span style={{ color: item.color }}>{item.icon}</span>
            <span style={{ fontSize: 22, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</span>
            <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 10, textAlign: 'center', fontSize: 10, color: '#334155' }}>
        🕒 Última verificação: {time} · Atualização automática a cada 60s
      </div>
    </div>
  )
}

const FILTERS = [
  { id: 'all',          label: 'Todos' },
  { id: 'ok',           label: '✅ Online' },
  { id: 'issues',       label: '🔴 Com problema' },
  { id: 'unconfigured', label: '⚫ Não configurados' },
]

export function ProviderStatusPanel({ onClear }: Props) {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')

  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/copilot/provider-status')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const t = window.setInterval(refresh, 60000)
    return () => window.clearInterval(t)
  }, [refresh])

  const filtered = (data?.providers ?? []).filter(p => {
    if (filter === 'all') return true
    if (filter === 'issues') return p.status !== 'ok' && p.status !== 'unconfigured'
    if (filter === 'unconfigured') return p.status === 'unconfigured'
    return p.status === filter
  })

  const categorizedIds = Object.values(CATEGORY_MAP).flatMap(c => c.ids)
  const byCategory = Object.entries(CATEGORY_MAP).map(([k, cat]) => ({
    k, cat, providers: filtered.filter(p => cat.ids.includes(p.id))
  })).filter(c => c.providers.length > 0)
  const uncategorized = filtered.filter(p => !categorizedIds.includes(p.id))

  return (
    <PremiumPanelLayout
      title="Painel de Provedores de IA"
      subtitle="Status, saldo e saúde em tempo real de todos os serviços integrados ao Apex."
      headerActions={
        <>
          <button onClick={refresh} disabled={loading} style={{
            background: '#1a1f2e', border: '1px solid #ffffff14', color: '#e2e8f0',
            borderRadius: 6, padding: '6px 12px', fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          }}>
            <RefreshCw size={13} className={loading ? 'spin-icon' : ''} />
            {loading ? 'Verificando...' : 'Atualizar Agora'}
          </button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {data && <SummaryBar s={data.summary} checkedAt={data.checkedAt} />}

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              background: filter === f.id ? '#2563eb' : 'transparent',
              color: filter === f.id ? '#fff' : '#64748b',
              borderColor: filter === f.id ? '#2563eb' : '#ffffff14',
              transition: 'all .15s',
            }}>{f.label}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#334155' }}>
            {filtered.length} / {data?.providers.length ?? '—'} provedores
          </span>
        </div>

        {error && (
          <div style={{ background: '#ef444412', border: '1px solid #ef444430', borderRadius: 8, padding: '10px 14px' }}>
            <span style={{ color: '#ef4444', fontSize: 12 }}>⚠️ {error}</span>
          </div>
        )}

        {loading && !data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 68, borderRadius: 10, background: '#0b0e14', border: '1px solid #ffffff0a', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {byCategory.map(({ k, cat, providers }) => (
              <CategorySection key={k} cat={cat} providers={providers} />
            ))}
            {uncategorized.length > 0 && (
              <CategorySection
                cat={{ label: 'Outros', icon: <Settings size={12} />, ids: [] }}
                providers={uncategorized}
              />
            )}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', color: '#334155', fontSize: 13, padding: 40 }}>
                Nenhum provedor corresponde ao filtro selecionado.
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin-icon{animation:spin 1s linear infinite}
        @keyframes pulse{0%,100%{opacity:.35}50%{opacity:.7}}
      `}</style>
    </PremiumPanelLayout>
  )
}

