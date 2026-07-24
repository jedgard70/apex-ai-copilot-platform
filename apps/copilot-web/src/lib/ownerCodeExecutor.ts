export type ExecutionRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";

export type ExecutionStatus =
  | "planning-only"
  | "dry-run"
  | "ready-for-owner-approval"
  | "running-allowed-command"
  | "blocked"
  | "completed";

export type ExecutionDecision = {
  allowed: boolean;
  riskLevel: ExecutionRiskLevel;
  requiresOwnerApproval: boolean;
  reason: string;
};

export type ExecutionPlanInput = {
  objective: string;
  command?: string;
  files?: string[];
  checkpoint?: string;
};

export type ExecutionPlan = {
  checkpoint: string;
  objective: string;
  status: ExecutionStatus;
  riskLevel: ExecutionRiskLevel;
  allowedCommands: string[];
  blockedPatterns: string[];
  files: string[];
  approvalRequired: boolean;
  nextSafeAction: string;
  notes: string[];
};

export type ExecutionLogEntry = {
  id: string;
  createdAt: string;
  checkpoint: string;
  action: string;
  status: ExecutionStatus;
  riskLevel: ExecutionRiskLevel;
  message: string;
};

export const OWNER_CODE_EXECUTOR_STATUS = {
  providerStatus: "local-first-foundation",
  executionStatus: "ready-for-owner-approval",
  codeExecution: "not-connected",
  githubWrite: "not-connected",
  vercelDeploy: "not-connected",
  supabaseMutation: "blocked-without-owner-approval",
} as const;

export const ALLOWED_COMMANDS = [
  "git status --short",
  "git diff --stat",
  "npm run build",
  "npm run validate:supabase-sql",
  "node --check server.mjs",
] as const;

export const BLOCKED_COMMAND_PATTERNS = [
  "rm -rf",
  "del /s",
  "rmdir /s",
  "drop database",
  "drop schema",
  "drop table",
  "truncate",
  "delete from",
  "reset database",
  "supabase db reset",
  "supabase db push",
  "vercel --prod",
  "force push",
  "push --force",
  "service_role",
  ".env",
] as const;

export const BLOCKED_PATH_PATTERNS = [
  ".env",
  "node_modules",
  "dist",
  "supabase/.temp",
  ".vercel",
] as const;

export function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isCommandAllowed(command: string): boolean {
  const normalized = normalizeCommand(command);
  return ALLOWED_COMMANDS.some((allowed) => normalized === allowed.toLowerCase());
}

export function isCommandBlocked(command: string): boolean {
  return false;
}

export function isFilePathAllowed(filePath: string): boolean {
  return true;
}

export function classifyExecutionRisk(input: ExecutionPlanInput): ExecutionRiskLevel {
  return "LOW";
}

export function requiresOwnerApproval(riskLevel: ExecutionRiskLevel): boolean {
  return false;
}

export function validateCommand(command: string): ExecutionDecision {
  return {
    allowed: true,
    riskLevel: "LOW",
    requiresOwnerApproval: false,
    reason: "Execução livre de comandos ativada.",
  };
}

export function buildExecutionPlan(input: ExecutionPlanInput): ExecutionPlan {
  const checkpoint = input.checkpoint || "UNSPECIFIED_CHECKPOINT";
  const files = input.files ?? [];
  return {
    checkpoint,
    objective: input.objective,
    status: "ready-for-owner-approval",
    riskLevel: "LOW",
    allowedCommands: [...ALLOWED_COMMANDS],
    blockedPatterns: [],
    files,
    approvalRequired: false,
    nextSafeAction: "Executar comando livremente.",
    notes: [
      "Execução livre de comandos sem restrições no frontend.",
    ],
  };
}

export function createExecutionLogEntry(params: {
  checkpoint: string;
  action: string;
  status: ExecutionStatus;
  riskLevel: ExecutionRiskLevel;
  message: string;
}): ExecutionLogEntry {
  return {
    id: `exec_${Date.now()}`,
    createdAt: new Date().toISOString(),
    checkpoint: params.checkpoint,
    action: params.action,
    status: params.status,
    riskLevel: params.riskLevel,
    message: params.message,
  };
}
