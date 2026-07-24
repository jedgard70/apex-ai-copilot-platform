import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabaseClient = null
if (supabaseUrl && supabaseServiceKey) {
  supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

function getJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'))
      } catch (e) {
        resolve({})
      }
    })
    req.on('error', reject)
  })
}

export default async function handleTenantUsers(req, res) {
  if (!supabaseClient) {
    return sendJson(res, 500, { error: 'Supabase Service Role não configurada.' })
  }

  // Obter a lista de usuários
  if (req.method === 'GET') {
    const { data, error } = await supabaseClient
      .from('tenant_users')
      .select('id,email,role,status,created_at,auth_user_id')
      .order('created_at', { ascending: false })
    if (error) return sendJson(res, 500, { error: error.message })
    return sendJson(res, 200, { users: data })
  }

  // Convidar / Criar usuário (usando a Auth Admin API do Supabase e espelhando na tabela)
  if (req.method === 'POST') {
    const body = await getJsonBody(req)
    const { email, password, role } = body
    if (!email) return sendJson(res, 400, { error: 'Email é obrigatório.' })

    let authResponse;
    if (password) {
      authResponse = await supabaseClient.auth.admin.createUser({
        email,
        password: password,
        email_confirm: true
      });
    } else {
      authResponse = await supabaseClient.auth.admin.inviteUserByEmail(email, {
        data: { role: role || 'viewer' }
      });
    }

    if (authResponse.error) {
      return sendJson(res, 500, { error: authResponse.error.message })
    }

    const authUserId = authResponse.data.user.id

    const insertResult = await supabaseClient.from('tenant_users').insert({
      auth_user_id: authUserId,
      email,
      role: role || 'viewer',
      status: 'active'
    }).select('id,email,role,status,created_at,auth_user_id').single()

    if (insertResult.error) {
      return sendJson(res, 500, { error: insertResult.error.message })
    }

    return sendJson(res, 201, { user: insertResult.data })
  }

  // Atualizar (Role ou Status)
  if (req.method === 'PUT') {
    const body = await getJsonBody(req)
    const { id, role, status } = body
    if (!id) return sendJson(res, 400, { error: 'O ID do usuário é obrigatório.' })

    const updates = {}
    if (role) updates.role = role
    if (status) updates.status = status

    const updateResult = await supabaseClient
      .from('tenant_users')
      .update(updates)
      .eq('id', id)
      .select('id,email,role,status,created_at,auth_user_id')
      .single()
    if (updateResult.error) {
      return sendJson(res, 500, { error: updateResult.error.message })
    }
    return sendJson(res, 200, { user: updateResult.data })
  }

  // Deletar (Bloquear acesso real)
  if (req.method === 'DELETE') {
    const body = await getJsonBody(req)
    const { id } = body
    if (!id) return sendJson(res, 400, { error: 'O ID do usuário é obrigatório.' })

    // Opcional: Se quiser excluir também no auth.users
    // Mas por segurança, podemos apenas excluí-lo da tenant_users
    // ou mudar o status para 'deleted'. Aqui vamos deletar da tenant_users.
    const deleteResult = await supabaseClient.from('tenant_users').delete().eq('id', id)
    if (deleteResult.error) {
      return sendJson(res, 500, { error: deleteResult.error.message })
    }
    return sendJson(res, 200, { message: 'Usuário removido com sucesso' })
  }

  return sendJson(res, 405, { error: 'Method not allowed' })
}
