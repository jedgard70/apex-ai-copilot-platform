import React, { useState } from 'react'
import { getBrowserSupabaseClient } from '../lib/supabaseClient'

export function CheckoutPortal() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchParams = new URLSearchParams(window.location.search)
  const service = searchParams.get('service') || 'premium'

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { client: supabase } = getBrowserSupabaseClient()

    try {
      // 1. Tentar criar o usuário no Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        // Se o usuário já existe, podemos tentar fazer login
        if (signUpError.message.includes('User already registered') || signUpError.status === 400) {
           const { error: signInError } = await supabase.auth.signInWithPassword({
             email,
             password
           })
           if (signInError) {
             throw new Error('Usuário já existe. Senha incorreta ou erro no login.')
           }
        } else {
          throw signUpError
        }
      }

      // 2. Bypass para o dono (Dr. Edgard)
      const isOwner = email.toLowerCase() === 'jedgard70@gmail.com' || email.toLowerCase() === 'jaedgard70@gmail.com'
      if (isOwner) {
        if (service === 'accounts') {
          window.location.href = '/accounts'
        } else {
          window.location.href = '/'
        }
        return
      }

      // 3. Integração com Stripe Real
      const userId = (await supabase.auth.getUser()).data.user?.id || 'unknown'
      const priceId = import.meta.env.VITE_STRIPE_ACCOUNTS_PRICE_ID || 'price_1QxXXXXXXX' // Substitua pelo Price ID real do Stripe

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'apex-global', // ou o tenantId correto se aplicável
          userId,
          plan: service,
          priceId: priceId,
          customerEmail: email,
          successUrl: window.location.origin + (service === 'accounts' ? '/accounts' : '/'),
          cancelUrl: window.location.origin + '/checkout?service=' + service
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Falha ao criar sessão de pagamento no Stripe.')
      }

      const { url } = await response.json()
      
      // Redireciona para o Stripe Checkout real
      if (url) {
        window.location.href = url
      } else {
        throw new Error('URL de checkout inválida retornada pelo servidor.')
      }
      
    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Erro ao processar assinatura.')
    } finally {
      setLoading(false)
    }
  }

  const getServiceDetails = () => {
    if (service === 'accounts') {
      return {
        title: 'Assinatura: Contabilidade (Accounts)',
        price: 'R$ 497,00',
        period: '/mês',
        features: [
          'Acesso ao Portal Contábil (Web)',
          'Extensão Chrome REDESIM com Automação',
          'Sincronização de Notas Fiscais (NFe/NFSe)',
          'Suporte Dedicado',
        ]
      }
    }
    return {
      title: 'Plano Premium Apex AI',
      price: 'R$ 997,00',
      period: '/mês',
      features: [
        'Acesso total aos agentes cognitivos',
        'Modelos Ilimitados',
        'Suporte Prioritário 24/7'
      ]
    }
  }

  const details = getServiceDetails()

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050b18', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
      <div style={{ maxWidth: 900, width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 0, background: '#0f172a', borderRadius: 24, overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Lado Esquerdo: Detalhes do Plano */}
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)', padding: 40, display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: 24, margin: '0 0 8px', color: '#60a5fa' }}>Apex AI Ecossistema</h1>
          <h2 style={{ fontSize: 32, margin: '0 0 24px', fontWeight: 800 }}>{details.title}</h2>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 32 }}>
            <span style={{ fontSize: 48, fontWeight: 900 }}>{details.price}</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>{details.period}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
            {details.features.map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✓</div>
                <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>{feature}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 40, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            Pagamento seguro via Stripe. Cancele a qualquer momento.
          </div>
        </div>

        {/* Lado Direito: Formulário */}
        <div style={{ padding: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h3 style={{ fontSize: 22, margin: '0 0 8px' }}>Crie sua conta para acessar</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 32px', fontSize: 15 }}>
            Se você já tem conta, faremos o login automaticamente.
          </p>

          <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>E-mail Profissional</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@suaempresa.com.br"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: 12, color: '#fff', fontSize: 16, outline: 'none', transition: 'border-color 0.2s' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 8 }}>Senha Segura</label>
              <input 
                type="password" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: 12, color: '#fff', fontSize: 16, outline: 'none', transition: 'border-color 0.2s' }}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: 12, borderRadius: 8, fontSize: 14, border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                background: '#3b82f6', 
                color: '#fff', 
                border: 'none', 
                padding: '16px', 
                borderRadius: 12, 
                fontSize: 16, 
                fontWeight: 600, 
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginTop: 8,
                transition: 'background 0.2s'
              }}
            >
              {loading ? 'Processando Pagamento...' : 'Assinar e Acessar Portal'}
            </button>
          </form>
          
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.5 }}>
            {/* Lock icon simulation */}
            <span style={{ fontSize: 14 }}>🔒</span>
            <span style={{ fontSize: 13 }}>Ambiente 100% Seguro</span>
          </div>
        </div>

      </div>
    </main>
  )
}
