type OwnerPageProps = {
  onNavigate?: (view: string) => void
  onOpenChat?: (cmd: string) => void
}

export function OwnerPage({ onNavigate, onOpenChat }: OwnerPageProps) {
  return (
    <div className="h-full overflow-y-auto bg-[#0B1221] relative">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#6C47FF]/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto p-6 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6C47FF] animate-pulse"></span>
              <span className="text-[#6C47FF] font-label-caps text-[10px] tracking-widest uppercase">System Operational</span>
            </div>
            <h1 className="font-display-lg text-[32px] font-bold text-[#e2e2e2]">Owner Insights</h1>
          </div>
          <div className="flex gap-4">
            <div
              className="px-4 py-2 rounded-xl flex items-center gap-3 cursor-pointer"
              style={{
                background: 'rgba(22, 33, 62, 0.7)',
                backdropFilter: 'blur(12px)',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                borderLeft: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <span className="text-[#c6c6ce] text-xs font-label-caps">View:</span>
              <span className="text-[#e2e2e2] font-bold text-sm">Global Aggregate</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </div>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* MRR */}
          <div
            className="md:col-span-4 p-6 rounded-xl flex flex-col justify-between group cursor-pointer transition-all hover:bg-[rgba(28,41,74,0.4)]"
            style={{
              background: 'rgba(22, 33, 62, 0.7)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderLeft: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex justify-between items-start mb-8">
              <div className="h-10 w-10 rounded-lg bg-[#4804dd]/20 flex items-center justify-center text-[#c9beff]">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <span className="bg-[#6C47FF]/10 text-[#6C47FF] text-[10px] font-bold px-2 py-1 rounded-full">+12.4%</span>
            </div>
            <div>
              <p className="text-[#c6c6ce] font-label-caps text-xs tracking-wider mb-1">Monthly Recurring Revenue</p>
              <h3 className="text-3xl font-bold text-[#e2e2e2]">$2,842,910</h3>
            </div>
          </div>

          {/* Leads */}
          <div
            className="md:col-span-4 p-6 rounded-xl flex flex-col justify-between group cursor-pointer transition-all hover:bg-[rgba(28,41,74,0.4)]"
            style={{
              background: 'rgba(22, 33, 62, 0.7)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderLeft: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex justify-between items-start mb-8">
              <div className="h-10 w-10 rounded-lg bg-[#16213e]/40 flex items-center justify-center text-[#bbc5eb]">
                <span className="material-symbols-outlined">hub</span>
              </div>
              <span className="bg-[#6C47FF]/10 text-[#6C47FF] text-[10px] font-bold px-2 py-1 rounded-full">840 New</span>
            </div>
            <div>
              <p className="text-[#c6c6ce] font-label-caps text-xs tracking-wider mb-1">Total Active CRM Leads</p>
              <h3 className="text-3xl font-bold text-[#e2e2e2]">42,105</h3>
            </div>
          </div>

          {/* Marketing ROI */}
          <div
            className="md:col-span-4 p-6 rounded-xl flex flex-col justify-between group cursor-pointer transition-all hover:bg-[rgba(28,41,74,0.4)]"
            style={{
              background: 'rgba(22, 33, 62, 0.7)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderLeft: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex justify-between items-start mb-8">
              <div className="h-10 w-10 rounded-lg bg-[#93000d]/10 flex items-center justify-center text-[#ffb4ab]">
                <span className="material-symbols-outlined">track_changes</span>
              </div>
              <span className="bg-[#D71920]/10 text-[#D71920] text-[10px] font-bold px-2 py-1 rounded-full">3 High-Priority</span>
            </div>
            <div>
              <p className="text-[#c6c6ce] font-label-caps text-xs tracking-wider mb-1">Marketing ROI Index</p>
              <h3 className="text-3xl font-bold text-[#e2e2e2]">4.82x</h3>
            </div>
          </div>

          {/* Global System Health */}
          <div
            className="md:col-span-8 p-6 rounded-xl"
            style={{
              background: 'rgba(22, 33, 62, 0.7)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderLeft: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-headline-md text-lg flex items-center gap-3 text-[#e2e2e2]">
                <span className="material-symbols-outlined text-[#6C47FF]">insights</span>
                Global System Health
              </h4>
              <div className="flex gap-2">
                <div className="bg-[#0B1221]/50 px-3 py-1 rounded-full text-xs font-label-caps text-[#c6c6ce] border border-[#45464d]/10">
                  Real-time Latency: 42ms
                </div>
              </div>
            </div>
            <div className="h-48 flex items-end justify-between gap-2">
              {[80, 85, 75, 90, 82, 95, 70, 88].map((height, i) => (
                <div
                  key={i}
                  className="w-full bg-[#6C47FF]/[0.1] rounded-t-lg relative group hover:bg-[#6C47FF]/[0.2] transition-all cursor-pointer"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-[#1C294A] p-2 rounded text-[10px] border border-[#6C47FF]/20 text-[#e2e2e2] whitespace-nowrap">
                    {99.1 + i * 0.1}%
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-4 text-[10px] font-label-caps text-[#c6c6ce] uppercase tracking-widest px-1">
              <span>00:00</span>
              <span>04:00</span>
              <span>08:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>20:00</span>
            </div>
          </div>

          {/* Admin Log */}
          <div
            className="md:col-span-4 p-6 rounded-xl flex flex-col"
            style={{
              background: 'rgba(22, 33, 62, 0.7)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderLeft: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <h4 className="font-headline-md text-lg mb-6 flex items-center gap-3 text-[#e2e2e2]">
              <span className="material-symbols-outlined text-[#6C47FF]">history_edu</span>
              Admin Log
            </h4>
            <div className="space-y-4 flex-grow overflow-y-auto max-h-64">
              <div className="flex gap-4 items-start pb-4 border-b border-[#45464d]/5">
                <div className="h-8 w-8 rounded-full bg-[#1C294A] flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xs text-[#c6c6ce]">shield_person</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#e2e2e2]">New Policy Deployed</p>
                  <p className="text-xs text-[#c6c6ce]">Global Security Protocol 4.2 active</p>
                  <span className="text-[10px] text-[#6C47FF] font-label-caps mt-1 inline-block">2m ago</span>
                </div>
              </div>
              <div className="flex gap-4 items-start pb-4 border-b border-[#45464d]/5">
                <div className="h-8 w-8 rounded-full bg-[#1C294A] flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xs text-[#c6c6ce]">vpn_key</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#e2e2e2]">API Key Rotation</p>
                  <p className="text-xs text-[#c6c6ce]">Finance module secondary keys updated</p>
                  <span className="text-[10px] text-[#6C47FF] font-label-caps mt-1 inline-block">14m ago</span>
                </div>
              </div>
              <div className="flex gap-4 items-start pb-4 border-b border-[#45464d]/5">
                <div className="h-8 w-8 rounded-full bg-[#1C294A] flex-shrink-0 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xs text-[#D71920]">warning</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#D71920]">Auth Failure Detected</p>
                  <p className="text-xs text-[#c6c6ce]">3 failed attempts on Node 08-FR</p>
                  <span className="text-[10px] text-[#6C47FF] font-label-caps mt-1 inline-block">1h ago</span>
                </div>
              </div>
            </div>
            <button className="mt-6 text-[#6C47FF] font-label-caps text-xs text-center uppercase tracking-widest hover:underline transition-all">
              View Full Audit Trail
            </button>
          </div>

          {/* AI Strategy Recommendation */}
          <div
            className="md:col-span-12 p-6 rounded-xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(to right, #1C294A, #0B1221)',
              backdropFilter: 'blur(12px)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              borderLeft: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-[#6C47FF]/10 rounded-full blur-[60px] pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/3">
                <div className="bg-[#6C47FF]/10 text-[#6C47FF] px-3 py-1 rounded-full text-[10px] font-bold inline-block mb-4">AI ANALYTIC SUGGESTION</div>
                <h3 className="font-headline-md text-2xl mb-4 text-[#e2e2e2]">Optimize Finance Allocation</h3>
                <p className="text-[#c6c6ce] text-sm leading-relaxed mb-6">
                  Our AI has detected a correlation between Marketing Spend in the EMEA region and a 15% uptick in High-Value CRM leads. We recommend a 10% budget shift from North American Search Ads to EMEA Social Direct for Q3.
                </p>
                <button
                  onClick={() => onNavigate?.('crm')}
                  className="bg-[#6C47FF] text-white font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform active:scale-95 cursor-pointer"
                >
                  Execute Allocation Strategy
                </button>
              </div>
              <div className="w-full md:w-2/3 h-64 bg-[#0B1221]/40 rounded-2xl border border-white/5 p-4 flex items-center justify-center">
                <div className="text-[#c6c6ce]/40 font-label-caps text-xs text-center">
                  Financial Flow Visualization
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-20"></div>
      </div>
    </div>
  )
}
