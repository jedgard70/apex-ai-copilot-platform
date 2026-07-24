import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import handler from '../../api/v1/apex/projects.mjs'
import { createApprovalToken } from '../../server/apexApi/auth.mjs'

type MockReq = {
  method: string
  headers?: Record<string, string>
  query?: Record<string, string>
  body?: Record<string, unknown>
}

function createMockRes() {
  const headers = new Map<string, string>()
  return {
    headers,
    statusCode: 200,
    payload: null as unknown,
    setHeader(name: string, value: string) {
      headers.set(name, value)
    },
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.payload = body
      return this
    },
  }
}

function buildApprovalToken(orgId = 'org-main', scopes = ['write:files']) {
  return createApprovalToken({
    auth: { orgId, plan: 'studio_firm' },
    scopes,
    operation: 'write',
    ttlSeconds: 600,
  })
}

describe('api/v1/apex/projects', () => {
  const originalKeys = process.env.APEX_PUBLIC_API_KEYS

  beforeEach(() => {
    process.env.APEX_PUBLIC_API_KEYS = 'key-main:org-main:studio_firm;key-other:org-other:studio_firm'
  })

  afterEach(() => {
    process.env.APEX_PUBLIC_API_KEYS = originalKeys
  })

  it('denies calls without valid API key', async () => {
    const req: MockReq = { method: 'GET', query: { project_id: 'project-auth-deny' } }
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(401)
    expect((res.payload as { error: string }).error).toBe('invalid_api_key')
  })

  it('blocks write mutations without approval token', async () => {
    const req: MockReq = {
      method: 'POST',
      headers: { 'x-api-key': 'key-main' },
      body: { project_id: 'project-needs-approval', metadata: { stage: 'draft' } },
    }
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(409)
    expect((res.payload as { error: string }).error).toBe('approval_required')
  })

  it('rejects approval token from another organization', async () => {
    const req: MockReq = {
      method: 'POST',
      headers: {
        'x-api-key': 'key-main',
        'x-apex-approval-token': buildApprovalToken('org-other'),
      },
      body: { project_id: 'project-wrong-org', metadata: { stage: 'draft' } },
    }
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(403)
    expect((res.payload as { error: string }).error).toBe('expired_or_wrong_approval')
  })

  it('persists POST updates and returns project on GET for same org/project', async () => {
    const projectId = 'project-write-read-roundtrip'
    const postReq: MockReq = {
      method: 'POST',
      headers: {
        'x-api-key': 'key-main',
        'x-apex-approval-token': buildApprovalToken('org-main'),
      },
      body: {
        project_id: projectId,
        metadata: { phase: 'execution', revision: 3 },
        files: [{ id: 'file-1', name: 'plan.pdf' }],
      },
    }
    const postRes = createMockRes()

    await handler(postReq, postRes)

    expect(postRes.statusCode).toBe(200)
    expect((postRes.payload as { project: { metadata: { phase: string } } }).project.metadata.phase).toBe('execution')
    expect((postRes.payload as { project: { files: unknown[] } }).project.files).toHaveLength(1)

    const getReq: MockReq = {
      method: 'GET',
      headers: { 'x-api-key': 'key-main' },
      query: { project_id: projectId },
    }
    const getRes = createMockRes()
    await handler(getReq, getRes)

    expect(getRes.statusCode).toBe(200)
    expect((getRes.payload as { project: { project_id: string } }).project.project_id).toBe(projectId)
    expect((getRes.payload as { project: { metadata: { revision: number } } }).project.metadata.revision).toBe(3)
  })

  it('isolates in-memory projects by organization boundary', async () => {
    const projectId = 'project-org-boundary'
    const postReq: MockReq = {
      method: 'POST',
      headers: {
        'x-api-key': 'key-main',
        'x-apex-approval-token': buildApprovalToken('org-main'),
      },
      body: { project_id: projectId, metadata: { owner: 'main' } },
    }
    await handler(postReq, createMockRes())

    const readFromOtherOrgReq: MockReq = {
      method: 'GET',
      headers: { 'x-api-key': 'key-other' },
      query: { project_id: projectId },
    }
    const readFromOtherOrgRes = createMockRes()

    await handler(readFromOtherOrgReq, readFromOtherOrgRes)

    expect(readFromOtherOrgRes.statusCode).toBe(200)
    expect((readFromOtherOrgRes.payload as { project: { org_id: string } }).project.org_id).toBe('org-other')
    expect((readFromOtherOrgRes.payload as { project: { files: unknown[] } }).project.files).toEqual([])
    expect((readFromOtherOrgRes.payload as { project: { source: string } }).project.source).toBe('memory_meter')
  })

  it('returns method_not_allowed for unsupported methods', async () => {
    const req: MockReq = {
      method: 'DELETE',
      headers: {
        'x-api-key': 'key-main',
        'x-apex-approval-token': buildApprovalToken('org-main'),
      },
      body: { project_id: 'project-delete-unsupported' },
    }
    const res = createMockRes()

    await handler(req, res)

    expect(res.statusCode).toBe(405)
    expect((res.payload as { error: string }).error).toBe('method_not_allowed')
    expect(res.headers.get('Allow')).toBe('GET, POST, PUT, PATCH')
  })
})
