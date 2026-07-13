import { createClient } from '@supabase/supabase-js'

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

/**
 * Faz upload do buffer para o Supabase Storage e registra na tabela project_files
 * @param {Buffer} buffer 
 * @param {string} mimeType 
 * @param {string} fileName 
 * @param {string} projectId 
 * @param {string} tenantId (opcional)
 * @returns {Promise<{file_id: string, url: string}>}
 */
export async function uploadMediaAndRegister(buffer, mimeType, fileName, projectId, tenantId = null) {
  const supabaseAdmin = getAdminSupabase()
  const bucketName = 'project-assets'
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2,8)}_${fileName}`
  const storagePath = `directcut/${projectId || 'global'}/${uniqueName}`

  // 1. Upload to Storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false
    })
  
  if (uploadError) {
    console.error('[supabaseMedia] Erro no upload:', uploadError.message)
    // Se o bucket não existir, vamos tentar criá-lo (se tivermos permissão)
    if (uploadError.message.includes('Bucket not found')) {
       await supabaseAdmin.storage.createBucket(bucketName, { public: true })
       const { error: retryError } = await supabaseAdmin.storage
         .from(bucketName)
         .upload(storagePath, buffer, { contentType: mimeType, upsert: false })
       if (retryError) throw retryError
    } else {
       throw uploadError
    }
  }

  const { data: publicData } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(storagePath)
  
  const publicUrl = publicData.publicUrl

  // Se nao passou projectId, só devolve a URL
  if (!projectId) {
    return { file_id: null, url: publicUrl }
  }

  // 2. Registrar no project_files
  let finalTenantId = tenantId
  if (!finalTenantId) {
    const { data: projData } = await supabaseAdmin.from('projects').select('tenant_id').eq('id', projectId).single()
    if (projData) finalTenantId = projData.tenant_id
  }

  // Se ainda não tiver tenant_id, não grava no db (evita erro de constraint)
  if (!finalTenantId) {
    return { file_id: null, url: publicUrl }
  }

  const fileKind = mimeType.startsWith('video') ? 'video' : mimeType.startsWith('audio') ? 'audio' : 'document'

  const { data: fileData, error: dbError } = await supabaseAdmin
    .from('project_files')
    .insert([{
      tenant_id: finalTenantId,
      project_id: projectId,
      bucket: bucketName,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: mimeType,
      size_bytes: buffer.length,
      file_kind: fileKind,
      source_confidence: 'SYSTEM_GENERATED',
      status: 'active'
    }])
    .select('id')
    .single()
  
  if (dbError) {
    console.error('[supabaseMedia] Erro ao gravar project_files:', dbError.message)
    throw dbError
  }

  return { file_id: fileData.id, url: publicUrl }
}
