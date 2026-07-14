import React, { useState } from 'react';
import { Download, Bot, Settings, ChevronRight, Activity, Zap } from 'lucide-react';

interface AccountsPortalProps {
  email?: string;
}

export function AccountsPortal({ email }: AccountsPortalProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    // Simula o download do ZIP release da esteira CI/CD
    setTimeout(() => {
      window.location.href = 'https://github.com/Apex-Global-LLC/apex-ai-copilot-platform/releases/latest/download/redesim-automation.zip';
      setDownloading(false);
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#050c1a',
      color: '#e2e8f0',
      fontFamily: 'Inter, sans-serif',
      padding: '40px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: 900 }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)', padding: 12, borderRadius: 12 }}>
              <Bot size={28} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' }}>Apex AI Accounts</h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>Portal do Cliente</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <span style={{ fontSize: 13, color: '#cbd5e1' }}>{email || 'Conectado'}</span>
          </div>
        </header>

        {/* Status / Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
          <div style={{ background: '#0b1326', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Activity size={20} color="#3b82f6" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Plano Ativo</h3>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Enterprise</div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>Automação Ilimitada de Contabilidade</p>
          </div>
          
          <div style={{ background: '#0b1326', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Zap size={20} color="#10b981" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Status do Robô</h3>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#10b981' }}>Online</div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>API e Webhooks Sincronizados</p>
          </div>
        </div>

        {/* Extensions List */}
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          Ferramentas e Extensões
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Extension Card 1 */}
          <div style={{ 
            background: 'linear-gradient(to right, rgba(37,99,235,0.05), rgba(11,19,38,0.5))', 
            border: '1px solid rgba(37,99,235,0.2)', 
            borderRadius: 16, 
            padding: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 24
          }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={32} color="#60a5fa" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12 }}>
                  Automação REDESIM & Junta Comercial
                  <span style={{ fontSize: 11, background: '#2563eb', color: '#fff', padding: '2px 8px', borderRadius: 12, fontWeight: 500 }}>v1.0.0</span>
                </h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: 14, maxWidth: 500, lineHeight: 1.5 }}>
                  Instale a extensão oficial no Chrome. O robô irá puxar os dados do contrato social do seu ERP automaticamente e preencher os DBEs nos sites governamentais, avisando via Webhook quando finalizar.
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleDownload}
              disabled={downloading}
              style={{
                background: downloading ? '#1e293b' : '#2563eb',
                color: downloading ? '#94a3b8' : '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 600,
                cursor: downloading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s'
              }}
            >
              {downloading ? 'Gerando pacote...' : (
                <>
                  <Download size={18} />
                  Baixar Extensão (.zip)
                </>
              )}
            </button>
          </div>
          
          {/* Upcoming Card */}
          <div style={{ 
            background: '#0b1326', 
            border: '1px dashed #1e293b', 
            borderRadius: 16, 
            padding: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            opacity: 0.6
          }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'transparent', border: '1px dashed #334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={32} color="#64748b" />
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 600 }}>
                  Automação e-CAC & Receita Federal
                </h3>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: 14 }}>Em breve. Conectores em desenvolvimento.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: 60, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
          <p>Apex AI Copilot Platform &copy; 2026. Todos os direitos reservados.</p>
          <a href="/" style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
            Voltar ao Painel Principal <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
