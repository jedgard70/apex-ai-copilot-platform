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

let newlyExtracted = [];

for (const fnName of functionsToExtract) {
  const functionRegex = new RegExp('function\\\\s+' + fnName + '\\\\s*\\\\([^)]*\\\\)\\\\s*(?::\\\\s*[^\\\\{]+)?\\\\s*\\\\{');
  const match = functionRegex.exec(mainContent);
  if (match) {
    let braceCount = 0;
    let i = match.index;
    let started = false;
    
    for (; i < mainContent.length; i++) {
      if (mainContent[i] === '{') {
        braceCount++;
        started = true;
      } else if (mainContent[i] === '}') {
        braceCount--;
      }
      
      if (started && braceCount === 0) {
        const fullFunction = mainContent.substring(match.index, i + 1);
        newlyExtracted.push('export ' + fullFunction);
        
        mainContent = mainContent.substring(0, match.index) + mainContent.substring(i + 1);
        break;
      }
    }
  } else {
    console.warn("Function " + fnName + " not found");
  }
}

fs.writeFileSync(path.resolve('src/lib/CopilotEngine.ts'), extractedCodeLines.join('\\n') + newlyExtracted.join('\\n\\n'));

const importStatement = "import { " + functionsToExtract.join(', ') + " } from './lib/CopilotEngine';\\n";
const firstImportIndex = mainContent.indexOf('import');
mainContent = mainContent.substring(0, firstImportIndex) + importStatement + mainContent.substring(firstImportIndex);

mainContent = mainContent.replace(
  'const shouldOpenProjectPackage = isProjectPackageIntent(routingText)',
  'const shouldOpenProjectPackage = explicitPanelOpen && isProjectPackageIntent(routingText)'
);
mainContent = mainContent.replace(
  'const shouldOpenGenerationHistory = isGenerationHistoryIntent(routingText)',
  'const shouldOpenGenerationHistory = explicitPanelOpen && isGenerationHistoryIntent(routingText)'
);
mainContent = mainContent.replace(
  'const shouldOpenSkillExport = clean && !shouldTreatAsConversation && (isSkillExportIntent(clean) || isSkillExportFactoryAlias(clean))',
  'const shouldOpenSkillExport = explicitPanelOpen && clean && !shouldTreatAsConversation && (isSkillExportIntent(clean) || isSkillExportFactoryAlias(clean))'
);
mainContent = mainContent.replace(
  'const shouldOpenExportCenter = clean && isExportIntent(clean)',
  'const shouldOpenExportCenter = explicitPanelOpen && clean && isExportIntent(clean)'
);

fs.writeFileSync(mainFile, mainContent);
console.log('CopilotEngine extracted and updated v3');
