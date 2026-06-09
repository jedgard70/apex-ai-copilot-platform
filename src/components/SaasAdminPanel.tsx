import { Shield, Users, X } from 'lucide-react'
import {
  clientWorkspaceTemplate,
  createAdminDashboard,
  localDemoModeNotice,
  localDemoUsers,
  rolePermissions,
  saasPlans,
} from '../lib/saasBusinessModel'

type SaasAdminPanelProps = {
  goal: string
  onClear: () => void
}

export function SaasAdminPanel({ goal, onClear }: SaasAdminPanelProps) {
  const dashboard = createAdminDashboard()

  return (
    <section className="business-studio contracts-studio">
      <div className="contracts-head">
        <div>
          <span><Shield size={16} /> SaaS Admin Layer</span>
          <h2>Users, roles and client workspace</h2>
          <p>{localDemoModeNotice}. No real login, database persistence or payment connector is active.</p>
        </div>
        <button onClick={onClear} aria-label="Close SaaS Admin"><X size={18} /></button>
      </div>

      <div className="business-alert">
        <strong>Truth rule</strong>
        <span>Client access boundaries are modeled locally only. Real production protection requires approved auth, database and RLS later.</span>
      </div>

      <div className="business-kpi-grid">
        <div><strong>{dashboard.usersCount}</strong><span>local users</span></div>
        <div><strong>{dashboard.clientsCount}</strong><span>clients</span></div>
        <div><strong>{dashboard.projectsCount}</strong><span>projects</span></div>
        <div><strong>{dashboard.leadsCount}</strong><span>leads</span></div>
        <div><strong>{dashboard.proposalsCount}</strong><span>proposals</span></div>
      </div>

      <div className="contracts-grid">
        <div className="contracts-card">
          <h3><Users size={15} /> Local demo users</h3>
          <div className="contracts-table">
            <table>
              <thead>
                <tr><th>Name</th><th>Role</th><th>Access</th><th>Status</th></tr>
              </thead>
              <tbody>
                {localDemoUsers.map(user => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.role}</td>
                    <td>{user.accessLevel}</td>
                    <td>{user.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="contracts-card">
          <h3>Admin dashboard</h3>
          <ul>
            {dashboard.usageSummary.map(item => <li key={item}>{item}</li>)}
            {dashboard.openTasks.map(item => <li key={item}>{item}</li>)}
          </ul>
          <p className="business-muted">{dashboard.revenuePlaceholder}</p>
        </div>
      </div>

      <div className="contracts-card">
        <h3>Permission matrix</h3>
        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Role</th>
                <th>Client workspace</th>
                <th>Internal data</th>
                <th>Finance</th>
                <th>Sales</th>
              </tr>
            </thead>
            <tbody>
              {rolePermissions.map(rule => (
                <tr key={rule.role}>
                  <td><strong>{rule.role}</strong><br /><small>{rule.description}</small></td>
                  <td>{rule.canAccessClientWorkspace ? 'Allowed' : 'Blocked'}</td>
                  <td>{rule.canAccessInternalData ? 'Allowed' : 'Blocked'}</td>
                  <td>{rule.canManageFinance ? 'Allowed' : 'Blocked'}</td>
                  <td>{rule.canManageSales ? 'Allowed' : 'Blocked'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="contracts-card">
        <h3>Client dashboard scaffold</h3>
        <p>{clientWorkspaceTemplate.dataBoundary}</p>
        <div className="business-client-strip">
          {clientWorkspaceTemplate.projects.map(project => (
            <div key={project.id}>
              <strong>{project.name}</strong>
              <span>{project.status}</span>
              <small>{project.nextAction}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="contracts-card">
        <h3>SaaS plans</h3>
        <div className="contracts-table">
          <table>
            <thead>
              <tr><th>Plan</th><th>Target</th><th>Modules</th><th>Price confidence</th></tr>
            </thead>
            <tbody>
              {saasPlans.map(plan => (
                <tr key={plan.name}>
                  <td>{plan.name}</td>
                  <td>{plan.targetUser}</td>
                  <td>{plan.includedModules.join(', ')}</td>
                  <td>{plan.sourceConfidence} · {plan.suggestedPricePlaceholder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="business-footer-note">Current command: {goal || 'Open SaaS admin/client workspace layer.'}</div>
    </section>
  )
}
