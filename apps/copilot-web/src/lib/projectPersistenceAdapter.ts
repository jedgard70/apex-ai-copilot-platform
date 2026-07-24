import {
  createProject,
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

export type RemoteProjectContextResult = {
  providerStatus: 'ready' | 'supabase-not-connected' | 'needs-auth' | 'needs-bootstrap' | 'sync-error'
  message: string
  localProjectId: string
  remoteProjectId?: string
  tenantId?: string
  userId?: string
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

export async function ensureRemoteProjectContext(project: ProjectWorkspace): Promise<RemoteProjectContextResult> {
  const { client } = getBrowserSupabaseClient()
  if (!client) {
    return {
      providerStatus: 'supabase-not-connected',
      message: 'Remote Supabase persistence is not connected.',
      localProjectId: project.id,
    }
  }

  const account = await loadSupabaseAccountState()
  if (account.sessionStatus !== 'signed-in' || !account.user) {
    return {
      providerStatus: 'needs-auth',
      message: 'Login required before syncing project-linked data to Supabase.',
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

  const projectMetadata = {
    local_project_id: project.id,
    active_studio: project.activeStudio || null,
    active_file_id: project.activeFileId || null,
    local_created_at: project.createdAt,
    local_updated_at: project.updatedAt,
    app_state: project.appState || {},
    project_profile: project.projectProfile || null,
    generation_history: project.generationHistory || [],
    project_memory: project.projectMemory || [],
    revision_constraints: project.revisionConstraints || [],
    preferences: project.preferences || [],
    skill_updates: project.skillUpdates || [],
    upgrade_plans: project.upgradePlans || [],
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
      userId: account.user.id,
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
        metadata: projectMetadata,
      })
      .eq('id', remoteProjectId)

    if (update.error) {
      return {
        providerStatus: 'sync-error',
        message: update.error.message,
        localProjectId: project.id,
        remoteProjectId,
        tenantId: account.tenant.id,
        userId: account.user.id,
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
        metadata: projectMetadata,
      })
      .select('id')
      .single()

    if (insert.error) {
      return {
        providerStatus: 'sync-error',
        message: insert.error.message,
        localProjectId: project.id,
        tenantId: account.tenant.id,
        userId: account.user.id,
      }
    }

    remoteProjectId = insert.data.id

    const membership = await client
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

    if (membership.error) {
      return {
        providerStatus: 'sync-error',
        message: membership.error.message,
        localProjectId: project.id,
        remoteProjectId,
        tenantId: account.tenant.id,
        userId: account.user.id,
      }
    }
  }

  return {
    providerStatus: 'ready',
    message: 'Remote project context is ready.',
    localProjectId: project.id,
    remoteProjectId,
    tenantId: account.tenant.id,
    userId: account.user.id,
  }
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

  const syncBatchId = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const context = await ensureRemoteProjectContext(project)
  if (context.providerStatus !== 'ready' || !context.remoteProjectId || !context.tenantId || !context.userId) {
    return {
      providerStatus: context.providerStatus === 'ready' ? 'sync-error' : context.providerStatus,
      message: context.message,
      localProjectId: project.id,
      remoteProjectId: context.remoteProjectId,
      tenantId: context.tenantId,
    }
  }

  const account = await loadSupabaseAccountState()
  if (account.sessionStatus !== 'signed-in' || !account.user || !account.tenant) {
    return {
      providerStatus: 'needs-auth',
      message: 'Login required before syncing a project to Supabase.',
      localProjectId: project.id,
      remoteProjectId: context.remoteProjectId,
      tenantId: context.tenantId,
    }
  }

  const remoteProjectId = context.remoteProjectId
  const syncMetadata = {
    local_project_id: project.id,
    active_studio: project.activeStudio || null,
    active_file_id: project.activeFileId || null,
    local_created_at: project.createdAt,
    local_updated_at: project.updatedAt,
    app_state: project.appState || {},
    project_profile: project.projectProfile || null,
    generation_history: project.generationHistory || [],
    project_memory: project.projectMemory || [],
    revision_constraints: project.revisionConstraints || [],
    preferences: project.preferences || [],
    skill_updates: project.skillUpdates || [],
    upgrade_plans: project.upgradePlans || [],
    last_sync_batch: syncBatchId,
  }
  const projectSyncUpdate = await client
    .from('projects')
    .update({
      name: project.name,
      language: project.language,
      active_tool: project.activeTool || null,
      metadata: syncMetadata,
    })
    .eq('id', remoteProjectId)
  if (projectSyncUpdate.error) {
    return {
      providerStatus: 'sync-error',
      message: projectSyncUpdate.error.message,
      localProjectId: project.id,
      remoteProjectId,
      tenantId: context.tenantId,
    }
  }

  const fileRows = project.files.map(file => ({
    tenant_id: context.tenantId,
    project_id: remoteProjectId,
    bucket: 'project-uploads',
    storage_path: `metadata-only/${context.tenantId}/${remoteProjectId}/${file.id}`,
    file_name: file.name,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    file_kind: file.kind,
    source_confidence: 'USER_PROVIDED',
    created_by: context.userId,
    metadata: {
      local_file_id: file.id,
      dimensions: file.dimensions || null,
      data_url_present_locally: Boolean(file.dataUrl),
      storage_status: 'metadata-only',
      sync_batch: syncBatchId,
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
    tenant_id: context.tenantId,
    project_id: remoteProjectId,
    role: message.role,
    content: message.text,
    attachments: message.attachmentFileId ? [{ local_file_id: message.attachmentFileId }] : [],
    source_confidence: message.role === 'user' ? 'USER_ENTERED' : 'SYSTEM_GENERATED',
    created_by: context.userId,
    metadata: { local_message_id: message.id, sync_batch: syncBatchId },
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
    tenant_id: context.tenantId,
    project_id: remoteProjectId,
    export_type: typeof item === 'object' && item && 'type' in item ? String((item as { type?: unknown }).type || 'project-export') : 'project-export',
    format: 'json',
    status: 'active',
    created_by: context.userId,
    metadata: {
      local_export_index: index,
      payload: item,
      sync_batch: syncBatchId,
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
  const { client } = getBrowserSupabaseClient()
  if (!client) {
    return {
      providerStatus: 'supabase-not-connected' as const,
      message: 'Remote Supabase persistence is not connected.',
      projectId: projectId || null,
      project: null,
    }
  }

  const account = await loadSupabaseAccountState()
  if (account.bootstrapStatus !== 'ready' || !account.tenant) {
    return {
      providerStatus: 'needs-bootstrap' as const,
      message: account.message,
      projectId: projectId || null,
      project: null,
    }
  }

  let projectRow = null as any
  if (projectId) {
    const byRemoteId = await client
      .from('projects')
      .select('id,name,language,active_tool,created_at,updated_at,metadata')
      .eq('tenant_id', account.tenant.id)
      .eq('id', projectId)
      .maybeSingle()
    if (byRemoteId.error) {
      return {
        providerStatus: 'sync-error' as const,
        message: byRemoteId.error.message,
        projectId,
        project: null,
      }
    }
    projectRow = byRemoteId.data
    if (!projectRow) {
      const byLocalId = await client
        .from('projects')
        .select('id,name,language,active_tool,created_at,updated_at,metadata')
        .eq('tenant_id', account.tenant.id)
        .contains('metadata', { local_project_id: projectId })
        .maybeSingle()
      if (byLocalId.error) {
        return {
          providerStatus: 'sync-error' as const,
          message: byLocalId.error.message,
          projectId,
          project: null,
        }
      }
      projectRow = byLocalId.data
    }
  } else {
    const latest = await client
      .from('projects')
      .select('id,name,language,active_tool,created_at,updated_at,metadata')
      .eq('tenant_id', account.tenant.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (latest.error) {
      return {
        providerStatus: 'sync-error' as const,
        message: latest.error.message,
        projectId: null,
        project: null,
      }
    }
    projectRow = latest.data
  }

  if (!projectRow) {
    return {
      providerStatus: 'loaded' as const,
      message: 'No remote project was found for this request.',
      projectId: projectId || null,
      project: null,
    }
  }

  const [filesResult, messagesResult, exportsResult] = await Promise.all([
    client
      .from('project_files')
      .select('file_name,mime_type,size_bytes,file_kind,metadata,created_at')
      .eq('project_id', projectRow.id)
      .order('created_at', { ascending: true }),
    client
      .from('project_messages')
      .select('role,content,attachments,metadata,created_at')
      .eq('project_id', projectRow.id)
      .order('created_at', { ascending: true }),
    client
      .from('project_exports')
      .select('export_type,metadata,created_at')
      .eq('project_id', projectRow.id)
      .order('created_at', { ascending: true }),
  ])

  const firstError = filesResult.error || messagesResult.error || exportsResult.error
  if (firstError) {
    return {
      providerStatus: 'sync-error' as const,
      message: firstError.message,
      projectId: projectId || projectRow.id,
      project: null,
    }
  }

  const metadata = projectRow.metadata && typeof projectRow.metadata === 'object' ? projectRow.metadata as Record<string, any> : {}
  const syncBatchId = String(metadata.last_sync_batch || '')
  const localProjectId = String(metadata.local_project_id || projectRow.id)
  const fileRows = (filesResult.data || []).filter((file: any) => !syncBatchId || file?.metadata?.sync_batch === syncBatchId)
  const messageRows = (messagesResult.data || []).filter((message: any) => !syncBatchId || message?.metadata?.sync_batch === syncBatchId)
  const exportRows = (exportsResult.data || []).filter((item: any) => !syncBatchId || item?.metadata?.sync_batch === syncBatchId)
  const hasMetadataOnlyFiles = fileRows.some((file: any) => file?.metadata?.storage_status === 'metadata-only')
  const project = createProject(projectRow.name || 'Apex Project')
  project.id = localProjectId
  project.name = projectRow.name || project.name
  project.language = projectRow.language || project.language
  project.createdAt = String(metadata.local_created_at || projectRow.created_at || project.createdAt)
  project.updatedAt = String(metadata.local_updated_at || projectRow.updated_at || project.updatedAt)
  project.activeTool = projectRow.active_tool || undefined
  project.activeStudio = metadata.active_studio || null
  project.activeFileId = metadata.active_file_id || undefined
  project.appState = metadata.app_state && typeof metadata.app_state === 'object' ? metadata.app_state : {}
  project.projectProfile = metadata.project_profile || null
  project.generationHistory = Array.isArray(metadata.generation_history) ? metadata.generation_history : []
  project.projectMemory = Array.isArray(metadata.project_memory) ? metadata.project_memory : []
  project.revisionConstraints = Array.isArray(metadata.revision_constraints) ? metadata.revision_constraints : []
  project.preferences = Array.isArray(metadata.preferences) ? metadata.preferences : []
  project.skillUpdates = Array.isArray(metadata.skill_updates) ? metadata.skill_updates : []
  project.upgradePlans = Array.isArray(metadata.upgrade_plans) ? metadata.upgrade_plans : []
  project.files = fileRows.map((file: any) => ({
    id: String(file?.metadata?.local_file_id || crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`),
    name: String(file?.file_name || 'remote-file'),
    type: String(file?.mime_type || 'application/octet-stream'),
    size: Number(file?.size_bytes || 0),
    kind: String(file?.file_kind || 'unknown'),
    dimensions: file?.metadata?.dimensions || undefined,
    addedAt: String(file?.created_at || project.updatedAt),
  }))
  project.chatMessages = messageRows.map((message: any, index: number) => ({
    id: String(message?.metadata?.local_message_id || `remote-message-${index + 1}`),
    role: message?.role === 'assistant' ? 'assistant' : 'user',
    text: String(message?.content || ''),
    attachmentFileId: Array.isArray(message?.attachments) && message.attachments[0]?.local_file_id
      ? String(message.attachments[0].local_file_id)
      : undefined,
  }))
  project.exports = exportRows.map((item: any) => {
    const payload = item?.metadata?.payload
    if (payload && typeof payload === 'object') return payload
    return {
      type: String(item?.export_type || 'project-export'),
      timestamp: String(item?.created_at || project.updatedAt),
    }
  })

  const savedProject = upsertProject(project)
  return {
    providerStatus: 'loaded' as const,
    message: hasMetadataOnlyFiles
      ? 'Remote project metadata restored. File-backed workflows remain unavailable until full file blob sync is implemented.'
      : 'Remote project restored from Supabase metadata.',
    projectId: projectId || projectRow.id,
    project: savedProject,
  }
}

export async function syncProjectLocalToRemote(project: ProjectWorkspace) {
  return saveProjectRemote(project)
}
