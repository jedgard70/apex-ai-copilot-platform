import React, { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '../lib/supabaseClient';

const INITIAL_PIPELINE = {
  leads: [],
  negotiation: [],
  closed: []
};

export function MarketCrmPanel() {
  const [pipeline, setPipeline] = useState(INITIAL_PIPELINE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { client } = getBrowserSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await client.from('crm_leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      if (data) {
        const grouped = {
          leads: data.filter((d: any) => d.status === 'leads'),
          negotiation: data.filter((d: any) => d.status === 'negotiation'),
          closed: data.filter((d: any) => d.status === 'closed')
        };
        setPipeline(grouped);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async () => {
    const { client } = getBrowserSupabaseClient();
    if (!client) return alert('Supabase não conectado. Não é possível salvar.');
    
    const newLead = {
      name: prompt('Nome do Lead:') || 'Novo Lead',
      contact: prompt('Contato (Email/Tel):') || 'sem contato',
      value: parseFloat(prompt('Valor Estimado (Apenas números):') || '0'),
      source: 'Adicionado Manualmente',
      status: 'leads'
    };

    const { error } = await client.from('crm_leads').insert([newLead]);
    if (error) {
      console.error(error);
      alert('Erro ao salvar no banco de dados.');
    } else {
      fetchLeads(); // Recarrega
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-[#060d20] flex items-center justify-center text-[#ecb2ff]">
        <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-[#060d20] to-[#0b1326] flex flex-col overflow-hidden text-[#dbe2fd] p-8">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <span className="material-symbols-outlined text-[#ecb2ff] text-4xl">handshake</span>
            Market CRM & Pipeline
          </h1>
          <p className="text-[#94a3b8]">Gestão de clientes conectada em tempo real com PostgreSQL (Supabase).</p>
        </div>
        <button onClick={handleAddLead} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-white/10">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Novo Negócio
        </button>
      </header>

      <div className="flex-1 overflow-x-auto flex gap-6 pb-4">
        {/* Column 1: Leads */}
        <div className="min-w-[350px] w-[350px] flex flex-col bg-[#111827]/40 rounded-2xl border border-white/5">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl">
            <h3 className="font-semibold text-white">Leads Capturados</h3>
            <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold">{pipeline.leads.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {pipeline.leads.map((lead: any) => (
              <div key={lead.id} className="bg-[#111827] border border-white/10 p-4 rounded-xl shadow-lg cursor-grab hover:border-[#ecb2ff]/50 transition-colors">
                <h4 className="font-bold text-white mb-1">{lead.name}</h4>
                <p className="text-sm text-[#94a3b8] mb-3">{lead.contact}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded font-mono">R$ {lead.value}</span>
                  <span className="text-[#64748b] flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">robot_2</span> {lead.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Negotiation */}
        <div className="min-w-[350px] w-[350px] flex flex-col bg-[#111827]/40 rounded-2xl border border-white/5">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl">
            <h3 className="font-semibold text-white">Em Negociação</h3>
            <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-bold">{pipeline.negotiation.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {pipeline.negotiation.map((lead: any) => (
              <div key={lead.id} className="bg-[#111827] border border-white/10 p-4 rounded-xl shadow-lg cursor-grab hover:border-[#ecb2ff]/50 transition-colors">
                <h4 className="font-bold text-white mb-1">{lead.name}</h4>
                <p className="text-sm text-[#94a3b8] mb-3">{lead.contact}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded font-mono">R$ {lead.value}</span>
                  <span className="text-[#64748b] flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">robot_2</span> {lead.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Closed */}
        <div className="min-w-[350px] w-[350px] flex flex-col bg-[#111827]/40 rounded-2xl border border-white/5">
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl">
            <h3 className="font-semibold text-white">Contratos Fechados</h3>
            <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs font-bold">{pipeline.closed.length}</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {pipeline.closed.map((lead: any) => (
              <div key={lead.id} className="bg-[#111827] border border-green-500/20 p-4 rounded-xl shadow-lg cursor-grab hover:border-green-500/50 transition-colors">
                <h4 className="font-bold text-white mb-1">{lead.name}</h4>
                <p className="text-sm text-[#94a3b8] mb-3">{lead.contact}</p>
                <div className="flex justify-between items-center text-xs">
                  <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded font-mono">R$ {lead.value}</span>
                  <span className="text-green-500/70 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">check_circle</span> Ganho</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
