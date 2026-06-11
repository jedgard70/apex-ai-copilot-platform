import { ProjectFileRecord } from './projectWorkspace'
import { getBrowserSupabaseClient } from './supabaseClient'

export type SupabaseUploadResult = {
  providerStatus: 'uploaded' | 'supabase-not-configured' | 'upload-error'
  bucket: string
  path?: string
  file?: ProjectFileRecord
  message: string
}

function safeFileName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'apex-upload'
}

export async function uploadProjectFileToSupabase(params: {
  file: File
  tenantId: string
  projectId: string
  kind?: string
  bucket?: string
}): Promise<SupabaseUploadResult> {
  const { client, status } = getBrowserSupabaseClient()
  const bucket = params.bucket || 'project-uploads'
  if (!client) {
    return {
      providerStatus: 'supabase-not-configured',
      bucket,
      message: status.message,
    }
  }

  const path = `${params.tenantId}/${params.projectId}/${crypto.randomUUID()}-${safeFileName(params.file.name)}`
  const upload = await client.storage
    .from(bucket)
    .upload(path, params.file, {
      contentType: params.file.type || 'application/octet-stream',
      upsert: false,
    })

  if (upload.error) {
    return {
      providerStatus: 'upload-error',
      bucket,
      path,
      message: upload.error.message,
    }
  }

  const fileRow = await client
    .from('project_files')
    .insert({
      tenant_id: params.tenantId,
      project_id: params.projectId,
      bucket,
      storage_path: path,
      file_name: params.file.name,
      mime_type: params.file.type || 'application/octet-stream',
      size_bytes: params.file.size,
      file_kind: params.kind || 'upload',
      source_confidence: 'USER_PROVIDED',
      metadata: {
        original_name: params.file.name,
        storage_status: 'uploaded',
      },
    })
    .select('id')
    .single()

  if (fileRow.error) {
    return {
      providerStatus: 'upload-error',
      bucket,
      path,
      message: `File uploaded, but metadata insert failed: ${fileRow.error.message}`,
    }
  }

  return {
    providerStatus: 'uploaded',
    bucket,
    path,
    file: {
      id: fileRow.data.id,
      name: params.file.name,
      type: params.file.type || 'application/octet-stream',
      size: params.file.size,
      kind: params.kind || 'upload',
      addedAt: new Date().toISOString(),
    },
    message: 'File uploaded to Supabase Storage and metadata saved.',
  }
}
