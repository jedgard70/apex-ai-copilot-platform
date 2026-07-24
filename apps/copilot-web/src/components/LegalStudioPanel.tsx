import React, { useState } from 'react'
import { IntakeFile } from '../lib/fileIntake'

type LegalStudioPanelProps = {
  source?: IntakeFile
  onClear: () => void
}

export default function LegalStudioPanel({ source, onClear }: LegalStudioPanelProps) {
  const [activeView, setActiveView] = useState<'split' | 'analysis'>('split')

  return (
    <div className="fixed inset-0 z-50 bg-[#0b1326] flex flex-col text-[#dae2fd] overflow-hidden font-sans">
      
      {/* HEADER */}
      <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-[#2d3449]/50 bg-[#131b2e]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={onClear}>
            <div className="w-8 h-8 rounded-full bg-[#171f33] flex items-center justify-center border border-[#2d3449] group-hover:border-amber-500 transition-colors">
              <span className="material-symbols-outlined text-sm text-[#afb9cb] group-hover:text-amber-400">arrow_back</span>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2 border-l border-[#2d3449] pl-4">
            <span className="material-symbols-outlined text-amber-500">gavel</span>
            Legal & Contracts <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 ml-2">PDF INTELLIGENCE</span>
          </h1>
        </div>
        
        <div className="flex bg-[#171f33] p-1 rounded-xl border border-[#2d3449]">
          <button 
            onClick={() => setActiveView('split')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'split' ? 'bg-amber-600/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-[#8d90a0] hover:text-white'}`}
          >
            Split View (Doc + IA)
          </button>
          <button 
            onClick={() => setActiveView('analysis')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeView === 'analysis' ? 'bg-amber-600/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'text-[#8d90a0] hover:text-white'}`}
          >
            Análise de Risco Completa
          </button>
        </div>

        <div className="flex gap-3">
          <button className="h-9 px-4 rounded-xl bg-[#171f33] border border-[#2d3449] text-white font-medium text-sm flex items-center gap-2 hover:bg-[#2d3449] transition-all">
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            Exportar Redline
          </button>
        </div>
      </header>

      {/* MAIN CONTENT - SPLIT VIEW */}
      <div className="flex-1 flex overflow-hidden bg-[#060e20]">
        
        {/* LEFT PANE: Document Viewer */}
        <div className="flex-1 border-r border-[#2d3449] flex flex-col bg-[#0b1326]">
          {/* Toolbar */}
          <div className="h-10 bg-[#131b2e] border-b border-[#2d3449] flex items-center justify-between px-4">
            <div className="text-xs font-semibold text-[#afb9cb] flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">description</span>
              CONTRATO_PRESTACAO_SERVICOS_ENG.pdf
            </div>
            <div className="flex gap-2">
              <button className="text-[#8d90a0] hover:text-white"><span className="material-symbols-outlined text-[16px]">zoom_out</span></button>
              <span className="text-xs text-[#8d90a0] font-mono">100%</span>
              <button className="text-[#8d90a0] hover:text-white"><span className="material-symbols-outlined text-[16px]">zoom_in</span></button>
            </div>
          </div>
          
          {/* PDF Mockup */}
          <div className="flex-1 overflow-auto custom-scrollbar p-8 flex justify-center bg-[#060e20]">
            <div className="w-full max-w-[800px] min-h-[1000px] bg-white rounded-sm shadow-2xl p-12 flex flex-col gap-6 font-serif">
              <h1 className="text-2xl font-bold text-center text-black mb-8 border-b-2 border-black pb-4">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ENGENHARIA</h1>
              
              <p className="text-sm text-gray-800 text-justify leading-relaxed">
                Pelo presente instrumento particular, de um lado, CONTRATANTE, e de outro lado, CONTRATADA, têm entre si justo e acertado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas e condições descritas a seguir.
              </p>

              <h2 className="text-lg font-bold text-black mt-4">CLÁUSULA 1 - DO OBJETO</h2>
              <p className="text-sm text-gray-800 text-justify leading-relaxed">
                1.1. O presente contrato tem como objeto a prestação de serviços de engenharia civil, consistindo na elaboração de projetos executivos, estruturais e acompanhamento da obra localizada na Avenida Paulista, 1000.
              </p>

              <h2 className="text-lg font-bold text-black mt-4">CLÁUSULA 2 - DO PREÇO E CONDIÇÕES DE PAGAMENTO</h2>
              <p className="text-sm text-gray-800 text-justify leading-relaxed">
                2.1. Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor global de R$ 150.000,00 (cento e cinquenta mil reais).
              </p>
              
              {/* Highlighted text (Risk) */}
              <div className="relative group">
                <div className="absolute -inset-2 bg-red-500/20 border-2 border-red-500 rounded-lg pointer-events-none"></div>
                <p className="text-sm text-gray-800 text-justify leading-relaxed relative z-10">
                  <span className="bg-red-200 text-red-900 font-bold">2.2. O atraso no pagamento de qualquer parcela implicará em multa moratória de 10% (dez por cento) ao dia sobre o valor da parcela em atraso, sem prejuízo de juros compensatórios.</span>
                </p>
              </div>

              <h2 className="text-lg font-bold text-black mt-8">CLÁUSULA 3 - DO PRAZO</h2>
              <p className="text-sm text-gray-800 text-justify leading-relaxed">
                3.1. O prazo para execução dos serviços será de 120 (cento e vinte) dias úteis, contados da assinatura deste instrumento.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: IA Analysis */}
        <div className="w-[450px] bg-[#131b2e] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.3)] shrink-0">
          
          {/* Section 1: Dashboard / Overview */}
          <div className="p-6 border-b border-[#2d3449]">
            <h2 className="text-lg font-bold text-white mb-4">Análise de Risco Apex</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#171f33] border border-red-500/30 rounded-xl p-3 flex flex-col">
                <span className="text-red-400 font-bold text-2xl">01</span>
                <span className="text-[10px] text-[#afb9cb] uppercase tracking-wider">Risco Crítico</span>
              </div>
              <div className="bg-[#171f33] border border-amber-500/30 rounded-xl p-3 flex flex-col">
                <span className="text-amber-400 font-bold text-2xl">03</span>
                <span className="text-[10px] text-[#afb9cb] uppercase tracking-wider">Atenção Necessária</span>
              </div>
            </div>

            <button className="w-full h-10 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              Gerar Relatório Resumido
            </button>
          </div>

          {/* Section 2: Detailed Issues list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-3">
            
            {/* Issue 1 */}
            <div className="bg-[#0b1326] border border-red-500/50 rounded-xl p-4 shadow-lg cursor-pointer hover:border-red-400 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-0.5">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Multa Moratória Abusiva</h3>
                  <p className="text-[10px] text-[#8d90a0] mt-1">Cláusula 2.2</p>
                </div>
              </div>
              <p className="text-xs text-[#dae2fd] leading-relaxed mb-3">
                A multa de 10% <strong className="text-red-400">ao dia</strong> é excessivamente onerosa e provavelmente nula perante o ordenamento jurídico, configurando desequilíbrio contratual severo.
              </p>
              <div className="bg-[#171f33] border border-[#2d3449] rounded-lg p-3">
                <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">Sugestão de Redação (Apex)</h4>
                <p className="text-xs text-[#afb9cb] italic">
                  "O atraso no pagamento implicará em multa moratória de 2% (dois por cento) sobre o valor da parcela, acrescida de juros de 1% (um por cento) ao mês."
                </p>
                <div className="flex justify-end mt-2">
                  <button className="text-xs font-medium text-amber-500 hover:text-amber-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">done_all</span> Aplicar ao Redline
                  </button>
                </div>
              </div>
            </div>

            {/* Issue 2 */}
            <div className="bg-[#0b1326] border border-amber-500/50 rounded-xl p-4 shadow-lg cursor-pointer hover:border-amber-400 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-0.5">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">warning</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Ausência de Cláusula de Foro</h3>
                  <p className="text-[10px] text-[#8d90a0] mt-1">Documento Geral</p>
                </div>
              </div>
              <p className="text-xs text-[#dae2fd] leading-relaxed mb-3">
                O contrato não estipula qual comarca será competente para dirimir conflitos, o que pode gerar atrasos processuais.
              </p>
              <button className="w-full py-2 bg-[#171f33] hover:bg-[#2d3449] border border-[#2d3449] rounded-lg text-xs font-medium text-white transition-colors">
                Gerar Cláusula de Foro
              </button>
            </div>

          </div>
        </div>

      </div>
      
      {/* Scrollbar styling */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2d3449; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #434655; }
      `}</style>
    </div>
  )
}
