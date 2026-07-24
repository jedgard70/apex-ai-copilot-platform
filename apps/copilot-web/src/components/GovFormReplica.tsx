import React, { useState } from 'react';
import { ShieldAlert, CheckCircle2, ChevronRight, FileText, Download, Fingerprint, MapPin, Building2, User } from 'lucide-react';
import { LegalProcess } from '../lib/legalCorporateModel';

interface GovFormReplicaProps {
  process: LegalProcess;
  aiFilledData?: any;
}

export function GovFormReplica({ process, aiFilledData }: GovFormReplicaProps) {
  const [formData, setFormData] = useState(aiFilledData || {});
  const [activeStep, setActiveStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const renderFormContent = () => {
    if (process.id === 'us-llc') {
      return (
        <div className="space-y-6">
          <div className="bg-[#f8f9fa] border-l-4 border-[#0051ba] p-4 text-black font-sans">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold uppercase tracking-wide text-[#333]">Department of State</h2>
                <h3 className="text-md text-[#555]">Division of Corporations</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold bg-[#e0e0e0] px-2 py-1">FORM LLC-1</span>
              </div>
            </div>
            
            <h4 className="text-center font-bold text-lg mb-4">ARTICLES OF ORGANIZATION</h4>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">1. Name of Limited Liability Company</label>
                  <input type="text" name="companyName" value={formData.companyName || ''} onChange={handleChange} className="w-full border border-gray-400 p-2 uppercase bg-white focus:outline-none focus:border-blue-500" placeholder="MUST END WITH LLC" />
                </div>
                <div>
                  <label className="block font-bold mb-1">2. State of Formation</label>
                  <select name="state" value={formData.state || 'WY'} onChange={handleChange} className="w-full border border-gray-400 p-2 bg-white focus:outline-none focus:border-blue-500">
                    <option value="WY">Wyoming</option>
                    <option value="DE">Delaware</option>
                    <option value="FL">Florida</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">3. Principal Office Address</label>
                <input type="text" name="address" value={formData.address || ''} onChange={handleChange} className="w-full border border-gray-400 p-2 bg-white focus:outline-none focus:border-blue-500 mb-2" placeholder="Street Address" />
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" name="city" value={formData.city || ''} onChange={handleChange} className="w-full border border-gray-400 p-2 bg-white focus:outline-none focus:border-blue-500" placeholder="City" />
                  <input type="text" name="zip" value={formData.zip || ''} onChange={handleChange} className="w-full border border-gray-400 p-2 bg-white focus:outline-none focus:border-blue-500" placeholder="Zip Code" />
                </div>
              </div>
              
              <div>
                <label className="block font-bold mb-1">4. Registered Agent Name and Address</label>
                <input type="text" name="agentName" value={formData.agentName || ''} onChange={handleChange} className="w-full border border-gray-400 p-2 bg-white focus:outline-none focus:border-blue-500 mb-2" placeholder="Agent Name" />
                <input type="text" name="agentAddress" value={formData.agentAddress || ''} onChange={handleChange} className="w-full border border-gray-400 p-2 bg-white focus:outline-none focus:border-blue-500" placeholder="Registered Agent Physical Address in State" />
              </div>
            </div>
            
            <div className="mt-8 border-t border-dashed border-gray-400 pt-4 flex justify-between items-center">
              <div className="text-xs text-gray-500">Signature Authorized by: Apex Legal Engine</div>
              <button className="bg-[#0051ba] text-white px-6 py-2 font-bold uppercase text-sm shadow">Submit to State</button>
            </div>
          </div>
        </div>
      );
    }
    
    if (process.id === 'br-alvara') {
      return (
        <div className="space-y-6">
          <div className="bg-white border border-gray-300 p-6 text-black font-sans shadow-inner">
            <div className="flex justify-between items-center mb-6 border-b-2 border-black pb-4">
              <div className="flex items-center gap-3">
                <Building2 size={32} className="text-black" />
                <div>
                  <h2 className="text-lg font-bold uppercase">Prefeitura Municipal</h2>
                  <h3 className="text-sm">Secretaria de Urbanismo e Obras</h3>
                </div>
              </div>
              <div className="text-right">
                <div className="border border-black px-3 py-1 text-xs font-bold">REQUERIMENTO DE ALVARÁ</div>
              </div>
            </div>
            
            <div className="space-y-5 text-sm">
              <div className="border border-gray-300 p-3 bg-gray-50">
                <h4 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase text-xs">1. Identificação do Imóvel</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs mb-1">Inscrição Imobiliária (SQL)</label>
                    <input type="text" name="sql" value={formData.sql || ''} onChange={handleChange} className="w-full border border-gray-400 p-1 bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Área do Terreno (m²)</label>
                    <input type="number" name="area" value={formData.area || ''} onChange={handleChange} className="w-full border border-gray-400 p-1 bg-white focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="border border-gray-300 p-3 bg-gray-50">
                <h4 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase text-xs">2. Qualificação do Proprietário</h4>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs mb-1">Nome/Razão Social</label>
                    <input type="text" name="ownerName" value={formData.ownerName || ''} onChange={handleChange} className="w-full border border-gray-400 p-1 bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">CPF/CNPJ</label>
                    <input type="text" name="ownerDoc" value={formData.ownerDoc || ''} onChange={handleChange} className="w-full border border-gray-400 p-1 bg-white focus:outline-none" />
                  </div>
                </div>
              </div>
              
              <div className="border border-gray-300 p-3 bg-gray-50">
                <h4 className="font-bold border-b border-gray-300 pb-2 mb-3 uppercase text-xs">3. Responsável Técnico (RT)</h4>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs mb-1">Nome do Profissional (CREA/CAU)</label>
                    <input type="text" name="rtName" value={formData.rtName || ''} onChange={handleChange} className="w-full border border-gray-400 p-1 bg-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs mb-1">Nº ART/RRT</label>
                    <input type="text" name="art" value={formData.art || ''} onChange={handleChange} className="w-full border border-gray-400 p-1 bg-white focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center pt-6">
              <button className="bg-green-700 text-white px-8 py-2 font-bold uppercase text-sm shadow-md hover:bg-green-800 transition-colors">Protocolar Processo</button>
            </div>
          </div>
        </div>
      );
    }
    
    // Default / Generic Contract
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 p-8 text-black font-serif shadow-lg max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold uppercase tracking-widest">{process.name}</h1>
            <div className="w-24 h-1 bg-black mx-auto mt-4"></div>
          </div>
          
          <div className="space-y-6 text-justify leading-relaxed">
            <p>
              This Agreement (the "Agreement") is entered into as of <input type="date" className="border-b border-black outline-none w-32 text-center" /> (the "Effective Date"), by and between:
            </p>
            <div className="pl-8 border-l-2 border-gray-300 space-y-4">
              <div>
                <strong>Party A:</strong> <input type="text" placeholder="Company Name" className="border-b border-black outline-none w-64" />, a <input type="text" placeholder="State/Country" className="border-b border-black outline-none w-32 text-center" /> corporation, with its principal place of business at <input type="text" placeholder="Address" className="border-b border-black outline-none w-full mt-2" />.
              </div>
              <div className="font-bold text-center">AND</div>
              <div>
                <strong>Party B:</strong> <input type="text" placeholder="Company Name" className="border-b border-black outline-none w-64" />, a <input type="text" placeholder="State/Country" className="border-b border-black outline-none w-32 text-center" /> corporation, with its principal place of business at <input type="text" placeholder="Address" className="border-b border-black outline-none w-full mt-2" />.
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-bold uppercase text-lg mb-2">1. Scope of Work / Obligations</h3>
              <textarea className="w-full h-32 border border-gray-300 p-2 outline-none resize-none" placeholder="Describe the scope of work here..."></textarea>
            </div>
            
            <div className="mt-4">
              <h3 className="font-bold uppercase text-lg mb-2">2. Compensation and Payment</h3>
              <p>Party B shall pay Party A the sum of $<input type="number" className="border-b border-black outline-none w-32 text-center" /> for the services rendered, payable as follows: <input type="text" className="border-b border-black outline-none w-full mt-2" placeholder="Milestones or Net 30" />.</p>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-2 gap-12">
            <div>
              <div className="border-b border-black h-8 mb-2"></div>
              <div className="font-bold text-sm uppercase">Signature Party A</div>
            </div>
            <div>
              <div className="border-b border-black h-8 mb-2"></div>
              <div className="font-bold text-sm uppercase">Signature Party B</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8">
      <div className="flex items-center gap-2 mb-6 text-on-surface-variant">
        <ShieldAlert size={20} className="text-secondary-fixed" />
        <span className="text-sm font-bold uppercase tracking-wider">Apex Official Forms Gateway</span>
      </div>
      
      <div className="mb-6 flex gap-4">
        {process.forms.map(f => (
          <div key={f.id} className="bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            <FileText size={16} />
            {f.name}
          </div>
        ))}
        {aiFilledData && (
          <div className="ml-auto bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse">
            <CheckCircle2 size={16} />
            Auto-filled by Apex AI
          </div>
        )}
      </div>

      {renderFormContent()}
      
    </div>
  );
}
