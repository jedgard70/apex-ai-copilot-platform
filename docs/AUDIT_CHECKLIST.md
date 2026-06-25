# AUDIT CHECKLIST — Varredura Tela por Tela

**Regra:** Não pular para a próxima tela até a atual estar 100%.

## 🟦 1. AppLayout (Header Global)
- [ ] Logo Apex Global + "AI Platform" visível
- [ ] Avatar do usuário real (não genérico)
- [ ] Ícone de Mapa da Plataforma (navigator) — ABRE
- [ ] Ícone de Owner Console (status + operacional) — ABRE
- [ ] Ícone de Mensagens da Plataforma
- [ ] Apenas 3 provedores principais (Gemini, FAL, ElevenLabs) com LED verde/vermelho
- [ ] Botão "Live/Offline" status
- [ ] Nada de "14 providers" poluindo

## 🟦 2. DashboardPage
- [ ] 3 cards de studio (ArchVis, DirectCut, BIM) ABREM corretamente
- [ ] Provider status NÃO repetido (sem duplicatas)
- [ ] "X/Y providers active" é clicável → abre ProviderDetail
- [ ] "Current Build" é clicável → abre info
- [ ] Dados vêm da API (não hardcoded)
- [ ] Botões sem ação foram removidos

## 🟦 3. Chat (shell principal)
- [ ] NENHUM fallback silencioso — se API falha, mostra erro real
- [ ] Se Gemini falha, tenta outro provedor explicitamente
- [ ] Botão enviar funciona
- [ ] Histórico persiste (localStorage)
- [ ] Model selector funciona

## 🟦 4. OwnerPage
- [ ] Provider status com saldo/limite REAL
- [ ] Dois tipos de console: Status + Operacional
- [ ] Dados de consumo por modelo
- [ ] Botões com função real
- [ ] Segue design system

## 🟦 5. ArchVisPanel
- [ ] Dashboard com dados reais (presets via API)
- [ ] Material Library carrega da promptLibrary
- [ ] Clique em preset → abre editor com prompt
- [ ] Render via API (não decorativo)
- [ ] Botão Humanizar Planta funciona
- [ ] Progresso honesto (não random)
- [ ] Botão Enviar para DirectCut funciona

## 🟦 6. DirectCutPanel
- [ ] Render via API real (video-render)
- [ ] Presets cinematográficos carregam
- [ ] Timeline funcional
- [ ] Play/Pause funcionais
- [ ] Scene Layers dinâmicas

## 🟦 7. PlatformNavigatorPage
- [ ] Sidebar completa
- [ ] Grid de módulos funcionais
- [ ] CTA banner clicável
- [ ] Navegação para painéis corretos

## 🟦 8. Demais Painéis
- [ ] GovernanceHubPage — carrega sem erro
- [ ] ModelTrainingPage — carrega sem erro
- [ ] DeploymentFlowPage — carrega sem erro
- [ ] TechnicalDocumentationPage — carrega sem erro
- [ ] MarketingAnalyticsPage — carrega sem erro
- [ ] CrmPipelinePanel — dados ao vivo
- [ ] FieldOpsPanel — geração via API
- [ ] BudgetPanel, ContractsPanel, ResearchPanel — carregam
