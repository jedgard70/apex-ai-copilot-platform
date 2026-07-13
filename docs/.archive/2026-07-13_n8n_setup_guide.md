# Manual de Configuração N8N (Arquitetura APEX AI)

Este documento guarda as diretrizes oficiais de configuração visual para integrar o n8n à Máquina Omnichannel da APEX AI, permitindo publicação autônoma.

## 1. O Gatilho (Nó: Webhook)
O ponto de entrada de dados da APEX no n8n.
- **Webhook URL:** Copiar o endereço de `Production`. Colar no `.env` do servidor da APEX sob a variável `N8N_WEBHOOK_URL`.
- **Method:** POST
- **Authentication:** None (Para execução local).
- **Respond:** "Immediately". Isso garante que o servidor da APEX (Node) seja liberado instantaneamente sem aguardar a conclusão do upload nas redes sociais.

## 2. Teste de Carga Inicial
1. Clicar em "Test URL" (ou "Execute Webhook") no nó do n8n.
2. Disparar a rotina de teste na APEX ou via Postman para popular as variáveis no n8n.
3. O payload capturado será no formato:
   ```json
   {
      "legenda": "texto",
      "midia_url": "link do video",
      "redes": ["instagram", "linkedin"]
   }
   ```

## 3. O Switch de Roteamento
Após o Webhook, criar um nó **Switch**.
- Ele lerá o array de redes e disparará para os nós subsequentes corretos (Instagram, Facebook, LinkedIn).

## 4. Nó de Download (HTTP Request) - Dica Profissional
Sempre que receber `midia_url`, antes de tentar postar, criar um nó "HTTP Request":
- Fazer download do arquivo do link para a memória binária do n8n.
- Publicar o **binário físico** e não a URL externa. Isso evita que as redes rejeitem o post por link inválido ou time-out de download.
