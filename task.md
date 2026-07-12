# Tasks: Implementação da Arquitetura Event-Driven (n8n + WhatsApp)

- [ ] **Fase 1: Teste Local do Daemon de Aprovação (Em Andamento)**
  - [/] Aguardar instalação do `whatsapp-web.js`.
  - [ ] Validar a leitura do QR Code pelo WhatsApp da APEX Global (final 7668).
  - [ ] Validar o recebimento do pedido de aprovação no WhatsApp do CEO (final 7667).
  - [ ] Receber o "1" (Aprovação) e verificar se o sistema dispararia o Webhook corretamente.

- [ ] **Fase 2: Implantação do Motor de Logística (n8n no VPS DigitalOcean)**
  - [ ] Criar o Droplet na DigitalOcean (Ubuntu/Debian).
  - [ ] Acessar o VPS via SSH.
  - [ ] Instalar o Node.js v20+ e npm.
  - [ ] Instalar o `n8n` e o `pm2` globalmente.
  - [ ] Configurar o `pm2` para iniciar o n8n no boot.
  - [ ] Opcional: Configurar Nginx/Caddy para o domínio e HTTPS.

- [ ] **Fase 3: Integração e End-to-End**
  - [ ] Atualizar o `N8N_WEBHOOK_URL` no `.env` da plataforma para apontar para o VPS da DigitalOcean.
  - [ ] Desenhar o fluxo final de publicação dentro da interface visual do n8n.
  - [ ] Realizar um teste real de ponta a ponta (Supabase -> Daemon -> CEO Aprova -> VPS n8n posta no Instagram).
