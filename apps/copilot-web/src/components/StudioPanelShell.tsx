import { ReactNode } from 'react'

type StudioPanelShellProps = {
  title: string
  subtitle?: string
  icon?: string
  onClear?: () => void
  children: ReactNode
  actions?: ReactNode
}

export default function StudioPanelShell({
  title, subtitle, icon = 'auto_awesome', onClear, children, actions,
}: StudioPanelShellProps) {
  return (
    <div className="bg-surface-container/90 backdrop-blur-xl border border-outline-variant/20 rounded-2xl overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[22px]">{icon}</span>
          <div>
            <h2 className="font-sora text-[16px] font-bold text-on-surface">{title}</h2>
            {subtitle && <p className="font-inter text-[12px] text-on-surface-variant">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {onClear && (
            <button onClick={onClear} className="p-2 rounded-lg hover:bg-surface-container-highest transition-all">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">close</span>
            </button>
          )}
        </div>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  )
}

export function GridCard({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface-container/50 border border-outline-variant/10 rounded-xl p-4 ${className}`}>
      {title && <h3 className="font-jetbrains-mono text-[11px] uppercase tracking-wider text-on-surface-variant mb-3">{title}</h3>}
      {children}
    </div>
  )
}

export function MetricBadge({ label, value, color = 'text-primary' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-surface-container/50 border border-outline-variant/10 rounded-lg px-3 py-2">
      <p className="font-jetbrains-mono text-[10px] text-on-surface-variant uppercase tracking-wider">{label}</p>
      <p className={`font-sora text-[18px] font-bold ${color}`}>{value}</p>
    </div>
  )
}

export function ActionButton({ icon, label, onClick, variant = 'default' }: { icon: string; label: string; onClick?: () => void; variant?: 'default' | 'primary' | 'ghost' }) {
  const base = 'flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-jetbrains-mono transition-all duration-150'
  const styles = {
    default: 'bg-surface-container-highest text-on-surface hover:bg-surface-container-high',
    primary: 'bg-primary text-on-primary hover:bg-primary/90',
    ghost: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest',
  }
  return (
    <button onClick={onClick} className={`${base} ${styles[variant]}`}>
      <span className="material-symbols-outlined text-[16px]">{icon}</span>
      {label}
    </button>
  )
}
