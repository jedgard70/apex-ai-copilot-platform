import React from 'react'

import { PlatformNavigatorPage } from './PlatformNavigatorPage'
import { GovernanceHubPage } from './GovernanceHubPage'
import { ModelTrainingPage } from './ModelTrainingPage'
import { DeploymentFlowPage } from './DeploymentFlowPage'
import { TechnicalDocumentationPage } from './TechnicalDocumentationPage'
import { CaixaCompliancePanel } from './CaixaCompliancePanel'
import { MarketingAnalyticsPage } from './MarketingAnalyticsPage'
import { ArchVisPanel } from './ArchVisPanel'
import { DirectCutPanel } from './DirectCutPanel'
import { Bim3DPanel } from './Bim3DPanel'
import { FieldOpsPanel } from './FieldOpsPanel'
import { BudgetPanel } from './BudgetPanel'
import { ContractsPanel } from './ContractsPanel'
import { ResearchPanel } from './ResearchPanel'
import { CrmPipelinePanel } from './CrmPipelinePanel'
import { FinancePanel } from './FinancePanel'
import { AiControlPanel } from './AiControlPanel'
import { CodeEditorPanel } from './CodeEditorPanel'
import GlobalPermitsPanel from './GlobalPermitsPanel'
import { OwnerPage } from './OwnerPage'

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
    case 'bim': return props.bim3DOutput ? (
      props.bim3DOutput.source ? (
        <Bim3DPanel source={props.bim3DOutput.source} onClear={() => props.setBim3DOutput(null)} />
      ) : (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0b1326', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
          <div style={{ textAlign: 'center', maxWidth: 450, background: '#171f33', padding: 32, borderRadius: 12, border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#3b82f6' }}>architecture</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#fff' }}>BIM / 3D Studio</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 24px' }}>
              Faça upload de um modelo IFC, GLB, GLTF, OBJ, STL, FBX, RVT, DWG, DXF ou SKP para visualizar, analisar e gerar relatório técnico.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              {['IFC', 'GLB', 'GLTF', 'OBJ', 'STL', 'FBX', 'RVT', 'DWG', 'DXF', 'SKP'].map(f => (
                <span key={f} style={{ padding: '4px 8px', background: 'rgba(59,130,246,0.08)', borderRadius: 4, fontSize: 10, color: '#60a5fa', fontFamily: "'JetBrains Mono', monospace" }}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      )
    ) : null;
    case 'fieldops': return <FieldOpsPanel goal="" conversationContext={[]} onClear={() => {}} />;
    case 'budget': return <BudgetPanel goal="" conversationContext={[]} onClear={() => {}} />;
    case 'contracts': return <ContractsPanel goal="" conversationContext={[]} onClear={() => {}} />;
    case 'research': return <ResearchPanel goal="" conversationContext={[]} onClear={() => {}} />;
    case 'crm': return <CrmPipelinePanel onClear={() => {}} />;
    case 'finance': return <FinancePanel goal="" conversationContext={[]} onClear={() => {}} />;
    case 'aicontrol': {
      const isOwner = props.currentRole === 'owner' || props.currentRole === 'owner_admin'
      return isOwner ? <AiControlPanel /> : <OwnerOnlyPanel />
    }
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
    case 'permits':
      return <GlobalPermitsPanel />
    case 'owner':
    case 'dashboard':
      return <OwnerPage onNavigate={props.setActiveView} onOpenChat={() => {}} />

    default: return <EmptyPanel />;
  }
}
