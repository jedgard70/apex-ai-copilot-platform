import React, { useState, useEffect, useMemo } from 'react';

export function PromptsCatalogPanel() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [page, setPage] = useState(1);
  const itemsPerPage = 60;
  
  // Modal state
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [requestText, setRequestText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/copilot/prompts-catalog')
      .then(res => res.json())
      .then(data => {
        if (data.prompts) setPrompts(data.prompts);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(prompts.map(p => p.category));
    return ['Todos', ...Array.from(cats)].sort();
  }, [prompts]);

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [prompts, search, selectedCategory]);

  const paginatedPrompts = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredPrompts.slice(start, start + itemsPerPage);
  }, [filteredPrompts, page]);
  
  const totalPages = Math.ceil(filteredPrompts.length / itemsPerPage);

  const handleDispatch = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/copilot/squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Auto: ${selectedPrompt.name}`,
          goal: requestText || 'Execute a task using this skill/prompt context.',
          skill: selectedPrompt.path,
          autoStart: true
        })
      });
      if (response.ok) {
        alert('✅ Squad / Prompt despachado com sucesso!');
        setSelectedPrompt(null);
        setRequestText('');
      } else {
        alert('❌ Erro ao despachar squad.');
      }
    } catch (err) {
      alert('❌ Erro de conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full bg-[#060d20] flex items-center justify-center text-[#dbe2fd]">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined animate-spin text-4xl text-[#7df4ff]">sync</span>
          <p>Carregando milhares de Prompts e Skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-[#060d20] to-[#0b1326] flex flex-col overflow-hidden text-[#dbe2fd]">
      {/* Header */}
      <header className="bg-[#0b1326]/90 backdrop-blur-xl border-b border-white/10 p-6 shrink-0 shadow-sm z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Biblioteca de Prompts ({prompts.length} itens)</h1>
            <p className="text-[#c3c6d7] text-sm mt-1">O acervo completo de automações, skills e agentes do ecossistema Apex.</p>
          </div>
          <span className="material-symbols-outlined text-[#7df4ff] text-3xl">library_books</span>
        </div>
        
        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-xl">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#64748b]">search</span>
            <input 
              type="text" 
              placeholder="O que você quer automatizar? (ex: copy, jurídico, bim...)" 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-[#111827] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white focus:ring-2 focus:ring-[#7df4ff]/50 outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => { setSelectedCategory(cat); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                  selectedCategory === cat 
                  ? 'bg-[#7df4ff]/20 text-[#7df4ff] border-[#7df4ff]/50' 
                  : 'bg-white/5 text-[#94a3b8] border-transparent hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedPrompts.map(prompt => (
            <div 
              key={prompt.id}
              onClick={() => setSelectedPrompt(prompt)}
              className="group relative rounded-xl p-5 cursor-pointer transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
              style={{
                background: 'rgba(23,31,51,0.6)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#a78bfa] text-lg">
                  {prompt.type === 'Skill Agent' ? 'smart_toy' : 'description'}
                </span>
                <span className="text-xs font-mono text-[#a78bfa] px-2 py-0.5 rounded bg-[#a78bfa]/10">
                  {prompt.type}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-[#7df4ff] transition-colors" title={prompt.name}>
                {prompt.name}
              </h3>
              <p className="text-[#94a3b8] text-xs leading-relaxed line-clamp-3 mb-4 flex-1">
                {prompt.description}
              </p>
            </div>
          ))}
        </div>
        
        {filteredPrompts.length === 0 && (
          <div className="text-center py-20 text-[#64748b]">
            <span className="material-symbols-outlined text-5xl mb-4 opacity-50">search_off</span>
            <p>Nenhum prompt encontrado para esta busca.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-30 hover:bg-white/10"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <span className="text-sm text-[#94a3b8]">Página {page} de {totalPages}</span>
            <button 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg bg-white/5 text-white disabled:opacity-30 hover:bg-white/10"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal Dispatch */}
      {selectedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl p-8 flex flex-col shadow-2xl relative bg-[#0b1326] border border-white/10">
            <button 
              onClick={() => setSelectedPrompt(null)}
              className="absolute top-6 right-6 text-[#94a3b8] hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <h2 className="text-xl font-bold text-white mb-2">{selectedPrompt.name}</h2>
            <p className="text-[#94a3b8] text-sm mb-6">{selectedPrompt.description}</p>
            
            <label className="block text-sm font-medium text-[#c3c6d7] mb-2">
              Contexto / Instrução Adicional (Opcional):
            </label>
            <textarea 
              className="w-full h-32 bg-[#111827] border border-white/10 rounded-xl p-4 text-white placeholder:text-[#475569] focus:ring-2 focus:ring-[#7df4ff]/50 outline-none resize-none mb-6"
              placeholder="Descreva o que o agente deve fazer com este prompt..."
              value={requestText}
              onChange={e => setRequestText(e.target.value)}
            />
            
            <div className="flex justify-end gap-4">
              <button 
                onClick={() => setSelectedPrompt(null)}
                className="px-6 py-2 rounded-lg text-sm text-[#94a3b8] hover:bg-white/5"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDispatch}
                disabled={isSubmitting}
                className="px-8 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">send</span>}
                Usar Prompt / Despachar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
