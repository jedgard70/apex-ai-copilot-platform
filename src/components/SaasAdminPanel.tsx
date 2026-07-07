import { Shield, Users, X, UserPlus, Trash, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { apexRoles, ApexRoleId } from '../lib/authModel'
import {
  clientWorkspaceTemplate,
  createAdminDashboard,
  localDemoModeNotice,
  rolePermissions,
  saasPlans,
} from '../lib/saasBusinessModel'

type SaasAdminPanelProps = {
  goal: string
  onClear: () => void
}

type RealUser = {
  id: string
  email: string
  role: ApexRoleId
  created_at: string
}

export function SaasAdminPanel({ goal, onClear }: SaasAdminPanelProps) {
  const dashboard = createAdminDashboard()
  const [users, setUsers] = useState<RealUser[]>([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<ApexRoleId>('cliente_simples')

  const fetchUsers = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/tenant/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao carregar usuários')
      setUsers(data.users || [])
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha na conexão com a API')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail) return
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/tenant/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao convidar usuário')
      
      setInviteEmail('')
      fetchUsers() // recarrega a lista
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/tenant/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole })
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as ApexRoleId } : u))
      } else {
        alert(data.error || 'Erro ao atualizar cargo')
      }
    } catch (err) {
      alert('Falha na requisição')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Deseja realmente remover o acesso deste usuário?')) return
    try {
      const res = await fetch('/api/tenant/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId })
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(users.filter(u => u.id !== userId))
      } else {
        alert(data.error || 'Erro ao remover usuário')
      }
    } catch (err) {
      alert('Falha na requisição')
    }
  }

  return (
    <section className="business-studio contracts-studio" style={{ overflowY: 'auto' }}>
      <div className="contracts-head">
        <div>
          <span><Shield size={16} /> SaaS Admin Layer</span>
          <h2>Gerenciamento de Usuários (Real-time RBAC)</h2>
          <p>Convite, alteração de cargos e restrição de rotas da plataforma.</p>
        </div>
        <button onClick={onClear} aria-label="Close SaaS Admin"><X size={18} /></button>
      </div>

      {errorMsg && (
        <div className="business-alert" style={{ background: '#5a1111', color: '#ffb5b5', borderColor: '#821a1a' }}>
          <strong>Atenção:</strong> {errorMsg}
        </div>
      )}

      <div className="contracts-card" style={{ marginBottom: '1.5rem' }}>
        <h3><UserPlus size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Convidar Novo Usuário</h3>
        <form onSubmit={handleInvite} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
          <input 
            type="email" 
            placeholder="e-mail do cliente ou funcionário..." 
            value={inviteEmail} 
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', background: '#1c1c1c', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
            required
          />
          <select 
            value={inviteRole} 
            onChange={(e) => setInviteRole(e.target.value as ApexRoleId)}
            style={{ padding: '8px 12px', background: '#1c1c1c', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
          >
            {apexRoles.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
          <button type="submit" disabled={loading} style={{ background: '#0055ff', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {loading ? <RefreshCw size={14} className="spin" /> : 'Convidar e Enviar E-mail'}
          </button>
        </form>
      </div>

      <div className="contracts-grid">
        <div className="contracts-card" style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><Users size={15} /> Usuários Ativos no Banco de Dados</h3>
            <button onClick={fetchUsers} style={{ background: 'transparent', border: '1px solid #444', color: '#ccc', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}>Atualizar</button>
          </div>
          <div className="contracts-table" style={{ marginTop: '10px' }}>
            <table>
              <thead>
                <tr><th>E-mail</th><th>Cargo (Role)</th><th>Data Criação</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#666' }}>Nenhum usuário encontrado.</td></tr>
                ) : (
                  users.map(user => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>
                        <select 
                          value={user.role} 
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          style={{ background: '#1a1a1a', color: '#eee', border: '1px solid #444', borderRadius: '4px', padding: '4px' }}
                        >
                          {apexRoles.map(r => (
                            <option key={r.id} value={r.id}>{r.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>
                        <button onClick={() => handleDelete(user.id)} title="Remover Acesso" style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}>
                          <Trash size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="contracts-card" style={{ marginTop: '1.5rem' }}>
        <h3>Matriz de Permissões (RBAC)</h3>
        <div className="contracts-table">
          <table>
            <thead>
              <tr>
                <th>Cargo (Role)</th>
                <th>Permissões Administrativas</th>
                <th>Módulos Visíveis</th>
              </tr>
            </thead>
            <tbody>
              {apexRoles.map(rule => (
                <tr key={rule.id}>
                  <td><strong>{rule.label}</strong><br /><small>{rule.description}</small></td>
                  <td>{rule.permissions.includes('admin.full_access' as any) ? 'Acesso Total' : (rule.permissions.includes('admin.manage_users' as any) ? 'Apenas Usuários' : 'Bloqueado')}</td>
                  <td>{rule.permissions.filter(p => p.includes('read')).join(', ').replace(/\.read/g, '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </section>
  )
}
