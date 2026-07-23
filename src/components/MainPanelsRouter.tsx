import React from 'react'

import { PlatformNavigatorPage } from './PlatformNavigatorPage'
import { GovernanceHubPage } from './GovernanceHubPage'
import { ModelTrainingPage } from './ModelTrainingPage'
import { DeploymentFlowPage } from './DeploymentFlowPage'
import { TechnicalDocumentationPage } from './TechnicalDocumentationPage'
import { CaixaCompliancePanel } from './CaixaCompliancePanel'
import { MarketingAnalyticsPage } from './MarketingAnalyticsPage'
import ArchVisPanel from './ArchVisPanel'
import DirectCutPanel from './DirectCutPanel'
import Bim3DPanel from './Bim3DPanel'
import { AvatarVoicePanel } from './AvatarVoicePanel'
import { FieldOpsPanel } from './FieldOpsPanel'
import { BudgetPanel } from './BudgetPanel'
import { ContractsPermitsPanel } from '../../modules/legal/frontend/ContractsPermitsPanel'
import { ResearchPanel } from './ResearchPanel'
import { CrmPipelinePanel } from '../../modules/crm/frontend/CrmPipelinePanel'
import { FinancePanel } from '../../modules/finance/frontend/FinancePanel'
import { AiControlPanel } from './AiControlPanel'
import { CodeEditorPanel } from './CodeEditorPanel'
import VisasCitizenshipPanel from '../../modules/legal/frontend/VisasCitizenshipPanel'
import { LegalGeneralPanel } from '../../modules/legal/frontend/LegalGeneralPanel'
import { OwnerPage } from './OwnerPage'
import { GlobalWorkflowOrchestrator } from './GlobalWorkflowOrchestrator'
import { N8nPanel } from './N8nPanel'
import { IaIntegrationsPanel } from './IaIntegrationsPanel'

const EmptyPanel = () => (
  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
    Painel não encontrado
  </div>
)

const OwnerOnlyPanel = () => (
  <div style={{
    height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '16px',
    background: '#0d1117', color: '#94a3b8',
  }}>
    <div style={{ fontSize: '48px' }}>🔒</div>
    <div style={{ fontSize: '18px', fontWeight: 700, color: '#e2e8f0' }}>Acesso Restrito</div>
    <div style={{ fontSize: '14px', maxWidth: '320px', textAlign: 'center' }}>
      Este painel é exclusivo do <strong style={{ color: '#a78bfa' }}>Owner Admin</strong>.<br />
      Somente o Dr. Edgard tem permissão para acessá-lo.
    </div>
  </div>
)

export type MainPanelsRouterProps = {
  panelView: string;
  setActiveView: (view: string) => void;
  currentRole: string;
  setCampaignAutomationOutput: (val: any) => void;
  archVisOutput: any;
  setArchVisOutput: (val: any) => void;
  archVisRevisionConstraints: any[];
  setArchVisRevisionConstraints: (val: any) => void;
  handleArchVisGeneration: (payload: any) => void;
  closeOtherPanels: (panel: string) => void;
  setDirectCutOutput: (val: any) => void;
  directCutOutput: any;
  handleDirectCutGeneration: (payload: any) => void;
  bim3DOutput: any;
  setBim3DOutput: (val: any) => void;
  activeFile: any;
  localFileHandles: Map<string, any>;
  setActiveFile: (val: any) => void;
  setShowTerminal: (val: boolean) => void;
  activeProject: any;
  fileToRecord: (file: any) => any;
  setActiveProject: (val: any) => void;
  upsertProject: (val: any) => void;
}

export function MainPanelsRouter(props: MainPanelsRouterProps) {
  switch (props.panelView) {
    case 'navigator': return <PlatformNavigatorPage onNavigate={props.setActiveView} userRole={props.currentRole} />;
    case 'governance': return <GovernanceHubPage />;
    case 'training': return <ModelTrainingPage />;
    case 'deployment': return <DeploymentFlowPage />;
    case 'docs': return <TechnicalDocumentationPage />;
    case 'caixa_mcmv': return <CaixaCompliancePanel />;
    case 'marketing': return <MarketingAnalyticsPage onNewCampaign={() => props.setCampaignAutomationOutput({ goal: 'Nova campanha', conversationContext: [] })} />;
    case 'archvis': return (
      <ArchVisPanel
        source={props.archVisOutput?.source || undefined}
        output={props.archVisOutput?.output || undefined}
        conversationContext={props.archVisOutput?.conversationContext || undefined}
        revisionConstraints={props.archVisRevisionConstraints}
        onAddRevisionConstraint={c => props.setArchVisRevisionConstraints((p: any[]) => p.includes(c) ? p : [...p, c])}
        onRemoveRevisionConstraint={c => props.setArchVisRevisionConstraints((p: any[]) => p.filter(i => i !== c))}
        onClearRevisionConstraints={() => props.setArchVisRevisionConstraints([])}
        onRecordGeneration={props.handleArchVisGeneration}
        onSendToDirectCut={img => { props.closeOtherPanels('directCut'); props.setDirectCutOutput({ goal: 'Imagem ArchVis p/ DirectCut', conversationContext: [`assistant: Imagem enviada: ${img?.substring(0, 80)}...`], source: props.archVisOutput?.source || undefined }) }}
        onClear={() => props.setArchVisOutput(null)}
      />
    );
    case 'directcut': return (
      <DirectCutPanel
        source={props.directCutOutput?.source || undefined}
        goal={props.directCutOutput?.goal || 'Planejamento de Vídeo'}
        conversationContext={props.directCutOutput?.conversationContext || []}
        initialConfig={props.directCutOutput?.initialConfig}
        onRecordGeneration={props.handleDirectCutGeneration}
        onClear={() => props.setDirectCutOutput(null)}
      />
    );
    case 'avatarvoice': return (
      <AvatarVoicePanel
        goal="Planejamento de Áudio"
        conversationContext={[]}
        onClear={() => props.setActiveView('dashboard')}
      />
    );
    case 'bim': return (
      <Bim3DPanel source={props.bim3DOutput?.source} onClear={() => { props.setBim3DOutput(null); props.setActiveView('dashboard'); }} />
    );
    case 'fieldops': return <FieldOpsPanel goal="" conversationContext={[]} onClear={() => {}} />;
    case 'budget': return <BudgetPanel goal="" conversationContext={[]} onClear={() => {}} />;
    case 'contracts': return <ContractsPermitsPanel goal="" conversationContext={[]} onClear={() => {}} />;
    case 'legal_general': return <LegalGeneralPanel />;
    case 'research': return <ResearchPanel goal="" conversationContext={[]} onClear={() => {}} />;
    case 'crm': return <CrmPipelinePanel onClear={() => {}} />;
    case 'finance': return <FinancePanel goal="" conversationContext={[]} onClear={() => {}} />;
    case 'aicontrol': {
      const isOwner = props.currentRole === 'owner' || props.currentRole === 'owner_admin'
      return isOwner ? <AiControlPanel /> : <OwnerOnlyPanel />
    }
    case 'global-workflow':
      return <GlobalWorkflowOrchestrator />
    case 'n8n':
      return <N8nPanel />
    case 'ia-integrations':
      return <IaIntegrationsPanel />
    case 'code-editor': {
      const isOwner = props.currentRole === 'owner' || props.currentRole === 'owner_admin'
      if (!isOwner) return <OwnerOnlyPanel />
      return (
        <CodeEditorPanel 
          activeFile={props.activeFile}
          hasNativeHandle={props.activeFile ? props.localFileHandles.has(props.activeFile.file.name) : false}
          onChangeContent={(content: string) => {
            props.setActiveFile((prev: any) => prev ? { ...prev, extractedText: content } : prev)
          }}
          onRunFile={(fileName: string) => {
            window.dispatchEvent(new CustomEvent('terminal-run', { detail: `node ${fileName}\r` }))
            props.setShowTerminal(true)
          }}
          onSaveNativeFile={async (content: string) => {
            if (!props.activeFile) return
            const handle = props.localFileHandles.get(props.activeFile.file.name)
            if (handle) {
              try {
                const writable = await handle.createWritable()
                await writable.write(content)
                await writable.close()
                if (props.activeProject) {
                  const activeId = props.fileToRecord(props.activeFile).id
                  const newFiles = props.activeProject.files.map((f: any) => f.id === activeId ? { ...f, extractedText: content } : f)
                  const nextProj = { ...props.activeProject, files: newFiles }
                  props.setActiveProject(nextProj)
                  props.upsertProject(nextProj)
                }
                alert('Arquivo salvo com sucesso no disco local!')
              } catch (e) {
                alert('Erro ao salvar no disco: ' + String(e))
              }
            }
          }}
        />
      );
    }

    case 'editor': {
      const isOwner = props.currentRole === 'owner' || props.currentRole === 'owner_admin'
      if (!isOwner) return <OwnerOnlyPanel />
      return <CodeEditorPanel 
        onRunFile={() => {}} 
        hasNativeHandle={false} 
        onSaveNativeFile={() => {}} 
        onChangeContent={() => {}} 
      />
    }
    case 'legal':
      return <VisasCitizenshipPanel />
    case 'owner':
    case 'dashboard':
      return <OwnerPage onNavigate={props.setActiveView} onOpenChat={() => {}} />

    default: return <EmptyPanel />;
  }
}
