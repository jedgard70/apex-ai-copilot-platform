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
  executionStatus: "planning-only",
  codeExecution: "not-connected",
  githubWrite: "not-connected",
  vercelDeploy: "not-connected",
  supabaseMutation: "blocked-without-owner-approval",
} as const;

export const ALLOWED_COMMANDS = [
  "git status --short",
  "git diff --stat",
  "npm.cmd run build",
  "npm.cmd run validate:supabase-sql",
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
  const normalized = normalizeCommand(command);
  return BLOCKED_COMMAND_PATTERNS.some((pattern) =>
    normalized.includes(pattern.toLowerCase()),
  );
}

export function isFilePathAllowed(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  return !BLOCKED_PATH_PATTERNS.some((pattern) =>
    normalized.includes(pattern.toLowerCase()),
  );
}

export function classifyExecutionRisk(input: ExecutionPlanInput): ExecutionRiskLevel {
  const objective = input.objective.toLowerCase();
  const command = input.command ? normalizeCommand(input.command) : "";
  const files = input.files ?? [];

  if (command && isCommandBlocked(command)) {
    return "BLOCKED";
  }

  if (files.some((file) => !isFilePathAllowed(file))) {
    return "BLOCKED";
  }

  if (
    objective.includes("drop") ||
    objective.includes("reset") ||
    objective.includes("delete data") ||
    objective.includes("service role") ||
    objective.includes("produção") ||
    objective.includes("production deploy")
  ) {
    return "BLOCKED";
  }

  if (
    objective.includes("auth") ||
    objective.includes("supabase") ||
    objective.includes("rls") ||
    objective.includes("payment") ||
    objective.includes("billing") ||
    objective.includes("deploy") ||
    objective.includes("vercel")
  ) {
    return "HIGH";
  }

  if (
    objective.includes("editar") ||
    objective.includes("alterar código") ||
    objective.includes("frontend") ||
    objective.includes("backend") ||
    objective.includes("api") ||
    objective.includes("package")
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

export function requiresOwnerApproval(riskLevel: ExecutionRiskLevel): boolean {
  return riskLevel === "HIGH" || riskLevel === "BLOCKED";
}

export function validateCommand(command: string): ExecutionDecision {
  if (isCommandBlocked(command)) {
    return {
      allowed: false,
      riskLevel: "BLOCKED",
      requiresOwnerApproval: true,
      reason: "Command matches a blocked or destructive pattern.",
    };
  }

  if (isCommandAllowed(command)) {
    return {
      allowed: true,
      riskLevel: "LOW",
      requiresOwnerApproval: false,
      reason: "Command is explicitly allowlisted for local validation.",
    };
  }

  return {
    allowed: false,
    riskLevel: "HIGH",
    requiresOwnerApproval: true,
    reason: "Command is not in the allowlist and requires Owner approval before execution.",
  };
}

export function buildExecutionPlan(input: ExecutionPlanInput): ExecutionPlan {
  const checkpoint = input.checkpoint || "UNSPECIFIED_CHECKPOINT";
  const files = input.files ?? [];
  const riskLevel = classifyExecutionRisk(input);
  const approvalRequired = requiresOwnerApproval(riskLevel);

  return {
    checkpoint,
    objective: input.objective,
    status: approvalRequired ? "ready-for-owner-approval" : "planning-only",
    riskLevel,
    allowedCommands: [...ALLOWED_COMMANDS],
    blockedPatterns: [...BLOCKED_COMMAND_PATTERNS],
    files,
    approvalRequired,
    nextSafeAction:
      riskLevel === "BLOCKED"
        ? "Stop and request explicit Owner decision. Do not execute."
        : approvalRequired
          ? "Prepare scope, evidence, and approval request before execution."
          : "Prepare local validation plan and run only allowlisted checks.",
    notes: [
      "This foundation does not provide unrestricted shell access.",
      "Real code execution remains controlled by Safety Gate.",
      "Production deploy, Supabase migrations, service role usage, and destructive actions are blocked without explicit Owner approval.",
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
