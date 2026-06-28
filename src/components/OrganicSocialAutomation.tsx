import React, { useState } from 'react';
import { MetaGraphService } from '../services/MetaGraphService';

export function OrganicSocialAutomation() {
  const [accessToken, setAccessToken] = useState('');
  const [igUserId, setIgUserId] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1000');
  const [caption, setCaption] = useState('Planta humanizada gerada pela Apex AI Copilot. #arquitetura #engenharia #ia');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null);

  const handlePublish = async () => {
    if (!accessToken || !igUserId || !imageUrl) {
      setResult({ success: false, message: 'Preencha o Token, o ID da conta e a URL da imagem.' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const response = await MetaGraphService.publishInstagramPost({
        accessToken,
        igUserId,
        caption,
        imageUrl
      });
      if (response.success) {
        setResult({ success: true, message: `Sucesso! Post criado. ID: ${response.id}` });
      } else {
        setResult({ success: false, message: `Falha: ${response.error}` });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Erro inesperado' });
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#16213e] rounded-xl border border-white/5 overflow-hidden flex flex-col p-6 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="material-symbols-outlined text-[#6C47FF] text-3xl">hub</span>
        <div>
          <h3 className="text-xl font-semibold text-[#e2e2e2]">Automação Orgânica (Meta Graph API)</h3>
          <p className="text-[#c6c6ce] text-sm mt-1">Publique conteúdos gerados pela IA diretamente no Instagram/Facebook.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coluna 1: Configuração Segura */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#7e89ab] uppercase tracking-widest mb-1">Access Token (Chave Mestra)</label>
            <input 
              type="password"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="Cole o token gigante aqui..." 
              className="w-full bg-[#0B1221] border border-white/10 rounded-lg p-3 text-sm text-[#e2e2e2] focus:border-[#6C47FF] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#7e89ab] uppercase tracking-widest mb-1">Instagram Business Account ID</label>
            <input 
              type="text"
              value={igUserId}
              onChange={(e) => setIgUserId(e.target.value)}
              placeholder="ID numérico da conta IG..." 
              className="w-full bg-[#0B1221] border border-white/10 rounded-lg p-3 text-sm text-[#e2e2e2] focus:border-[#6C47FF] focus:outline-none"
            />
            <p className="text-[10px] text-[#c6c6ce] mt-1">Ex: 17841400000000000</p>
          </div>
        </div>

        {/* Coluna 2: Postagem */}
        <div className="space-y-4 bg-[#1C294A]/30 p-4 rounded-lg border border-white/5">
          <div>
            <label className="block text-xs font-bold text-[#7e89ab] uppercase tracking-widest mb-1">URL Pública da Mídia (Imagem/Vídeo)</label>
            <input 
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-[#0B1221] border border-white/10 rounded-lg p-2 text-sm text-[#e2e2e2] focus:border-[#6C47FF] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#7e89ab] uppercase tracking-widest mb-1">Copy (Legenda)</label>
            <textarea 
              rows={3}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-[#0B1221] border border-white/10 rounded-lg p-2 text-sm text-[#e2e2e2] focus:border-[#6C47FF] focus:outline-none resize-none"
            />
          </div>
          <button 
            onClick={handlePublish}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-[#6C47FF] to-[#9b51e0] rounded-lg text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">send</span>}
            {loading ? 'Disparando para o Instagram...' : 'Disparar Post Agora'}
          </button>

          {result && (
            <div className={`mt-3 p-3 rounded-lg text-xs font-bold ${result.success ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {result.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
