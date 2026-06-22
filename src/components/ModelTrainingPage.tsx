export function ModelTrainingPage() {
  return (
    <div className="h-full bg-[#0B1221] text-[#e2e2e2] overflow-hidden flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 sticky top-0 z-40 bg-[#121414] flex items-center justify-between px-8 border-b border-[#45464d] shrink-0">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-semibold text-[#e2e2e2]">Model Training - Apex AI Copilot</h2>
            <nav className="flex gap-6">
              <span className="text-sm text-[#c6c6ce] hover:text-[#e2e2e2] transition-colors cursor-pointer">Analytics</span>
              <span className="text-sm text-[#bbc5eb] font-bold border-b-2 border-[#bbc5eb] pb-1 cursor-pointer">Supervision</span>
              <span className="text-sm text-[#c6c6ce] hover:text-[#e2e2e2] transition-colors cursor-pointer">Logs</span>
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[#c6c6ce]">
              <span className="material-symbols-outlined cursor-pointer hover:text-[#bbc5eb]">notifications</span>
              <span className="material-symbols-outlined cursor-pointer hover:text-[#bbc5eb]">settings</span>
            </div>
            <button className="bg-[#bbc5eb] text-[#252f4d] px-6 py-2 rounded-full font-bold text-sm hover:opacity-80 transition-opacity cursor-pointer">
              Deploy Model
            </button>
            <div className="w-8 h-8 rounded-full bg-[#16213e] border border-[#909098] overflow-hidden">
              <img className="w-full h-full object-cover" alt="avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDcRHq72BWiwjhp5TagyVWgKBRRpdDWB0MDU0g0jv5CLXiuQbcQkLpPBWljPnZz5PMz2drNNi3aYymgby7u3bYmyncYipr1QqzQMIdn65xWpToT3Tdh3FTAzdbZiYhyxJD5DG5N46VUx6Oxr71A8HgV1mup-kUl6WmilCLzBsTUC-Khui-NRRo7d-ws7E84OT9wQ6OcSqJbrInhE2SaICeofCvOXbym7yr8dzNNRcUkhq6E8K1boshjaVfLUBzI6Rk5C9q-sFTP10" />
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-10">
          <div className="grid grid-cols-12 gap-8 h-full">
            {/* Training Progress & Controls */}
            <div className="col-span-8 space-y-8">
              {/* Active Job */}
              <section className="p-8 rounded-2xl relative overflow-hidden" style={{ background: 'rgba(22,33,62,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="absolute top-0 right-0 p-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#6C47FF]/10 rounded-full border border-[#6C47FF]/20">
                    <div className="w-2 h-2 rounded-full bg-[#6C47FF]" style={{ animation: 'pulse-glow 2s cubic-bezier(0.4,0,0.6,1) infinite' }}></div>
                    <span className="text-[#6C47FF] font-bold text-[10px] tracking-widest uppercase">Live Training</span>
                  </div>
                </div>
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <p className="text-[#c6c6ce] text-sm mb-1 uppercase font-bold">Training Job ID</p>
                    <h3 className="text-xl font-semibold">v4-fine-tune-llama-8b-enterprise</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[#c6c6ce] text-sm mb-1">Epoch Progress</p>
                    <p className="text-3xl font-bold">14 <span className="text-[#c6c6ce] text-lg">/ 50</span></p>
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="relative py-8">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-[#282a2b] -translate-y-1/2 rounded-full"></div>
                  <div className="absolute top-1/2 left-0 w-[28%] h-1 bg-[#6C47FF] -translate-y-1/2 rounded-full" style={{ boxShadow: '0 0 15px #6C47FF' }}></div>
                  <div className="flex justify-between relative z-10">
                    {[
                      { icon: 'check', label: 'Data Loading', done: true },
                      { icon: 'check', label: 'Pre-processing', done: true },
                      { icon: 'psychology', label: 'Fine-tuning', active: true },
                      { icon: 'science', label: 'Validation', active: false },
                      { icon: 'rocket_launch', label: 'Checkpoint', active: false },
                    ].map((step, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${step.active ? 'bg-[#6C47FF] text-white' : step.done ? 'bg-[#6C47FF] text-white' : 'bg-[#333535] border border-[#45464d] text-[#c6c6ce]'} ${step.active ? '' : ''}`} style={step.active ? { animation: 'pulse-glow 2s cubic-bezier(0.4,0,0.6,1) infinite' } : {}}>
                          <span className="material-symbols-outlined fill-1">{step.icon}</span>
                        </div>
                        <span className={`text-xs font-bold ${step.active ? 'text-[#6C47FF]' : 'text-[#e2e2e2]'} ${!step.done && !step.active ? 'opacity-40' : ''}`}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                  <button className="flex-1 bg-[#D71920] text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer">
                    <span className="material-symbols-outlined">pause_circle</span>
                    Pause Training
                  </button>
                  <button className="flex-1 bg-[#333535] border border-[#45464d] text-[#e2e2e2] py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#282a2b] transition-all cursor-pointer">
                    <span className="material-symbols-outlined">tune</span>
                    Adjust Hyperparameters
                  </button>
                  <button className="flex-1 bg-[#333535] border border-[#45464d] text-[#e2e2e2] py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#282a2b] transition-all cursor-pointer">
                    <span className="material-symbols-outlined">terminal</span>
                    View Logs
                  </button>
                </div>
              </section>

              {/* Infrastructure Stats */}
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: 'GPU UTILIZATION', value: '94.2%', accent: true, bars: [4,6,8,5] },
                  { label: 'MEM USAGE', value: '78.1 GB', sub: 'A100 x 4 Cluster' },
                  { label: 'EST. TIME REMAINING', value: '04:12:33', icon: 'schedule' },
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-2xl" style={{ background: 'rgba(22,33,62,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p className="text-[#c6c6ce] text-[10px] font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <span className={`text-2xl font-bold ${stat.accent ? 'text-[#6C47FF]' : ''}`}>{stat.value}</span>
                      {stat.bars ? (
                        <div className="flex gap-1 h-8 items-end">
                          {stat.bars.map((h, j) => (
                            <div key={j} className="w-1 bg-[#6C47FF] rounded-full" style={{ height: `${h * 12}%`, opacity: 0.4 + j * 0.15 }}></div>
                          ))}
                        </div>
                      ) : stat.sub ? (
                        <span className="text-xs text-[#c6c6ce]">{stat.sub}</span>
                      ) : (
                        <span className="material-symbols-outlined text-[#c6c6ce]">schedule</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Live Console */}
              <div className="bg-[#0c0f0f] border border-[#45464d] rounded-xl p-4 font-mono text-[11px] leading-relaxed text-[#c6c6ce] overflow-hidden h-40">
                <p className="text-[#6C47FF] opacity-50">[SYSTEM] Initialization of tensor parallelism complete...</p>
                <p>[TRAIN] Epoch 14, Step 4420: Loss 0.04321, Grad Norm 0.81</p>
                <p>[TRAIN] Epoch 14, Step 4421: Loss 0.04298, Grad Norm 0.79</p>
                <p className="text-[#ff403b]">[VALID] Validation loss decreased 0.0451 -&gt; 0.0448. Saving checkpoint...</p>
                <p>[TRAIN] Epoch 14, Step 4422: Loss 0.04285, Grad Norm 0.83</p>
                <div className="inline-block w-2 h-4 bg-[#6C47FF] ml-1" style={{ animation: 'pulse 1s infinite' }}></div>
              </div>
            </div>

            {/* AI Copilot Chat Panel */}
            <div className="col-span-4 h-full">
              <div className="rounded-2xl h-full flex flex-col" style={{ background: 'rgba(22,33,62,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="p-6 border-b border-[#45464d] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#6C47FF]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#6C47FF] text-xl fill-1">smart_toy</span>
                    </div>
                    <span className="font-bold text-[#bbc5eb]">Copilot Insight</span>
                  </div>
                  <span className="material-symbols-outlined text-[#c6c6ce] cursor-pointer">more_vert</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="bg-[#16213e] p-4 rounded-xl rounded-tl-none border-l-2 border-[#6C47FF]">
                    <p className="text-sm leading-relaxed text-[#e2e2e2] mb-4">
                      Training is proceeding nominally. I've observed a 12% improvement in convergence speed after the learning rate adjustment in Epoch 11.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-[#0B1221]/50 p-3 rounded-lg border border-[#45464d]">
                        <p className="text-[10px] font-bold text-[#c6c6ce] uppercase">Current Loss</p>
                        <p className="text-lg font-bold text-[#6C47FF]">0.0428</p>
                      </div>
                      <div className="bg-[#0B1221]/50 p-3 rounded-lg border border-[#45464d]">
                        <p className="text-[10px] font-bold text-[#c6c6ce] uppercase">Perplexity</p>
                        <p className="text-lg font-bold text-[#e2e2e2]">1.082</p>
                      </div>
                    </div>
                    {/* Loss SVG */}
                    <div className="w-full h-32 bg-[#0B1221]/80 rounded-lg p-2 border border-[#45464d] relative overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 200 100">
                        <path d="M0,80 Q20,75 40,65 T80,45 T120,35 T160,25 T200,20" fill="none" stroke="#6C47FF" strokeWidth="2" strokeDasharray="1000" strokeDashoffset="0" style={{ animation: 'dash 5s linear forwards infinite' }}></path>
                        <path d="M0,90 Q20,85 40,78 T80,60 T120,55 T160,48 T200,45" fill="none" stroke="#bbc5eb" strokeDasharray="2,2" strokeWidth="1"></path>
                        <text fill="#6C47FF" fontFamily="Inter" fontSize="8" fontWeight="bold" x="5" y="15">Loss Curve</text>
                      </svg>
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#6C47FF]"></span>
                        <span className="text-[8px] text-[#c6c6ce]">Training</span>
                        <span className="w-2 h-2 rounded-full bg-[#bbc5eb] ml-2"></span>
                        <span className="text-[8px] text-[#c6c6ce]">Validation</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3 py-1 bg-[#6C47FF]/10 rounded-full border border-[#6C47FF]/20 text-[11px] text-[#6C47FF] font-bold cursor-pointer hover:bg-[#6C47FF]/20 transition-all">Why is loss dipping?</div>
                    <div className="px-3 py-1 bg-[#6C47FF]/10 rounded-full border border-[#6C47FF]/20 text-[11px] text-[#6C47FF] font-bold cursor-pointer hover:bg-[#6C47FF]/20 transition-all">Optimize batch size</div>
                  </div>
                </div>
                <div className="p-6 border-t border-[#45464d]">
                  <div className="relative">
                    <input className="w-full bg-[#0B1221] border border-[#45464d] rounded-xl px-4 py-3 text-sm focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] transition-all outline-none pr-12 text-[#e2e2e2] placeholder:text-[#c6c6ce]" placeholder="Ask Copilot about training status..." type="text" />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#6C47FF] rounded-lg flex items-center justify-center text-white cursor-pointer">
                      <span className="material-symbols-outlined text-lg">arrow_upward</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px #6C47FF); }
          50% { opacity: 0.5; filter: drop-shadow(0 0 8px #6C47FF); }
        }
        @keyframes dash {
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
