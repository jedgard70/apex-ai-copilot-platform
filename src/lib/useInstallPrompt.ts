import { useState, useEffect } from 'react'
import React from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export type InstallPlatform = 'android-chrome' | 'ios-safari' | 'desktop' | 'already-installed' | 'unknown'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstallNative, setCanInstallNative] = useState(false)
  const [platform, setPlatform] = useState<InstallPlatform>('unknown')

  useEffect(() => {
    const ua = navigator.userAgent
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as unknown as Record<string, unknown>).standalone === true

    if (isStandalone) {
      setIsInstalled(true)
      setPlatform('already-installed')
      return
    }

    const isIos = /iPad|iPhone|iPod/.test(ua)
    const isAndroid = /Android/.test(ua)
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua)
    const isChrome = /Chrome|CriOS/.test(ua)

    if (isIos && isSafari) setPlatform('ios-safari')
    else if (isAndroid && isChrome) setPlatform('android-chrome')
    else if (isIos) setPlatform('ios-safari')
    else if (isAndroid) setPlatform('android-chrome')
    else setPlatform('desktop')

    // Listen for native install prompt (Android Chrome / Desktop Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstallNative(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // canInstall = true se pode instalar de qualquer forma (nativo ou via instruções)
  const canInstall = !isInstalled && (platform === 'android-chrome' || platform === 'ios-safari' || platform === 'desktop')

  const promptInstall = async () => {
    // Android/Desktop Chrome com evento nativo disponível
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      setCanInstallNative(false)
      if (outcome === 'accepted') setIsInstalled(true)
      return outcome === 'accepted' ? 'installed' : 'dismissed'
    }
    // iOS ou Android sem evento — retorna 'manual' para mostrar instruções
    return 'manual'
  }

  return {
    canInstall,
    canInstallNative,
    isInstalled,
    platform,
    promptInstall,
  }
}
