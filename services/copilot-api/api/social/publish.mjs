import { createClient } from '@supabase/supabase-js';

// POST /api/social/publish
// Pode ser chamado por um CronJob (Vercel Cron) a cada X minutos.
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verifica token de segurança do Cron (proteção)
  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn('[Social Publish] Unauthorized cron attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Missing Supabase config' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Busca posts agendados que já passaram do horário
  const { data: posts, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString());

  if (error) {
    console.error('[Social Publish] Supabase fetch error:', error);
    return res.status(500).json({ error: error.message });
  }

  if (!posts || posts.length === 0) {
    return res.status(200).json({ message: 'Nenhum post agendado para agora.' });
  }

  const metaToken = process.env.META_SYSTEM_ACCESS_TOKEN;
  if (!metaToken) {
    return res.status(500).json({ error: 'Missing META_SYSTEM_ACCESS_TOKEN' });
  }

  const results = [];

  for (const post of posts) {
    try {
      // Resolve qual Page ID usar
      const pageId = post.campaign_type === 'ebook' 
        ? process.env.META_PAGE_ID_EBOOK 
        : process.env.META_PAGE_ID_APEX;
      
      if (!pageId) {
        throw new Error(`Missing Page ID for campaign: ${post.campaign_type}`);
      }

      // Prepara o payload para a Meta Graph API
      let endpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      let payload = {
        message: post.content,
        access_token: metaToken
      };

      if (post.media_url) {
        payload.url = post.media_url;
        // Se for vídeo, o endpoint muda (Graph API para vídeos)
        if (post.media_url.match(/\.(mp4|mov)$/i)) {
          endpoint = `https://graph.facebook.com/v19.0/${pageId}/videos`;
          payload.file_url = post.media_url;
          payload.description = post.content;
          delete payload.url;
          delete payload.message;
        }
      } else {
        // Post só de texto
        endpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const metaResult = await response.json();

      if (!response.ok) {
        throw new Error(metaResult.error?.message || 'Meta API Error');
      }

      // Sucesso! Atualiza no Supabase
      await supabase
        .from('social_posts')
        .update({ 
          status: 'published',
          error_log: metaResult 
        })
        .eq('id', post.id);

      results.push({ id: post.id, status: 'published', providerId: metaResult.id });

    } catch (err) {
      console.error(`[Social Publish] Erro no post ${post.id}:`, err);
      // Atualiza o log de erro no Supabase, mas mantém em 'failed' para auditoria
      await supabase
        .from('social_posts')
        .update({ 
          status: 'failed',
          error_log: { message: err.message, stack: err.stack } 
        })
        .eq('id', post.id);
        
      results.push({ id: post.id, status: 'failed', error: err.message });
    }
  }

  return res.status(200).json({ processed: results.length, results });
}
