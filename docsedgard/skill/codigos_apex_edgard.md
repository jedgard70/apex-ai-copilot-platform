# 📦 Repositório de Códigos — Dr. José Edgard de Oliveira
**Apex Global Ltda | AI Construction Intelligence Platform**  
Gerado em: 22/05/2026

---

## ⚠️ Status dos Arquivos na Memória

| Arquivo | Status | Código Disponível |
|---|---|---|
| Visualizador de Plantas (React) | ✅ Completo | Sim |
| Apex Creative Studio Otimizador (HTML) | ✅ Completo | Sim |
| Humanizador e Renderizador 3D (HTML) | ✅ Completo | Sim |
| `humanizador-plantas.html` | ⚠️ Mencionado | Apenas descrição |
| `quantitativo-apex.html` | ⚠️ Mencionado | Apenas descrição |
| `quantitativo-xlsx.html` | ⚠️ Mencionado | Apenas descrição |
| `pages/juridico.tsx` | ⚠️ Mencionado | Apenas descrição |
| `components/JuridicoClient.tsx` | ⚠️ Mencionado | Apenas descrição |

---

## 1. Visualizador de Plantas Arquitetônicas (React)

**Arquivo:** `PlantasViewer.tsx` (componente para integrar ao dashboard)  
**Stack:** React + Lucide Icons + TailwindCSS  
**Projeto:** Jose Edgard de Oliveira — Lote 255,12 m² | Área Construída: 280 m²  
**Destino:** Botão no canto superior direito do dashboard, ao lado de Refresh/New Project

```tsx
import React, { useState } from 'react';
import { 
  Home, 
  Maximize2, 
  Layers, 
  Layout, 
  ChevronRight, 
  Info, 
  FileText,
  Map,
  Compass,
  Square
} from 'lucide-react';

const App = () => {
  const [selectedSection, setSelectedSection] = useState(null);

  const sections = [
    { id: 1, title: "Planta Baixa", description: "Layout detalhado do pavimento térreo com divisões de cômodos.", scale: "1:100" },
    { id: 2, title: "Forro da Casa", description: "Planta de teto refletido e detalhes de acabamento superior.", scale: "1:100" },
    { id: 3, title: "Telhado", description: "Estrutura de cobertura e escoamento de águas pluviais.", scale: "1:100" },
    { id: 5, title: "Corte Piscina", description: "Seção transversal mostrando a profundidade e estrutura da piscina.", scale: "1:100" },
    { id: 6, title: "Frente Sul", description: "Elevação principal voltada para o sul.", scale: "1:100" },
    { id: 7, title: "Fundos", description: "Vista posterior da residência.", scale: "1:100" },
    { id: 8, title: "Fundos 2", description: "Detalhes adicionais da área de lazer posterior.", scale: "1:100" },
    { id: 9, title: "Fundos 3", description: "Vista detalhada da área de serviço e fundos.", scale: "1:100" },
    { id: 10, title: "Lateral Leste", description: "Elevação lateral direita.", scale: "1:100" },
    { id: 11, title: "Lateral Oeste", description: "Elevação lateral esquerda.", scale: "1:100" },
    { id: 12, title: "Fachada Principal", description: "Renderização e vista estética frontal da casa.", scale: "1:1" },
  ];

  const projectInfo = {
    title: "Projeto Arquitetônico Residencial",
    author: "Jose Edgart de Oliveira",
    date: "10/01/25",
    areas: {
      lote: "Aprox. 255.12 m²",
      construida: "280.00 m²",
      pavTerreo: "255.12 m²"
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{projectInfo.title}</h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <Compass size={16} /> Responsável Técnico: {projectInfo.author}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-500 uppercase font-semibold">Área Total</p>
            <p className="text-lg font-mono">{projectInfo.areas.construida}</p>
          </div>
          <div className="bg-blue-900/30 p-3 rounded-lg border border-blue-500/30">
            <p className="text-xs text-blue-400 uppercase font-semibold">Data</p>
            <p className="text-lg font-mono text-blue-200">{projectInfo.date}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar - List of Drawings */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Layers size={20} className="text-blue-400" /> Índice de Plantas
          </h2>
          <div className="space-y-2 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section)}
                className={`w-full text-left p-4 rounded-xl transition-all border ${
                  selectedSection?.id === section.id 
                    ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-900/20' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-blue-200/60 uppercase tracking-widest block mb-1">
                      Folha {section.id}
                    </span>
                    <h3 className="font-semibold">{section.title}</h3>
                  </div>
                  <Maximize2 size={16} className={selectedSection?.id === section.id ? 'text-white' : 'text-slate-500'} />
                </div>
                <p className={`text-xs mt-2 ${selectedSection?.id === section.id ? 'text-blue-100' : 'text-slate-400'}`}>
                  Escala {section.scale}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Detail View */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSection ? (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedSection.title}</h2>
                <div className="px-3 py-1 bg-slate-700 rounded-full text-xs font-mono text-slate-300 border border-slate-600">
                  REF: DOC-2026-P{selectedSection.id}
                </div>
              </div>
              
              {/* Virtual High-Res Frame */}
              <div className="aspect-video bg-slate-900 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
                <div className="text-center p-8">
                  <Layout size={48} className="mx-auto text-slate-700 mb-4 group-hover:text-blue-500 transition-colors" />
                  <p className="text-slate-500 font-medium italic">
                    Visualização Detalhada da {selectedSection.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-2">
                    Análise técnica processada em 1:100
                  </p>
                </div>
                
                {/* Decorative UI elements to simulate blueprint precision */}
                <div className="absolute top-4 left-4 h-8 w-px bg-slate-700"></div>
                <div className="absolute top-4 left-4 w-8 h-px bg-slate-700"></div>
                <div className="absolute bottom-4 right-4 h-8 w-px bg-slate-700"></div>
                <div className="absolute bottom-4 right-4 w-8 h-px bg-slate-700"></div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Descrição Técnica</h4>
                  <p className="text-slate-300 leading-relaxed">
                    {selectedSection.description} Esta seção do projeto foi otimizada para garantir a precisão milimétrica durante a execução da obra.
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Metadados da Planta</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between text-sm py-2 border-b border-slate-700/50">
                      <span className="text-slate-500">Escala de Impressão</span>
                      <span className="text-blue-400 font-mono">{selectedSection.scale}</span>
                    </li>
                    <li className="flex justify-between text-sm py-2 border-b border-slate-700/50">
                      <span className="text-slate-500">Tipo de Documento</span>
                      <span className="text-slate-300 italic">Arquitetônico</span>
                    </li>
                    <li className="flex justify-between text-sm py-2">
                      <span className="text-slate-500">Status de Aprovação</span>
                      <span className="text-green-500 flex items-center gap-1 font-semibold uppercase text-xs">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Processado
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-800/20 text-center p-12">
              <div className="max-w-xs">
                <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-700">
                  <FileText className="text-slate-500" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Seleção de Planta</h3>
                <p className="text-slate-500">
                  Selecione uma das plantas na lista à esquerda para visualizar os detalhes técnicos e as especificações de corte.
                </p>
              </div>
            </div>
          )}

          {/* Table of Areas Summary */}
          <div className="bg-blue-600/10 rounded-2xl border border-blue-500/20 p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Square size={18} className="text-blue-400" /> Quadro de Áreas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Lote</p>
                <p className="font-mono text-lg">{projectInfo.areas.lote}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Térreo</p>
                <p className="font-mono text-lg text-blue-400">{projectInfo.areas.pavTerreo}</p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-xl col-span-2 md:col-span-1">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Cons.</p>
                <p className="font-mono text-lg text-white underline decoration-blue-500">{projectInfo.areas.construida}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-slate-600 text-sm">
        <p>© 2025 • Gestão de Projetos Arquitetônicos • Processamento Digital de Plantas</p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}} />
    </div>
  );
};

export default App;
```

---

## 2. Apex Creative Studio — Otimizador de Plantas para IA

**Arquivo:** `apex-creative-studio.html`  
**Função:** Importa planta, aplica alto contraste (P&B) e exporta PNG otimizado para geração de imagens IA  
**Stack:** HTML puro + TailwindCSS CDN + Canvas API

```html
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Apex Creative Studio - Otimizador IA</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans h-screen flex flex-col">

    <header class="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 class="text-2xl font-black text-slate-900 tracking-tighter uppercase">Apex Creative Studio</h1>
        <button id="btnExport" class="bg-slate-900 text-white px-6 py-2 rounded-full font-bold hover:bg-slate-700 transition">Exportar Imagem</button>
    </header>

    <main class="flex-1 flex p-8 gap-8">
        <div class="w-1/3 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-6">
            <h2 class="text-xl font-bold">Otimizar Planta para IA</h2>
            <button id="btnImport" class="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl hover:border-slate-900 transition">
                Importar Planta
            </button>
            <input type="file" id="fileInput" class="hidden" accept="image/*">
            <button id="btnOptimize" class="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition">
                Otimizar Linhas (Alto Contraste)
            </button>
            <p id="statusMsg" class="text-xs text-slate-500 italic">Aguardando importação...</p>
        </div>

        <div class="flex-1 bg-white rounded-3xl shadow-inner border border-slate-100 flex items-center justify-center p-8 overflow-hidden">
            <canvas id="mainCanvas"></canvas>
        </div>
    </main>

    <script>
        const btnImport = document.getElementById('btnImport');
        const btnOptimize = document.getElementById('btnOptimize');
        const fileInput = document.getElementById('fileInput');
        const btnExport = document.getElementById('btnExport');
        const statusMsg = document.getElementById('statusMsg');
        const canvas = document.getElementById('mainCanvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        let currentImg = null;

        btnImport.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            statusMsg.innerText = "A carregar...";
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    currentImg = img;
                    statusMsg.innerText = "Imagem importada com sucesso!";
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        btnOptimize.addEventListener('click', () => {
            if (!currentImg) { alert("Por favor, importe uma planta primeiro."); return; }
            statusMsg.innerText = "A processar...";
            let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                let gray = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114);
                let val = gray > 150 ? 255 : 0;
                data[i] = data[i+1] = data[i+2] = val;
            }
            ctx.putImageData(imageData, 0, 0);
            statusMsg.innerText = "Planta otimizada para IA.";
        });

        btnExport.addEventListener('click', () => {
            if (!currentImg) return;
            const link = document.createElement('a');
            link.download = 'planta_otimizada_IA.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    </script>
</body>
</html>
```

---

## 3. Humanizador e Renderizador 3D — Plantas e Fachadas

**Arquivo:** `humanizador-renderizador-3d.html`  
**API:** Google Gemini (`gemini-2.5-flash` + `gemini-2.5-flash-image-preview`)  
**Função:** Análise de planta/fachada/corte com IA, geração de prompt, render 3D, paleta de cores, copy marketing e chat arquitetônico  
**Stack:** HTML + TailwindCSS CDN + Font Awesome + Gemini API

> ⚠️ **Nota:** A API Key `AIzaSyBi8BR_NTcu6txq8-YRBdiTfgiylzQlG_I` está hardcoded. Substituir antes de publicar.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Humanizador e Renderizador 3D: Plantas e Fachadas</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; }
        .loader { border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .color-swatch { width: 36px; height: 36px; border-radius: 50%; box-shadow: inset 0 2px 4px rgba(0,0,0,0.1); border: 2px solid white; }
        .chat-bubble-user { background-color: #d1fae5; color: #065f46; border-radius: 12px 12px 0 12px; align-self: flex-end; margin-left: 2rem; }
        .chat-bubble-ai { background-color: #f3f4f6; color: #374151; border-radius: 12px 12px 12px 0; align-self: flex-start; margin-right: 2rem; }
    </style>
</head>
<body class="min-h-screen text-gray-800 flex flex-col h-screen overflow-hidden">

    <header class="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center z-10 shrink-0">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl shadow-inner">
                <i class="fa-solid fa-layer-group"></i>
            </div>
            <div>
                <h1 class="text-xl font-bold leading-tight">Apex Global — Studio 3D</h1>
                <p class="text-xs text-slate-400">Plantas, Fachadas e Interiores com IA</p>
            </div>
        </div>
        <div class="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full text-slate-300 flex items-center gap-2">
            <i class="fa-solid fa-ruler-combined text-blue-400"></i> Escala Fixa: 1,70m
        </div>
    </header>

    <main class="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        <aside class="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col overflow-y-auto custom-scrollbar shrink-0">
            <div class="p-6 flex flex-col gap-6">
                <div>
                    <h2 class="text-xs font-bold tracking-wider uppercase text-gray-500 mb-3">1 — Imagem do Projeto 2D</h2>
                    <div id="uploadZone" class="border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-xl p-6 text-center cursor-pointer transition-colors relative group">
                        <input type="file" id="fileInput" accept="image/*" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                        <i class="fa-regular fa-image text-3xl text-blue-500 mb-2 group-hover:scale-110 transition-transform"></i>
                        <p class="text-sm font-semibold text-gray-700">Arraste ou clique</p>
                        <p class="text-xs text-gray-500 mt-1">JPG ou PNG do desenho</p>
                    </div>
                    <div id="previewWrap" class="hidden relative mt-2 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                        <img id="previewImg" src="" alt="Preview" class="w-full h-48 object-contain p-2">
                        <button id="removeFileBtn" class="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded shadow transition-colors">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </div>

                <div>
                    <h2 class="text-xs font-bold tracking-wider uppercase text-gray-500 mb-3">2 — Configurações</h2>
                    <div class="flex flex-col gap-4">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">O que é esta imagem?</label>
                            <select id="projectType" class="w-full text-sm p-2.5 bg-blue-50 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-800 shadow-sm transition-colors">
                                <option value="floorplan">📐 Planta Baixa (Vista Superior)</option>
                                <option value="facade">🏢 Fachada / Elevação (Vista Frontal)</option>
                                <option value="section">🛋️ Corte / Seção Interna (Vista Frontal)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Tipo de Edificação</label>
                            <select id="buildingType" class="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="residential">🏠 Residencial (Casa)</option>
                                <option value="apartment">🏢 Residencial (Apartamento)</option>
                                <option value="commercial">💼 Comercial / Escritório</option>
                            </select>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Escala</label>
                                <select id="scale" class="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value="50">1:50</option>
                                    <option value="100">1:100</option>
                                    <option value="25">1:25</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Nº de Pessoas</label>
                                <input type="number" id="numPeople" value="2" min="0" max="15" class="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                            </div>
                        </div>
                        <div class="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex items-center gap-2 border border-blue-100">
                            <i class="fa-solid fa-circle-info"></i>
                            <span id="scaleInfo">Figura (1,70m) = 3,4 cm no desenho</span>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 mb-1">Estilo de Renderização 3D</label>
                            <select id="renderStyle" class="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="Photorealistic high-end architectural visualization">Fotorrealista Profissional</option>
                                <option value="Cozy warm evening lighting architectural render">Iluminação Noturna Aconchegante</option>
                                <option value="Minimalist bright natural lighting architectural render">Minimalista Claro (Luz Natural)</option>
                                <option value="Stylized watercolor architectural floor plan">Estilizado / Aquarela</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button id="btnAnalyze" class="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-xl shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fa-solid fa-microchip"></i> Analisar com IA
                </button>
            </div>
        </aside>

        <section class="flex-1 bg-gray-100 overflow-y-auto custom-scrollbar p-4 md:p-8 relative">
            <div id="errorBox" class="hidden mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm">
                <div class="flex items-center">
                    <i class="fa-solid fa-triangle-exclamation text-red-500 mr-3"></i>
                    <p id="errorMessage" class="text-sm text-red-700 font-medium"></p>
                </div>
            </div>

            <div id="emptyState" class="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl text-gray-300 mb-6 shadow-sm border border-gray-200">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-700 mb-2">Workspace de Renderização</h2>
                <p class="text-sm text-gray-500 leading-relaxed">Faça o upload do seu desenho 2D à esquerda. A IA analisará o ambiente e criará um prompt otimizado para gerar uma maquete ou vista 3D fotorrealista.</p>
            </div>

            <div id="loadingState" class="hidden absolute inset-0 bg-gray-100/90 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                <div class="loader mb-4"></div>
                <p id="loadingText" class="text-blue-600 font-medium animate-pulse">Analisando imagem...</p>
            </div>

            <div id="resultsContainer" class="hidden max-w-5xl mx-auto flex flex-col xl:flex-row gap-6 items-start">
                <div class="w-full xl:w-5/12 flex flex-col gap-4">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 class="text-sm font-bold text-gray-700"><i class="fa-solid fa-clipboard-list text-blue-500 mr-2"></i>Análise da IA</h3>
                            <span class="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Concluído</span>
                        </div>
                        <div class="p-4 text-sm text-gray-600">
                            <div class="mb-4">
                                <h4 class="font-semibold text-gray-800 text-xs uppercase mb-1">Elementos Identificados</h4>
                                <p id="resAnalysis" class="leading-relaxed"></p>
                            </div>
                            <div class="mb-4">
                                <h4 class="font-semibold text-gray-800 text-xs uppercase mb-1">Humanização (<span id="lblPeopleCount"></span> Pessoas)</h4>
                                <p id="resDistribution" class="leading-relaxed"></p>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-800 text-xs uppercase mb-1">Instruções Técnicas / Revit</h4>
                                <p id="resRevit" class="leading-relaxed text-xs"></p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-slate-800 px-4 py-3 flex justify-between items-center">
                            <h3 class="text-sm font-bold text-white"><i class="fa-solid fa-terminal text-blue-400 mr-2"></i>Prompt Gerado</h3>
                        </div>
                        <div class="p-4">
                            <textarea id="resPrompt" rows="5" class="w-full text-xs font-mono p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 leading-relaxed resize-y"></textarea>
                            <button id="btnRender" class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow transition-all flex justify-center items-center gap-2">
                                <i class="fa-solid fa-cube"></i> Gerar Renderização 3D
                            </button>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-emerald-700 px-4 py-3 flex justify-between items-center">
                            <h3 class="text-sm font-bold text-white"><i class="fa-solid fa-palette text-emerald-300 mr-2"></i>Design de Interiores</h3>
                        </div>
                        <div class="p-4 text-sm">
                            <button id="btnGeneratePalette" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg shadow transition-all flex justify-center items-center gap-2 mb-3">
                                ✨ Sugerir Cores e Materiais
                            </button>
                            <div id="paletteContainer" class="hidden">
                                <div id="paletteColors" class="flex flex-wrap gap-3 mb-3"></div>
                                <ul id="paletteMaterials" class="text-xs text-gray-600 list-disc pl-4 space-y-1"></ul>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div class="bg-indigo-800 px-4 py-3 flex justify-between items-center">
                            <h3 class="text-sm font-bold text-white"><i class="fa-solid fa-bullhorn text-indigo-400 mr-2"></i>Marketing Imobiliário</h3>
                        </div>
                        <div class="p-4 text-sm">
                            <button id="btnGenerateCopy" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg shadow transition-all flex justify-center items-center gap-2 mb-3">
                                ✨ Gerar Descrição de Vendas
                            </button>
                            <div id="copyContainer" class="hidden relative">
                                <textarea id="resCopy" rows="6" class="w-full text-xs p-3 bg-indigo-50 border border-indigo-200 rounded-lg outline-none text-indigo-900 leading-relaxed resize-y" readonly></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-full xl:w-7/12 flex flex-col gap-4">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full min-h-[450px]">
                        <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                            <h3 class="text-sm font-bold text-gray-700"><i class="fa-solid fa-image text-blue-500 mr-2"></i>Resultado 3D</h3>
                            <button id="btnDownload" class="hidden text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md">
                                <i class="fa-solid fa-download mr-1"></i> Baixar
                            </button>
                        </div>
                        <div id="renderCanvas" class="flex-1 bg-gray-100 relative flex items-center justify-center p-4">
                            <div id="renderPlaceholder" class="text-center text-gray-400">
                                <i class="fa-regular fa-images text-5xl mb-3 opacity-50"></i>
                                <p class="text-sm">Clique em "Gerar Renderização 3D" para visualizar.</p>
                            </div>
                            <img id="finalImage" src="" alt="Render 3D" class="hidden max-w-full max-h-[700px] object-contain rounded shadow-lg border border-gray-200">
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-80">
                        <div class="bg-teal-800 px-4 py-3 flex justify-between items-center shrink-0">
                            <h3 class="text-sm font-bold text-white"><i class="fa-solid fa-comments text-teal-300 mr-2"></i>Assistente Virtual do Projeto</h3>
                        </div>
                        <div class="p-4 flex flex-col flex-1 bg-gray-50 overflow-hidden">
                            <div id="chatHistory" class="flex-1 overflow-y-auto mb-3 flex flex-col gap-2 pr-2 custom-scrollbar text-xs">
                                <div class="p-2 rounded-lg text-xs chat-bubble-ai">
                                    <strong>Consultor IA:</strong> Olá! Após a análise da planta/fachada, pode me fazer perguntas sobre decoração, iluminação ou distribuição do espaço!
                                </div>
                            </div>
                            <div class="flex gap-2 shrink-0">
                                <input type="text" id="chatInput" placeholder="Ex: Qual o melhor piso para essa sala?" class="flex-1 text-sm p-2 border border-gray-300 rounded-lg outline-none focus:border-teal-500" disabled>
                                <button id="btnSendChat" class="bg-teal-600 text-white px-4 py-2 rounded-lg disabled:opacity-50" disabled>
                                    <i class="fa-solid fa-paper-plane"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    <script>
        // ⚠️ SUBSTITUIR ANTES DE PUBLICAR
        const apiKey = "AIzaSyBi8BR_NTcu6txq8-YRBdiTfgiylzQlG_I";
        
        const fileInput = document.getElementById('fileInput');
        const uploadZone = document.getElementById('uploadZone');
        const previewWrap = document.getElementById('previewWrap');
        const previewImg = document.getElementById('previewImg');
        const removeFileBtn = document.getElementById('removeFileBtn');
        const projectType = document.getElementById('projectType');
        const renderStyle = document.getElementById('renderStyle');
        const scaleSelect = document.getElementById('scale');
        const scaleInfo = document.getElementById('scaleInfo');
        const numPeopleInput = document.getElementById('numPeople');
        const btnAnalyze = document.getElementById('btnAnalyze');
        const btnRender = document.getElementById('btnRender');
        const btnDownload = document.getElementById('btnDownload');
        const emptyState = document.getElementById('emptyState');
        const resultsContainer = document.getElementById('resultsContainer');
        const loadingState = document.getElementById('loadingState');
        const loadingText = document.getElementById('loadingText');
        const finalImage = document.getElementById('finalImage');
        const renderPlaceholder = document.getElementById('renderPlaceholder');
        const errorBox = document.getElementById('errorBox');
        const errorMessage = document.getElementById('errorMessage');
        const btnGenerateCopy = document.getElementById('btnGenerateCopy');
        const copyContainer = document.getElementById('copyContainer');
        const resCopy = document.getElementById('resCopy');
        const btnGeneratePalette = document.getElementById('btnGeneratePalette');
        const paletteContainer = document.getElementById('paletteContainer');
        const paletteColors = document.getElementById('paletteColors');
        const paletteMaterials = document.getElementById('paletteMaterials');
        const chatInput = document.getElementById('chatInput');
        const btnSendChat = document.getElementById('btnSendChat');
        const chatHistory = document.getElementById('chatHistory');
        let chatMessages = [];
        let currentImageBase64 = null;
        let currentMimeType = null;

        async function fetchWithBackoff(url, options, maxRetries = 5) {
            const delays = [1000, 2000, 4000, 8000, 16000];
            for (let i = 0; i < maxRetries; i++) {
                try {
                    const response = await fetch(url, options);
                    if (!response.ok) { const errText = await response.text(); throw new Error(`HTTP ${response.status}: ${errText}`); }
                    return await response.json();
                } catch (error) {
                    if (i === maxRetries - 1) throw error;
                    await new Promise(res => setTimeout(res, delays[i]));
                }
            }
        }

        scaleSelect.addEventListener('change', () => {
            const s = parseInt(scaleSelect.value);
            const cm = ((1.70 / s) * 100).toFixed(2);
            scaleInfo.textContent = `Figura (1,70m) = ${cm} cm no desenho`;
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                currentMimeType = file.type;
                currentImageBase64 = event.target.result.split(',')[1];
                previewImg.src = event.target.result;
                uploadZone.classList.add('hidden');
                previewWrap.classList.remove('hidden');
                errorBox.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        });

        removeFileBtn.addEventListener('click', () => {
            currentImageBase64 = null; currentMimeType = null; fileInput.value = '';
            previewWrap.classList.add('hidden'); uploadZone.classList.remove('hidden');
            emptyState.classList.remove('hidden'); resultsContainer.classList.add('hidden');
            chatInput.disabled = true; btnSendChat.disabled = true;
        });

        function showLoading(text) { loadingText.textContent = text; loadingState.classList.remove('hidden'); }
        function hideLoading() { loadingState.classList.add('hidden'); }
        function showError(msg) { errorMessage.textContent = msg; errorBox.classList.remove('hidden'); }

        btnAnalyze.addEventListener('click', async () => {
            if (!currentImageBase64) { showError("Faça o upload do desenho do projeto primeiro."); return; }
            errorBox.classList.add('hidden');
            showLoading("Analisando ambientes e decoração com IA Vision...");
            emptyState.classList.add('hidden'); resultsContainer.classList.add('hidden'); btnAnalyze.disabled = true;

            const pType = projectType.value;
            const bType = document.getElementById('buildingType').options[document.getElementById('buildingType').selectedIndex].text;
            const scale = scaleSelect.value;
            const numPeople = numPeopleInput.value;
            const style = renderStyle.value;
            document.getElementById('lblPeopleCount').textContent = numPeople;

            const promptStr = `Atue como especialista em visualização arquitetônica. Analise esta imagem de ${pType === 'facade' ? 'FACHADA' : pType === 'section' ? 'CORTE INTERNO' : 'PLANTA BAIXA'}.
Edificação: ${bType}. Escala: 1:${scale}. Pessoas: ${numPeople}. Estilo: ${style}.
RETORNE APENAS UM JSON VÁLIDO (sem markdown):
{"analise":"...","distribuicao":"...","revit":"...","prompt_dalle":"..."}`;

            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
                const payload = {
                    contents: [{ role: "user", parts: [{ text: promptStr }, { inlineData: { mimeType: currentMimeType, data: currentImageBase64 } }] }],
                    generationConfig: { responseMimeType: "application/json" }
                };
                const result = await fetchWithBackoff(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const data = JSON.parse(result.candidates[0].content.parts[0].text.replace(/```json|```/g, '').trim());
                document.getElementById('resAnalysis').textContent = data.analise;
                document.getElementById('resDistribution').textContent = data.distribuicao;
                document.getElementById('resRevit').textContent = data.revit;
                document.getElementById('resPrompt').value = data.prompt_dalle;
                resultsContainer.classList.remove('hidden');
                chatInput.disabled = false; btnSendChat.disabled = false; chatMessages = [];
            } catch (error) {
                showError("Falha ao analisar: " + error.message);
                emptyState.classList.remove('hidden');
            } finally { hideLoading(); btnAnalyze.disabled = false; }
        });

        btnRender.addEventListener('click', async () => {
            const promptText = document.getElementById('resPrompt').value.trim();
            if (!promptText || !currentImageBase64) return;
            showLoading("Renderizando 3D...");
            btnRender.disabled = true; renderPlaceholder.classList.add('hidden'); finalImage.classList.add('hidden');
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
                const finalPrompt = `Transform this 2D architectural drawing into a highly detailed photorealistic 3D render. Maintain exact original geometry. Apply: ${promptText}`;
                const payload = {
                    contents: [{ role: "user", parts: [{ text: finalPrompt }, { inlineData: { mimeType: currentMimeType, data: currentImageBase64 } }] }],
                    generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
                };
                const result = await fetchWithBackoff(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const base64 = result.candidates[0].content.parts.find(p => p.inlineData)?.inlineData?.data;
                if (base64) {
                    const imageUrl = `data:image/png;base64,${base64}`;
                    finalImage.src = imageUrl;
                    finalImage.onload = () => { finalImage.classList.remove('hidden'); btnDownload.classList.remove('hidden'); };
                    btnDownload.onclick = () => { const a = document.createElement('a'); a.href = imageUrl; a.download = 'render_3d.png'; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
                } else throw new Error("Falha na geração.");
            } catch (error) { showError("Falha: " + error.message); renderPlaceholder.classList.remove('hidden'); }
            finally { hideLoading(); btnRender.disabled = false; }
        });

        function appendChatMessage(text, sender) {
            const div = document.createElement('div');
            div.className = `p-2 rounded-lg text-xs ${sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`;
            div.innerHTML = sender === 'user' ? `<strong>Você:</strong> ${text}` : `<strong>Consultor IA:</strong> ${text}`;
            chatHistory.appendChild(div); chatHistory.scrollTop = chatHistory.scrollHeight;
            return div;
        }

        btnSendChat.addEventListener('click', async () => {
            const userMsg = chatInput.value.trim();
            if (!userMsg) return;
            appendChatMessage(userMsg, 'user');
            chatInput.value = '';
            const loadingBubble = appendChatMessage("Digitando...", 'ai');
            chatInput.disabled = true; btnSendChat.disabled = true;
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
                chatMessages.push({ role: "user", parts: [{ text: userMsg }] });
                const systemInstruction = { parts: [{ text: `Você é Arquiteto Consultor Virtual. Projeto analisado: ${document.getElementById('resAnalysis').textContent}. Responda de forma concisa e prática.` }] };
                const result = await fetchWithBackoff(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ systemInstruction, contents: chatMessages }) });
                const aiText = result.candidates[0].content.parts[0].text;
                chatHistory.removeChild(loadingBubble);
                appendChatMessage(aiText, 'ai');
                chatMessages.push({ role: "model", parts: [{ text: aiText }] });
            } catch (error) { chatHistory.removeChild(loadingBubble); appendChatMessage("Erro ao responder.", 'ai'); chatMessages.pop(); }
            finally { chatInput.disabled = false; btnSendChat.disabled = false; chatInput.focus(); }
        });

        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') btnSendChat.click(); });
    </script>
</body>
</html>
```

---

## 4. Arquivos Mencionados (Código NÃO Armazenado na Memória)

Os arquivos abaixo foram citados em conversas anteriores mas o código completo **não foi persistido na memória**. Para recuperá-los, será necessário reenviá-los.

### 4.1 `humanizador-plantas.html`
- **Função:** Converte plantas baixas em prompts para DALL-E / Midjourney com figuras humanas de 1,70m
- **Pipeline:** 3 etapas de processamento IA (para evitar JSON truncado)

### 4.2 `quantitativo-apex.html`
- **Função:** Parser IFC (IFCSPACE + IFCQUANTITYAREA) → materiais com SINAPI + BDI → exporta Excel/CSV/PDF
- **Pipeline:** 3 etapas de processamento IA

### 4.3 `quantitativo-xlsx.html`
- **Função:** Processa cronogramas/quantitativos do Revit em XLSX e gera takeoffs de materiais
- **Pipeline:** 3 etapas de processamento IA

### 4.4 `pages/juridico.tsx`
- **Função:** Módulo Jurídico — 7 etapas guiadas, seletor Apex Global Ltda vs. José Edgard pessoalmente
- **Features:** Formulário automático via upload, agente IA jurídico, classificação de obra, assinaturas formatadas, pagamento via Apex, exportação `.txt` e PDF

### 4.5 `components/JuridicoClient.tsx`
- **Função:** Componente client-side do Módulo Jurídico
- **Branding:** Logo `/public/logo_apex_nova.jpeg`

---

## 5. Informações de Contexto do Projeto

```json
{
  "empresa": "Apex Global Ltda",
  "responsavel": "Dr. José Edgard de Oliveira",
  "email": "jedgard70@gmail.com",
  "projeto_residencial": {
    "autor": "Jose Edgard de Oliveira",
    "lote": "255.12 m²",
    "area_construida": "280.00 m²",
    "data": "10/01/25"
  },
  "stack": {
    "frontend": ["React", "TailwindCSS", "Three.js", "Lucide Icons"],
    "backend": ["Node.js", "Python"],
    "banco": ["PostgreSQL", "Redis"],
    "ia": ["OpenAI API", "Google Gemini API"],
    "bim": ["IFC Parser", "Revit API", "Autodesk ACC"]
  },
  "modulos_implementados": [
    "Módulo Jurídico (juridico.tsx)",
    "Visualizador de Plantas",
    "Studio 3D Humanizador",
    "Otimizador IA (Canvas)"
  ],
  "pendente": "Integrar PlantasViewer ao dashboard (botão canto superior direito)"
}
```

---

*Documento gerado automaticamente a partir da memória de sessões anteriores.*  
*Para atualizar, reenvie os arquivos ausentes ou solicite nova geração.*
