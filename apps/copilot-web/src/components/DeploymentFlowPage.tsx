export function DeploymentFlowPage() {
  return (
    <div className="h-full bg-[#0B1221] flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="h-16 flex items-center justify-between px-8 bg-[#121414] border-b border-[#45464d] flex-shrink-0">
        <div className="flex items-center gap-8">
          <h1 className="font-headline-md text-headline-md font-bold text-[#e2e2e2]">Deployment Flow</h1>
          <div className="flex items-center gap-6">
            <span className="text-sm text-[#c6c6ce] hover:text-[#e2e2e2] transition-colors cursor-pointer">Analytics</span>
            <span className="text-sm text-[#bbc5eb] font-bold border-b-2 border-[#bbc5eb] pb-1 cursor-pointer">Supervision</span>
            <span className="text-sm text-[#c6c6ce] hover:text-[#e2e2e2] transition-colors cursor-pointer">Logs</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="material-symbols-outlined p-2 text-[#c6c6ce] hover:text-[#e2e2e2] transition-colors cursor-pointer">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#D71920] rounded-full border border-[#121414]"></span>
          </div>
          <span className="material-symbols-outlined p-2 text-[#c6c6ce] hover:text-[#e2e2e2] transition-colors cursor-pointer">settings</span>
          <div className="h-8 w-px bg-[#45464d] mx-2"></div>
          <button className="bg-[#6C47FF] text-white px-4 py-1.5 rounded-lg font-bold text-xs hover:brightness-110 transition-all">
            Deploy Model
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Traffic Visualization */}
        <div className="flex-1 p-10 flex flex-col items-center justify-center relative">
          <div className="absolute top-8 left-10 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#6C47FF] animate-pulse"></div>
            <span className="text-[10px] font-bold text-[#6C47FF] uppercase tracking-widest">Live Canary Stage: 25% Rollout</span>
          </div>

          {/* Traffic Diagram */}
          <div className="w-full max-w-4xl h-[400px] relative bg-[#16213e]/30 rounded-xl border border-[#45464d] p-8 flex items-center justify-center">
            <svg className="w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 800 400">
              <defs>
                <linearGradient id="grad-v3" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#bbc5eb" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#bbc5eb" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="grad-v4" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor="#6C47FF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6C47FF" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <rect x="50" y="170" width="60" height="60" rx="8" fill="#16213E" stroke="#bbc5eb" strokeWidth="2" />
              <text x="80" y="205" fill="#bbc5eb" fontFamily="Inter" fontSize="12" fontWeight="bold" textAnchor="middle">LB_01</text>
              <path d="M 110 200 L 300 200" fill="none" stroke="#bbc5eb" strokeDasharray="8" strokeWidth="2" opacity="0.3" />
              <path d="M 300 200 Q 350 100 450 100" fill="none" stroke="url(#grad-v3)" strokeWidth="4" strokeDasharray="8" />
              <circle cx="450" cy="100" r="30" fill="#16213E" stroke="#bbc5eb" strokeWidth="2" />
              <text x="450" y="105" fill="#bbc5eb" fontFamily="Inter" fontSize="14" fontWeight="bold" textAnchor="middle">V3</text>
              <text x="450" y="150" fill="#A0AEC0" fontFamily="Inter" fontSize="12" textAnchor="middle">75% Traffic</text>
              <text x="450" y="165" fill="#A0AEC0" fontFamily="Inter" fontSize="10" textAnchor="middle">Latency: 142ms</text>
              <path d="M 300 200 Q 350 300 450 300" fill="none" stroke="url(#grad-v4)" strokeWidth="6" strokeDasharray="8" />
              <circle cx="450" cy="300" r="35" fill="#16213E" stroke="#6C47FF" strokeWidth="3" />
              <text x="450" y="305" fill="#6C47FF" fontFamily="Inter" fontSize="16" fontWeight="black" textAnchor="middle">V4</text>
              <text x="450" y="360" fill="#e2e2e2" fontFamily="Inter" fontSize="12" fontWeight="bold" textAnchor="middle">25% Traffic</text>
              <text x="450" y="375" fill="#6C47FF" fontFamily="Inter" fontSize="10" textAnchor="middle">Latency: 89ms</text>
              <circle cx="300" cy="200" r="10" fill="#6C47FF" />
            </svg>

            <div className="absolute bottom-8 right-8 space-y-4">
              <div className="p-4 rounded-xl border-l-4 border-[#6C47FF] w-64 shadow-2xl" style={{ background: 'rgba(22,33,62,0.8)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-[#c6c6ce] uppercase tracking-widest">V4 STATUS</span>
                  <span className="text-[10px] bg-[#6C47FF]/20 text-[#6C47FF] px-2 py-0.5 rounded-full font-bold">STABLE</span>
                </div>
                <div className="text-2xl font-bold text-white">89.4 <span className="text-sm font-normal text-[#c6c6ce]">ms</span></div>
                <div className="text-[10px] text-[#6C47FF] font-bold">▼ 37% improvement vs V3</div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center gap-6">
            <button className="flex items-center gap-3 px-8 py-4 rounded-xl border border-[#D71920]/30 hover:bg-[#D71920]/10 transition-all active:scale-95 cursor-pointer">
              <span className="material-symbols-outlined text-[#D71920]">history</span>
              <span className="text-[10px] font-bold text-[#D71920] uppercase tracking-widest">Rollback to V3</span>
            </button>
            <button className="flex items-center gap-3 px-10 py-4 rounded-xl bg-[#6C47FF] text-white shadow-[0_0_30px_rgba(108,71,255,0.4)] hover:brightness-110 transition-all active:scale-95 cursor-pointer">
              <span className="material-symbols-outlined">rocket_launch</span>
              <span className="text-xs font-bold uppercase tracking-widest">Promote to 100%</span>
            </button>
          </div>
        </div>

        {/* Right: AI Copilot Chat */}
        <div className="w-[380px] border-l border-[#45464d] bg-[#1a1c1c] flex flex-col flex-shrink-0">
          <div className="p-6 border-b border-[#45464d] flex items-center gap-3">
            <span className="material-symbols-outlined text-[#6C47FF]">auto_awesome</span>
            <h2 className="font-headline-md text-lg font-bold text-[#e2e2e2]">AI Copilot Analysis</h2>
          </div>
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#16213e] flex items-center justify-center shrink-0" style={{ boxShadow: '0 0 15px rgba(180,197,255,0.15)' }}>
                <span className="material-symbols-outlined text-[#6C47FF] text-sm">smart_toy</span>
              </div>
              <div className="flex-1 p-4 rounded-2xl rounded-tl-none border border-[#45464d]/30" style={{ background: 'rgba(22,33,62,0.8)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-sm text-[#e2e2e2] leading-relaxed">
                  Monitoring the <span className="text-[#6C47FF] font-bold">Canary Rollout</span>. System health metrics remain optimal across all shards.
                </p>
              </div>
            </div>
            <div className="ml-12 p-5 rounded-2xl bg-[#16213e]/40 border border-[#6C47FF]/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#6C47FF]"></div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#6C47FF] text-sm">analytics</span>
                <span className="text-[10px] font-bold text-[#6C47FF] uppercase tracking-widest">Risk Assessment</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-[#45464d]/20 pb-2">
                  <span className="text-xs text-[#c6c6ce]">Global Latency</span>
                  <span className="text-lg font-bold text-white">-52ms</span>
                </div>
                <div className="flex justify-between items-end border-b border-[#45464d]/20 pb-2">
                  <span className="text-xs text-[#c6c6ce]">Error Rate (V4)</span>
                  <span className="text-lg font-bold text-white">0.02%</span>
                </div>
                <div className="flex justify-between items-end border-b border-[#45464d]/20 pb-2">
                  <span className="text-xs text-[#c6c6ce]">Memory Footprint</span>
                  <span className="text-lg font-bold text-white">4.2GB <span className="text-[10px] text-green-400">Stable</span></span>
                </div>
              </div>
              <p className="mt-4 text-xs text-[#c6c6ce] italic leading-tight">
                "V4 shows significant performance gains in token generation. I recommend promoting to 50% within the next 15 minutes."
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#16213e] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#6C47FF] text-sm">bolt</span>
              </div>
              <div className="flex-1 p-4 rounded-2xl rounded-tl-none border border-[#45464d]/30" style={{ background: 'rgba(22,33,62,0.8)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <p className="text-sm text-[#e2e2e2]">Shall I initiate the next step of the traffic split?</p>
                <div className="flex gap-2 mt-4">
                  <button className="px-3 py-1.5 rounded-lg border border-[#6C47FF]/30 text-[10px] font-bold text-[#6C47FF] hover:bg-[#6C47FF]/10 transition-colors uppercase tracking-wider cursor-pointer">Increase to 50%</button>
                  <button className="px-3 py-1.5 rounded-lg border border-[#45464d]/30 text-[10px] font-bold text-[#c6c6ce] hover:bg-white/5 transition-colors uppercase tracking-wider cursor-pointer">Show Details</button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 bg-[#1a1c1c] border-t border-[#45464d]">
            <div className="relative">
              <input
                type="text"
                placeholder="Ask Copilot about deployment metrics..."
                className="w-full bg-[#0B1221] border border-[#45464d] rounded-xl py-3 px-4 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] outline-none text-sm text-white placeholder-[#c6c6ce] transition-all"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#6C47FF] text-white flex items-center justify-center hover:brightness-110 cursor-pointer">
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
