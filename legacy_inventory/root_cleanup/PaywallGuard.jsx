import React from 'react';
import { Lock, CreditCard } from 'lucide-react';

// Supondo que você use Zustand ou um hook do Supabase para o estado do usuário
// import { useAuthStore } from '../store/useAuthStore'; 

export const PaywallGuard = ({ children, serviceName, requiresPaidPlan = true }) => {
    // Simulação do estado atual do usuário (você vai plugar o seu Zustand/Supabase aqui)
    const { user, isSubscribed } = { user: true, isSubscribed: false }; // Exemplo onde não pagou ainda

    // 1. Se não estiver logado, nem mostra o serviço
    if (!user) {
        return <div className="p-8 text-white">Redirecionando para login...</div>;
    }

    // 2. Se o serviço exige pagamento e ele não tem assinatura/créditos -> TELA DE BLOQUEIO
    if (requiresPaidPlan && !isSubscribed) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-slate-100 p-8 rounded-lg border border-slate-700 shadow-xl">
                <Lock className="w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Acesso Restrito: {serviceName}</h2>
                <p className="text-slate-400 mb-6 text-center max-w-md">
                    Para utilizar o motor de execução da Apex AI e gerar arquivos prontos, você precisa de um plano ativo ou créditos de execução.
                </p>

                <div className="flex gap-4">
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-md font-semibold transition-colors">
                        <CreditCard className="w-5 h-5" />
                        Fazer Upgrade agora
                    </button>
                    <button className="px-6 py-3 border border-slate-600 hover:bg-slate-800 rounded-md font-semibold transition-colors">
                        Ver Planos
                    </button>
                </div>
            </div>
        );
    }

    // 3. Se ele pagou (isSubscribed === true), renderiza o serviço (Terminal, BIM, etc) sem tela branca!
    return <>{children}</>;
};