import { useEffect, useState } from 'react'

type ServiceOrder = {
  id: string; number: string; serviceName: string; serviceType: string
  amount: number; currency: string; plan: string; status: string
  createdAt: string; approvedAt: string | null; deliveredAt: string | null
}

type Invoice = {
  id: string; number: string; serviceName: string; amount: number
  currency: string;   status: string; paidAt: string | null; createdAt: string
}

type ClientData = {
  name: string; email: string; status: string; totalSpent: number
  orderCount: number; firstContact: string
}

export function ClientDashboard({ email, onBack }: { email?: string; onBack?: () => void }) {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'orders' | 'invoices'>('orders')

  useEffect(() => {
    if (!email) { setLoading(false); return }
    fetch(`/api/service/my-orders?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(d => { if (d.ok) { setClient(d.client); setOrders(d.orders || []); setInvoices(d.invoices || []) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [email])

  const statusColor = (s: string) => {
    const colors: Record<string, string> = { pending: '#f59e0b', paid: '#10b981', in_progress: '#3b82f6', review: '#8b5cf6', approved: '#10b981', delivered: '#10b981', cancelled: '#ef4444' }
    return colors[s] || '#6b7280'
  }

  if (loading) return <div className="p-8 text-center" style={{ color: '#94a3b8' }}>Carregando...</div>

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '16px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/apex-global-logo.png" alt="Apex Global" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#f1f5f9' }}>Apex Global</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Apex AI Copilot</div>
          </div>
        </div>
        {onBack && (
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px' }}>
            ← Voltar ao Chat
          </button>
        )}
      </div>

      {client && (
        <div style={{ marginBottom: '24px', padding: '16px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: '20px' }}>{client.name}</h2>
          <p style={{ margin: '0 0 8px', color: '#94a3b8', fontSize: '13px' }}>{client.email}</p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#94a3b8' }}>
            <span>Pedidos: <strong style={{ color: '#e2e8f0' }}>{client.orderCount}</strong></span>
            <span>Total gasto: <strong style={{ color: '#10b981' }}>'BRL' {client.totalSpent.toFixed(2)}</strong></span>
            <span>Cliente desde: <strong style={{ color: '#e2e8f0' }}>{new Date(client.firstContact).toLocaleDateString('pt-BR')}</strong></span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setTab('orders')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === 'orders' ? '#3b82f6' : '#1e293b', color: '#fff', fontSize: '13px' }}>Pedidos</button>
        <button onClick={() => setTab('invoices')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: tab === 'invoices' ? '#3b82f6' : '#1e293b', color: '#fff', fontSize: '13px' }}>Faturas</button>
      </div>

      {tab === 'orders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {orders.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Nenhum pedido ainda.</p>}
          {orders.map(o => (
            <div key={o.id} style={{ padding: '16px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong>{o.serviceName}</strong>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: `${statusColor(o.status)}20`, color: statusColor(o.status), border: `1px solid ${statusColor(o.status)}40` }}>{o.status}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '12px' }}>
                <span>{o.number}</span>
                <span>{o.currency} {o.amount.toFixed(2)}</span>
                <span>{o.plan === 'subscription' ? 'Assinatura' : 'Único'}</span>
                <span>{new Date(o.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'invoices' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {invoices.length === 0 && <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>Nenhuma fatura ainda.</p>}
          {invoices.map(inv => (
            <div key={inv.id} style={{ padding: '16px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong>{inv.serviceName}</strong>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: inv.status === 'paid' ? '#10b98120' : '#f59e0b20', color: inv.status === 'paid' ? '#10b981' : '#f59e0b', border: `1px solid ${inv.status === 'paid' ? '#10b98140' : '#f59e0b40'}` }}>{inv.status === 'paid' ? 'Pago' : 'Pendente'}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', gap: '12px' }}>
                <span>{inv.number}</span>
                <span>{inv.currency} {inv.amount.toFixed(2)}</span>
                <span>{inv.paidAt ? `Pago em: ${new Date(inv.paidAt).toLocaleDateString('pt-BR')}` : `Criada em: ${new Date(inv.createdAt).toLocaleDateString('pt-BR')}`}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
