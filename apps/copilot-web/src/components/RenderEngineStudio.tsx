import { useState } from 'react'
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Trash2,
  RefreshCw,
  Maximize2
} from 'lucide-react'

// --- Types ---
type GeneratedImage = {
  id: string
  imageUrl: string
  prompt: string
  style: string
  aspectRatio: string
  timestamp: string
}

type RenderEngineProps = {
  conversationContext?: string[]
}

// --- Design Tokens ---
const T = {
  bg: '#0b1326',
  surface: '#131b2e',
  surfaceContainer: '#171f33',
  primary: '#2563eb',
  onPrimary: '#eeefff',
  border: 'rgba(255, 255, 255, 0.1)',
  text: '#f8fafc',
  textMuted: '#94a3b8'
}

export function RenderEngineStudio({ conversationContext }: RenderEngineProps) {
  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [style, setStyle] = useState('photorealistic')
  const [aspectRatio, setAspectRatio] = useState('16:9') // landscape by default
  const [isGenerating, setIsGenerating] = useState(false)
  const [gallery, setGallery] = useState<GeneratedImage[]>([])
  const [activeImageId, setActiveImageId] = useState<string | null>(null)
  
  const activeImage = gallery.find(img => img.id === activeImageId) || gallery[0]

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    
    setIsGenerating(true)
    try {
      const res = await fetch('/api/copilot/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          negativePrompt,
          imageSize: aspectRatio === '16:9' ? 'landscape_16_9' : aspectRatio === '9:16' ? 'portrait_4_3' : 'square_hd',
          mode: 'text-to-image',
          promptStyle: style
        })
      })
      
      const data = await res.json()
      if (data.images && data.images.length > 0) {
        const newImage: GeneratedImage = {
          id: Math.random().toString(36).substring(2, 9),
          imageUrl: data.images[0].imageUrl,
          prompt,
          style,
          aspectRatio,
          timestamp: new Date().toISOString()
        }
        setGallery(prev => [newImage, ...prev])
        setActiveImageId(newImage.id)
      } else {
        alert(data.message || 'Erro ao gerar a imagem.')
      }
    } catch (err) {
      console.error(err)
      alert('Erro de comunicação com o Render Engine.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDelete = (id: string) => {
    setGallery(prev => prev.filter(img => img.id !== id))
    if (activeImageId === id) setActiveImageId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: T.bg, color: T.text, overflow: 'hidden' }}>
      {/* HEADER */}
      <header style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', padding: '10px', borderRadius: '12px' }}>
          <Sparkles size={24} color="#fff" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Apex Render Engine</h2>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: T.textMuted }}>Geração de imagens fotorrealistas e volumetrias arquitetônicas</p>
        </div>
      </header>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        
        {/* LEFT COLUMN: Controls */}
        <div style={{ width: '400px', borderRight: `1px solid ${T.border}`, padding: '24px', overflowY: 'auto', background: T.surfaceContainer }}>
          
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: T.textMuted, marginBottom: '8px' }}>PROMPT POSITIVO</label>
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Descreva a imagem que deseja gerar..."
              style={{ width: '100%', height: '120px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '12px', color: T.text, fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: T.textMuted, marginBottom: '8px' }}>PROMPT NEGATIVO</label>
            <textarea 
              value={negativePrompt}
              onChange={e => setNegativePrompt(e.target.value)}
              placeholder="O que você NÃO quer na imagem (ex: pessoas, carros, borrão)"
              style={{ width: '100%', height: '80px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '12px', color: T.text, fontSize: '14px', resize: 'vertical' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: T.textMuted, marginBottom: '8px' }}>ESTILO ARQUITETÔNICO</label>
            <select value={style} onChange={e => setStyle(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px', color: T.text, fontSize: '14px' }}>
              <option value="photorealistic">Fotorrealista (Padrão)</option>
              <option value="cinematic">Cinemático / Dramático</option>
              <option value="technical">Render Técnico / Maquete</option>
              <option value="sketch">Sketch / Esboço a Mão</option>
              <option value="interior">Design de Interiores</option>
            </select>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: T.textMuted, marginBottom: '8px' }}>PROPORÇÃO (ASPECT RATIO)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['1:1', '16:9', '9:16'].map(ar => (
                <button 
                  key={ar}
                  onClick={() => setAspectRatio(ar)}
                  style={{ flex: 1, padding: '10px', background: aspectRatio === ar ? T.primary : T.surface, border: `1px solid ${aspectRatio === ar ? T.primary : T.border}`, borderRadius: '8px', color: '#fff', cursor: 'pointer', transition: '0.2s' }}
                >
                  {ar}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            style={{ width: '100%', padding: '14px', background: isGenerating ? T.surface : 'linear-gradient(135deg, #06b6d4, #3b82f6)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 600, cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isGenerating ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={18} />}
            {isGenerating ? 'Gerando Imagem (FAL.ai)...' : 'Gerar Imagem'}
          </button>
          
        </div>

        {/* RIGHT COLUMN: Output Preview & Gallery */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#030712' }}>
          
          {/* Main Viewer */}
          <div style={{ flex: 1, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {activeImage ? (
              <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
                <img src={activeImage.imageUrl} alt={activeImage.prompt} style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', objectFit: 'contain' }} />
                
                {/* Actions overlay */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px' }}>
                  <button onClick={() => window.open(activeImage.imageUrl, '_blank')} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}>
                    <Maximize2 size={18} />
                  </button>
                  <a href={activeImage.imageUrl} download={`apex-render-${activeImage.id}.jpg`} target="_blank" rel="noreferrer" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '8px', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'inline-flex' }}>
                    <Download size={18} />
                  </a>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: T.textMuted }}>
                <ImageIcon size={64} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                <p style={{ fontSize: '16px' }}>Nenhuma imagem gerada ainda.</p>
                <p style={{ fontSize: '13px', opacity: 0.7 }}>Ajuste os parâmetros à esquerda e clique em Gerar Imagem.</p>
              </div>
            )}
          </div>

          {/* Gallery Filmstrip */}
          {gallery.length > 0 && (
            <div style={{ height: '140px', background: T.surfaceContainer, borderTop: `1px solid ${T.border}`, padding: '16px', display: 'flex', gap: '12px', overflowX: 'auto' }}>
              {gallery.map(img => (
                <div 
                  key={img.id} 
                  onClick={() => setActiveImageId(img.id)}
                  style={{ width: '160px', minWidth: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', border: activeImageId === img.id ? `2px solid ${T.primary}` : '2px solid transparent', position: 'relative' }}
                >
                  <img src={img.imageUrl} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '4px', padding: '4px', color: '#fff', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

    </div>
  )
}

export default RenderEngineStudio
