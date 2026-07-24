import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '../lib/supabaseClient';
import { PremiumPanelLayout } from './PremiumPanelLayout';
import { Calendar, CheckCircle, Clock, Edit3, Image as ImageIcon, Send, X, AlertTriangle } from 'lucide-react';

type SocialPost = {
  id: string;
  campaign_type: 'construtora' | 'ebook';
  platform: 'instagram' | 'facebook';
  content: string;
  media_url?: string;
  media_type?: string;
  scheduled_at: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  error_log?: any;
};

type Props = {
  onClose: () => void;
};

export function MarketingSalesPanel({ onClose }: Props) {
  const { client: supabase } = getBrowserSupabaseClient();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrafting, setIsDrafting] = useState(false);
  
  // Form state
  const [campaignType, setCampaignType] = useState<'construtora' | 'ebook'>('construtora');
  const [platform, setPlatform] = useState<'instagram' | 'facebook'>('instagram');
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    setLoading(true);
    if (!supabase) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .order('scheduled_at', { ascending: true });
    
    if (!error && data) setPosts(data);
    setLoading(false);
  }

  async function handleMediaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploadingMedia(true);
    
    // Upload to Supabase Storage (assuming bucket 'media')
    if (!supabase) return;
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('media')
      .upload(`marketing/${fileName}`, file);
      
    if (error) {
      alert('Erro no upload: ' + error.message);
    } else if (data) {
      const { data: publicData } = supabase.storage.from('media').getPublicUrl(data.path);
      setMediaUrl(publicData.publicUrl);
    }
    setUploadingMedia(false);
  }

  async function handleCreateDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!content || !scheduledAt || !supabase) return;
    
    const { error } = await supabase
      .from('social_posts')
      .insert({
        campaign_type: campaignType,
        platform,
        content,
        media_url: mediaUrl || null,
        scheduled_at: new Date(scheduledAt).toISOString(),
        status: 'draft' // ALL posts start as draft pending approval (Rule E)
      });
      
    if (error) alert('Erro ao criar draft: ' + error.message);
    else {
      setIsDrafting(false);
      setContent('');
      setMediaUrl('');
      fetchPosts();
    }
  }

  async function approvePost(id: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('social_posts')
      .update({ status: 'scheduled' })
      .eq('id', id);
      
    if (error) alert('Erro ao aprovar: ' + error.message);
    else fetchPosts();
  }

  const drafts = posts.filter(p => p.status === 'draft');
  const scheduled = posts.filter(p => p.status === 'scheduled');
  const history = posts.filter(p => p.status === 'published' || p.status === 'failed');

  return (
    <PremiumPanelLayout
      title="Marketing & Vendas"
      subtitle="Agendamento Meta API e Automação de Campanha"
      icon={<Send size={16} />}
      headerActions={
        <button className="ghost-action" onClick={onClose}><X size={16} /></button>
      }
    >
      <div className="contracts-layout" style={{ flex: 1 }}>
        <aside className="contracts-controls">
          <div className="contracts-card">
            <strong>Controles Operacionais</strong>
            <button className="contracts-primary" onClick={() => setIsDrafting(!isDrafting)}>
              {isDrafting ? 'Ver Painel Geral' : '+ Novo Post (Draft)'}
            </button>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>
              ⚠️ Todos os agendamentos nascem como rascunhos. O Owner deve aprovar manualmente para que entrem na fila do Agente.
            </p>
          </div>
        </aside>

        <div className="contracts-main">
          {isDrafting ? (
            <div className="contracts-card">
              <div className="contracts-section-head">
                <strong><Edit3 size={14} /> Criar Novo Rascunho</strong>
              </div>
              <form onSubmit={handleCreateDraft} style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <label style={{ flex: 1 }}>
                    <span>Campanha</span>
                    <select value={campaignType} onChange={e => setCampaignType(e.target.value as any)}>
                      <option value="construtora">Apex Construtora (Serviços)</option>
                      <option value="ebook">eBook (Hotmart)</option>
                    </select>
                  </label>
                  <label style={{ flex: 1 }}>
                    <span>Plataforma</span>
                    <select value={platform} onChange={e => setPlatform(e.target.value as any)}>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </label>
                </div>
                
                <label>
                  <span>Data e Hora de Agendamento (Sua aprovação será requerida depois)</span>
                  <input type="datetime-local" required value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                </label>

                <label>
                  <span>Texto da Publicação</span>
                  <textarea required rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="Escreva a legenda..." />
                </label>

                <div style={{ padding: 12, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, display: 'block', marginBottom: 8 }}><ImageIcon size={12} /> Mídia (Opcional)</span>
                  <input type="file" accept="image/*,video/*" onChange={handleMediaUpload} disabled={uploadingMedia} />
                  {uploadingMedia && <span style={{ fontSize: 12, color: '#3b82f6' }}> Fazendo upload para Supabase Storage...</span>}
                  {mediaUrl && <div style={{ marginTop: 8 }}><img src={mediaUrl} alt="Preview" style={{ height: 60, borderRadius: 4 }} /></div>}
                </div>

                <button type="submit" className="contracts-primary" style={{ marginTop: 10 }}>Salvar como Draft</button>
              </form>
            </div>
          ) : (
            <>
              {loading && <p>Carregando dados da fila...</p>}
              
              <div className="contracts-card" style={{ borderColor: 'rgba(234, 179, 8, 0.4)' }}>
                <div className="contracts-section-head">
                  <strong><AlertTriangle size={14} color="#eab308" /> Pendente de Aprovação (Drafts)</strong>
                  <span>{drafts.length}</span>
                </div>
                {drafts.length === 0 ? <p style={{ fontSize: 13, color: '#64748b' }}>Nenhum rascunho pendente.</p> : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {drafts.map(p => (
                      <div key={p.id} style={{ background: 'rgba(234, 179, 8, 0.05)', padding: 12, borderRadius: 8, border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <span style={{ fontSize: 10, background: '#334155', padding: '2px 6px', borderRadius: 4, marginRight: 6, textTransform: 'uppercase' }}>{p.campaign_type}</span>
                            <span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(p.scheduled_at).toLocaleString()}</span>
                          </div>
                          <button 
                            onClick={() => approvePost(p.id)}
                            style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 'bold' }}
                          >
                            <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }}/>
                            Aprovar e Enviar p/ Agente
                          </button>
                        </div>
                        <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: 0 }}>{p.content}</p>
                        {p.media_url && <img src={p.media_url} alt="Media" style={{ height: 40, marginTop: 8, borderRadius: 4 }} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="contracts-card" style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                <div className="contracts-section-head">
                  <strong><Clock size={14} color="#3b82f6" /> Fila do Agente (Scheduled)</strong>
                  <span>{scheduled.length}</span>
                </div>
                {scheduled.length === 0 ? <p style={{ fontSize: 13, color: '#64748b' }}>Fila vazia.</p> : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {scheduled.map(p => (
                      <div key={p.id} style={{ background: 'rgba(59, 130, 246, 0.05)', padding: 12, borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <span style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 }}>Agendado para: {new Date(p.scheduled_at).toLocaleString()}</span>
                        <p style={{ fontSize: 13, whiteSpace: 'pre-wrap', margin: 0, opacity: 0.8 }}>{p.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
            </>
          )}
        </div>
      </div>
    </PremiumPanelLayout>
  );
}
