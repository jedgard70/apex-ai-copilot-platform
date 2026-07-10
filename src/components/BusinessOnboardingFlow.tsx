import React, { useState, useEffect } from 'react';
import { SplitAuthScreen } from './SplitAuthScreen';
import { SupabaseAccountState } from '../lib/supabaseAuthBootstrap';

type FlowStep = 'vsl' | 'auth';

type ServiceOption = {
  id: string;
  title: string;
  videoUrl?: string;
};

const SERVICES: ServiceOption[] = [
  { id: 'stock_market_analytics', title: 'STOCK MARKET ANALYTICS' },
  { id: 'autotrader_bot', title: 'AUTOTRADER BOT' },
  { id: 'accounting_and_contabilidade_crc', title: 'ACCOUNTING & CONTABILIDADE (CRC)' },
  { id: 'contracts_studio_rascunho_jurídico', title: 'CONTRACTS STUDIO (Rascunho Jurídico)' },
  { id: 'permits_and_offshore', title: 'PERMITS & OFFSHORE' },
  { id: 'crm_and_pipeline_de_vendas', title: 'CRM & PIPELINE DE VENDAS' },
  { id: 'bim_3d_studio_webgl___ifcopenshell', title: 'BIM 3D STUDIO (WebGL / IfcOpenShell)' },
  { id: 'bim_clash_detection', title: 'BIM CLASH DETECTION' },
  { id: 'ms_project_parser', title: 'MS PROJECT PARSER' },
  { id: 'budget_and_quantity_studio_sinapi', title: 'BUDGET & QUANTITY STUDIO (SINAPI)' },
  { id: 'project_package_pipeline', title: 'PROJECT PACKAGE PIPELINE' },
  { id: 'field_ops_studio', title: 'FIELD OPS STUDIO' },
  { id: 'rdo_diário_de_obras_digital', title: 'RDO (Diário de Obras Digital)' },
  { id: 'qualidade_e_ncis', title: 'QUALIDADE E NCIs' },
  { id: 'nr_compliance', title: 'NR COMPLIANCE' },
  { id: 'supply_chain_studio', title: 'SUPPLY CHAIN STUDIO' },
  { id: 'digital_twin_ops', title: 'DIGITAL TWIN OPs' },
  { id: 'iot_telemetry', title: 'IoT TELEMETRY' },
  { id: 'predictive_analytics', title: 'PREDICTIVE ANALYTICS' },
  { id: 'workflow_and_tasks_gantt', title: 'WORKFLOW & TASKS (Gantt)' },
  { id: 'folha_de_pagamento_automatizada', title: 'FOLHA DE PAGAMENTO AUTOMATIZADA' },
  { id: 'trip_planner', title: 'TRIP PLANNER' },
  { id: 'vsl_landing_page', title: 'VSL LANDING PAGE' },
  { id: 'stripe_checkout', title: 'STRIPE CHECKOUT' },
  { id: 'stripe_webhooks', title: 'STRIPE WEBHOOKS' },
  { id: 'campaign_automation_studio', title: 'CAMPAIGN AUTOMATION STUDIO' },
  { id: 'hotmart_webhook', title: 'HOTMART WEBHOOK' },
  { id: 'directors_cut_studio', title: 'DIRECTOR\'S CUT STUDIO' },
  { id: 'avatar_pipeline', title: 'AVATAR PIPELINE' },
  { id: 'voice_tts_pipeline_elevenlabs', title: 'VOICE TTS PIPELINE (ElevenLabs)' },
  { id: 'directors_cut_refine', title: 'DIRECTOR\'S CUT REFINE' },
  { id: 'chat_principal_apex_ai', title: 'CHAT PRINCIPAL (Apex AI)' },
  { id: 'cognitive_agents_hub', title: 'COGNITIVE AGENTS HUB' },
  { id: 'agent_planner', title: 'AGENT PLANNER' },
  { id: 'agent_executor', title: 'AGENT EXECUTOR' },
  { id: 'agent_verifier', title: 'AGENT VERIFIER' },
  { id: 'tool_registry', title: 'TOOL REGISTRY' },
  { id: 'apex_memory_memória_de_longo_prazo', title: 'APEX MEMORY (Memória de Longo Prazo)' },
  { id: 'personal_assistant_logic', title: 'PERSONAL ASSISTANT LOGIC' },
  { id: 'teach_api', title: 'TEACH API' },
  { id: 'train_gemma_motor_de_re-treino', title: 'TRAIN GEMMA (Motor de Re-treino)' },
  { id: 'self_upgrade', title: 'SELF UPGRADE' },
  { id: 'deep_research_studio', title: 'DEEP RESEARCH STUDIO' },
  { id: 'trend_scout_agent_radar_24_7', title: 'TREND SCOUT AGENT (Radar 24/7)' },
  { id: 'apex_reasoning_core', title: 'APEX REASONING CORE' },
  { id: 'provider_router', title: 'PROVIDER ROUTER' },
  { id: 'provider_status_and_analytics', title: 'PROVIDER STATUS & ANALYTICS' },
  { id: 'whatsapp_bot_webhook', title: 'WHATSAPP BOT WEBHOOK' },
  { id: 'whatsapp_cli_tool', title: 'WHATSAPP CLI TOOL' },
  { id: 'google_auth', title: 'GOOGLE AUTH' },
  { id: 'google_calendar_bot', title: 'GOOGLE CALENDAR BOT' },
  { id: 'google_workspace_cli', title: 'GOOGLE WORKSPACE CLI' },
  { id: 'gemini_agents_orchestrator', title: 'GEMINI AGENTS ORCHESTRATOR' },
  { id: 'firebase_connector', title: 'FIREBASE CONNECTOR' },
  { id: 'github_tools', title: 'GITHUB TOOLS' },
  { id: 'fal_model_registry', title: 'FAL MODEL REGISTRY' },
  { id: 'authkey_connector', title: 'AUTHKEY CONNECTOR' },
  { id: 'domain_knowledge_connector', title: 'DOMAIN KNOWLEDGE CONNECTOR' },
  { id: 'local_worker_client', title: 'LOCAL WORKER CLIENT' },
  { id: 'embeddings_engine', title: 'EMBEDDINGS ENGINE' },
  { id: 'background_tasks_connector', title: 'BACKGROUND TASKS CONNECTOR' },
  { id: 'brain_module_agente_autônomo', title: 'BRAIN MODULE (Agente Autônomo)' },
  { id: 'code_tools_and_validator', title: 'CODE TOOLS & VALIDATOR' },
  { id: 'confirmation_state_machine', title: 'CONFIRMATION STATE MACHINE' },
  { id: 'controlled_executor', title: 'CONTROLLED EXECUTOR' },
  { id: 'delegation_generator', title: 'DELEGATION GENERATOR' },
  { id: 'execution_policy_and_policy_engine', title: 'EXECUTION POLICY & POLICY ENGINE' },
  { id: 'local_worker_electron', title: 'LOCAL WORKER (Electron)' },
  { id: 'offline_gateway', title: 'OFFLINE GATEWAY' },
  { id: 'mcp_server_model_context_protocol', title: 'MCP SERVER (Model Context Protocol)' },
  { id: 'runtime_próprio_llama-server_ollama', title: 'RUNTIME PRÓPRIO (llama-server/Ollama)' },
  { id: 'apex_engine_proxy', title: 'APEX ENGINE PROXY' },
  { id: 'apex_runtime_engine', title: 'APEX RUNTIME ENGINE' },
  { id: 'inference_server', title: 'INFERENCE SERVER' },
  { id: 'soberania_tecnológica_offline_gguf', title: 'SOBERANIA TECNOLÓGICA (OFFLINE GGUF)' },
  { id: 'dashboard___home', title: 'DASHBOARD / HOME' },
  { id: 'owner_console', title: 'OWNER CONSOLE' },
  { id: 'platform_map___manual_interativo', title: 'PLATFORM MAP / MANUAL INTERATIVO' },
  { id: 'project_workspace', title: 'PROJECT WORKSPACE' },
  { id: 'auth_server', title: 'AUTH SERVER' },
  { id: 'multi-tenant_rls_supabase', title: 'MULTI-TENANT RLS (Supabase)' },
  { id: 'pwa_progressive_web_app', title: 'PWA (Progressive Web App)' },
  { id: 'auto-update_ota', title: 'AUTO-UPDATE (OTA)' },
  { id: 'platform_status_telemetria', title: 'PLATFORM STATUS (Telemetria)' },
  { id: 'code_executor_terminal_web', title: 'CODE EXECUTOR (Terminal Web)' },
  { id: 'rate_limit_monitor', title: 'RATE LIMIT MONITOR' },
  { id: 'security_audit', title: 'SECURITY AUDIT' },
];

export function BusinessOnboardingFlow({ onComplete }: { onComplete: (state: SupabaseAccountState) => void }) {
  const [step, setStep] = useState<FlowStep>('vsl');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [hoveredService, setHoveredService] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSelectService = (id: string) => {
    setSelectedService(id);
    setStep('auth');
  };

  const handleStartGeneral = () => {
    setSelectedService('general_access');
    setStep('auth');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex overflow-hidden bg-[#0a0508] text-white font-sans transition-opacity duration-1000"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {/* Background with dynamic subtle gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b12] via-[#0a0508] to-[#0d142b] opacity-80" />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[120px] transition-all duration-700"
          style={{
            background: hoveredService === 'cinematic_3d' ? 'rgba(220, 38, 38, 0.15)' : 
                        hoveredService === 'ai_copilots' ? 'rgba(59, 130, 246, 0.15)' :
                        hoveredService === 'bim_planning' ? 'rgba(16, 185, 129, 0.15)' :
                        'rgba(159, 18, 57, 0.1)'
          }}
        />
        {/* Abstract shape/image placeholder simulating the model in the reference */}
        <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{
          backgroundImage: 'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.1) 0%, transparent 60%)'
        }} />
      </div>

      {step === 'vsl' && (
        <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-between px-8 md:px-24">
          
          {/* Header/Logo */}
          <div className="absolute top-8 left-8 md:left-24 flex items-center gap-12">
            <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight">
              <img src="/apex-global-logo.png" alt="Apex AI Logo" className="w-8 h-8 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              <span>Apex AI</span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-white/70">
              <a href="#" className="hover:text-white transition-colors">Suite Criativa</a>
              <a href="#" className="hover:text-white transition-colors">Recursos</a>
              <a href="#" className="hover:text-white transition-colors">Empresa</a>
            </nav>
          </div>

          {/* Right Header actions */}
          <div className="absolute top-8 right-8 md:right-24 flex items-center gap-4">
            <button onClick={handleStartGeneral} className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              Conecte-se
            </button>
            <button onClick={handleStartGeneral} className="bg-white text-black text-sm font-bold px-4 py-2 rounded hover:bg-gray-200 transition-colors">
              Inscrever-se
            </button>
          </div>

          {/* Left Content: Headline & CTA */}
          <div className="flex-1 max-w-2xl mt-24 md:mt-0 animate-[fadeInLeft_1s_ease-out]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white/80 mb-6 backdrop-blur-md cursor-pointer hover:bg-white/10 transition-colors">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
              Plataforma de IA número 1 <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </div>
            
            <h1 className="text-5xl md:text-[64px] leading-[1.05] font-extrabold mb-6 tracking-tight">
              A plataforma de inteligência para direcionar seus melhores trabalhos.
            </h1>
            
            <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-xl">
              Todos os modelos de IA para engenharia, arquitetura e gestão. Fluxos de trabalho inteligentes para controle e colaboração profissionais. Produção alinhada à sua marca em qualquer escala.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <button 
                onClick={handleStartGeneral}
                className="bg-white text-black font-bold text-base px-8 py-4 rounded hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                Comece a criar
              </button>
              <button className="flex items-center gap-2 bg-transparent border border-white/20 text-white font-bold text-base px-8 py-4 rounded hover:bg-white/5 transition-all">
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                Por que Apex AI?
              </button>
            </div>
          </div>

          {/* Right Content: Services List */}
          <div className="flex-1 w-full md:w-auto mt-16 md:mt-0 flex flex-col md:items-end justify-center animate-[fadeInRight_1s_ease-out_0.2s_both]">
            <div className="flex flex-col gap-2 md:text-right w-full max-w-md max-h-[70vh] overflow-y-auto scrollbar-hide pb-20 pointer-events-auto" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {SERVICES.map((srv, idx) => (
                <div 
                  key={srv.id}
                  onMouseEnter={() => setHoveredService(srv.id)}
                  onMouseLeave={() => setHoveredService(null)}
                  onClick={() => handleSelectService(srv.id)}
                  className={`group relative py-3 md:py-4 px-4 cursor-pointer transition-all duration-300 flex items-center justify-between md:justify-end gap-4 rounded-lg md:rounded-none md:rounded-l-lg
                    ${hoveredService === srv.id ? 'bg-white/5 backdrop-blur-sm' : 'hover:bg-white/5'}
                  `}
                >
                  {hoveredService === srv.id && (
                    <span className="material-symbols-outlined text-rose-500 md:hidden animate-[fadeIn_0.2s]">play_arrow</span>
                  )}
                  <span className={`text-xl md:text-3xl font-bold tracking-tight transition-all duration-300
                    ${hoveredService === srv.id ? 'text-white translate-x-2 md:-translate-x-4' : 'text-white/40'}
                  `}>
                    {srv.title}
                  </span>
                  {hoveredService === srv.id && (
                    <span className="material-symbols-outlined text-rose-500 hidden md:block animate-[fadeIn_0.2s]">play_arrow</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer tags */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-6 opacity-60">
            <p className="text-xs font-semibold tracking-wider">Com a confiança das maiores construtoras — engenheiros, arquitetos e estúdios.</p>
            {/* Logos placeholder */}
            <div className="flex items-center gap-8 opacity-50">
              <div className="h-4 w-16 bg-white/20 rounded"></div>
              <div className="h-4 w-16 bg-white/20 rounded"></div>
              <div className="h-4 w-16 bg-white/20 rounded"></div>
              <div className="h-4 w-16 bg-white/20 rounded"></div>
            </div>
          </div>
        </div>
      )}

      {step === 'auth' && (
        <SplitAuthScreen 
          onComplete={onComplete}
          onBack={() => setStep('vsl')}
          contextMetadata={selectedService && selectedService !== 'general_access' ? { selected_service: selectedService } : undefined}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
