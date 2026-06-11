import {
  ProjectWorkspace,
  loadActiveProject,
  loadProjects,
  upsertProject,
} from './projectWorkspace'
import { loadSupabaseAccountState } from './supabaseAuthBootstrap'
import { getBrowserSupabaseClient, getSupabaseProviderStatus } from './supabaseClient'

export type PersistenceMode = 'localStorage' | 'supabase-not-connected' | 'supabase-connected' | 'hybrid-sync'

export type RemoteProjectSyncResult = {
  providerStatus: 'synced' | 'supabase-not-connected' | 'needs-auth' | 'needs-bootstrap' | 'sync-error'
  message: string
  localProjectId: string
  remoteProjectId?: string
  tenantId?: string
  counts?: {
    files: number
    messages: number
    exports: number
  }
}

export function getPersistenceMode(): PersistenceMode {
  const status = getSupabaseProviderStatus()
  return status.providerStatus === 'supabase-connected' ? 'supabase-connected' : 'localStorage'
}

export function saveProjectLocal(project: ProjectWorkspace) {
  return {
    providerStatus: 'localStorage-active' as const,
    project: upsertProject(project),
  }
}

export function loadProjectLocal(projectId?: string) {
  const projects = loadProjects()
  return {
    providerStatus: 'localStorage-active' as const,
    project: projectId ? projects.find(project => project.id === projectId) || null : loadActiveProject(),
    projects,
  }
}

export async function saveProjectRemotePlaceholder(project: ProjectWorkspace) {
  return saveProjectRemote(project)
}

export async function loadProjectRemotePlaceholder(projectId?: string) {
  return loadProjectRemote(projectId)
}

export async function saveProjectRemote(project: ProjectWorkspace): Promise<RemoteProjectSyncResult> {
  const { client } = getBrowserSupabaseClient()
  if (!client) {
    return {
      providerStatus: 'supabase-not-connected',
      message: 'Remote Supabase persistence is not connected. LocalStorage remains active.',
      localProjectId: project.id,
    }
  }

  const account = await loadSupabaseAccountState()
  if (account.sessionStatus !== 'signed-in' || !account.user) {
    return {
      providerStatus: 'needs-auth',
      message: 'Login required before syncing a project to Supabase.',
      localProjectId: project.id,
    }
  }
  if (account.bootstrapStatus !== 'ready' || !account.tenant) {
    return {
      providerStatus: 'needs-bootstrap',
      message: account.message,
      localProjectId: project.id,
    }
  }

  const existing = await client
    .from('projects')
    .select('id')
    .eq('tenant_id', account.tenant.id)
    .contains('metadata', { local_project_id: project.id })
    .maybeSingle()

  if (existing.error) {
    return {
      providerStatus: 'sync-error',
      message: existing.error.message,
      localProjectId: project.id,
      tenantId: account.tenant.id,
    }
  }

  let remoteProjectId = existing.data?.id
  if (remoteProjectId) {
    const update = await client
      .from('projects')
      .update({
        name: project.name,
        language: project.language,
        active_tool: project.activeTool || null,
        metadata: {
          local_project_id: project.id,
          active_studio: project.activeStudio || null,
          active_file_id: project.activeFileId || null,
          local_updated_at: project.updatedAt,
          app_state: project.appState || {},
        },
      })
      .eq('id', remoteProjectId)
    if (update.error) {
      return {
        providerStatus: 'sync-error',
        message: update.error.message,
        localProjectId: project.id,
        remoteProjectId,
        tenantId: account.tenant.id,
      }
    }
  } else {
    const insert = await client
      .from('projects')
      .insert({
        tenant_id: account.tenant.id,
        name: project.name,
        language: project.language,
        active_tool: project.activeTool || null,
        created_by: account.user.id,
        metadata: {
          local_project_id: project.id,
          active_studio: project.activeStudio || null,
          active_file_id: project.activeFileId || null,
          local_created_at: project.createdAt,
          local_updated_at: project.updatedAt,
          app_state: project.appState || {},
        },
      })
      .select('id')
      .single()
    if (insert.error) {
      return {
        providerStatus: 'sync-error',
        message: insert.error.message,
        localProjectId: project.id,
        tenantId: account.tenant.id,
      }
    }
    remoteProjectId = insert.data.id
    await client
      .from('project_members')
      .upsert({
        tenant_id: account.tenant.id,
        project_id: remoteProjectId,
        user_id: account.user.id,
        role: account.role || 'owner_admin',
        status: 'active',
        created_by: account.user.id,
        metadata: { source: 'client-sync-bootstrap' },
      }, { onConflict: 'project_id,user_id,role' })
  }

  const tableDelete = async (table: 'project_files' | 'project_messages' | 'project_exports') => {
    await client.from(table).delete().eq('project_id', remoteProjectId)
  }

  await tableDelete('project_files')
  await tableDelete('project_messages')
  await tableDelete('project_exports')

  const fileRows = project.files.map(file => ({
    tenant_id: account.tenant!.id,
    project_id: remoteProjectId,
    bucket: 'project-uploads',
    storage_path: `metadata-only/${account.tenant!.id}/${remoteProjectId}/${file.id}`,
    file_name: file.name,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    file_kind: file.kind,
    source_confidence: 'USER_PROVIDED',
    created_by: account.user!.id,
    metadata: {
      local_file_id: file.id,
      dimensions: file.dimensions || null,
      data_url_present_locally: Boolean(file.dataUrl),
      storage_status: 'metadata-only',
    },
  }))

  if (fileRows.length) {
    const files = await client.from('project_files').insert(fileRows)
    if (files.error) {
      return {
        providerStatus: 'sync-error',
        message: files.error.message,
        localProjectId: project.id,
        remoteProjectId,
        tenantId: account.tenant.id,
      }
    }
  }

  const messageRows = project.chatMessages.map(message => ({
    tenant_id: account.tenant!.id,
    project_id: remoteProjectId,
    role: message.role,
    content: message.text,
    attachments: message.attachmentFileId ? [{ local_file_id: message.attachmentFileId }] : [],
    source_confidence: message.role === 'user' ? 'USER_ENTERED' : 'SYSTEM_GENERATED',
    created_by: account.user!.id,
    metadata: { local_message_id: message.id },
  }))

  if (messageRows.length) {
    const messages = await client.from('project_messages').insert(messageRows)
    if (messages.error) {
      return {
        providerStatus: 'sync-error',
        message: messages.error.message,
        localProjectId: project.id,
        remoteProjectId,
        tenantId: account.tenant.id,
      }
    }
  }

  const exportRows = project.exports.map((item, index) => ({
    tenant_id: account.tenant!.id,
    project_id: remoteProjectId,
    export_type: typeof item === 'object' && item && 'type' in item ? String((item as { type?: unknown }).type || 'project-export') : 'project-export',
    format: 'json',
    status: 'active',
    created_by: account.user!.id,
    metadata: {
      local_export_index: index,
      payload: item,
    },
  }))

  if (exportRows.length) {
    const exportsResult = await client.from('project_exports').insert(exportRows)
    if (exportsResult.error) {
      return {
        providerStatus: 'sync-error',
        message: exportsResult.error.message,
        localProjectId: project.id,
        remoteProjectId,
        tenantId: account.tenant.id,
      }
    }
  }

  return {
    providerStatus: 'synced',
    message: 'Project metadata, messages and export metadata synced to Supabase.',
    localProjectId: project.id,
    remoteProjectId,
    tenantId: account.tenant.id,
    counts: {
      files: fileRows.length,
      messages: messageRows.length,
      exports: exportRows.length,
    },
  }
}

export async function loadProjectsRemote() {
  const { client } = getBrowserSupabaseClient()
  if (!client) return { providerStatus: 'supabase-not-connected' as const, projects: [] }
  const account = await loadSupabaseAccountState()
  if (account.bootstrapStatus !== 'ready' || !account.tenant) {
    return { providerStatus: 'needs-bootstrap' as const, message: account.message, projects: [] }
  }
  const result = await client
    .from('projects')
    .select('id,name,language,active_tool,created_at,updated_at,metadata')
    .eq('tenant_id', account.tenant.id)
    .order('updated_at', { ascending: false })
  if (result.error) return { providerStatus: 'sync-error' as const, message: result.error.message, projects: [] }
  return { providerStatus: 'loaded' as const, projects: result.data || [] }
}

export async function loadProjectRemote(projectId?: string) {
  return {
    providerStatus: 'metadata-loader-not-implemented' as const,
    message: 'Remote full project restore is not implemented yet. Use localStorage restore and sync metadata to Supabase in CP15.',
    projectId: projectId || null,
    project: null,
  }
}

export async function syncProjectLocalToRemote(project: ProjectWorkspace) {
  return saveProjectRemote(project)
}
