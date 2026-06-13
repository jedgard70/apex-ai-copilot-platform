import { summarizeWorkspaceContext } from './tools/fileTools.mjs'

export function buildOperatorMemory({ identityContext = {}, workspaceContext = {} } = {}) {
  return {
    identity: {
      email: identityContext.email || '',
      role: identityContext.role || '',
      workspaceName: identityContext.workspaceName || '',
      isOwnerAdmin: Boolean(identityContext.isOwnerAdmin),
    },
    workspace: summarizeWorkspaceContext(workspaceContext),
  }
}

