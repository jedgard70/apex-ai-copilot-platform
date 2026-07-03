// n8n.mjs - Módulo de Disparo para o Webhook do n8n

export async function enviarParaN8N(idCampanha, legenda, midiaUrl, plataformasAlvo) {
    console.log(`🚀 Materiais da campanha ${idCampanha} concluídos! Iniciando publicação...`);

    // A URL do Webhook configurada no .env (ou nula se não houver para não quebrar)
    const webhookDoN8N = process.env.N8N_WEBHOOK_URL;
    
    if (!webhookDoN8N) {
      console.warn("⚠️ N8N_WEBHOOK_URL não configurada no .env. Ignorando disparo para n8n.");
      return;
    }

    try {
        const response = await fetch(webhookDoN8N, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idCampanha: idCampanha,
                legenda: legenda,
                midia_url: midiaUrl,
                redes: plataformasAlvo || ["instagram", "linkedin"]
            })
        });

        if (response.ok) {
            console.log("✅ Pacote enviado para o n8n. Publicação a caminho!");
        } else {
            console.error(`⚠️ Erro retornado pelo n8n: ${response.statusText}`);
        }
    } catch (erro) {
        console.error("❌ Falha ao acionar o n8n:", erro.message);
    }
}
