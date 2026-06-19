import json
import requests
from datetime import datetime

class MarketingDispatcher:
    def __init__(self, webhook_url: str):
        # Esta é a URL mágica (do n8n ou Make) que vai receber os dados e publicar o anúncio
        self.webhook_url = webhook_url

    def disparar_campanha(self, project_id: str, roi: float, esg_score: str, ad_copy: str, image_url: str, audience_type: str):
        """
        Empacota os dados gerados pela IA e envia para a plataforma de anúncios.
        """
        
        # O payload é o pacote de informações no formato JSON universal
        payload = {
            "event_type": "launch_autonomous_campaign",
            "timestamp": datetime.now().isoformat(),
            "project_context": {
                "project_id": project_id,
                "financial_roi": roi,
                "esg_rating": esg_score
            },
            "creative_assets": {
                "copywriting": ad_copy,
                "media_url": image_url
            },
            "targeting": {
                "audience": audience_type,
                "platform": "meta_ads_and_google_ads"
            }
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer SEU_TOKEN_DE_SEGURANCA_AQUI" # Para garantir que só seu sistema dispare isso
        }

        print(f"⏳ Preparando disparo de campanha para o projeto {project_id}...")
        
        try:
            # Enviando o JSON para o mundo externo
            response = requests.post(self.webhook_url, data=json.dumps(payload), headers=headers)
            
            # Verifica se o disparo foi bem-sucedido (Código 200)
            response.raise_for_status()
            
            print(f"✅ SUCESSO! Campanha disparada. Servidor respondeu com status: {response.status_code}")
            print(f"📦 Dados enviados:\n{json.dumps(payload, indent=2, ensure_ascii=False)}")
            return True
            
        except requests.exceptions.RequestException as error:
            print(f"❌ ERRO: Falha ao comunicar com o servidor de automação. Detalhes: {error}")
            return False

# =======================================================
# SIMULAÇÃO DE USO PELO SEU SALES AGENT
# =======================================================
if __name__ == "__main__":
    # URL fictícia de um webhook (substituiremos pela sua URL real do n8n/Make depois)
    URL_WEBHOOK_N8N = "https://seu-servidor-n8n.com/webhook/disparo-ads"
    
    motor = MarketingDispatcher(webhook_url=URL_WEBHOOK_N8N)
    
    # Dados fictícios que o seu Sales_Agent gerou com base no projeto BIM/Financeiro
    motor.disparar_campanha(
        project_id="PRJ-2026-ALPHA",
        roi=18.5,
        esg_score="Excelente (92/100)",
        ad_copy="Invista no futuro da engenharia. Projeto Alpha com rentabilidade projetada de 18.5% e selo ESG de excelência. Cadastre-se para receber o Pitch Deck gerado por nossa IA.",
        image_url="https://seu-storage.com/renders/fachada_cinematografica_v1.jpg",
        audience_type="investidores_imobiliarios_high_ticket"
    )