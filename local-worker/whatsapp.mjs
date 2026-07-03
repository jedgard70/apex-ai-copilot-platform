import wwebjs from 'whatsapp-web.js'
const { Client, LocalAuth } = wwebjs
import qrcode from 'qrcode-terminal'
import { enviarParaN8N } from './n8n.mjs'
import 'dotenv/config'

let clientWPP = null
let isReady = false

// Memória de Curto Prazo (O "Botão Vermelho")
const campanhasAguardandoAprovacao = new Map();
const NUMERO_ADMIN = process.env.WHATSAPP_ADMIN || "5514999999999@c.us"; 

export function initWhatsApp() {
  if (clientWPP) return

  clientWPP = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] }
  })

  clientWPP.on('qr', (qr) => {
    console.log('\n======================================================')
    console.log('📱 ESCANEIE ESTE QR CODE COM O SEU WHATSAPP COMERCIAL:')
    console.log('======================================================\n')
    qrcode.generate(qr, { small: true })
  })

  clientWPP.on('ready', () => {
    isReady = true
    console.log('✅ WhatsApp conectado e pronto para enviar projetos!')
  })

  clientWPP.on('auth_failure', () => {
    console.error('❌ Falha na autenticação do WhatsApp. Apague a pasta .wwebjs_auth e tente novamente.')
  })

  clientWPP.on('disconnected', (reason) => {
    isReady = false
    console.error('❌ WhatsApp desconectado:', reason)
  })

  // 🎧 O Ouvinte de Respostas (O Listener HITL)
  clientWPP.on('message', async msg => {
      const remetente = msg.from;
      const textoMensagem = msg.body.trim();

      // Verifica se a mensagem veio de você E se tem alguma campanha esperando sua ordem
      if (remetente === NUMERO_ADMIN && campanhasAguardandoAprovacao.has(NUMERO_ADMIN)) {
          
          const campanha = campanhasAguardandoAprovacao.get(NUMERO_ADMIN);

          if (textoMensagem === '1') {
              // Aprovado!
              await msg.reply("✅ Ordem recebida. Disparando Webhook para o n8n publicar nas redes!");
              
              // Dispara para o n8n
              await enviarParaN8N(campanha.idCampanha, campanha.legenda, campanha.linkMidia, campanha.plataformasAlvo); 
              
              // Limpa a memória
              campanhasAguardandoAprovacao.delete(NUMERO_ADMIN);

          } else if (textoMensagem === '2') {
              // Descartado!
              await msg.reply("❌ Campanha descartada. Nenhuma postagem será feita.");
              
              // AQUI poderia atualizar o Supabase para 'descartado' caso conectado
              
              // Limpa a memória
              campanhasAguardandoAprovacao.delete(NUMERO_ADMIN);

          } else {
              // O usuário mandou outra coisa qualquer
              await msg.reply("⚠️ Comando inválido. Por favor, responda apenas *1* (Aprovar) ou *2* (Descartar).");
          }
          
          // Encerra a execução para esta mensagem
          return; 
      }

      // Restante do seu código para lidar com clientes normais...
  });

  clientWPP.initialize().catch(err => {
    console.error('❌ Erro fatal ao iniciar o WhatsApp:', err)
  })
}

// A Função de Envio (O Pedido de Aprovação)
export async function pedirAprovacaoCEO(idCampanha, legenda, linkMidia, plataformasAlvo = ["instagram"]) {
    if (!clientWPP || !isReady) {
        console.error('⚠️ WhatsApp não está conectado para pedir aprovação!');
        return;
    }

    const mensagem = `🤖 *APEX Automations - Revisão de Campanha*\n\n` +
                     `*Legenda:* ${legenda}\n` +
                     `*Mídia:* ${linkMidia}\n\n` +
                     `👉 Responda *1* para APROVAR e POSTAR.\n` +
                     `👉 Responda *2* para DESCARTAR.`;

    try {
        await clientWPP.sendMessage(NUMERO_ADMIN, mensagem);
        
        // Salva na memória: "O número do chefe está decidindo sobre a campanha"
        campanhasAguardandoAprovacao.set(NUMERO_ADMIN, {
           idCampanha, legenda, linkMidia, plataformasAlvo
        });
        
        console.log(`⏳ Aguardando aprovação do CEO para a campanha ${idCampanha}...`);
    } catch (erro) {
        console.error("Falha ao pedir aprovação:", erro);
    }
}

export async function enviarParaCliente(numeroTelefone, mensagem) {
  if (!clientWPP || !isReady) {
    throw new Error('WhatsApp não está conectado ou não terminou de inicializar.')
  }

  const numLimpo = numeroTelefone.replace(/\D/g, '')
  let numeroFormatado = numLimpo
  
  if (numLimpo.length === 10 || numLimpo.length === 11) {
    numeroFormatado = `55${numLimpo}`
  }

  numeroFormatado = `${numeroFormatado}@c.us`

  try {
    await clientWPP.sendMessage(numeroFormatado, mensagem)
    console.log(`📤 Mensagem enviada com sucesso para ${numeroFormatado}`)
    return true
  } catch (erro) {
    console.error(`❌ Falha ao enviar WhatsApp para ${numeroFormatado}:`, erro)
    throw erro
  }
}
