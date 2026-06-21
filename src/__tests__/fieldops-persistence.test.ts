import { describe, expect, it } from 'vitest'
import { buildFieldOpsPayloads } from '../lib/fieldOpsPersistence'
import { emptyFieldOpsPlan, FieldRdoContext } from '../lib/fieldOpsKnowledge'

describe('fieldOpsPersistence', () => {
  it('maps field ops plan into Supabase payload groups', () => {
    const context: FieldRdoContext = {
      date: '2026-06-21',
      project: 'Obra Alpha',
      weather: 'Ensolarado',
      crew: '8 trabalhadores',
      activitiesPerformed: 'Concretagem e vistoria',
      equipment: 'Betoneira',
      materialsDeliveredUsed: 'Concreto usinado',
      visitors: 'Cliente final',
      delays: 'Sem atrasos',
      incidents: 'Nenhum',
      safetyNotes: 'EPI conferido',
      qualityNotes: 'Acabamento em revisão',
    }

    const plan = emptyFieldOpsPlan()
    plan.activities = [
      {
        id: 'activity-1',
        description: 'Concretagem da laje',
        responsibleParty: 'Equipe civil',
        evidence: 'PHOTO_CONFIRMED',
        status: 'Completed',
      },
    ]
    plan.issues = [
      {
        id: 'issue-1',
        issue: 'Revisar prumo da alvenaria',
        location: 'Bloco B',
        severity: 'High',
        evidence: 'USER_REPORTED',
        assignedTo: 'Eng. Carlos',
        dueDate: '2026-06-22',
        status: 'In Progress',
      },
    ]
    plan.photoLog = [
      {
        id: 'photo-1',
        fileName: 'obra-1.jpg',
        caption: 'Andamento da concretagem',
        location: 'Laje 2',
        relatedActivity: 'Concretagem da laje',
        evidence: 'PHOTO_CONFIRMED',
      },
    ]
    plan.qualityItems = plan.qualityItems.map(item => ({
      ...item,
      status: 'Accepted',
      notes: '',
      evidence: 'USER_REPORTED',
      riskLevel: 'Medium',
    }))
    plan.safetyItems[0] = {
      ...plan.safetyItems[0],
      status: 'Needs review',
      notes: 'Linha de vida precisa ajuste',
      evidence: 'USER_REPORTED',
      riskLevel: 'High',
    }
    plan.qualityItems[0] = {
      ...plan.qualityItems[0],
      status: 'Rejected',
      notes: 'Refazer acabamento',
      evidence: 'PHOTO_CONFIRMED',
      riskLevel: 'Medium',
    }

    const payloads = buildFieldOpsPayloads({
      tenantId: 'tenant-1',
      remoteProjectId: '11111111-1111-1111-1111-111111111111',
      userId: 'user-1',
      reportDate: context.date,
      localProjectId: 'project-local-1',
      context,
      plan,
      rdoId: '22222222-2222-2222-2222-222222222222',
    })

    expect(payloads.activities).toHaveLength(1)
    expect(payloads.activities[0].metadata.normalized_status).toBe('done')
    expect(payloads.issues).toHaveLength(1)
    expect(payloads.issues[0].status).toBe('in_review')
    expect(payloads.photos).toHaveLength(1)
    expect(payloads.safetyChecks[0].status).toBe('in_review')
    expect(payloads.qualityChecks[0].status).toBe('rejected')
    expect(payloads.punchItems).toHaveLength(1)
    expect(payloads.correctiveActions).toHaveLength(1)
    expect(payloads.rdoMetadata.project_name).toBe('Obra Alpha')
    expect(payloads.rdoMetadata.generated_outputs.rdo_draft).toBe(plan.rdoDraft)
  })
})
