import fs from 'node:fs'
import path from 'node:path'

export function fileExists(filePath) {
  return fs.existsSync(filePath)
}

export function repoFileExists(repoPath, relativePath) {
  return fileExists(path.join(repoPath, relativePath))
}

export function summarizeWorkspaceContext(workspaceContext = {}) {
  return {
    activeProjectName: workspaceContext.activeProjectName || workspaceContext.projectName || '',
    activeStudio: workspaceContext.activeStudio || '',
    filesCount: Array.isArray(workspaceContext.files) ? workspaceContext.files.length : undefined,
    messagesCount: Array.isArray(workspaceContext.messages) ? workspaceContext.messages.length : undefined,
  }
}

