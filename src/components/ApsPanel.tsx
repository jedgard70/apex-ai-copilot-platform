import { useEffect, useState } from 'react'
import { CheckCircle2, RefreshCw, X, Zap } from 'lucide-react'

type ApsStatus = {
  connector: string
  configured: boolean
  live: boolean
  token_type?: string
  expires_in?: number
  reason: string | null
  checks?: { APS_CLIENT_ID: boolean; APS_CLIENT_SECRET: boolean }
}

type ApsPanelProps = {
  onClear?: () => void
}

export function ApsPanel({ onClear }: ApsPanelProps) {
  const [status, setStatus] = useState<ApsStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [hubs, setHubs] = useState<unknown[] | null>(null)
  const [hubsLoading, setHubsLoading] = useState(false)
  const [hubsError, setHubsError] = useState('')

  async function checkStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/aps/status')
      const data: ApsStatus = await res.json()
      setStatus(data)
    } catch (error) {
      setStatus({ connector: 'autodesk-platform-services', configured: false, live: false, reason: error instanceof Error ? error.message : 'Request failed.' })
    } finally {
      setLoading(false)
    }
  }

  async function getToken() {
    setTokenLoading(true)
    setTokenError('')
    setToken(null)
    try {
      const res = await fetch('/api/aps/token', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Token request failed.')
      setToken(`${data.token_type} ...${String(data.access_token).slice(-12)}  (expires in ${data.expires_in}s)`)
    } catch (error) {
      setTokenError(error instanceof Error ? error.message : 'Token failed.')
    } finally {
      setTokenLoading(false)
    }
  }

  async function listHubs() {
    setHubsLoading(true)
    setHubsError('')
    setHubs(null)
    try {
      const res = await fetch('/api/aps/hubs')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Hubs request failed.')
      setHubs(data.data || data)
    } catch (error) {
      setHubsError(error instanceof Error ? error.message : 'Hubs failed.')
    } finally {
      setHubsLoading(false)
    }
  }

  useEffect(() => { checkStatus() }, [])

  const isLive = status?.live

  return (
    <section className="business-studio contracts-studio">
      <div className="contracts-heading">
        <div>
          <span><Zap size={16} /> Autodesk Platform Services</span>
          <h2>APS connector — 2-legged OAuth + Data Management API</h2>
          <p>Server-side connector using Client Credentials (secrets never exposed to browser).</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          <button onClick={checkStatus} disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
            <RefreshCw size={16} className={loading ? 'spin-icon' : ''} /> {loading ? 'Checking...' : 'Refresh status'}
          </button>
          {onClear && (
            <button className="ghost-action" type="button" onClick={onClear} aria-label="Close APS Panel">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="contracts-card">
        <h3>Connector status</h3>
        <div className="business-alert">
          <strong>{isLive ? '✓ APS Live' : status?.configured ? '⚠ Configured but not verified live' : '✗ Not configured'}</strong>
          <span>
            {status
              ? status.reason || (isLive ? `Token verified. Type: ${status.token_type}, expires in ${status.expires_in}s.` : '')
              : 'Loading...'}
          </span>
        </div>
        {status && (
          <table style={{ marginTop: '8px', fontSize: '12px', width: '100%' }}>
            <tbody>
              <tr><td><strong>Connector</strong></td><td>{status.connector}</td></tr>
              <tr><td><strong>APS_CLIENT_ID present</strong></td><td>{String(status.checks?.APS_CLIENT_ID ?? status.configured)}</td></tr>
              <tr><td><strong>APS_CLIENT_SECRET present</strong></td><td>{String(status.checks?.APS_CLIENT_SECRET ?? status.configured)}</td></tr>
              <tr><td><strong>Live auth test</strong></td><td>{isLive ? '✓ passed' : '✗ failed'}</td></tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="contracts-card">
        <h3>2-legged token test</h3>
        <p>Request a real access token from APS via server-side credentials (secret stays on server).</p>
        <div className="contracts-actions">
          <button type="button" onClick={getToken} disabled={tokenLoading || !status?.configured}>
            <CheckCircle2 size={15} /> {tokenLoading ? 'Requesting...' : 'Get APS token'}
          </button>
        </div>
        {token && <pre style={{ marginTop: '8px', fontSize: '11px', background: 'var(--bg-subtle, #f5f5f5)', padding: '8px', borderRadius: '4px' }}>{token}</pre>}
        {tokenError && <p style={{ color: 'var(--color-danger, red)', marginTop: '8px' }}>{tokenError}</p>}
      </div>

      <div className="contracts-card">
        <h3>Data Management — Hubs</h3>
        <p>Lists ACC / BIM 360 hubs accessible to this app. A 2-legged app requires explicit hub provisioning in the APS portal; an empty list is normal for newly created apps.</p>
        <div className="contracts-actions">
          <button type="button" onClick={listHubs} disabled={hubsLoading || !isLive}>
            <RefreshCw size={15} className={hubsLoading ? 'spin-icon' : ''} /> {hubsLoading ? 'Loading hubs...' : 'List hubs'}
          </button>
        </div>
        {hubs !== null && (
          <pre style={{ marginTop: '8px', fontSize: '11px', background: 'var(--bg-subtle, #f5f5f5)', padding: '8px', borderRadius: '4px', maxHeight: '180px', overflow: 'auto' }}>
            {JSON.stringify(hubs, null, 2)}
          </pre>
        )}
        {hubsError && <p style={{ color: 'var(--color-danger, red)', marginTop: '8px' }}>{hubsError}</p>}
      </div>
    </section>
  )
}
