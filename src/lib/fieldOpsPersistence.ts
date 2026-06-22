import { IntakeFile } from './fileIntake'
import { FieldOpsPlan, FieldRdoContext } from './fieldOpsKnowledge'
import { ensureRemoteProjectContext } from './projectPersistenceAdapter'
import { ProjectWorkspace } from './projectWorkspace'
import { getBrowserSupabaseClient } from './supabaseClient'

export type FieldOpsRemoteSyncResult = {
  providerStatus: 'synced' | 'supabase-not-connected' | 'needs-auth' | 'needs-bootstrap' | 'sync-error'
  message: string
  rdoId?: string
  remoteProjectId?: string
  tenantId?: string
  counts?: {
    activities: number
    issues: number
    punchItems: number
    photos: number
    safetyChecks: number
    qualityChecks: number
    correctiveActions: number
  }
}

function mapIssueStatus(status: string) {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'resolved') return 'resolved'
  if (normalized === 'in progress') return 'in_review'
  if (normalized === 'open') return 'open'
  return 'draft'
}

function mapChecklistStatus(status: string) {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'accepted') return 'approved'
  if (normalized === 'needs review') return 'in_review'
  if (normalized === 'rejected') return 'rejected'
  return 'draft'
}

function mapActivityStatus(status: string) {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'completed') return 'done'
  if (normalized === 'in progress') return 'in_review'
  if (normalized === 'blocked') return 'needs_revision'
  return 'draft'
}

function formatMutationError(table: string, error: { message?: string; code?: string | null; hint?: string | null }) {
  const base = error.message || `Supabase mutation failed for ${table}.`
  if (error.code === '42501') {
    const hint = error.hint ? ` ${error.hint}` : ''
    return `${base} Check Data API grants and RLS for public.${table}.${hint}`.trim()
  }
  return base
}

function buildSourceMetadata(source?: IntakeFile | null) {
  if (!source) return null
  return {
    file_name: source.file.name,
    mime_type: source.file.type || null,
    size_bytes: source.file.size,
    kind: source.kind,
    dimensions: source.dimensions || null,
  }
}

export function buildFieldOpsPayloads(args: {
  tenantId: string
  remoteProjectId: string
  userId: string
  reportDate: string
  localProjectId: string
  context: FieldRdoContext
  plan: FieldOpsPlan
  rdoId: string
  source?: IntakeFile | null
}) {
  const { tenantId, remoteProjectId, userId, reportDate, localProjectId, context, plan, rdoId, source } = args
  const baseMetadata = {
    local_project_id: localProjectId,
    rdo_id: rdoId,
    source: 'fieldops-panel',
    report_date: reportDate,
  }

  return {
    activities: plan.activities.map(item => ({
      tenant_id: tenantId,
      project_id: remoteProjectId,
      rdo_id: rdoId,
      activity: item.description,
      responsible_party: item.responsibleParty || null,
      evidence_level: item.evidence,
      created_by: userId,
      metadata: {
        ...baseMetadata,
        local_activity_id: item.id,
        activity_status: item.status,
        normalized_status: mapActivityStatus(item.status),
      },
    })),
    issues: plan.issues.map(item => ({
      tenant_id: tenantId,
      project_id: remoteProjectId,
      title: item.issue,
      location: item.location || null,
      severity: item.severity,
      evidence_level: item.evidence,
      status: mapIssueStatus(item.status),
      created_by: userId,
      metadata: {
        ...baseMetadata,
        local_issue_id: item.id,
        assigned_to: item.assignedTo || null,
        due_date: item.dueDate || null,
      },
    })),
    punchItems: plan.qualityItems
      .filter(item => item.status !== 'Accepted')
      .map(item => ({
        tenant_id: tenantId,
        project_id: remoteProjectId,
        title: item.item,
        location: null,
        severity: item.riskLevel,
        status: mapChecklistStatus(item.status),
        evidence_level: item.evidence,
        created_by: userId,
        metadata: {
          ...baseMetadata,
          local_check_id: item.id,
          source_type: 'quality-checklist',
          notes: item.notes || '',
        },
      })),
    photos: plan.photoLog.map(item => ({
      tenant_id: tenantId,
      project_id: remoteProjectId,
      file_id: null,
      caption: item.caption || null,
      location: item.location || null,
      evidence_level: item.evidence,
      created_by: userId,
      metadata: {
        ...baseMetadata,
        local_photo_id: item.id,
        file_name: item.fileName,
        related_activity: item.relatedActivity || null,
        source_file: buildSourceMetadata(source),
      },
    })),
    safetyChecks: plan.safetyItems.map(item => ({
      tenant_id: tenantId,
      project_id: remoteProjectId,
      checklist_date: reportDate,
      risk_level: item.riskLevel,
      evidence_level: item.evidence,
      status: mapChecklistStatus(item.status),
      created_by: userId,
      metadata: {
        ...baseMetadata,
        local_check_id: item.id,
        checklist_type: 'safety',
        item: item.item,
        notes: item.notes || '',
      },
    })),
    qualityChecks: plan.qualityItems.map(item => ({
      tenant_id: tenantId,
      project_id: remoteProjectId,
      checklist_date: reportDate,
      evidence_level: item.evidence,
      status: mapChecklistStatus(item.status),
      created_by: userId,
      metadata: {
        ...baseMetadata,
        local_check_id: item.id,
        checklist_type: 'quality',
        item: item.item,
        notes: item.notes || '',
        risk_level: item.riskLevel,
      },
    })),
    correctiveActions: plan.issues
      .filter(item => item.status !== 'Resolved' || item.dueDate)
      .map(item => ({
        tenant_id: tenantId,
        project_id: remoteProjectId,
        title: item.issue,
        responsible_party: item.assignedTo || null,
        due_date: item.dueDate || null,
        severity: item.severity,
        evidence_level: item.evidence,
        status: mapIssueStatus(item.status),
        created_by: userId,
        metadata: {
          ...baseMetadata,
          source_type: 'field_issue',
          location: item.location || null,
          local_issue_id: item.id,
        },
      })),
    rdoMetadata: {
      ...baseMetadata,
      project_name: context.project,
      crew: context.crew,
      activities_performed: context.activitiesPerformed,
      equipment: context.equipment,
      materials_delivered_used: context.materialsDeliveredUsed,
      visitors: context.visitors,
      delays: context.delays,
      incidents: context.incidents,
      safety_notes: context.safetyNotes,
      quality_notes: context.qualityNotes,
      crew_list: plan.crew,
      materials_list: plan.materials,
      generated_outputs: {
        rdo_draft: plan.rdoDraft,
        client_summary: plan.clientSummary,
        internal_field_report: plan.internalFieldReport,
        safety_report: plan.safetyReport,
        quality_punch_list: plan.qualityPunchList,
        materials_log: plan.materialsLog,
        next_day_plan: plan.nextDayPlan,
        confidence_summary: plan.confidenceSummary,
      },
      activity_statuses: plan.activities.map(item => ({ id: item.id, status: item.status })),
      source_file: buildSourceMetadata(source),
    },
  }
}

export async function syncFieldOpsPlanRemote(args: {
  project: ProjectWorkspace
  context: FieldRdoContext
  plan: FieldOpsPlan
  source?: IntakeFile | null
}): Promise<FieldOpsRemoteSyncResult> {
  const { client } = getBrowserSupabaseClient()
  if (!client) {
    return {
      providerStatus: 'supabase-not-connected',
      message: 'FieldOps RDO saved locally. Supabase is not connected for remote RDO persistence.',
    }
  }

  const projectContext = await ensureRemoteProjectContext(args.project)
  if (
    projectContext.providerStatus !== 'ready'
    || !projectContext.remoteProjectId
    || !projectContext.tenantId
    || !projectContext.userId
  ) {
    return {
      providerStatus: projectContext.providerStatus === 'ready' ? 'sync-error' : projectContext.providerStatus,
      message: projectContext.message,
      remoteProjectId: projectContext.remoteProjectId,
      tenantId: projectContext.tenantId,
    }
  }

  const reportDate = args.context.date || new Date().toISOString().slice(0, 10)
  const existing = await client
    .from('rdos')
    .select('id')
    .eq('tenant_id', projectContext.tenantId)
    .eq('project_id', projectContext.remoteProjectId)
    .eq('report_date', reportDate)
    .contains('metadata', { source: 'fieldops-panel' })
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing.error) {
    return {
      providerStatus: 'sync-error',
      message: formatMutationError('rdos', existing.error),
      remoteProjectId: projectContext.remoteProjectId,
      tenantId: projectContext.tenantId,
    }
  }

  const baseRdoPayload = {
    tenant_id: projectContext.tenantId,
    project_id: projectContext.remoteProjectId,
    report_date: reportDate,
    weather: args.context.weather || null,
    status: 'draft',
    evidence_level: args.plan.photoLog.length ? 'PHOTO_CONFIRMED' : 'USER_REPORTED',
  }

  let rdoId = existing.data?.id || ''
  if (rdoId) {
    const update = await client
      .from('rdos')
      .update(baseRdoPayload)
      .eq('id', rdoId)
      .select('id')
      .single()
    if (update.error) {
      return {
        providerStatus: 'sync-error',
        message: formatMutationError('rdos', update.error),
        remoteProjectId: projectContext.remoteProjectId,
        tenantId: projectContext.tenantId,
      }
    }
    rdoId = update.data.id
  } else {
    const insert = await client
      .from('rdos')
      .insert({
        ...baseRdoPayload,
        created_by: projectContext.userId,
        metadata: {},
      })
      .select('id')
      .single()
    if (insert.error) {
      return {
        providerStatus: 'sync-error',
        message: formatMutationError('rdos', insert.error),
        remoteProjectId: projectContext.remoteProjectId,
        tenantId: projectContext.tenantId,
      }
    }
    rdoId = insert.data.id
  }

  const payloads = buildFieldOpsPayloads({
    tenantId: projectContext.tenantId,
    remoteProjectId: projectContext.remoteProjectId,
    userId: projectContext.userId,
    reportDate,
    localProjectId: args.project.id,
    context: args.context,
    plan: args.plan,
    rdoId,
    source: args.source,
  })

  const rdoMetadataUpdate = await client
    .from('rdos')
    .update({
      metadata: payloads.rdoMetadata,
    })
    .eq('id', rdoId)
  if (rdoMetadataUpdate.error) {
    return {
      providerStatus: 'sync-error',
      message: formatMutationError('rdos', rdoMetadataUpdate.error),
      rdoId,
      remoteProjectId: projectContext.remoteProjectId,
      tenantId: projectContext.tenantId,
    }
  }

  const cleanupRequests = [
    client.from('rdo_activities').delete().eq('rdo_id', rdoId),
    client.from('field_photos').delete().eq('project_id', projectContext.remoteProjectId).contains('metadata', { rdo_id: rdoId }),
    client.from('field_issues').delete().eq('project_id', projectContext.remoteProjectId).contains('metadata', { rdo_id: rdoId }),
    client.from('punch_items').delete().eq('project_id', projectContext.remoteProjectId).contains('metadata', { rdo_id: rdoId }),
    client.from('safety_checklists').delete().eq('project_id', projectContext.remoteProjectId).contains('metadata', { rdo_id: rdoId }),
    client.from('quality_checklists').delete().eq('project_id', projectContext.remoteProjectId).contains('metadata', { rdo_id: rdoId }),
    client.from('corrective_actions').delete().eq('project_id', projectContext.remoteProjectId).contains('metadata', { rdo_id: rdoId }),
  ]
  const cleanupResults = await Promise.all(cleanupRequests)
  const cleanupError = cleanupResults.find((result: { error?: { message?: string } | null }) => result.error)?.error
  if (cleanupError) {
    return {
      providerStatus: 'sync-error',
      message: cleanupError.message || 'Failed to refresh existing FieldOps child records in Supabase.',
      rdoId,
      remoteProjectId: projectContext.remoteProjectId,
      tenantId: projectContext.tenantId,
    }
  }

  if (payloads.activities.length) {
    const result = await client.from('rdo_activities').insert(payloads.activities)
    if (result.error) {
      return {
        providerStatus: 'sync-error',
        message: formatMutationError('rdo_activities', result.error),
        rdoId,
        remoteProjectId: projectContext.remoteProjectId,
        tenantId: projectContext.tenantId,
      }
    }
  }
  if (payloads.photos.length) {
    const result = await client.from('field_photos').insert(payloads.photos)
    if (result.error) {
      return {
        providerStatus: 'sync-error',
        message: formatMutationError('field_photos', result.error),
        rdoId,
        remoteProjectId: projectContext.remoteProjectId,
        tenantId: projectContext.tenantId,
      }
    }
  }
  if (payloads.issues.length) {
    const result = await client.from('field_issues').insert(payloads.issues)
    if (result.error) {
      return {
        providerStatus: 'sync-error',
        message: formatMutationError('field_issues', result.error),
        rdoId,
        remoteProjectId: projectContext.remoteProjectId,
        tenantId: projectContext.tenantId,
      }
    }
  }
  if (payloads.punchItems.length) {
    const result = await client.from('punch_items').insert(payloads.punchItems)
    if (result.error) {
      return {
        providerStatus: 'sync-error',
        message: formatMutationError('punch_items', result.error),
        rdoId,
        remoteProjectId: projectContext.remoteProjectId,
        tenantId: projectContext.tenantId,
      }
    }
  }
  if (payloads.safetyChecks.length) {
    const result = await client.from('safety_checklists').insert(payloads.safetyChecks)
    if (result.error) {
      return {
        providerStatus: 'sync-error',
        message: formatMutationError('safety_checklists', result.error),
        rdoId,
        remoteProjectId: projectContext.remoteProjectId,
        tenantId: projectContext.tenantId,
      }
    }
  }
  if (payloads.qualityChecks.length) {
    const result = await client.from('quality_checklists').insert(payloads.qualityChecks)
    if (result.error) {
      return {
        providerStatus: 'sync-error',
        message: formatMutationError('quality_checklists', result.error),
        rdoId,
        remoteProjectId: projectContext.remoteProjectId,
        tenantId: projectContext.tenantId,
      }
    }
  }
  if (payloads.correctiveActions.length) {
    const result = await client.from('corrective_actions').insert(payloads.correctiveActions)
    if (result.error) {
      return {
        providerStatus: 'sync-error',
        message: formatMutationError('corrective_actions', result.error),
        rdoId,
        remoteProjectId: projectContext.remoteProjectId,
        tenantId: projectContext.tenantId,
      }
    }
  }

  return {
    providerStatus: 'synced',
    message: 'FieldOps RDO saved locally and synced to Supabase.',
    rdoId,
    remoteProjectId: projectContext.remoteProjectId,
    tenantId: projectContext.tenantId,
    counts: {
      activities: payloads.activities.length,
      issues: payloads.issues.length,
      punchItems: payloads.punchItems.length,
      photos: payloads.photos.length,
      safetyChecks: payloads.safetyChecks.length,
      qualityChecks: payloads.qualityChecks.length,
      correctiveActions: payloads.correctiveActions.length,
    },
  }
}
