import {
  ProjectWorkspace,
  loadActiveProject,
  loadProjects,
  upsertProject,
} from './projectWorkspace'
import { getSupabaseProviderStatus } from './supabaseClient'

export type PersistenceMode = 'localStorage' | 'supabase-not-connected' | 'supabase-ready-placeholder'

export function getPersistenceMode(): PersistenceMode {
  const status = getSupabaseProviderStatus()
  return status.providerStatus === 'supabase-connected' ? 'supabase-ready-placeholder' : 'localStorage'
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
  return {
    providerStatus: 'supabase-not-connected' as const,
    message: 'Remote Supabase persistence is not connected yet. LocalStorage remains the active persistence layer.',
    projectId: project.id,
  }
}

export async function loadProjectRemotePlaceholder(projectId?: string) {
  return {
    providerStatus: 'supabase-not-connected' as const,
    message: 'Remote Supabase persistence is not connected yet. LocalStorage remains the active persistence layer.',
    projectId: projectId || null,
    project: null,
  }
}
