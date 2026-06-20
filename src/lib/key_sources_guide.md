# Links Importantes para Configuração de Keys da Plataforma Apex

Este documento contém os caminhos diretos para obter as credenciais e chaves do Stripe, Firebase e canais de comunicação para o pleno funcionamento da plataforma online e offline.

---

## 1. Stripe (Pagamentos)
* **Criar Conta / Painel de Desenvolvedores**:
  * Link: [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
* **Obter Chaves de Produção (Modo Live - STRIPE_SECRET_KEY)**:
  * Link: [https://dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
* **Criar e Configurar Webhook (STRIPE_WEBHOOK_SECRET)**:
  * Link: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
  * Clique em *Add Endpoint* e configure com a URL:
    `https://www.apexglobalai.com/api/stripe/webhook`

---

## 2. Firebase Cloud Messaging (Push Notifications)
* **Console do Firebase (Painel Geral)**:
  * Link: [https://console.firebase.google.com/project/apex-ai-copilot-platform](https://console.firebase.google.com/project/apex-ai-copilot-platform)
* **Chave VAPID para Web Push (VITE_FIREBASE_VAPID_KEY)**:
  * Link: [https://console.firebase.google.com/project/apex-ai-copilot-platform/settings/cloudmessaging](https://console.firebase.google.com/project/apex-ai-copilot-platform/settings/cloudmessaging)
  * Role até *Web Push certificates* e clique em **Generate Key**.
* **Conta de Serviço do Firebase (FIREBASE_SERVICE_ACCOUNT_JSON)**:
  * Link: [https://console.cloud.google.com/iam-admin/serviceaccounts?project=apex-ai-copilot-platform](https://console.cloud.google.com/iam-admin/serviceaccounts?project=apex-ai-copilot-platform)
  * Clique em **Gerar nova chave privada** no formato JSON e cole seu conteúdo na Vercel.

---

## 3. Authkey (SMS, OTP & WhatsApp)
* **Painel de Credenciais**:
  * Link: [https://console.authkey.io/](https://console.authkey.io/)
* **Criar Template OTP com o código {#2fa#}**:
  * Link: [https://console.authkey.io/#/templates](https://console.authkey.io/#/templates)
