import fs from 'fs';
import path from 'path';

const mainFile = path.resolve('src/main.tsx');
let mainContent = fs.readFileSync(mainFile, 'utf8');

const functionsToExtract = [
  'isRevisionIntent',
  'revisionChatLabel',
  'isArchVisIntent',
  'isDirectCutIntent',
  'isDirectVideoNoPanelIntent',
  'isBudgetIntent',
  'isProjectPackageIntent',
  'isGenerationHistoryIntent',
  'isContractsIntent',
  'isResearchIntent',
  'isFieldOpsIntent',
  'isBusinessLayerIntent',
  'isAuthIntent',
  'isCopilotExecutionIntent',
  'suggestLayerOpenDecision',
  'isExplicitPanelOpenRequest',
  'isOwnerConsoleIntent',
  'isStockIntent',
  'isTripIntent',
  'isPipelineIntent',
  'isNRIntent',
  'isAccountingIntent',
  'isPromptLibraryIntent',
  'getPromptLibraryModule',
  'isPermitsIntent',
  'isCheckpointContinuationIntent',
];

const extractedCodeLines = [
  "import type { IntakeFile } from './fileIntake';",
  "import { isBim3DIntent } from '../main'; // If not extracted yet",
  "import { isAgentIntent } from './apexAgents';",
  "import { isAiCostIntent } from './aiCostKnowledge';",
  "import { isAutoupgradeIntent } from './autoupgradeKnowledge';",
  "import { isAvatarVoiceIntent } from './avatarVoiceKnowledge';",
  "import { isCampaignAutomationIntent } from './campaignAutomationKnowledge';",
  "import { isDigitalTwinIntent } from './digitalTwinKnowledge';",
  "import { isEvmSchedulerComplianceIntent } from './evmSchedulerComplianceKnowledge';",
  "import { isKnowledgeBaseIntent } from './knowledgeBaseKnowledge';",
  "import { isMetricsIntent } from './metricsKnowledge';",
  "import { isMultiTenantIntent } from './multiTenantKnowledge';",
  "import { isNotificationsIntent } from './notificationsKnowledge';",
  "import { isPlatformMapIntent } from './platformMapKnowledge';",
  "import { isPwaMobileIntent } from './pwaMobileKnowledge';",
  "import { isSupplyChainIntent } from './supplyChainKnowledge';",
  "",
  "export type PendingLayerDecision = {",
  "  label: string;",
  "  openCommand: string;",
  "  goal: string;",
  "}",
  ""
];

// Extract functions using a parser-like approach
let modifiedMainContent = mainContent;
let newlyExtracted = [];

for (const fnName of functionsToExtract) {
  // Using string concatenation for safe RegExp
  const functionRegex = new RegExp('^function\\\\s+' + fnName + '\\\\s*\\\\([^)]*\\\\)\\\\s*(?::\\\\s*[^\\\\{]+)?\\\\s*\\\\{', 'm');
  const match = functionRegex.exec(modifiedMainContent);
  if (match) {
    let braceCount = 0;
    let i = match.index;
    let started = false;
    
    for (; i < modifiedMainContent.length; i++) {
      if (modifiedMainContent[i] === '{') {
        braceCount++;
        started = true;
      } else if (modifiedMainContent[i] === '}') {
        braceCount--;
      }
      
      if (started && braceCount === 0) {
        const fullFunction = modifiedMainContent.substring(match.index, i + 1);
        newlyExtracted.push('export ' + fullFunction);
        
        // Remove from main.tsx
        modifiedMainContent = modifiedMainContent.substring(0, match.index) + modifiedMainContent.substring(i + 1);
        break;
      }
    }
  } else {
    console.warn("Function " + fnName + " not found");
  }
}

// Write the CopilotEngine.ts
fs.writeFileSync(path.resolve('src/lib/CopilotEngine.ts'), extractedCodeLines.join('\\n') + newlyExtracted.join('\\n\\n'));

// Now add the import statement to main.tsx
const importStatement = "import { " + functionsToExtract.join(', ') + " } from './lib/CopilotEngine';\\n";

// Find first import and insert after
const firstImportIndex = modifiedMainContent.indexOf('import');
modifiedMainContent = modifiedMainContent.substring(0, firstImportIndex) + importStatement + modifiedMainContent.substring(firstImportIndex);

// Now fix the automatic opening bug by enforcing explicitPanelOpen
modifiedMainContent = modifiedMainContent.replace(
  'const shouldOpenProjectPackage = isProjectPackageIntent(routingText)',
  'const shouldOpenProjectPackage = explicitPanelOpen && isProjectPackageIntent(routingText)'
);
modifiedMainContent = modifiedMainContent.replace(
  'const shouldOpenGenerationHistory = isGenerationHistoryIntent(routingText)',
  'const shouldOpenGenerationHistory = explicitPanelOpen && isGenerationHistoryIntent(routingText)'
);
modifiedMainContent = modifiedMainContent.replace(
  'const shouldOpenSkillExport = clean && !shouldTreatAsConversation && (isSkillExportIntent(clean) || isSkillExportFactoryAlias(clean))',
  'const shouldOpenSkillExport = explicitPanelOpen && clean && !shouldTreatAsConversation && (isSkillExportIntent(clean) || isSkillExportFactoryAlias(clean))'
);
modifiedMainContent = modifiedMainContent.replace(
  'const shouldOpenExportCenter = clean && isExportIntent(clean)',
  'const shouldOpenExportCenter = explicitPanelOpen && clean && isExportIntent(clean)'
);

fs.writeFileSync(mainFile, modifiedMainContent);
console.log('CopilotEngine extracted and updated');
