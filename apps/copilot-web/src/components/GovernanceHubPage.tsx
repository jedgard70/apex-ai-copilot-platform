export function GovernanceHubPage() {
  return (
    <div className="h-full bg-[#0c0f0f] flex overflow-hidden">
      {/* Audit Trail & Chat */}
      <div className="flex-1 flex flex-col h-full border-r border-[#45464d]/30">
        <div className="p-6 flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#45464d transparent' }}>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6C47FF]/10 rounded-full mb-4">
              <span className="w-2 h-2 rounded-full bg-[#6C47FF] animate-pulse"></span>
              <span className="text-[#6C47FF] text-[10px] font-bold uppercase tracking-widest">Governance Live Audit</span>
            </div>
            <h3 className="text-2xl font-semibold text-[#e2e2e2] mb-2">Governance Hub</h3>
            <p className="text-[#c6c6ce] max-w-2xl">
              Audit trail for <span className="text-[#bbc5eb] font-bold">Project: Phoenix-LLM-v2</span>. I've completed the compliance scan of the deployment manifest.
            </p>
          </div>
          <div className="mb-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-[#16213e] flex items-center justify-center shrink-0 border border-[#45464d]">
                <span className="material-symbols-outlined text-[#bbc5eb] fill-1">smart_toy</span>
              </div>
              <div className="flex-1 space-y-6">
                {/* Compliance Scorecard */}
                <div className="bg-[#282a2b]/50 p-5 rounded-xl border border-[#45464d] relative">
                  <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(187,197,235,0.2), transparent)' }}></div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-bold text-[#e2e2e2] mb-1">Compliance Scorecard</h4>
                      <p className="text-xs text-[#c6c6ce]">Last Scan: 2 minutes ago</p>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl font-extrabold text-[#D71920]">82</span>
                      <span className="text-[#c6c6ce] text-[10px] font-bold uppercase tracking-widest">/100</span>
                    </div>
                  </div>
                  {/* Score Breakdown */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[#0B1221] p-4 rounded-lg border border-[#45464d]/50">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c6c6ce] mb-2 block">PII Coverage</span>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#45464d] rounded-full overflow-hidden">
                          <div className="w-[65%] h-full bg-[#D71920]"></div>
                        </div>
                        <span className="text-xs font-bold text-[#D71920]">65%</span>
                      </div>
                    </div>
                    <div className="bg-[#0B1221] p-4 rounded-lg border border-[#45464d]/50">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c6c6ce] mb-2 block">Residency</span>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#45464d] rounded-full overflow-hidden">
                          <div className="w-full h-full bg-[#bbc5eb]"></div>
                        </div>
                        <span className="text-xs font-bold text-[#bbc5eb]">100%</span>
                      </div>
                    </div>
                    <div className="bg-[#0B1221] p-4 rounded-lg border border-[#45464d]/50">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#c6c6ce] mb-2 block">Safety Alignment</span>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-[#45464d] rounded-full overflow-hidden">
                          <div className="w-[92%] h-full bg-[#bbc5eb]"></div>
                        </div>
                        <span className="text-xs font-bold text-[#bbc5eb]">92%</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Critical Findings */}
                <div className="bg-[#282a2b]/30 p-5 rounded-xl border-l-4 border-l-[#D71920]">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-[#D71920]">error</span>
                    <h4 className="font-bold text-[#e2e2e2]">3 PII Risks Detected</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[#0B1221] rounded border border-[#45464d]/30">
                      <div className="flex gap-3 items-center">
                        <span className="px-2 py-0.5 bg-[#D71920]/20 text-[#D71920] text-[10px] font-bold rounded">HIGH</span>
                        <span className="text-sm">Unmasked SSN patterns in log stream</span>
                      </div>
                      <button className="text-[#6C47FF] text-xs font-bold hover:underline cursor-pointer">Apply Redaction</button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#0B1221] rounded border border-[#45464d]/30">
                      <div className="flex gap-3 items-center">
                        <span className="px-2 py-0.5 bg-[#D71920]/20 text-[#D71920] text-[10px] font-bold rounded">HIGH</span>
                        <span className="text-sm">Raw API keys detected in prompt history</span>
                      </div>
                      <button className="text-[#6C47FF] text-xs font-bold hover:underline cursor-pointer">Apply Redaction</button>
                    </div>
                  </div>
                </div>
                {/* AI Recommendation */}
                <div className="p-4 rounded-xl border border-[#45464d]/30" style={{ background: 'rgba(22,33,62,0.7)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <p className="text-[#c6c6ce] text-sm leading-relaxed">
                    "I recommend enabling the <strong className="text-[#e2e2e2]">Toxic Input Detection</strong> guardrail immediately to mitigate prompt-injection attempts detected during the dry-run. I've also drafted a <strong className="text-[#e2e2e2]">Regional Data Residency</strong> policy for your EMEA users."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Chat Input */}
        <div className="p-6 bg-[#121414] border-t border-[#45464d]">
          <div className="relative">
            <input
              type="text"
              placeholder="Ask Copilot for audit details or policy generation..."
              className="w-full bg-[#0B1221] border border-[#45464d]/50 rounded-xl px-4 py-4 pr-36 focus:border-[#6C47FF] focus:ring-1 focus:ring-[#6C47FF] outline-none transition-all text-sm text-[#e2e2e2] placeholder-[#c6c6ce]"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <button className="p-2 text-[#c6c6ce] hover:text-[#bbc5eb] transition-colors cursor-pointer">
                <span className="material-symbols-outlined">mic</span>
              </button>
              <button className="bg-[#bbc5eb] text-[#252f4d] px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-lg">send</span>
                Send
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Security Guardrails */}
      <div className="w-[320px] bg-[#1e2020] flex flex-col h-full border-l border-[#45464d]/30 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#45464d transparent' }}>
        <div className="p-6 border-b border-[#45464d]/30">
          <h3 className="font-bold text-[#e2e2e2] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#bbc5eb]">verified_user</span>
            Security Guardrails
          </h3>
        </div>
        <div className="p-6 space-y-8">
          {/* Toggles */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#e2e2e2]">Toxic Input Detection</h4>
                <p className="text-[11px] text-[#c6c6ce]">Block profanity & adversarial prompts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-[#0B1221] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C47FF]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#e2e2e2]">Regional Data Residency</h4>
                <p className="text-[11px] text-[#c6c6ce]">Lock inference to EU-West-1</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-[#0B1221] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C47FF]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#e2e2e2]">PII Redaction Engine</h4>
                <p className="text-[11px] text-[#c6c6ce]">Auto-filter sensitive entities</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input defaultChecked type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-[#0B1221] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6C47FF]"></div>
              </label>
            </div>
          </div>
          {/* World Map */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#c6c6ce] mb-4">Global Policy Coverage</h4>
            <div className="aspect-video bg-[#0B1221] rounded-xl border border-[#45464d]/30 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 opacity-40">
                <img
                  className="w-full h-full object-cover grayscale brightness-50"
                  alt="World map"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFW-M6ixOa3j928ipRCTf3Nm4aOHPG3RYdazfCruuXk8tLHFIDsdyyu_Y1NVm14vAszx2h_3wZh23vuplSeBDSIMv3Hhg15z5mDdjfKLqbpDXzG-Wcrrz8SlO44RaWXxLONseisbcq5fLCGOvY_GGQ2W91VPL2KohhXT0m1snRQ6WY3SSe0X0s6XBXqlW3q2n7_0wZYR-bujOOH3IJXYAb3xoZZo-71Z2BNkBXd2-Q7O--Of7nkUehDC1wsjBNUohZ-wH79RcQvjg"
                />
              </div>
              <div className="z-10 text-center">
                <div className="flex justify-center -space-x-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-[#bbc5eb] border-2 border-[#0B1221]"></div>
                  <div className="w-6 h-6 rounded-full bg-[#6C47FF] border-2 border-[#0B1221]"></div>
                  <div className="w-6 h-6 rounded-full bg-[#D71920] border-2 border-[#0B1221]"></div>
                </div>
                <span className="text-[10px] font-bold text-[#e2e2e2] bg-[#0B1221]/80 px-2 py-1 rounded">3 Nodes Compliant</span>
              </div>
            </div>
          </div>
          {/* Audit Logs */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#c6c6ce] mb-4">Recent Audit Logs</h4>
            <div className="space-y-2">
              <div className="p-3 bg-[#0B1221] rounded border border-[#45464d]/20 hover:border-[#6C47FF]/50 transition-all cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-[#bbc5eb]">EU-GDPR-V4</span>
                  <span className="text-[9px] text-[#c6c6ce]">Mar 24</span>
                </div>
                <p className="text-[10px] text-[#c6c6ce] truncate">Full encryption at rest verification completed.</p>
              </div>
              <div className="p-3 bg-[#0B1221] rounded border border-[#45464d]/20 hover:border-[#6C47FF]/50 transition-all cursor-pointer">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-[#bbc5eb]">SOC2-TYPE-2</span>
                  <span className="text-[9px] text-[#c6c6ce]">Mar 22</span>
                </div>
                <p className="text-[10px] text-[#c6c6ce] truncate">Access control matrix synchronized.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-auto p-6 bg-[#282a2b]/50">
          <button className="w-full bg-[#16213e] text-[#bbc5eb] font-bold py-3 rounded-lg border border-[#bbc5eb]/20 hover:bg-[#bbc5eb] hover:text-[#252f4d] transition-all flex items-center justify-center gap-2 cursor-pointer">
            <span className="material-symbols-outlined text-lg">download</span>
            Export Governance Report
          </button>
        </div>
      </div>
    </div>
  )
}
