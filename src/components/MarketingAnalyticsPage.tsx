export function MarketingAnalyticsPage() {
  return (
    <div className="h-full bg-[#0B1221] flex flex-col overflow-hidden">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 bg-[#0B1221] border-b border-white/5 flex justify-between items-center w-full px-10 h-16 shrink-0">
        <div className="flex items-center gap-8">
          <h1 className="text-3xl font-bold text-[#6C47FF] leading-none">Apex Global AI</h1>
          <div className="hidden md:flex items-center bg-[#1C294A]/50 px-4 py-2 rounded-full border border-white/10">
            <span className="material-symbols-outlined text-on-surface-variant text-sm mr-2">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm w-64 text-[#e2e2e2] placeholder:text-[#c6c6ce]" placeholder="Search marketing data..." type="text" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button className="text-[#c6c6ce] hover:text-[#e2e2e2] transition-colors cursor-pointer">
            <span className="text-[10px] font-bold uppercase tracking-widest">Switch Org</span>
          </button>
          <div className="flex items-center gap-4 text-[#c6c6ce]">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#6C47FF]">notifications</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-[#6C47FF]">settings</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-[#6C47FF]">help</span>
          </div>
          <div className="h-8 w-8 rounded-full border-2 border-[#6C47FF] overflow-hidden cursor-pointer active:scale-95 transition-transform">
            <img className="w-full h-full object-cover" alt="avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQqymaefROIv5TItUNoaDdAQtmsYXDSGSWVX6VSXCohT77CtGoqKh1tcSVN8wTM9W6ow45YcSWswYOGzwA7aMP0sTZSwoeu_PvQ5n8zIwWbBNxuXISHtaz_ADll_Np7n-B27atPCLDEoB7PxBR98LToHJfVWWrDbskjtBhSg972ZzPid1mBFFt_GzgSQBuWyBSXyW4uWt1SlO8l0Bd7zfBC0Wz0f6R93Iuyr9h5HL0vNujBeBLPEWst0XoImN6B0fDNPD24qJeRZc" />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-10 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-[#e2e2e2]">Marketing Intelligence</h2>
            <p className="text-[#c6c6ce] mt-2 max-w-2xl">Real-time performance metrics and cross-channel AI analysis for current marketing cycles.</p>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-2 border border-white/20 rounded-lg text-[#e2e2e2] hover:bg-[#1C294A] transition-all text-[10px] font-bold uppercase tracking-widest cursor-pointer">Download Report</button>
            <button className="px-6 py-2 bg-[#6C47FF] rounded-lg text-white font-bold hover:shadow-lg hover:shadow-[#6C47FF]/30 transition-all flex items-center gap-2 cursor-pointer">
              <span className="material-symbols-outlined text-sm">add</span>
              New Campaign
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Performance Metrics */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-3 gap-6">
            <div className="bg-[#16213e] p-6 rounded-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-7xl fill-1">trending_up</span>
              </div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[#7e89ab] text-[10px] font-bold uppercase tracking-widest">Click-Through Rate</span>
                <span className="text-green-400 text-xs font-bold">+12.4%</span>
              </div>
              <div className="text-4xl font-bold text-[#e2e2e2] mb-1">4.82%</div>
              <div className="text-[#c6c6ce] text-xs">AI Optimized Prediction: 5.1%</div>
            </div>
            <div className="bg-[#16213e] p-6 rounded-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-7xl fill-1">payments</span>
              </div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[#7e89ab] text-[10px] font-bold uppercase tracking-widest">Cost Per Click</span>
                <span className="text-[#6C47FF] text-xs font-bold">-0.12 USD</span>
              </div>
              <div className="text-4xl font-bold text-[#e2e2e2] mb-1">$0.84</div>
              <div className="text-[#c6c6ce] text-xs">Target Benchmark: $0.90</div>
            </div>
            <div className="bg-[#16213e] p-6 rounded-xl border border-white/5 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <span className="material-symbols-outlined text-7xl fill-1">rocket_launch</span>
              </div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[#7e89ab] text-[10px] font-bold uppercase tracking-widest">Marketing ROI</span>
                <span className="text-green-400 text-xs font-bold">3.2x</span>
              </div>
              <div className="text-4xl font-bold text-[#e2e2e2] mb-1">485%</div>
              <div className="text-[#c6c6ce] text-xs">Fiscal Q3 Projection Meta</div>
            </div>
            {/* Chart */}
            <div className="col-span-3 bg-[#16213e] p-8 rounded-xl border border-white/5 min-h-[360px] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-semibold text-[#e2e2e2]">Campaign Performance Over Time</h3>
                <div className="flex gap-2">
                  <span className="flex items-center gap-2 text-xs text-[#c6c6ce]"><div className="w-2 h-2 rounded-full bg-[#6C47FF]"></div> Search</span>
                  <span className="flex items-center gap-2 text-xs text-[#c6c6ce]"><div className="w-2 h-2 rounded-full bg-[#c9beff]"></div> Social</span>
                  <span className="flex items-center gap-2 text-xs text-[#c6c6ce]"><div className="w-2 h-2 rounded-full bg-[#ffb4ab]"></div> Email</span>
                </div>
              </div>
              <div className="flex-1 flex items-end gap-1 px-4">
                {[40,65,30,55,85,45,50,75,40,60,90].map((h, i) => (
                  <div key={i} className="flex-1 hover:opacity-80 transition-all rounded-t-lg cursor-pointer"
                    style={{ height: `${h}%`, background: i % 3 === 0 ? 'rgba(108,71,255,0.3)' : i % 3 === 1 ? 'rgba(201,190,255,0.3)' : 'rgba(255,180,171,0.3)' }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between pt-4 text-[10px] text-[#c6c6ce] font-bold uppercase tracking-widest">
                <span>Week 01</span><span>Week 02</span><span>Week 03</span><span>Week 04</span><span>Week 05</span>
              </div>
            </div>
          </div>
          {/* Right Rail */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Lead Source Donut */}
            <div className="bg-[#16213e] p-6 rounded-xl border border-white/5">
              <h3 className="text-xl font-semibold text-[#e2e2e2] mb-6">Lead Source Allocation</h3>
              <div className="flex justify-center items-center py-8">
                <div className="relative w-48 h-48 rounded-full border-[20px] border-[#1C294A] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#e2e2e2]">12.4k</div>
                    <div className="text-[10px] text-[#c6c6ce] uppercase tracking-widest">Total Leads</div>
                  </div>
                  <div className="absolute inset-[-20px] rounded-full border-[20px] border-[#6C47FF] border-r-transparent border-b-transparent rotate-[45deg]"></div>
                  <div className="absolute inset-[-20px] rounded-full border-[20px] border-[#c9beff] border-t-transparent border-l-transparent -rotate-[15deg]"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#6C47FF]"></div> Organic Search</span>
                  <span className="font-bold">45%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#c9beff]"></div> Paid Social</span>
                  <span className="font-bold">30%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#ffb4ab]"></div> Referrals</span>
                  <span className="font-bold">25%</span>
                </div>
              </div>
            </div>
            {/* Content Engagement */}
            <div className="bg-[#16213e] p-6 rounded-xl border border-white/5 flex flex-col h-full max-h-[440px]">
              <h3 className="text-xl font-semibold text-[#e2e2e2] mb-6">High Impact Content</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6C47FF transparent' }}>
                {[
                  { title: 'AI In the Enterprise: 2024 Whitepaper', badge: 'PDF', badgeColor: 'bg-[#6C47FF]', views: '4.2k', action: 'download', actionCount: '1.1k' },
                  { title: 'Executive Webinar: Q3 Strategy', badge: 'VIDEO', badgeColor: 'bg-[#c9beff]', views: '2.8k', action: 'play_circle', actionCount: '840' },
                  { title: 'Case Study: FinTech AI Scaling', badge: 'CASE', badgeColor: 'bg-[#ffb4ab]', views: '1.5k', action: 'share', actionCount: '320' },
                  { title: 'Blog: Future of Generative Ads', badge: 'ARTICLE', badgeColor: 'bg-[#6C47FF]', views: '940', action: 'chat', actionCount: '45' },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-[#1C294A]/30 rounded-lg hover:bg-[#1C294A]/50 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-bold text-[#e2e2e2] truncate pr-4">{item.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 ${item.badgeColor}/20 text-[#e2e2e2] rounded font-bold`}>{item.badge}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#c6c6ce]">
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">visibility</span> {item.views}</span>
                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">{item.action}</span> {item.actionCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Active Campaigns Table */}
          <div className="col-span-12 bg-[#16213e] rounded-xl border border-white/5 overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-[#e2e2e2]">Active Campaign Live-Feed</h3>
              <button className="text-[#6C47FF] text-sm font-bold hover:underline cursor-pointer">View All Active</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#0B1221]/40 text-[10px] font-bold uppercase tracking-widest text-[#c6c6ce]">
                  <tr>
                    <th className="px-6 py-4">Campaign Name</th>
                    <th className="px-6 py-4">Channel</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Spend</th>
                    <th className="px-6 py-4">CTR</th>
                    <th className="px-6 py-4">Conversions</th>
                    <th className="px-6 py-4">AI Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {[
                    { name: 'Global SaaS Summit Drive', channel: 'LinkedIn Ads', status: 'Active', statusColor: 'text-green-400', pulse: true, spend: '$14,200', ctr: '3.2%', conversions: '421', score: '98%' },
                    { name: 'Cloud Security Q4 Series', channel: 'Google Search', status: 'Active', statusColor: 'text-green-400', pulse: true, spend: '$28,500', ctr: '5.8%', conversions: '812', score: '94%' },
                    { name: 'Developer Tooling Newsletter', channel: 'Direct Email', status: 'Optimization', statusColor: 'text-yellow-400', pulse: false, spend: '$5,100', ctr: '12.4%', conversions: '156', score: '87%' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors cursor-pointer group">
                      <td className="px-6 py-4 font-bold text-[#e2e2e2]">{row.name}</td>
                      <td className="px-6 py-4 text-[#c6c6ce]">{row.channel}</td>
                      <td className="px-6 py-4"><span className={`flex items-center gap-1.5 ${row.statusColor}`}><div className={`w-1.5 h-1.5 rounded-full bg-current ${row.pulse ? 'animate-pulse' : ''}`}></div> {row.status}</span></td>
                      <td className="px-6 py-4 text-[#c6c6ce]">{row.spend}</td>
                      <td className="px-6 py-4 text-[#c6c6ce]">{row.ctr}</td>
                      <td className="px-6 py-4 text-[#c6c6ce]">{row.conversions}</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-[#6C47FF]/10 text-[#6C47FF] rounded font-bold">{row.score}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Floating AI Insights FAB */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-[#6C47FF] text-white rounded-full flex items-center justify-center shadow-2xl shadow-[#6C47FF]/50 hover:scale-110 active:scale-95 transition-all z-50 group cursor-pointer">
        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">auto_awesome</span>
        <div className="absolute right-full mr-4 bg-[#1C294A] p-3 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity w-48 text-left pointer-events-none">
          <p className="text-xs font-bold text-[#6C47FF] mb-1">AI Recommendation</p>
          <p className="text-[10px] text-[#c6c6ce]">Reallocate $5k from Paid Social to LinkedIn Search for 15% ROI increase.</p>
        </div>
      </button>
    </div>
  )
}
