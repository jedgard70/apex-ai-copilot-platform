import json
import os
import requests
from openai import OpenAI

# Importando o motor de disparo que criamos na etapa anterior
# Ajuste o caminho do import conforme a sua estrutura de pastas no VS Code
import sys
sys.path.append('../../integrations/marketing_webhooks')
from webhook_dispatcher import MarketingDispatcher

class AutonomousSalesAgent:
    def __init__(self, api_key: str):
        # Inicializa o cliente da IA (ex: OpenAI, mas pode ser adaptado para Gemini ou Claude)
        self.client = OpenAI(api_key=api_key)
        
        # Carrega as regras do agente que criamos no arquivo JSON
        prompt_path = os.path.join(os.path.dirname(__line__), 'sales_system_prompt.json')
        with open(prompt_path, 'r', encoding='utf-8') as file:
            self.system_prompt = json.load(file)

    def gerar_copy_e_disparar(self, project_data: dict, webhook_url: str):
        print("🧠 Iniciando processamento do Sales Agent...")
        
        # 1. Preparando a instrução para a IA
        instrucoes_sistema = json.dumps(self.system_prompt, ensure_ascii=False)
        dados_projeto = json.dumps(project_data, ensure_ascii=False)
        
        # 2. Chamando a IA e forçando a resposta em JSON (JSON Mode)
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o", # Ou o modelo de sua preferência
                response_format={ "type": "json_object" },
                messages=[
                    {"role": "system", "content": f"Você é o agente de vendas detalhado aqui: {instrucoes_sistema}"},
                    {"role": "user", "content": f"Gere os assets de campanha para os seguintes dados do projeto. Retorne APENAS um JSON válido seguindo o 'output_schema_expected': {dados_projeto}"}
                ]
            )
            
            # 3. Extraindo a resposta gerada pela IA
            ia_output = json.loads(response.choices[0].message.content)
            print("✨ Copy gerada com sucesso pela IA!")
            print(json.dumps(ia_output, indent=2, ensure_ascii=False))
            
            # 4. Disparando para o Make.com usando a classe que criamos antes
            dispatcher = MarketingDispatcher(webhook_url=webhook_url)
            
            sucesso = dispatcher.disparar_campanha(
                project_id=project_data["project_id"],
                roi=project_data["financial_data"]["roi_projected"],
                esg_score=str(project_data["esg_data"]["score"]),
                ad_copy=f"{ia_output['headline_ad']}\n\n{ia_output['primary_text']}\n\n{ia_output['call_to_action']}",
                image_url=ia_output["selected_image_url"],
                audience_type=project_data["target_audience"]
            )
            
            if sucesso:
                print("🎯 Fluxo Autônomo concluído: Do canteiro de obras para a campanha de captação!")
            else:
                print("⚠️ Copy gerada, mas falha ao enviar para o Webhook.")
                
        except Exception as e:
            print(f"❌ Erro na execução do Sales Agent: {e}")

# =======================================================
# EXECUÇÃO DO FLUXO (Exemplo Prático)
# =======================================================
if __name__ == "__main__":
    # Substitua pelas suas chaves reais
    SUA_CHAVE_OPENAI = "sk-sua-chave-api-aqui"
    
    # Cole aqui a URL que você gerou no passo anterior lá no Make.com!
    URL_WEBHOOK_MAKE = "https://hook.us1.make.com/sua-url-magica-aqui"
    
    # Instanciando o agente
    sales_agent = AutonomousSalesAgent(api_key=SUA_CHAVE_OPENAI)
    
    # Simulando os dados consolidados pelo seu sistema BIM/Financeiro
    dados_do_projeto_ativo = {
        "project_id": "PRJ-2026-ALPHA",
        "target_audience": "Investidores corporativos e fundos imobiliários",
        "financial_data": {
            "roi_projected": 18.5,
            "cap_rate": 8.2,
            "vgv": 45000000.00
        },
        "esg_data": {
            "score": 92,
            "main_highlight": "Reúso de água 100% e certificação LEED Platinum projetada."
        },
        "visual_assets": [
            "https://seu-servidor.com/assets/fachada_dia.jpg",
            "https://seu-servidor.com/assets/fachada_noite_neon.jpg"
        ]
    }
    
    # Executa a mágica
    sales_agent.gerar_copy_e_disparar(
        project_data=dados_do_projeto_ativo,
        webhook_url=URL_WEBHOOK_MAKE
    )