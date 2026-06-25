import { useInstallPrompt } from '../lib/useInstallPrompt'
import { X, Download, Smartphone } from 'lucide-react'
import { useState } from 'react'

export function PwaInstallBanner() {
  const { canInstall, isInstalled, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('pwa_install_dismissed') === '1' } catch { return false }
  })

  // Don't show if already installed, can't install, or user dismissed
  if (isInstalled || !canInstall || dismissed) return null

  const handleInstall = async () => {
    await promptInstall()
  }

  const handleDismiss = () => {
    setDismissed(true)
    try { sessionStorage.setItem('pwa_install_dismissed', '1') } catch {}
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '72px',
        left: '12px',
        right: '12px',
        zIndex: 50,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid rgba(100, 116, 139, 0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: 'rgba(99, 102, 241, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Smartphone size={20} style={{ color: '#818cf8' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>
          Instalar no celular
        </div>
        <div style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.4' }}>
          Acesse como app nativo — mais rápido e com tela cheia
        </div>
      </div>

      <button
        onClick={handleInstall}
        style={{
          background: '#6366f1',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          padding: '8px 14px',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexShrink: 0,
        }}
      >
        <Download size={14} />
        Instalar
      </button>

      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}

/**
 * iOS-specific install instructions banner
 * (iOS doesn't support beforeinstallprompt, so we show manual instructions)
 */
export function IosInstallBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('ios_install_dismissed') === '1' } catch { return false }
  })

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)

  if (!isIos || isStandalone || !isSafari || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    try { sessionStorage.setItem('ios_install_dismissed', '1') } catch {}
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '72px',
        left: '12px',
        right: '12px',
        zIndex: 50,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid rgba(100, 116, 139, 0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'rgba(99, 102, 241, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Smartphone size={20} style={{ color: '#818cf8' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600 }}>
            Instalar no iPhone
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px' }}>
            Siga os passos abaixo:
          </div>
        </div>
        <button
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <X size={16} />
        </button>
      </div>
      <ol style={{ color: '#cbd5e1', fontSize: '12px', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
        <li>Toque no botão <strong>Compartilhar</strong> (ícone <span style={{ fontSize: '14px' }}>⬆</span>)</li>
        <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></li>
        <li>Toque em <strong>"Adicionar"</strong> para confirmar</li>
      </ol>
    </div>
  )
}
