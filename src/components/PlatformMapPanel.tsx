import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, BookOpen, CheckCircle,
  Clipboard, Compass, Download, ExternalLink,
  RefreshCw, Search, WifiOff, X, XCircle,
} from 'lucide-react'
import { createPlatformMapSections } from '../lib/platformMapKnowledge'
import { getManualSections } from '../lib/platformManualData'

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { onClear: () => void }

type ProviderStatus = {
  id: string
  name: string
  status: 'ok' | 'warning' | 'needs-topup' | 'error' | 'unconfigured'
  message: string
  balance?: string | null
  topUpUrl?: string
}
type ProviderData = {
  providers: ProviderStatus[]
  summary: { total: number; healthy: number; needsAttention: number; unconfigured: number; overallStatus: 'ok' | 'attention' }
  checkedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function copy(text: string) { navigator.clipboard?.writeText(text).catch(() => undefined) }
function dl(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
}
function fmt(iso: string) {
  try { return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
  catch { return iso }
}

// ─── Status colours / labels ─────────────────────────────────────────────────

const S_COLOR: Record<string, string> = {
  ok: '#22c55e', warning: '#f59e0b', 'needs-topup': '#ef4444', error: '#ef4444', unconfigured: '#6b7280',
}
const S_LABEL: Record<string, string> = {
  ok: 'OK', warning: 'Atenção', 'needs-topup': 'Recarregar', error: 'Erro', unconfigured: 'Não configurado',
}

function StatusIcon({ s, size = 15 }: { s: string; size?: number }) {
  if (s === 'ok') return <CheckCircle size={size} color="#22c55e" />
  if (s === 'warning') return <AlertTriangle size={size} color="#f59e0b" />
  if (s === 'needs-topup') return <AlertTriangle size={size} color="#ef4444" />
  if (s === 'error') return <XCircle size={size} color="#ef4444" />
  return <WifiOff size={size} color="#6b7280" />
}

function Badge({ s }: { s: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
      background: `${S_COLOR[s]}22`, color: S_COLOR[s], border: `1px solid ${S_COLOR[s]}44`,
      whiteSpace: 'nowrap',
    }}>
      <StatusIcon s={s} size={11} />{S_LABEL[s] || s}
    </span>
  )
}

function statusLabel(s: 'ready' | 'partial' | 'planned') {
  return s === 'ready' ? 'Ready' : s === 'partial' ? 'Partial' : 'Planned'
}

// ─── Tab: Interactive Map ─────────────────────────────────────────────────────

function MapTab({ onClear }: { onClear: () => void }) {
  const [filter, setFilter] = useState('')
  const sections = useMemo(() => createPlatformMapSections(), [])
  const q = filter.trim().toLowerCase()
  const visible = sections
    .map(sec => ({ ...sec, features: sec.features.filter(f => !q || `${sec.title} ${f.name} ${f.summary} ${f.command} ${f.outputs.join(' ')}`.toLowerCase().includes(q)) }))
    .filter(sec => sec.features.length > 0)

  return (
    <div className="contracts-layout">
      <aside className="contracts-controls">
        <div className="contracts-card">
          <strong>Buscar</strong>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Search size={14} />
            <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Ex: orçamento, BIM, vídeo..." />
          </div>
        </div>
        <div className="contracts-card">
          <strong>Como usar</strong>
          <p style={{ margin: '8px 0 0', color: 'rgba(226,232,240,0.78)', lineHeight: 1.5, fontSize: 12 }}>
            Cada item mostra o que existe, o comando natural para abrir e o que entrega. Status:
            <br /><code>Ready</code> = disponível agora · <code>Partial</code> = em progresso · <code>Planned</code> = roadmap
          </p>
        </div>
        <div className="contracts-card">
          <strong>Ações</strong>
          <button onClick={() => copy(JSON.stringify(sections, null, 2))}><Clipboard size={15} /> Copiar mapa</button>
          <button onClick={() => dl('apex-platform-map.json', JSON.stringify(sections, null, 2))}><Download size={15} /> Exportar JSON</button>
        </div>
      </aside>

      <div className="contracts-main">
        {visible.map(sec => (
          <div key={sec.id} className="contracts-card" style={{ marginBottom: 12 }}>
            <div className="contracts-section-head">
              <strong><BookOpen size={15} style={{ marginRight: 6 }} />{sec.title}</strong>
              <span>{sec.features.length} item(ns)</span>
            </div>
            <p style={{ margin: '8px 0 14px', color: 'rgba(226,232,240,0.78)', lineHeight: 1.5, fontSize: 13 }}>{sec.summary}</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {sec.features.map(f => (
                <details key={f.name} open={!!q}>
                  <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{f.name}</span>
                    <span className={`status-chip ${f.status}`}>{statusLabel(f.status)}</span>
                  </summary>
                  <div style={{ marginTop: 10, display: 'grid', gap: 6, fontSize: 13 }}>
                    <div><strong>O que faz:</strong> {f.summary}</div>
                    <div><strong>Comando:</strong> <code>{f.command}</code></div>
                    <div><strong>Entrega:</strong> {f.outputs.join(' · ')}</div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Provider Status ─────────────────────────────────────────────────────

function StatusTab() {
  const [data, setData] = useState<ProviderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true); setErr(null)
    try {
      const r = await fetch('/api/copilot/provider-status')
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setData(await r.json())
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Falha ao carregar status.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    refresh()
    const t = window.setInterval(refresh, 60_000)
    return () => window.clearInterval(t)
  }, [refresh])

  const attention = data?.providers.filter(p => p.status === 'needs-topup' || p.status === 'error') ?? []
  const warns = data?.providers.filter(p => p.status === 'warning') ?? []

  return (
    <div className="contracts-layout">
      <aside className="contracts-controls">
        {/* Overall summary */}
        {data && (
          <div className="contracts-card" style={{
            background: data.summary.overallStatus === 'ok' ? '#22c55e11' : '#ef444411',
            borderColor: data.summary.overallStatus === 'ok' ? '#22c55e33' : '#ef444433',
          }}>
            <strong style={{ color: data.summary.overallStatus === 'ok' ? '#22c55e' : '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
              <StatusIcon s={data.summary.overallStatus === 'ok' ? 'ok' : 'needs-topup'} size={14} />
              {data.summary.overallStatus === 'ok' ? 'Plataforma saudável' : 'Atenção necessária'}
            </strong>
            <ul style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12 }}>
              <li>✅ {data.summary.healthy} provedores OK</li>
              {data.summary.needsAttention > 0 && <li>🔴 {data.summary.needsAttention} precisam de ação</li>}
              {warns.length > 0 && <li>🟡 {warns.length} com aviso</li>}
              {data.summary.unconfigured > 0 && <li>⚫ {data.summary.unconfigured} não configurados</li>}
            </ul>
            <p style={{ fontSize: 11, marginTop: 8, color: '#64748b' }}>Verificado às {fmt(data.checkedAt)}</p>
          </div>
        )}

        {/* Needs attention */}
        {attention.length > 0 && (
          <div className="contracts-card" style={{ borderColor: '#ef444433' }}>
            <strong style={{ color: '#ef4444' }}>🔴 Ação necessária</strong>
            <ul style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {attention.map(p => (
                <li key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontWeight: 600, fontSize: 12 }}>{p.name}</span>
                  <span style={{ fontSize: 11, color: '#ef4444' }}>{p.message}</span>
                  {p.topUpUrl && (
                    <a href={p.topUpUrl} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <ExternalLink size={10} /> Recarregar agora
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Refresh */}
        <div className="contracts-card">
          <strong>Controles</strong>
          <button className="contracts-primary" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? ' Verificando...' : ' Atualizar agora'}
          </button>
          <p style={{ fontSize: 11, marginTop: 8, color: '#64748b' }}>Auto-refresh a cada 60s.</p>
        </div>

        {err && (
          <div className="contracts-card" style={{ borderColor: '#ef444433' }}>
            <strong style={{ color: '#ef4444' }}>Erro</strong>
            <p style={{ fontSize: 12, marginTop: 4 }}>{err}</p>
          </div>
        )}
      </aside>

      <div className="contracts-main">
        <div className="contracts-card contracts-table-card">
          <div className="contracts-section-head">
            <strong>Todos os provedores</strong>
            <span>{data?.providers.length ?? '—'}</span>
          </div>

          {data ? (
            <div className="contracts-table-wrap">
              <table className="contracts-table">
                <thead>
                  <tr>
                    <th>Provedor</th>
                    <th>Status</th>
                    <th>Saldo / Informação</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {data.providers.map(p => (
                    <tr key={p.id} style={{ background: p.status === 'needs-topup' || p.status === 'error' ? '#ef444408' : undefined }}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</td>
                      <td><Badge s={p.status} /></td>
                      <td style={{ fontSize: 12, color: '#94a3b8', maxWidth: 280 }}>
                        {p.balance && <span style={{ fontWeight: 600, color: p.status === 'ok' ? '#22c55e' : '#f59e0b' }}>{p.balance} — </span>}
                        {p.message}
                      </td>
                      <td>
                        {p.topUpUrl && (p.status !== 'ok') ? (
                          <a href={p.topUpUrl} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: '#3b82f6', display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
                            <ExternalLink size={10} />
                            {p.status === 'needs-topup' ? 'Recarregar' : p.status === 'unconfigured' ? 'Configurar' : 'Dashboard'}
                          </a>
                        ) : <span style={{ fontSize: 11, color: '#475569' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
              {loading ? 'Verificando provedores...' : 'Nenhum dado.'}
            </div>
          )}
        </div>

        <div className="contracts-card" style={{ marginTop: 12 }}>
          <strong style={{ fontSize: 12 }}>O que é monitorado</strong>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 6, lineHeight: 1.6 }}>
            Gemini Genuíno · fal.ai · ElevenLabs · Brave Search · Stripe · Supabase · GitHub · AuthKey · FFmpeg local
            <br />Cada check faz uma chamada real à API para verificar chave, saldo e quota.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Manual do Usuário ───────────────────────────────────────────────────

function ManualTab() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const sections = useMemo(() => getManualSections(), [])
  const q = search.trim().toLowerCase()

  const visible = sections
    .map(sec => ({
      ...sec,
      items: sec.items.filter(i => !q
        || i.name.toLowerCase().includes(q)
        || i.description.toLowerCase().includes(q)
        || i.howToUse.toLowerCase().includes(q)
        || sec.title.toLowerCase().includes(q)),
    }))
    .filter(sec => sec.items.length > 0)

  return (
    <div className="contracts-layout">
      <aside className="contracts-controls">
        <div className="contracts-card">
          <strong>Buscar</strong>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Search size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ex: orçamento, contrato, vídeo..." />
          </div>
        </div>
        <div className="contracts-card">
          <strong>Sobre este manual</strong>
          <p style={{ margin: '8px 0 0', color: 'rgba(226,232,240,0.78)', lineHeight: 1.5, fontSize: 12 }}>
            Este manual descreve <strong>tudo que a Apex AI faz</strong> em linguagem simples.
            Cada funcionalidade pode ser acessada pelo chat — é só pedir.
            <br /><br />
            <span style={{ color: '#22c55e' }}>🟢 Todos</span> = disponível para qualquer usuário<br />
            <span style={{ color: '#3b82f6' }}>🔵 Clientes</span> = disponível para clientes pagantes<br />
            <span style={{ color: '#ef4444' }}>🔴 Owner</span> = apenas o dono da plataforma
          </p>
        </div>
        <div className="contracts-card">
          <strong>Dica</strong>
          <p style={{ margin: '8px 0 0', color: 'rgba(226,232,240,0.78)', lineHeight: 1.5, fontSize: 12 }}>
            Você não precisa de botões. <strong>Peça no chat</strong> exatamente o que precisa.
            Se quiser um painel visual, é só pedir "abrir [funcionalidade]".
          </p>
        </div>
      </aside>

      <div className="contracts-main">
        {visible.map(sec => (
          <div key={sec.id} className="contracts-card" style={{ marginBottom: 12 }}>
            <div className="contracts-section-head">
              <strong>{sec.icon} {sec.title}</strong>
              <span>{sec.items.length} item(ns)</span>
            </div>
            <p style={{ margin: '8px 0 14px', color: 'rgba(226,232,240,0.78)', lineHeight: 1.5, fontSize: 13 }}>{sec.summary}</p>
            <div style={{ display: 'grid', gap: 10 }}>
              {sec.items.map(item => (
                <details
                  key={item.name}
                  open={expanded === item.name}
                  onToggle={e => setExpanded(e.currentTarget.open ? item.name : null)}
                >
                  <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 12, textTransform: 'uppercase',
                      background: item.availableTo === 'owner' ? '#ef444422' : item.availableTo === 'clientes' ? '#3b82f622' : '#22c55e22',
                      color: item.availableTo === 'owner' ? '#ef4444' : item.availableTo === 'clientes' ? '#3b82f6' : '#22c55e',
                    }}>
                      {item.availableTo === 'owner' ? '🔴 Owner' : item.availableTo === 'clientes' ? '🔵 Clientes' : '🟢 Todos'}
                    </span>
                  </summary>
                  <div style={{ marginTop: 10, display: 'grid', gap: 8, fontSize: 13 }}>
                    <div style={{ lineHeight: 1.6, color: 'rgba(226,232,240,0.85)' }}>{item.description}</div>
                    <div style={{ background: 'rgba(59,130,246,0.08)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #3b82f6' }}>
                      <strong style={{ fontSize: 11, color: '#93c5fd' }}>📖 Como usar:</strong>
                      <div style={{ marginTop: 4, fontSize: 12, color: 'rgba(226,232,240,0.78)' }}>{item.howToUse}</div>
                    </div>
                    <div style={{ background: 'rgba(251,191,36,0.08)', padding: '8px 12px', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
                      <strong style={{ fontSize: 11, color: '#fcd34d' }}>💡 Exemplo:</strong>
                      <code style={{ display: 'block', marginTop: 4, fontSize: 12, color: '#fde68a' }}>{item.example}</code>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
            <p>Nenhum resultado para "{search}"</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

type Tab = 'map' | 'status' | 'manual'

export function PlatformMapPanel({ onClear }: Props) {
  const [tab, setTab] = useState<Tab>('map')

  return (
    <section className="contracts-studio" aria-label="Platform Map">
      <div className="contracts-heading">
        <div>
          <span>
            {tab === 'map' ? <><Compass size={16} /> Platform Map</> : tab === 'status' ? <><Activity size={16} /> Status ao Vivo</> : <><BookOpen size={16} /> Manual do Usuário</>}
          </span>
          <h2>{tab === 'map' ? 'Manual interativo da plataforma' : tab === 'status' ? 'Provedores e chaves de API' : '📖 Manual do Usuário'}</h2>
          <p>
            {tab === 'map'
              ? 'Mapa navegável de todas as funcionalidades — comando, status e entrega de cada módulo.'
              : tab === 'status'
                ? 'Status real de cada provedor pago. Indica quando precisa recarregar créditos.'
                : 'Tudo que a Apex AI faz, explicado em linguagem simples. Clientes pagantes podem usar tudo.'}
          </p>
        </div>
        <button className="ghost-action" onClick={onClear}><X size={16} /></button>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, padding: '0 20px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4 }}>
        {(['manual', 'map', 'status'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: tab === t ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: tab === t ? '#e2e8f0' : '#64748b',
              border: tab === t ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {t === 'manual' ? '📖 Manual' : t === 'map' ? '🗺️ Mapa' : '🔑 Status'}
          </button>
        ))}
      </div>

      {tab === 'manual' ? <ManualTab /> : tab === 'map' ? <MapTab onClear={onClear} /> : <StatusTab />}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </section>
  )
}
