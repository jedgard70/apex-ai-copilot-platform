import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Configurado para o ambiente serverless (Vercel)
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('[Worker API] Missing Supabase credentials');
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data: tasks, error } = await supabase
      .from('squad_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5);

    if (error) {
      console.error('[Worker API] Error fetching tasks:', error.message);
      return res.status(500).json({ error: error.message });
    }

    if (tasks && tasks.length > 0) {
      const processedCount = tasks.length;
      for (const task of tasks) {
        console.log(`[Worker API] Processing Task ID: ${task.id} | Squad: ${task.squad_name}`);
        
        // Marca como processando
        await supabase
          .from('squad_tasks')
          .update({ status: 'processing' })
          .eq('id', task.id);

        // Simulação de execução por Agente IA
        // Em produção, aqui chamaremos Groq/Gemini via MCP ou chamadas de API nativas
        const mockResult = `Missão "${task.goal}" concluída com sucesso pelo esquadrão de ${task.squad_name}. Relatório: Métricas otimizadas e rascunhos gerados na plataforma.`;
        
        // Marca como concluído
        await supabase
          .from('squad_tasks')
          .update({ 
            status: 'completed', 
            result: mockResult,
            completed_at: new Date().toISOString()
          })
          .eq('id', task.id);
      }
      return res.status(200).json({ message: `Sucesso: ${processedCount} tarefas processadas pelo agente background.` });
    } else {
      return res.status(200).json({ message: 'Nenhuma tarefa pendente.' });
    }
  } catch (err) {
    console.error('[Worker API] Fatal Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
