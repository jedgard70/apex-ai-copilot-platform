import { runFixedCommand, runApprovedCommit } from '../executor.mjs'

export async function collectGitEvidence(repoPath) {
  return {
    status: await runFixedCommand('git_status', repoPath),
    diffStat: await runFixedCommand('git_diff_stat', repoPath),
    changedNames: await runFixedCommand('git_diff_name_only', repoPath),
    logRecent: await runFixedCommand('git_log_recent', repoPath),
  }
}

export { runApprovedCommit }

