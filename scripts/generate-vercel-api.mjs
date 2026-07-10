import fs from 'node:fs';

const endpoints = {
  'export-package': 'handleExportPackage',
  'background-task': 'handleBackgroundTask',
  'export-skill-pack': 'handleExportSkillPack',
  'analyze-skill-update': 'handleAnalyzeSkillUpdate',
  'business-plan': 'handleBusinessPlan',
  'runtime-status': 'handleRuntimeStatus',
  'evm-scheduler-compliance': 'handleEvmSchedulerCompliance',
  'avatar-voice-plan': 'handleAvatarVoicePlan',
  'autoupgrade-plan': 'handleAutoupgradePlan',
  'auth-plan': 'handleAuthPlan'
};

const serverCode = fs.readFileSync('server.mjs', 'utf8');

for (const [file, fn] of Object.entries(endpoints)) {
  if (serverCode.includes('export async function ' + fn)) {
    const code = `import { ${fn} } from '../../server.mjs';\n\nexport default async function handler(req, res) {\n  return ${fn}(req, res);\n}\n`;
    fs.writeFileSync(`api/copilot/${file}.mjs`, code);
    console.log(`Created ${file}.mjs`);
  } else {
    console.log(`Skipped ${file}.mjs (not exported in server.mjs)`);
  }
}
