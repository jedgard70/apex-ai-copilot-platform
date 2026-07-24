import { runFixedCommand } from '../executor.mjs'

export async function runBuildValidation(repoPath) {
  return runFixedCommand('build', repoPath)
}

export async function runServerSyntaxValidation(repoPath) {
  return runFixedCommand('check_server', repoPath)
}

