import { useInstallPrompt } from '../lib/useInstallPrompt'
import { X, Download, Smartphone, Share2 } from 'lucide-react'
import { useState } from 'react'
import React from 'react'

// ─── Modal de instruções manuais ────────────────────────────────────────────
function InstallInstructionsModal({ platform, onClose }: { platform: string; onClose: () => void }) {
  const isIos = platform === 'ios-safari'
  const isAndroid = platform === 'android-chrome'
  const steps = isIos
    ? [
        { icon: '⬆️', text: 'Toque no botão Compartilhar (⬆️) na barra inferior do Safari' },
        { icon: '📋', text: 'Role e toque em "Adicionar à Tela de Início"' },
        { icon: '✅', text: 'Toque em "Adicionar" — o ícone aparece na tela inicial!' },
      ]
    : isAndroid
    ? [
        { icon: '⋮', text: 'Toque no menu (⋮) no canto superior direito do Chrome' },
        { icon: '📲', text: 'Toque em "Adicionar à tela inicial" ou "Instalar app"' },
        { icon: '✅', text: 'Confirme — o ícone da Apex AI aparece na tela inicial!' },
      ]
    : [
        { icon: '🖥️', text: 'No Chrome/Edge: clique no ícone ⊕ na barra de endereço' },
        { icon: '📌', text: 'Ou: Menu ▸ "Instalar Apex AI..."' },
        { icon: '✅', text: 'O app abre em janela própria, sem o browser' },
      ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)', borderRadius: '20px 20px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: '480px', border: '1px solid rgba(100,116,139,0.3)', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/apex-global-logo.png" alt="Apex AI" style={{ width: '32px', height: '32px', borderRadius: '8px' }} />
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '15px' }}>Instalar Apex AI</div>
              <div style={{ color: '#64748b', fontSize: '11px' }}>Acesso nativo, offline e mais rápido</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(99,102,241,0.08)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '22px', minWidth: '32px', textAlign: 'center' }}>{s.icon}</div>
              <div style={{ color: '#cbd5e1', fontSize: '13px' }}>{s.text}</div>
            </div>
          ))}
        </div>
        {isIos && (
          <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(234,179,8,0.08)', borderRadius: '10px', border: '1px solid rgba(234,179,8,0.2)' }}>
            <div style={{ color: '#fbbf24', fontSize: '11px' }}>⚠️ Funciona apenas no <strong>Safari</strong>. No Chrome do iPhone não há suporte a PWA.</div>
          </div>
        )}
        <div style={{ marginTop: '18px', textAlign: 'center', color: '#475569', fontSize: '11px' }}>www.apexglobalai.com</div>
      </div>
    </div>
  )
}

// ─── Botão fixo de instalação (sempre visível no mobile enquanto não instalado) ──
export function PwaInstallButton() {
  const { canInstall, canInstallNative, isInstalled, platform, promptInstall } = useInstallPrompt()
  const [showModal, setShowModal] = useState(false)
  const [installing, setInstalling] = useState(false)

  if (isInstalled || platform === 'already-installed' || !canInstall) return null

  const handleClick = async () => {
    if (canInstallNative) {
      setInstalling(true)
      const result = await promptInstall()
      setInstalling(false)
      if (result === 'manual') setShowModal(true)
    } else {
      setShowModal(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        title="Instalar Apex AI no celular"
        style={{ position: 'fixed', bottom: '80px', right: '16px', zIndex: 100, background: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)', color: '#fff', border: 'none', borderRadius: '50px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }}
      >
        <Download size={14} />{installing ? 'Instalando...' : 'Instalar App'}
      </button>
      {showModal && <InstallInstructionsModal platform={platform} onClose={() => setShowModal(false)} />}
    </>
  )
}

// ─── Aliases mantidos para compatibilidade com imports existentes ──────────────
export function PwaInstallBanner() {
  return <PwaInstallButton />
}

export function IosInstallBanner() {
  const [dismissed, setDismissed] = React.useState(() => {
    try { return sessionStorage.getItem('ios_install_dismissed') === '1' } catch { return false }
  })
  const [showModal, setShowModal] = React.useState(false)
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || !!(navigator as unknown as Record<string, unknown>).standalone
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua)
  if (!isIos || isStandalone || !isSafari || dismissed) return null
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{ position: 'fixed', bottom: '80px', right: '16px', zIndex: 100, background: 'linear-gradient(135deg,#6366f1 0%,#4f46e5 100%)', color: '#fff', border: 'none', borderRadius: '50px', padding: '10px 16px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 20px rgba(99,102,241,0.5)' }}
      >
        <Download size={14} />Instalar App
        <button onClick={e => { e.stopPropagation(); setDismissed(true); try { sessionStorage.setItem('ios_install_dismissed','1') } catch {} }} style={{ marginLeft: '4px', background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <X size={10} />
        </button>
      </button>
      {showModal && <InstallInstructionsModal platform="ios-safari" onClose={() => setShowModal(false)} />}
    </>
  )
}
