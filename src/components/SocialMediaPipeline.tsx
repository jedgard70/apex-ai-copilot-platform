import { useEffect, useState } from 'react'
import { Megaphone, Plus, RefreshCw, X, Download, Image, Video, FileText, Linkedin, Globe, CheckCircle, Clock, AlertCircle, Sparkles } from 'lucide-react'

type Campaign = {
  id: string; product: string; theme: string; description: string; status: string
  createdAt: string; generated: boolean
  plan: any; content: { images: any[]; videos: any[]; carousels: any[]; posts: any[]; ads: any[] }
}

export function SocialMediaPipeline({ onClear }: { onClear: () => void }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [selected, setSelected] = useState<Campaign | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ product: '', theme: '', description: '', targetAudience: '' })

  async function fetchCampaigns() {
    setLoading(true)
    try {
      const res = await fetch('/api/social/campaigns')
      const d = await res.json()
      if (d.campaigns) setCampaigns(d.campaigns)
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCampaigns() }, [])

  async function createCampaign() {
    if (!form.product) { setMessage('Produto obrigatorio'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/social/campaign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setShowForm(false); setForm({ product: '', theme: '', description: '', targetAudience: '' })
        setMessage('Campanha criada! Clique em "Gerar Conteudo" para produzir as artes.')
        await fetchCampaigns()
      }
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setLoading(false) }
  }

  async function generateContent(id: string) {
    setGenerating(id)
    setMessage('Gerando imagens e conteudo... (pode levar alguns segundos)')
    try {
      const res = await fetch(`/api/social/generate/${id}`, { method: 'POST' })
      const d = await res.json()
      if (d.content) {
        setMessage(`✅ Conteudo gerado! ${d.content.images?.length || 0} imagens, ${d.content.carousels?.length || 0} carrosseis, ${d.content.posts?.length || 0} posts, ${d.content.ads?.length || 0} ads`)
        await fetchCampaigns()
      } else {
        setMessage(`⚠️ ${d.message || 'Geracao incompleta'}`)
      }
    } catch (err) { setMessage(`Erro: ${err instanceof Error ? err.message : 'unknown'}`) }
    finally { setGenerating(null) }
  }

  function selectCampaign(c: Campaign) {
    setSelected(selected?.id === c.id ? null : c)
  }

  function statusIcon(status: string) {
    if (status === 'generated' || status === 'done') return <CheckCircle size={14} color="#10b981" />
    if (status === 'generating') return <Clock size={14} color="#f59e0b" />
    return <AlertCircle size={14} color="#6b7280" />
  }

  return (
    <section style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', overflow: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Megaphone size={14} style={{ display: 'inline' }} /> Marketing & Social Media
          </span>
          <h2 style={{ margin: '4px 0', fontSize: '16px' }}>Pipeline de Conteudo</h2>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: 0 }}>Cria plano, imagens, carrosseis, posts e ads para qualquer produto</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => setShowForm(!showForm)} disabled={loading}>
            <Plus size={15} /> {showForm ? 'Cancelar' : 'Nova Campanha'}
          </button>
          <button onClick={fetchCampaigns} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin-icon' : ''} />
          </button>
          <button className="ghost-action" onClick={onClear}><X size={16} /></button>
        </div>
      </div>

      {message && <div className="business-alert"><span>{message}</span></div>}

      {/* New campaign form */}
      {showForm && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px',
          background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <input value={form.product} onChange={e => setForm(p => ({ ...p, product: e.target.value }))}
            placeholder="Produto/Servico *" style={inp} />
          <input value={form.theme} onChange={e => setForm(p => ({ ...p, theme: e.target.value }))}
            placeholder="Tema (ex: l绿色发展)" style={inp} />
          <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            placeholder="Descricao do produto/servico" style={{ ...inp, gridColumn: '1 / -1', minHeight: '60px' }} />
          <input value={form.targetAudience} onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))}
            placeholder="Publico-alvo (ex: engenheiros, construtoras)" style={{ ...inp, gridColumn: '1 / -1' }} />
          <button onClick={createCampaign} disabled={loading || !form.product}
            style={{ gridColumn: '1 / -1', padding: '10px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '13px' }}>
            {loading ? 'Criando...' : 'Criar Campanha e Plano'}
          </button>
        </div>
      )}

      {/* Campaign list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {campaigns.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
            <Megaphone size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>Nenhuma campanha ainda. Crie uma nova campanha para comecar.</p>
          </div>
        )}

        {campaigns.map(camp => (
          <div key={camp.id} onClick={() => selectCampaign(camp)}
            style={{
              padding: '12px', borderRadius: '8px', cursor: 'pointer',
              background: selected?.id === camp.id ? '#fffbeb' : '#fff',
              border: `1px solid ${selected?.id === camp.id ? '#fde68a' : '#e5e7eb'}`,
              transition: 'all 0.15s',
            }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {statusIcon(camp.status)}
                <strong style={{ fontSize: '13px' }}>{camp.product}</strong>
                {camp.theme && <span style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>{camp.theme}</span>}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {!camp.generated ? (
                  <button onClick={e => { e.stopPropagation(); generateContent(camp.id) }}
                    disabled={generating === camp.id}
                    style={{ padding: '4px 10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                    <Sparkles size={12} style={{ display: 'inline' }} /> {generating === camp.id ? 'Gerando...' : 'Gerar Conteudo'}
                  </button>
                ) : (
                  <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                    <CheckCircle size={12} style={{ display: 'inline' }} /> Pronto
                  </span>
                )}
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'flex', gap: '12px' }}>
              <span>📅 {new Date(camp.createdAt).toLocaleDateString('pt-BR')}</span>
              {camp.content?.images?.length > 0 && <span>🖼️ {camp.content.images.length} imagens</span>}
              {camp.content?.posts?.length > 0 && <span>📝 {camp.content.posts.length} posts</span>}
              {camp.content?.ads?.length > 0 && <span>📊 {camp.content.ads.length} ads</span>}
            </div>

            {/* Expanded detail */}
            {selected?.id === camp.id && camp.plan && (
              <div style={{ marginTop: '12px', borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                {/* Plan */}
                <div style={{ marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 6px' }}>📋 Plano de Marketing</h4>
                  <p style={{ fontSize: '11px', color: '#6b7280', lineHeight: '1.5' }}>{camp.plan.summary}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {camp.plan.platforms?.map((p: any) => (
                      <span key={p.name} style={{ padding: '3px 8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Generated images / carousel preview */}
                {camp.generated && camp.content?.images?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 6px' }}>
                      <Image size={12} style={{ display: 'inline' }} /> Imagens Geradas ({camp.content.images.length})
                    </h4>
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {camp.content.images.map((img: any, i: number) => (
                        <div key={i} style={{ flexShrink: 0, width: '100px', height: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #e5e7eb', position: 'relative' }}>
                          <img src={img.url} alt={`Slide ${img.slide}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '3px' }}>
                            {img.slide}/{camp.content.images.length}
                          </span>
                          <a href={img.url} target="_blank" download
                            style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px', borderRadius: '3px', cursor: 'pointer', display: 'inline-flex' }}>
                            <Download size={10} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Carousel ready */}
                {camp.generated && camp.content?.carousels?.length > 0 && (
                  <div style={{ marginBottom: '12px', padding: '8px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 4px', color: '#059669' }}>
                      ✅ Carrossel Instagram/Facebook Pronto
                    </h4>
                    <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 6px' }}>
                      {camp.content.carousels[0].slides.length} slides · Legenda e hashtags prontas
                    </p>
                    <button onClick={() => {
                      const text = camp.content.carousels[0].caption
                      navigator.clipboard.writeText(text).catch(() => {})
                      setMessage('Legenda copiada!')
                    }} style={{ padding: '4px 10px', background: '#059669', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>
                      Copiar Legenda
                    </button>
                  </div>
                )}

                {/* LinkedIn post */}
                {camp.generated && camp.content?.posts?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 6px' }}>
                      <Linkedin size={12} style={{ display: 'inline' }} /> Post LinkedIn
                    </h4>
                    <div style={{ fontSize: '11px', color: '#374151', background: '#f9fafb', padding: '8px', borderRadius: '6px', whiteSpace: 'pre-wrap', maxHeight: '100px', overflow: 'auto' }}>
                      {camp.content.posts[0].body?.slice(0, 300)}...
                    </div>
                    <button onClick={() => {
                      navigator.clipboard.writeText(camp.content.posts[0].body || '').catch(() => {})
                      setMessage('Post copiado!')
                    }} style={{ marginTop: '4px', padding: '4px 10px', background: '#0a66c2', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>
                      Copiar Post LinkedIn
                    </button>
                  </div>
                )}

                {/* Google Ads */}
                {camp.generated && camp.content?.ads?.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 700, margin: '0 0 6px' }}>
                      <Globe size={12} style={{ display: 'inline' }} /> Google Ads (rascunho)
                    </h4>
                    <div style={{ background: '#f9fafb', padding: '8px', borderRadius: '6px', fontSize: '11px' }}>
                      <div><strong>Campanha:</strong> {camp.content.ads[0].campaignName}</div>
                      <div><strong>Headlines:</strong> {camp.content.ads[0].headlines?.join(' · ')}</div>
                      <div><strong>Palavras-chave:</strong> {camp.content.ads[0].keywords?.join(', ')}</div>
                      <div><strong>Status:</strong> <span style={{ color: '#f59e0b' }}>{camp.content.ads[0].status}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin-icon { animation: spin 1s linear infinite; }`}</style>
    </section>
  )
}

const inp: React.CSSProperties = { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }
