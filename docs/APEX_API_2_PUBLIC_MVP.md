# Apex AI 2.0 Public API MVP

Base URL:

- Production clean path: `/v1`
- Vercel function path: `/api/v1`

Authentication:

- Header: `Authorization: Bearer <api_key>`
- Recommended env for customer keys: `APEX_PUBLIC_API_KEYS`
- Format: `key:orgId:plan:scope1,scope2;key2:org2:engineer_pro:read:*,operate:revit`
- Owner/internal fallback: `APEX_API_KEY`, `APEX_OWNER_API_KEY`, or `APEX_API_TOKEN`

Endpoints:

- `POST /v1/chat/completions`
- `POST /v1/apex/engineering/analyze`
- `POST /v1/apex/revit/operate`
- `POST /v1/apex/images/generate`
- `GET|POST|PUT|PATCH /v1/apex/projects`
- `POST /v1/apex/approvals`
- `GET /v1/apex/plans`

Scopes:

- `read:*`
- `operate:revit`
- `operate:images`
- `operate:projects`
- `write:revit`
- `write:files`
- `admin:billing`

Write confirmation:

- Any `write:*` route requires `X-Apex-Approval-Token`.
- Create it with `POST /v1/apex/approvals` using a key that already has the target write scope.
- Tokens are short lived and scoped to the organization and requested operation.

Product positioning:

- Sell to engineers as `Engineering Copilot API com operacoes BIM controladas`.
- Never position it as an agent that changes a client BIM model invisibly.
- `read` is analysis, `operate` is connected safe operation, `write` mutates files/models and requires approval plus audit evidence.

Current MVP limits:

- Usage metering is in-process per deployment instance and returned in response headers/body.
- Persistent billing should be connected next through Supabase tables or Stripe metered billing.
- Revit write accepts/queues only when APS/MCP is configured; it does not fake model edits.
