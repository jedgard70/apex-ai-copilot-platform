import { KeyRound, UserCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PremiumPanelLayout } from './PremiumPanelLayout'
import { apexRoles, getAuthProviderStatus, permissionGroups } from '../lib/authModel'
import { loadSupabaseAccountState, SupabaseAccountState } from '../lib/supabaseAuthBootstrap'

type UserAccountPanelProps = {
  onClear?: () => void
}

export function UserAccountPanel({ onClear }: UserAccountPanelProps) {
  const authMode = getAuthProviderStatus()
  const [account, setAccount] = useState<SupabaseAccountState | null>(null)

  useEffect(() => {
    loadSupabaseAccountState()
      .then(setAccount)
      .catch(() => setAccount(null))
  }, [])

  return (
    <PremiumPanelLayout 
      title="User Account" 
      subtitle="Ações e configurações operacionais"
      headerActions={
        onClear && <button className="ghost-button" onClick={onClear}>Close</button>
      }
    >

      <div className="status-strip warning">
        <KeyRound size={16} />
        <span>Auth mode: {authMode}. Persistence: {account?.persistenceMode || 'localStorage'}.</span>
      </div>

      <div className="panel-grid two">
        <div className="panel-card">
          <h3><UserCircle size={16} /> Current session</h3>
          <p>{account?.user ? account.user.email : 'No real Supabase session is loaded yet.'}</p>
          <small>{account?.sessionStatus || 'signed-out'} · {account?.bootstrapStatus || 'needs-login'}</small>
        </div>
        <div className="panel-card">
          <h3>Profile</h3>
          <p>{account?.profile ? account.profile.email : 'No profile row loaded yet.'}</p>
          <small>{account?.message || 'Supabase/Auth not connected yet.'}</small>
        </div>
        <div className="panel-card">
          <h3>Tenant / workspace</h3>
          <p>{account?.tenant ? account.tenant.name : 'No tenant/workspace loaded yet.'}</p>
          <small>{account?.tenant?.id || 'Tenant assignment required before remote project sync.'}</small>
        </div>
        <div className="panel-card">
          <h3>Role / permissions</h3>
          <p>{account?.role || 'No role loaded yet.'}</p>
          <small>Permissions remain policy-owned by Supabase RLS.</small>
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
    </PremiumPanelLayout>
  )
}
