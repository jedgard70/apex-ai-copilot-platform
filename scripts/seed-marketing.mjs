import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://csvtkvyauusvtmrkqtzl.supabase.co';
const supabaseKey = 'sb_secret_brXqeRm3prcJzAsZ82Q-1A_wc9UQELr';
const supabase = createClient(supabaseUrl, supabaseKey);

const posts = [
  {
    campaign_type: 'construtora',
    platform: 'instagram',
    content: "O sonho de uma casa de alto padrão começa muito antes de colocar o primeiro tijolo. Começa no planejamento BIM e na precisão da engenharia. 🏗️✨\n\nArrasta pro lado para ver o projeto em 3D e como ele ficou na realidade! Na Apex Construtora, nós não vendemos apenas projetos, entregamos a chave do seu novo estilo de vida.\n\n📲 Quer construir com segurança e previsibilidade? Acesse o link na bio e fale com nossos engenheiros.\n\n#ApexConstrutora #ArquiteturaDeLuxo #EngenhariaCivil #BIM #ConstruçãoAltoPadrão",
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
    status: 'draft'
  },
  {
    campaign_type: 'ebook',
    platform: 'instagram',
    content: "🚨 3 ERROS QUE ENCARECEM A SUA OBRA EM ATÉ 30%!\n\n1️⃣ Falta de sondagem do solo (O barato sai caríssimo na fundação).\n2️⃣ Comprar materiais sem cronograma físico-financeiro.\n3️⃣ Contratar pedreiros sem um Engenheiro responsável para fiscalizar.\n\nQuer saber como evitar esses ralos de dinheiro e construir com inteligência? 💡\n\n📖 Baixe agora o meu eBook completo! Link na bio.\n\n#DrEdgard #EngenhariaInteligente #GestãoDeObras #ConstruçãoCivil #DicasDeObra",
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    status: 'draft'
  },
  {
    campaign_type: 'construtora',
    platform: 'facebook',
    content: "Você sabia que o uso da tecnologia BIM na fase de projetos pode reduzir o desperdício de materiais a quase ZERO? 📉♻️\n\nAqui na Apex Construtora, nós aplicamos o que há de mais avançado em gestão de obras para garantir que o seu investimento seja otimizado até o último centavo.\n\nConheça nosso portfólio e descubra por que somos referência em alto padrão. (Link nos comentários) 👇\n\n#ApexConstrutora #TecnologiaBIM #Sustentabilidade #ObrasRápidas #Engenharia",
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    status: 'draft'
  }
];

async function seed() {
  const { data, error } = await supabase.from('social_posts').insert(posts);
  if (error) console.error('Error inserting:', error);
  else console.log('Successfully inserted drafts!');
}

seed();
