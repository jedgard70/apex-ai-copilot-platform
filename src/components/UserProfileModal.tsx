import React, { useState, useEffect } from 'react'
import { X, User, Camera, Mic, Video, ShieldCheck, Mail, MapPin, Phone, Check, Sparkles, AlertCircle } from 'lucide-react'

export interface UserProfileData {
  fullName: string
  email: string
  phone: string
  address: string
  avatarUrl: string
  voiceName: string
  voiceId: string
  avatarModelRef: string
  role: 'owner_admin' | 'cliente_pro' | 'cliente_basic'
  subscriptionPlan: string
}

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserEmail?: string
  currentUserRole?: string
  onSave?: (profile: UserProfileData) => void
}

const DEFAULT_PROFILE: UserProfileData = {
  fullName: 'Dr. Edgard (Owner)',
  email: 'jedgard70@gmail.com',
  phone: '+55 (16) 99466-7667',
  address: 'Lins / São Paulo - Brasil',
  avatarUrl: '',
  voiceName: 'Voz Sintética Dr. Edgard v2',
  voiceId: 'eleven_labs_dr_edgard_master',
  avatarModelRef: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400',
  role: 'owner_admin',
  subscriptionPlan: 'Plano Enterprise Owner (Ilimitado)',
}

export function UserProfileModal({ isOpen, onClose, currentUserEmail, currentUserRole, onSave }: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfileData>(() => {
    const saved = localStorage.getItem('apex_user_profile_data')
    if (saved) {
      try { return JSON.parse(saved) } catch (_) {}
    }
    const isOwner = ['jedgard70@gmail.com','owner@apexglobalai.co','edgard@apexglobalai.co'].includes(currentUserEmail?.toLowerCase() || '') || currentUserRole === 'owner' || currentUserRole === 'owner_admin'
    return {
      ...DEFAULT_PROFILE,
      email: isOwner ? 'jedgard70@gmail.com' : (currentUserEmail || DEFAULT_PROFILE.email),
      fullName: isOwner ? 'Dr. Edgard (Platform Owner)' : 'Assinante Apex Pro',
      role: isOwner ? 'owner_admin' : 'cliente_pro',
      subscriptionPlan: isOwner ? 'Plano Enterprise Owner (Ilimitado)' : 'Assinatura Apex AI Pro',
    }
  })

  const [savedSuccess, setSavedSuccess] = useState(false)
  const isOwner = profile.role === 'owner_admin' || ['jedgard70@gmail.com','owner@apexglobalai.co','edgard@apexglobalai.co'].includes(currentUserEmail?.toLowerCase() || '') || currentUserRole === 'owner' || currentUserRole === 'owner_admin'

  useEffect(() => {
    if (currentUserEmail) {
      const isOwnerCheck = ['jedgard70@gmail.com','owner@apexglobalai.co','edgard@apexglobalai.co'].includes(currentUserEmail.toLowerCase()) || currentUserRole === 'owner' || currentUserRole === 'owner_admin'
      setProfile(prev => ({
        ...prev,
        email: isOwnerCheck ? 'jedgard70@gmail.com' : currentUserEmail,
        role: isOwnerCheck ? 'owner_admin' : 'cliente_pro',
        subscriptionPlan: isOwnerCheck ? 'Plano Enterprise Owner (Ilimitado)' : 'Assinatura Apex AI Pro'
      }))
    }
  }, [currentUserEmail, currentUserRole])

  if (!isOpen) return null

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setProfile(prev => ({ ...prev, avatarUrl: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    localStorage.setItem('apex_user_profile_data', JSON.stringify(profile))
    if (profile.avatarUrl) {
      localStorage.setItem('apex_user_avatar', profile.avatarUrl)
    }
    if (onSave) onSave(profile)
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                Perfil e Configurações de Usuário
                {isOwner ? (
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" /> Owner Admin
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" /> Assinante Pro
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Identificação, avatar de vídeo, clone de voz e permissões do sistema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Photo & Identity Section */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl border-2 border-purple-500/40 bg-slate-800 overflow-hidden flex items-center justify-center shadow-lg">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg cursor-pointer transition-transform hover:scale-105">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="text-xl font-bold text-slate-100">{profile.fullName}</h3>
              </div>
              <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" /> {profile.email}
              </p>
              <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span className="text-[11px] px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-md font-mono">
                  {isOwner ? 'Plano Enterprise Owner (Ilimitado)' : profile.subscriptionPlan}
                </span>
              </div>
            </div>
          </div>

          {/* Basic Personal Info */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider text-xs border-b border-slate-800 pb-2">
              Dados Pessoais & Contato
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={e => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800/80 rounded-lg text-sm text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Telefone / WhatsApp</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={e => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Endereço / Cidade</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={profile.address}
                    onChange={e => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Voice & Video Avatar Settings */}
          <div className="space-y-4 pt-2">
            <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider text-xs border-b border-slate-800 pb-2 flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-400" /> Clone de Voz & Avatar para Vídeos por IA
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nome do Clone de Voz</label>
                <input
                  type="text"
                  value={profile.voiceName}
                  onChange={e => setProfile(prev => ({ ...prev, voiceName: e.target.value }))}
                  placeholder="Ex: Voz Dr. Edgard Oficial"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Voice ID (ElevenLabs / FAL)</label>
                <input
                  type="text"
                  value={profile.voiceId}
                  onChange={e => setProfile(prev => ({ ...prev, voiceId: e.target.value }))}
                  placeholder="ID do modelo de voz"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">URL de Referência da Imagem do Avatar 3D/Vídeo</label>
              <div className="relative">
                <Video className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={profile.avatarModelRef}
                  onChange={e => setProfile(prev => ({ ...prev, avatarModelRef: e.target.value }))}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-purple-500 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Role & Privileges Explanation */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-800/40 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 space-y-1">
              <span className="font-semibold text-purple-300 block">Nível de Acesso e Permissões do Chat:</span>
              {isOwner ? (
                <p>
                  Sua conta está identificada como <strong className="text-purple-200">Owner Admin (Dr. Edgard)</strong>. O assistente de IA responde a todos os comandos avançados, incluindo engenharia de software, geração de código, controle de infraestrutura, deploys e scripts do sistema.
                </p>
              ) : (
                <p>
                  Sua conta está identificada como <strong className="text-emerald-300">Usuário Assinante</strong>. O assistente de IA responde a todas as suas solicitações de negócios, marketing, contratos, orçamentos e BIM. Solicitações de programação de código são restritas ao Owner Admin.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" /> Salvo com Sucesso!
              </>
            ) : (
              'Salvar Configurações'
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
