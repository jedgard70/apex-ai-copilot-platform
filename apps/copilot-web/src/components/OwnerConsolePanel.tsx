import React, { useState, useEffect } from 'react';

export function OwnerConsolePanel() {
  const [stats, setStats] = useState({ activeSquads: 12, completedTasks: 1450, systemHealth: 99.9 });
  
  return (
    <div className="h-full bg-gradient-to-br from-[#060d20] to-[#0b1326] flex flex-col overflow-hidden text-[#dbe2fd] p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-[#7df4ff] text-4xl">monitoring</span>
          Executive Overview
        </h1>
        <p className="text-[#94a3b8]">Visão consolidada da operação de Inteligência Artificial da Apex.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-[#111827]/80 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          <h3 className="text-[#a78bfa] text-sm uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">group_work</span>
            Squads Ativos
          </h3>
          <div className="text-5xl font-bold text-white mb-2">{stats.activeSquads}</div>
          <p className="text-[#64748b] text-sm">+3 instanciados na última hora</p>
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          <h3 className="text-[#7df4ff] text-sm uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">task_alt</span>
            Tarefas Autônomas
          </h3>
          <div className="text-5xl font-bold text-white mb-2">{stats.completedTasks}</div>
          <p className="text-[#64748b] text-sm">Resolução completa sem intervenção humana</p>
        </div>

        <div className="bg-[#111827]/80 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          <h3 className="text-[#ecb2ff] text-sm uppercase tracking-widest font-semibold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined">health_and_safety</span>
            Saúde do Ecossistema
          </h3>
          <div className="text-5xl font-bold text-white mb-2">{stats.systemHealth}%</div>
          <p className="text-[#64748b] text-sm">Uptime dos provedores de inferência</p>
        </div>
      </div>

      <div className="flex-1 bg-[#111827]/50 rounded-2xl border border-white/5 p-6 overflow-hidden flex flex-col">
        <h3 className="text-lg font-medium text-white mb-6">Atividade Recente dos Agentes</h3>
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {[
            { agent: 'Marketing Lead', action: 'Campanha de E-mail criada para Lançamento do ApexOS', time: 'Há 5 mins' },
            { agent: 'Advogado IA', action: 'Revisão finalizada no Contrato de Prestação de Serviços', time: 'Há 12 mins' },
            { agent: 'Arquiteto BIM', action: 'Geração de perspectivas renders 3D', time: 'Há 30 mins' },
            { agent: 'QA Code Agent', action: 'Refatoração da API de autenticação concluída', time: 'Há 2 horas' }
          ].map((log, i) => (
            <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div className="flex-1">
                <h4 className="text-white text-sm font-medium">{log.agent}</h4>
                <p className="text-[#94a3b8] text-sm">{log.action}</p>
              </div>
              <div className="text-[#475569] text-xs font-mono">{log.time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
