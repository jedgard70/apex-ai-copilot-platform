import { initWhatsApp, pedirAprovacaoCEO } from '../local-worker/whatsapp.mjs';

console.log("Iniciando WhatsApp para Teste de Aprovação do CEO...");
initWhatsApp();

setTimeout(() => {
    pedirAprovacaoCEO(
        "CAMPANHA-TESTE-001",
        "🚀 Chefe, gerei este teste do nosso motor Event-Driven!\nSe você aprovar (1), eu disparo para o Webhook do n8n.\nSe você descartar (2), eu não faço nada.",
        "https://apexglobalai.com/video_demo.mp4",
        ["instagram", "linkedin"]
    );
    console.log("Aprovação solicitada. Olhe seu WhatsApp...");
}, 10000);
