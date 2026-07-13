import React, { useEffect, useState } from 'react';
import { Network, Server, Zap, Lock, ShieldCheck, Database, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function IaIntegrationsPanel() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading telemetry
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const providers = [
    {
      id: 'gemini',
      name: 'Google Gemini',
      role: 'LLM Principal / Raciocínio (Regra 9)',
      status: 'operational',
      latency: '245ms',
      icon: <Network size={24} color="#3b82f6" />,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)'
    },
    {
      id: 'fal',
      name: 'FAL.ai',
      role: 'Geração de Imagens & Vídeo',
      status: 'operational',
      latency: '412ms',
      icon: <Zap size={24} color="#a855f7" />,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.1)'
    },
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      role: 'Síntese de Voz (TTS) / Clonagem',
      status: 'operational',
      latency: '180ms',
      icon: <Server size={24} color="#10b981" />,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)'
    },
    {
      id: 'internal',
      name: 'Infraestrutura Interna',
      role: 'Supabase / Firebase / Vertex',
      status: 'operational',
      latency: '45ms',
      icon: <Database size={24} color="#ea580c" />,
      color: '#ea580c',
      bg: 'rgba(234, 88, 12, 0.1)'
    }
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', backgroundColor: '#0b1326', color: '#e2e8f0', fontFamily: "'Inter', sans-serif", padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                <ShieldCheck size={28} color="#3b82f6" />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: '#fff', letterSpacing: '-0.5px' }}>IA Integrations</h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px', maxWidth: '600px', lineHeight: 1.5 }}>
              Central de orquestração de Inteligência Artificial. Todos os provedores listados abaixo operam sob a 
              <strong style={{ color: '#a78bfa' }}> Regra Absoluta 9</strong> de conectividade restrita.
            </p>
          </div>
        </div>

        {/* Restriction Banner */}
        <div style={{ background: 'rgba(15, 23, 42, 0.8)', borderLeft: '4px solid #a855f7', borderRadius: '0 8px 8px 0', padding: '16px 20px', marginBottom: '40px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <Lock color="#a855f7" size={20} style={{ marginTop: '2px' }} />
          <div>
            <h4 style={{ margin: '0 0 4px', color: '#e2e8f0', fontSize: '14px', fontWeight: 600 }}>Governança Ativa (Regra 9)</h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: 1.5 }}>
              Fica terminantemente proibido o uso, integração ou fallback para qualquer provedor de IA externo (como OpenAI compatible, Anthropic, etc) que não seja Gemini (Nativo), FAL.ai, ElevenLabs e provedores internos autorizados.
            </p>
          </div>
        </div>

        {/* Providers Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {providers.map((provider) => (
            <div key={provider.id} style={{ 
              background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '16px', padding: '24px', backdropFilter: 'blur(10px)',
              display: 'flex', flexDirection: 'column', gap: '20px'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '12px', background: provider.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {provider.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 600, color: '#fff' }}>{provider.name}</h3>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{provider.role}</div>
                  </div>
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {loading ? (
                      <Loader2 size={14} color="#64748b" className="animate-spin" />
                    ) : provider.status === 'operational' ? (
                      <><CheckCircle2 size={14} color="#10b981" /> <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 500 }}>Operational</span></>
                    ) : (
                      <><XCircle size={14} color="#ef4444" /> <span style={{ fontSize: '13px', color: '#ef4444', fontWeight: 500 }}>Degraded</span></>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Latency</span>
                  <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>
                    {loading ? '--' : provider.latency}
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
