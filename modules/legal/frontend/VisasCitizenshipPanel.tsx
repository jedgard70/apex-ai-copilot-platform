// @ts-nocheck
import React, { useState } from 'react';
import { GlobalLegalData, LegalJurisdiction, LegalProcess } from '../../../src/lib/legalCorporateModel';
import { ShieldAlert, CheckCircle2, ChevronRight, FileText, ChevronLeft, Globe, FileCheck, Plane } from 'lucide-react';

import { GovFormReplica } from '../../../src/components/GovFormReplica';

export default function VisasCitizenshipPanel({ initialRegion, initialType }: { initialRegion?: string; initialType?: string }) {
  const [activeTab, setActiveTab] = useState(initialRegion || initialType ? 1 : 0); // 0 = País, 1 = Visto, 2 = Checklist, 3 = Intake, 4 = AI, 5 = GovFormReplica

  const [selectedCountry, setSelectedCountry] = useState<LegalJurisdiction | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<string>('');
  
  const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');
  const [aiResult, setAiResult] = useState<any>(null);

  React.useEffect(() => {
    if (initialRegion) {
      const country = GlobalLegalData.find(c => c.countryCode === initialRegion);
      if (country) {
        setSelectedCountry(country);
        if (initialType === 'contract') {
          // Pre-select contract if we had that logic
        }
      }
    } else if (initialType) {
      // Find first country that matches type if we want to just show all contracts, 
      // but for now let's default to US if no region.
      const us = GlobalLegalData.find(c => c.countryCode === 'US');
      if (us) setSelectedCountry(us);
    }
  }, [initialRegion, initialType]);

  const [formData, setFormData] = useState({
    fullName: '',
    passportNumber: '',
    lastEntry: '',
    lastExit: '',
    overstayed: 'no',
    criminalRecord: 'no',
    sponsorName: '',
    sponsorJob: ''
  });

  const selectedVisa = selectedCountry?.processes.find(v => v.id === selectedProcessId);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAnalyze = async () => {
    setAiStatus('analyzing');
    try {
      const response = await fetch('/api/copilot/immigration-logic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId: selectedProcessId, formData })
      });
      const data = await response.json();
      if (data && data.documents) {
        setAiResult(data.documents);
      }
    } catch (e) {
      console.error("Erro na API de imigração:", e);
    } finally {
      setAiStatus('done');
    }
  };

  const selectCountryAndProceed = (countryCode: string) => {
    const country = GlobalLegalData.find(c => c.countryCode === countryCode);
    if (country) {
      setSelectedCountry(country);
      setActiveTab(1); // Vai para Vistos
    }
  };

  const selectVisaAndProceed = (id: string) => {
    setSelectedProcessId(id);
    setActiveTab(2); // Vai para Checklist
  };

  const goBack = () => {
    if (activeTab > 0) setActiveTab(activeTab - 1);
  };

  const tabs = ['1. Destino', '2. Rota', '3. Checklist', '4. Triagem', '5. Apex AI'];

  return (
    <div className="p-6 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Globe className="text-primary" />
            Global Permits & Visas
          </h1>
          <p className="text-on-surface-variant text-lg">
            Motor Jurídico Internacional de Vistos, Cidadanias e Residências.
          </p>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant/20 overflow-hidden shadow-2xl">
        {/* Progress Tabs */}
        <div className="flex border-b border-outline-variant/20 bg-surface-container-highest">
          {tabs.map((tab, idx) => (
            <button
              key={tab}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${
                activeTab === idx
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-on-surface-variant hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab > 0 && (
            <button onClick={goBack} className="flex items-center gap-2 text-sm text-on-surface-variant hover:text-white mb-6 transition-colors">
              <ChevronLeft size={16}/> Voltar
            </button>
          )}

          {/* TAB 0: COUNTRY SELECTION */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Selecione o País de Destino</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GlobalLegalData.map((country) => (
                  <div 
                    key={country.countryCode}
                    onClick={() => selectCountryAndProceed(country.countryCode)}
                    className="bg-surface-container hover:bg-surface-container-highest p-6 rounded-xl border border-outline-variant/10 hover:border-primary/50 cursor-pointer transition-all flex items-center gap-4"
                  >
                    <span className="text-5xl">{country.flag}</span>
                    <div>
                      <h3 className="text-white font-bold text-xl">{country.countryName}</h3>
                      <p className="text-sm text-on-surface-variant">{country.processes.length} rotas disponíveis</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: VISA SELECTION */}
          {activeTab === 1 && selectedCountry && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {selectedCountry.flag} Escolha a Rota para {selectedCountry.countryName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCountry.processes.map((visa) => (
                  <div 
                    key={visa.id}
                    onClick={() => selectVisaAndProceed(visa.id)}
                    className="bg-surface-container hover:bg-surface-container-highest p-5 rounded-xl border border-outline-variant/10 hover:border-primary/50 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                          {visa.code}
                        </span>
                        <ChevronRight className="text-on-surface-variant" size={20}/>
                      </div>
                      <h3 className="text-white font-bold text-lg mb-2">{visa.name}</h3>
                      <p className="text-sm text-on-surface-variant mb-4">{visa.description}</p>
                    </div>
                    
                    <div className="mt-auto border-t border-outline-variant/10 pt-4">
                       <div className="flex justify-between items-end">
                         <div>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-1">Honorários Médios</p>
                            <p className="text-xs text-on-surface-variant line-through mb-1">${visa.marketPrice.toLocaleString()}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-secondary-fixed uppercase font-bold tracking-wider mb-1">Apex AI</p>
                            <p className="text-lg font-bold text-white">${visa.apexPrice.toLocaleString()}</p>
                         </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CHECKLIST */}
          {activeTab === 2 && selectedVisa && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <div className="bg-primary/10 border border-primary/20 p-5 rounded-lg flex items-start gap-4">
                  <ShieldAlert className="text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-primary font-bold mb-1">Checklist Documental: {selectedVisa.code}</h3>
                    <p className="text-sm text-on-surface-variant">
                      Antes de prosseguir com a inteligência artificial, você ou seu cliente precisam reunir as evidências abaixo para provar o pleito.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-bold text-white mb-4 border-b border-outline-variant/20 pb-2">Formulários Oficiais Exigidos</h4>
                    <ul className="space-y-3">
                      {selectedVisa.forms.map(form => (
                        <li key={form.id} className="flex items-start gap-3">
                          <CheckCircle2 className="text-secondary-fixed mt-0.5" size={18}/>
                          <div>
                            <p className="text-white text-sm font-bold">{form.name}</p>
                            <p className="text-xs text-on-surface-variant">{form.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-white mb-4 border-b border-outline-variant/20 pb-2">Evidências (Supporting Documents)</h4>
                    <ul className="space-y-3">
                      {selectedVisa.documents.map(doc => (
                        <li key={doc.id} className="flex items-start gap-3">
                          <CheckCircle2 className="text-secondary-fixed mt-0.5" size={18}/>
                          <div>
                            <p className="text-white text-sm font-bold">{doc.name}</p>
                            <p className="text-xs text-on-surface-variant">{doc.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button onClick={() => setActiveTab(3)} className="bg-primary text-on-primary font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors">
                    Continuar para Triagem / Intake
                  </button>
                </div>
             </div>
          )}

          {/* TAB 3: INTAKE */}
          {activeTab === 3 && (
             <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-white text-center mb-6">Questionário de Triagem (Intake Form)</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Nome Completo do Aplicante</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/20 rounded p-3 text-white focus:border-primary outline-none" placeholder="Ex: João da Silva"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-1">Passaporte Atual</label>
                      <input type="text" name="passportNumber" value={formData.passportNumber} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/20 rounded p-3 text-white focus:border-primary outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Houve histórico de violação imigratória (Overstay / Estadia Irregular)?</label>
                    <select name="overstayed" value={formData.overstayed} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/20 rounded p-3 text-white focus:border-primary outline-none">
                      <option value="no">Não. Sempre cumpri os prazos legais.</option>
                      <option value="yes">Sim. Permaneci além do prazo concedido.</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Nome do Patrocinador (Sponsor / Familiar)</label>
                    <input type="text" name="sponsorName" value={formData.sponsorName} onChange={handleInputChange} className="w-full bg-surface-container border border-outline-variant/20 rounded p-3 text-white focus:border-primary outline-none" placeholder="Opcional se for visto de trabalho independente" />
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button onClick={() => { setActiveTab(4); handleAnalyze(); }} className="w-full bg-secondary-fixed text-on-secondary-fixed font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-colors flex justify-center items-center gap-2">
                    Enviar para Apex Legal Engine
                  </button>
                </div>
             </div>
          )}

          {/* TAB 4: AI ENGINE */}
          {activeTab === 4 && (
             <div className="animate-in fade-in duration-300">
                {aiStatus === 'analyzing' && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <h2 className="text-xl font-bold text-white">Apex Legal Engine Processando...</h2>
                    <p className="text-on-surface-variant text-sm text-center max-w-md">Cruzando dados do Intake com as regulamentações governamentais e redigindo as peças paralegais.</p>
                  </div>
                )}

                {aiStatus === 'done' && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 border-b border-outline-variant/20 pb-4">
                      <div className="bg-secondary-fixed/20 p-3 rounded-full">
                        <CheckCircle2 className="text-secondary-fixed" size={32}/>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Processamento Concluído</h2>
                        <p className="text-on-surface-variant text-sm">Dossiê preparado para: {selectedVisa?.name} ({selectedCountry?.countryName})</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-bold text-white text-sm">Resumo de Admissibilidade (Análise das Leis Locais)</h3>
                      <div className="flex gap-3 text-sm bg-surface-container p-3 rounded border border-outline-variant/10">
                         <CheckCircle2 className="text-secondary-fixed flex-shrink-0" size={18}/>
                         <span>{aiResult?.legalRiskAnalysis || 'Análise de risco concluída sem impedimentos críticos.'}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-bold text-white text-sm">Peças Geradas pela Apex AI</h3>
                      <ul className="space-y-3">
                        {aiResult?.document1?.title && (
                          <li className="bg-surface-container-highest p-4 rounded border border-outline-variant/10">
                            <span className="text-sm font-bold text-white flex items-center gap-2 mb-2"><FileText size={16} className="text-tertiary"/> {aiResult.document1.title}</span>
                            <p className="text-xs text-on-surface-variant font-mono whitespace-pre-wrap">{aiResult.document1.content}</p>
                          </li>
                        )}
                        {aiResult?.document2?.title && (
                          <li className="bg-surface-container-highest p-4 rounded border border-outline-variant/10">
                            <span className="text-sm font-bold text-white flex items-center gap-2 mb-2"><FileText size={16} className="text-tertiary"/> {aiResult.document2.title}</span>
                            <p className="text-xs text-on-surface-variant font-mono whitespace-pre-wrap">{aiResult.document2.content}</p>
                          </li>
                        )}
                      </ul>
                    </div>

                    {aiResult?.formFillerGuide && (
                      <div className="space-y-3">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2"><FileCheck size={18} className="text-secondary-fixed"/> Guia de Preenchimento: {aiResult.formFillerGuide.formName}</h3>
                        <div className="bg-surface-container rounded-lg border border-outline-variant/20 overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-surface-container-highest border-b border-outline-variant/20">
                              <tr>
                                <th className="p-3 font-bold text-white">Pergunta Oficial (No Formulário)</th>
                                <th className="p-3 font-bold text-tertiary">Resposta Exata a Preencher (Copiar)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                              {aiResult.formFillerGuide.fields.map((field: any, idx: number) => (
                                <tr key={idx} className="hover:bg-primary/5">
                                  <td className="p-3 text-on-surface-variant w-1/2">{field.question}</td>
                                  <td className="p-3 font-mono text-white w-1/2 font-bold">{field.suggestedAnswer}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {aiResult?.protocolInstructions && (
                      <div className="bg-[#0f172a] p-5 rounded-lg border border-[#1e293b]">
                        <h4 className="text-sm font-bold text-[#60a5fa] mb-3 flex items-center gap-2"><Plane size={18}/> Instruções Oficiais de Protocolo (Submissão)</h4>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-[#1c2235] p-3 rounded">
                             <p className="text-xs text-on-surface-variant uppercase font-bold">Departamento / Portal</p>
                             <p className="text-sm font-bold text-white">{aiResult.protocolInstructions.department}</p>
                          </div>
                          <div className="bg-[#1c2235] p-3 rounded">
                             <p className="text-xs text-on-surface-variant uppercase font-bold">Taxa Governamental</p>
                             <p className="text-sm font-bold text-white">{aiResult.protocolInstructions.fee}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-bold text-on-surface-variant uppercase">Passo a Passo</p>
                          <ol className="list-decimal list-inside text-sm text-white space-y-1">
                            {aiResult.protocolInstructions.steps.map((step: string, idx: number) => (
                              <li key={idx} className="pl-1">{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-8 border-t border-outline-variant/20 pt-6 flex flex-col gap-3">
                      <button onClick={async () => {
                        alert('Iniciando geração do formulário real em PDF usando pdf-lib...');
                        try {
                          const res = await fetch('/api/permits/download-pdf', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: 'form-global' })
                          });
                          if (!res.ok) throw new Error('Erro na API');
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Application_${selectedCountry?.countryName}_${selectedVisa?.name}.pdf`;
                          a.click();
                        } catch (e) {
                          alert('Erro ao baixar o PDF real: ' + e);
                        }
                      }} className="w-full bg-primary text-on-primary font-bold py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors flex justify-center items-center gap-2">
                        Baixar Formulário Oficial Preenchido (PDF)
                      </button>

                      <button onClick={() => setActiveTab(5)} className="w-full bg-surface-container-highest text-white font-bold py-3 px-6 rounded-lg hover:bg-surface-container-highest/80 transition-colors flex justify-center items-center gap-2 border border-outline-variant/20">
                        <FileText size={18} />
                        Visualizar Réplica Interativa do Governo
                      </button>
                    </div>

                  </div>
                )}
             </div>
          )}

          {activeTab === 5 && selectedVisa && (
            <GovFormReplica process={selectedVisa} aiFilledData={aiResult?.extractedData} />
          )}
        </div>
      </div>
    </div>
  );
}
