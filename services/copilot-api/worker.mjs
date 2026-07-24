import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Requires service role to bypass RLS

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('[Worker] Missing Supabase credentials. Worker will not start.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('[Worker] Apex Autonomous Squad Worker Started...');

async function pollTasks() {
  try {
    // Busca tarefas pendentes
    const { data: tasks, error } = await supabase
      .from('squad_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5);

    if (error) {
      console.error('[Worker] Error fetching tasks:', error.message);
      return;
    }

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        console.log(`[Worker] Processing Task ID: ${task.id} | Squad: ${task.squad_name}`);
        
        // Marca como em processamento
        await supabase
          .from('squad_tasks')
          .update({ status: 'processing' })
          .eq('id', task.id);

        // ============================================
        // AQUI ENTRA A LÓGICA DE EXECUÇÃO DA IA 
        // ============================================
        // Exemplo simulado de tempo de processamento
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const mockResult = `Task "${task.goal}" executed successfully by ${task.squad_name}. Result: Optimized pipeline metrics and drafted 3 emails.`;
        
        // Marca como concluído
        await supabase
          .from('squad_tasks')
          .update({ 
            status: 'completed', 
            result: mockResult,
            completed_at: new Date().toISOString()
          })
          .eq('id', task.id);
          
        console.log(`[Worker] Task ID: ${task.id} Completed.`);
      }
    }
  } catch (err) {
    console.error('[Worker] Fatal Error during polling:', err);
  } finally {
    // Poll again after 5 seconds
    setTimeout(pollTasks, 5000);
  }
}

pollTasks();
