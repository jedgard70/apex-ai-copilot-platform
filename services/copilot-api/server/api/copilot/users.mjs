import { createClient } from '@supabase/supabase-js'

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body))
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  if (!chunks.length) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

// Inicializa o cliente do Supabase com a Service Role Key (Acesso total de Admin)
// Nota: Essa rota NUNCA deve expor essa chave para o Frontend.
function getAdminSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey || supabaseServiceKey === 'server-only-do-not-expose') {
    throw new Error('Chave SUPABASE_SERVICE_ROLE_KEY ausente ou inválida no .env')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return sendJson(res, 200, { ok: true })
  }

  try {
    const supabaseAdmin = getAdminSupabase()

    // Lógica para Listar Usuários
    if (req.method === 'GET') {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
      if (error) throw error

      // Retorna a lista omitindo dados sensíveis se necessário
      const formattedUsers = users.map(u => ({
        id: u.id,
        email: u.email,
        role: u.user_metadata?.role || 'cliente_c', // Default role
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at
      }))

      return sendJson(res, 200, { ok: true, users: formattedUsers })
    }

    // Lógica para Criar/Convidar Usuário ou Atualizar Role
    if (req.method === 'POST') {
      const body = await readJsonBody(req)
      const { action, email, role, userId } = body

      if (action === 'invite') {
        if (!email) return sendJson(res, 400, { ok: false, error: 'Email é obrigatório' })
        
        // Dispara e-mail automático do Supabase
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
          data: { role: role || 'cliente_c' } // Injeta o cargo no metadata
        })

        if (error) throw error
        return sendJson(res, 200, { ok: true, message: 'Convite enviado com sucesso', user: data.user })
      }

      if (action === 'update_role') {
        if (!userId || !role) return sendJson(res, 400, { ok: false, error: 'userId e role são obrigatórios' })
        
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { role }
        })

        if (error) throw error
        return sendJson(res, 200, { ok: true, message: 'Cargo atualizado com sucesso', user: data.user })
      }

      if (action === 'delete') {
        if (!userId) return sendJson(res, 400, { ok: false, error: 'userId é obrigatório' })
        
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        if (error) throw error
        return sendJson(res, 200, { ok: true, message: 'Usuário deletado' })
      }

      return sendJson(res, 400, { ok: false, error: 'Ação inválida' })
    }

    return sendJson(res, 405, { ok: false, error: 'Método não permitido' })

  } catch (error) {
    console.error('[API Users]', error)
    return sendJson(res, 500, { ok: false, error: error.message || 'Erro interno no servidor' })
  }
}
