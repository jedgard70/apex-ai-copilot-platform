import { KeyRound, UserCircle } from 'lucide-react'
import { apexRoles, getAuthProviderStatus, permissionGroups } from '../lib/authModel'

type UserAccountPanelProps = {
  onClear?: () => void
}

export function UserAccountPanel({ onClear }: UserAccountPanelProps) {
  const authMode = getAuthProviderStatus()

  return (
    <section className="studio-panel account-panel">
      <div className="studio-panel-header">
        <div>
          <span className="eyebrow">Account model</span>
          <h2>User Account</h2>
          <p>Profile, tenant, role and permissions placeholder for the future Supabase session.</p>
        </div>
        {onClear && <button className="ghost-button" onClick={onClear}>Close</button>}
      </div>

      <div className="status-strip warning">
        <KeyRound size={16} />
        <span>Auth mode: {authMode}. Local UI only until Supabase is configured.</span>
      </div>

      <div className="panel-grid two">
        <div className="panel-card">
          <h3><UserCircle size={16} /> Current session</h3>
          <p>No real Supabase session is loaded in this scaffold unless env vars are configured and login succeeds.</p>
        </div>
        <div className="panel-card">
          <h3>Profile placeholder</h3>
          <p>Name, email and avatar will come from `profiles` after CP12 real connection.</p>
        </div>
        <div className="panel-card">
          <h3>Tenant / workspace</h3>
          <p>Future source: `tenants` and `tenant_members`. No fake tenant isolation is claimed here.</p>
        </div>
        <div className="panel-card">
          <h3>Role / permissions</h3>
          <p>Future source: `tenant_members`, `project_members`, `roles`, `permissions`.</p>
        </div>
      </div>

      <div className="panel-card">
        <h3>Role matrix preview</h3>
        <div className="compact-table">
          {apexRoles.map(role => (
            <div key={role.id} className="table-row">
              <strong>{role.label}</strong>
              <span>{role.permissions.slice(0, 5).join(', ')}{role.permissions.length > 5 ? '...' : ''}</span>
            </div>
          ))}
        </div>
        <small>{permissionGroups.length} permission groups planned.</small>
      </div>
    </section>
  )
}
