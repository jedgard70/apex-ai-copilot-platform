# Master Roadmap — Apex OS

- **Versão:** 2.1.0
- **Status:** Aprovado pelo Owner (com 3 Emendas de Consolidação)
- **Data:** 2026-07-22
- **Empresa:** Apex Global
- **Plataforma:** Apex OS
- **Repositório Autorizado:** `D:\AI-constr\apex-os`

---

## 1. Hierarquia Definitiva de Autoridade e Governança

A governança do Apex OS obedece estritamente à seguinte hierarquia de autoridade:

```text
AGENTS.md
Autoridade máxima de comportamento dos motores e regras operacionais
        ↓
Planejamento Mestre (roadmap/MASTER_ROADMAP.md)
Autoridade máxima do escopo do produto e matriz de capabilities
        ↓
Planejamento de Execução (docs/canonical/APEX_RELEASE_MASTER_PLAN.md)
Autoridade máxima da implementação, release trains e checklist operacional
        ↓
Código executável, testes, migrations, infraestrutura e evidências
```

### Regras de Governança dos Motores (`AGENTS.md`)
- **Consulta Global**: Permitida em qualquer diretório/repositório da máquina como fonte somente leitura.
- **Modificação Exclusiva**: Restrita estritamente a `D:\AI-constr\apex-os`.
- **Reutilização Antes de Criação**: Toda funcionalidade nova exige pesquisa prévia comprovada em ativos existentes.
- **Evidência Proporcional**: Nenhuma funcionalidade é declarada concluída ou `PASS` sem testes e evidências executáveis.
- **Commits Atômicos**: Commits pequenos, rastreáveis e obrigatórios ao concluir tarefas aprovadas.
- **Proibição de Automações Danosas**: Proibido deploy automático, alteração de `.env` de terceiros, encerramento indiscriminado de processos Node ou chamadas pagas sem autorização explícita.
- **Pausa Obrigatória (`STOP`)**: Toda tarefa é interrompida no gate autorizado aguardando validação do Owner.

---

## 2. Estado Real de Partida (Diagnóstico Auditado)

| Área | Estado Comprovado | Detalhes e Evidências |
| :--- | :--- | :--- |
| **Linha de Base Canônica (Mínimo Inviolável)** | **43 MÓDULOS / 260 AGENTES** | Marco zero consolidado e permanente da plataforma. |
| **Módulos Totais Registrados** | **78 MÓDULOS** | 65 originais + 13 novos (Anexo C do inventário auditado). |
| **Produtos Especializados Segregados** | **23 PRODUTOS** | Produtos independentes multitela com painéis próprios. |
| **Studios Canônicos** | **7 STUDIOS** | Setorização canônica (Engineering, Legal, Finance, Marketing, Media, HR, Core). |
| **Skills Físicas no Disco** | **4.114 SKILLS** | Acervo de arquivos `SKILL.md` identificados para deduplicação SHA-256. |
| **Handlers e APIs Backend (`.mjs`)** | **634 HANDLERS** | 94 endpoints em `api/` + 114 em `server/` + legados auditados. |
| **Componentes React / TSX** | **211 COMPONENTES** | Componentes visuais e conectores do `apex-ai-copilot-platform` e legados. |
| **Telas HTML do Stitch** | **112 TELAS** | Telas HTML e protótipos visuais exportados no acervo Stitch. |
| **Mídias e Previews Visuais** | **610 MÍDIAS** | Imagens, renders 3D e mídias de pilar catalogadas no inventário E2.18. |
| **Provedores de IA Integrados** | **11 PROVEDORES** | Gemini, Ollama, fal.ai, ElevenLabs, Brave, AuthKey, Supabase, Firebase, Tavily, GitHub, Stripe. |
| **Apex OS Core** | `FUNCTIONAL_LOCAL` | Estrutura modular, Kernel types e CoreFoundation em TypeScript. |
| **Auth Supabase** | `INTEGRATED_PARTIAL` | Integrado via `@supabase/supabase-js`; fail-closed ativado sem fallback legado. |
| **Provider fal.ai** | `INTEGRATED_GOVERNED` | Adapter contratual com mascaramento de chave e isolamento de SDK. |
| **API Pública v1** | `INTEGRATED_PARTIAL` | Endpoints `/v1/*` contratados com validação de escopos e Bearer tokens. |
| **Produção Pública Pronta** | `NÃO` | *UNKNOWN é FAIL para qualquer gate de produção.* |

---

## 3. Emendas Canônicas do Owner (Diretrizes Obrigatórias)

### Emenda 1: Inventário Abrangente de Todo o Patrimônio Técnico (Fase E2)
A Fase E2 inventaria obrigatoriamente 100% do patrimônio técnico existente na máquina e repositórios antes de qualquer migração:
- **E2.1** Apex OS (`D:\AI-constr\apex-os`)
- **E2.2** Apex AI Copilot Platform (`D:\AI-constr\apex-ai-copilot-platform`)
- **E2.3** AI Construction Intelligence Platform (`D:\AI-PLATAFORM\AI-Construction-Intelligence-Platform`)
- **E2.4** Todos os repositórios Git locais
- **E2.5** Todos os repositórios GitHub (`jedgard70/*`)
- **E2.6** Todos os HDs, SSDs e volumes montados
- **E2.7** Diretório Downloads (`C:\Users\apexg\Downloads`)
- **E2.8** Cache interno do Antigravity (`C:\Users\apexg\.gemini\antigravity\brain`)
- **E2.9** Cache interno do Gemini (`C:\Users\apexg\.gemini\config`)
- **E2.10** Exportações do Stitch (`stitch_apex_intelligence_design_system`)
- **E2.11** Acervos de Prompts
- **E2.12** Acervos de Skills (`SKILL.md`)
- **E2.13** Agentes e Personas
- **E2.14** Workflows e Automações
- **E2.15** Servidores e Ferramentas MCP
- **E2.16** APIs e Routers (`/api/*`, `/v1/*`, `.mjs`)
- **E2.17** Templates e Snippets
- **E2.18** Painéis e Dashboards
- **E2.19** Componentes React / TypeScript
- **E2.20** Bibliotecas e Pacotes Compartilhados

### Emenda 2: Processo Obrigatório de Canonicalização (Fase E2A)
Antes da migração ou integração no Apex OS, todo ativo deve passar pelo funil de canonicalização:
```text
Existe o Ativo?
      ↓
Qual a versão oficial/canônica?
      ↓
Onde está localizado?
      ↓
Quem depende dele (imports, rotas, testes)?
      ↓
Pode migrar com segurança para o Apex OS?
      ↓
Pode arquivar/remover a versão legada antiga (com autorização explícita do Owner)?
```
*Garantia da Canonicalização:* Elimina duplicatas conflitantes (ex: Dashboard V2, Dashboard Final, Dashboard Regen, Dashboard Visual Fix coexistindo).

### Emenda 3: Trava de Preview Expandida para toda a Experiência do Usuário (UX)
> [!IMPORTANT]
> **Trava de UX & Preview Gate**: Nenhum elemento de interface — seja **Tela, Dashboard, Landing Page, Workflow, Prompt Visual, Capability UI, Studio, Página ou Wizard** — será integrado ao Apex OS sem a geração prévia de um preview de alta fidelidade e autorização explícita do Owner.

### Emenda 4: Estados Canônicos de Progresso do Checklist
Cada item de execução do Apex OS evolui obrigatoriamente através dos seguintes 9 estados:
1. `NOT_STARTED` — Não iniciado
2. `DISCOVERED` — Identificado no acervo local ou externo
3. `INVENTORIED` — Catalogado com hash, localização e contrato
4. `CANONICAL` — Definido como a versão oficial/canônica do ecossistema
5. `MIGRATED` — Migrado fisicamente para `D:\AI-constr\apex-os`
6. `INTEGRATED` — Conectado às rotas, APIs e dependências do Apex OS
7. `VALIDATED` — Aprovado em suíte de testes e typecheck
8. `OWNER_APPROVED` — Homologado e aprovado pelo Owner
9. `COMPLETE` — Entregue, commitado e em estado operacional durável

---

## 4. Escopo Permanente do Planejamento Mestre

### 4.1 Plataforma Compartilhada (Core)

| ID | Módulo | Existe? | Origem Prioritária | Estado Inicial | Estado Final |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CORE-01** | Identity | Sim | Apex OS Core | `FUNCTIONAL_LOCAL` | Persistente e Multi-tenant |
| **CORE-02** | Organizations | Sim | Apex OS Core | `FUNCTIONAL_LOCAL` | Persistente com Tenant Isolation |
| **CORE-03** | Membership / RBAC | Sim | Apex OS + Stitch | `INTEGRATED_PARTIAL` | Operacional e Granular |
| **CORE-04** | Workspace | Sim | Apex OS | `FUNCTIONAL_LOCAL` | Persistente por Organização |
| **CORE-05** | Ownership | Sim | Kernel | `BACKEND_ONLY` | Aplicado a 100% dos Recursos |
| **CORE-06** | Audit Ledger | Sim | Core | `VOLÁTIL` | Persistente, Imutável e Pesquisável |
| **CORE-07** | Telemetry | Sim | Core | `VOLÁTIL` | Observabilidade em Tempo Real |
| **CORE-08** | Events / Outbox | Sim | Core | `FUNCTIONAL_LOCAL` | Durable Outbox Pattern |
| **CORE-09** | API Keys | Parcial | Apex OS Migrations | `BACKEND_ONLY` | Operacional com Escopos Granulares |
| **CORE-10** | Jobs / Queues | Parcial | Apex OS + Legado | `INTEGRATED_PARTIAL` | Fila Persistente com Retry / Dead-Letter |
| **CORE-11** | Notifications | Legado | Copilot Legado | `LEGACY` | Adapter Governado (Email/WS) |
| **CORE-12** | Files / Storage | Parcial | Custódia Apex | `FUNCTIONAL_LOCAL` | Object Storage Durável com Expiração |
| **CORE-13** | Search / Knowledge | Parcial | Supabase Adapters | `INTEGRATED_PARTIAL` | RAG e Busca Vetorial Operacional |
| **CORE-14** | Admin / Owner | Parcial | Apex OS + Stitch | `INTEGRATED_PARTIAL` | Painel de Controle Unificado |
| **CORE-15** | Public API v1 | Sim | Apex OS `/v1` | `INTEGRATED_PARTIAL` | Versionada e Contratada |

---

### 4.2 Apex Intelligence (IA & Governance Core)

| ID | Capability | Origem a Reutilizar | Estado Inicial | Estado Final |
| :--- | :--- | :--- | :--- | :--- |
| **AI-01** | Intelligent Intake Router | Classificadores legados + Contratos OS | `INTEGRATED_PARTIAL` | Operacional Multi-formato |
| **AI-02** | PDF Intelligence | Extratores PDF legados | `LEGACY` | Operacional com Vetorização e Segmentação |
| **AI-03** | Document / View Classifier | Modelos legados de classificação | `LEGACY` | Operacional por Tipo de Prancha/Visão |
| **AI-04** | Capability Router | Apex OS | `FUNCTIONAL_LOCAL` | Operacional com Reutilização de Ativos |
| **AI-05** | Provider Router | Apex OS | `INTEGRATED_PARTIAL` | Multi-provider Governado com Fallback |
| **AI-06** | Model Registry | Apex OS | `FUNCTIONAL_LOCAL` | Catálogo Deterministico de Modelos |
| **AI-07** | Policy Enforcer | Apex OS | `FUNCTIONAL_LOCAL` | Obrigatório em 100% das Chamadas |
| **AI-08** | Execution Ledger | Apex OS | `VOLÁTIL` | Persistente com Provider Request ID |
| **AI-09** | Usage / Cost Ledger | Apex OS | `VOLÁTIL` | Reconciliado por Organização/Execução |
| **AI-10** | Quality Gates | Apex OS | `PARCIAL` | Validação Automática por Formato |
| **AI-11** | Idempotency Engine | Apex OS | `LOCAL` | Persistente com Deduplicação Distribuída |
| **AI-12** | Asset Custody | Apex OS | `FILESYSTEM` | Object Storage Durável com Checksum |
| **AI-13** | Knowledge / RAG Engine | Apex OS + Legado | `BACKEND_ONLY` | Operacional com Ingestão Multimodal |
| **AI-14** | Agent Runtime | Registries + Agentes Legados | `PROTOTYPE` | Agentes Operacionais com Telemetria |
| **AI-15** | Prompt / Skill Registry | Apex OS + Acervos | `BACKEND_ONLY` | Deduplicado, Versionado e Auditado |
| **AI-16** | Human Approval Workflow | Runtime Atual | `PARCIAL` | Workflow Persistente com Notificação |

---

### 4.3 Intelligent Intake — Formatos Obrigatórios

- **Prioridade 1 (Engenharia Cotidiana):** PDF, DWG, DXF, IFC, RVT.
- **Prioridade 2 (Coordenação & 3D):** FBX, GLB, GLTF, OBJ, NWC, NWD, DGN.
- **Prioridade 3 (Dados & Documentos):** XLSX, CSV, DOCX, BCF, XML.
- **Prioridade 4 (Imagens Auxiliares):** JPG, PNG, WEBP, TIFF.

---

### 4.4 Pipeline Obrigatório de PDF

```text
Upload Seguro (Multipart / Presigned)
  ↓
Validação Estrutural e Malware Scan
  ↓
Detecção Vetorial vs Raster
  ↓
Extração de Texto e Camadas
  ↓
Renderização de Páginas em Alta Resolução
  ↓
Segmentação da Prancha (Detecção de Detalhes)
  ↓
Detecção e Classificação de Vistas (Planta, Corte, Fachada, Implantação, Carimbo)
  ↓
Extração de Escalas, Cotas e Dados do Carimbo
  ↓
Apresentação ao Usuário no Workspace
  ↓
Confirmação Humana e Seleção da VistaAlvo
  ↓
Roteamento para a Capability Específica (ex: ArchVis, SINAPI, Clash)
```

---

### 4.5 Apex Engineering Suite

| ID | Módulo | Origem Prioritária | Estado Atual | Critério de Aceite Final |
| :--- | :--- | :--- | :--- | :--- |
| **ENG-01** | ArchVis Studio | Apex OS + Legado | `FUNCTIONAL_LOCAL` | PDF/Imagem → Render Durável com Preservação Geométrica |
| **ENG-02** | BIM / 3D Viewer | Legado IFC | `LEGACY` | IFC Real, Inspeção de Propriedades e Tree View |
| **ENG-03** | Autodesk APS | Legado APS | `LEGACY` | Tradução de Arquivos Proprietários e Visualização Autenticada |
| **ENG-04** | IFC / OpenShell | Legado OpenShell | `LEGACY` | Parsing, Extração de Elementos e Validação Reproduzível |
| **ENG-05** | Revit MCP Bridge | Legado Revit | `LEGACY` | Conector Local Autorizado e Auditado para Revit |
| **ENG-06** | Digital Twin | Legado + Stitch | `UI_ONLY` | Modelo 3D Persistente Vinculado a Dados Operacionais |
| **ENG-07** | IoT Monitoring | Legado IoT | `LEGACY` | Integração com Sensores Reais ou Simulador Rotulado |
| **ENG-08** | Clash Detection | Legado Clash | `LEGACY` | Detecção de Conflitos Calculada por Regras, com Relatório |
| **ENG-09** | RDO / Field Ops | Legado RDO | `LEGACY` | Diario de Obra, Equipes, Clima, Fotos e Assinatura Digital |
| **ENG-10** | Qualidade / NCI | Legado Qualidade | `LEGACY` | Workflow Completo de Não Conformidade e Ações Corretivas |
| **ENG-11** | Budget / SINAPI | Legado Financeiro | `LEGACY` | Quantitativos e Preços Versionados por Tabela SINAPI |
| **ENG-12** | Cronograma / EVM | Legado Cronograma | `LEGACY` | Baseline, Curva S e Progresso Físico-Financeiro |
| **ENG-13** | Contracts / Permits | Legado Jurídico | `LEGACY` | Geração de Minutas e Alvarás com Aprovação Humana |
| **ENG-14** | NR Compliance | Legado Normas | `LEGACY` | Verificação de Normas Regulamentadoras com Fonte Citada |
| **ENG-15** | Supply Chain | Legado Suprimentos | `LEGACY` | Cotações, RFQ e Pedidos de Compra Rastreados |
| **ENG-16** | Project Package | Apex OS | `LEGACY` | Pacote ZIP Executivo com Todos os Entregáveis do Projeto |
| **ENG-17** | Director's Cut | Legado Mídia | `LEGACY` | Pipeline de Vídeo e Animação Arquitetônica Auditável |
| **ENG-18** | Predictive Analytics | Legado Analytics | `LEGACY` | Previsão de Desvios de Custo/Prazo com Dados Reais |
| **ENG-19** | MS Project Import | Legado MS Project | `LEGACY` | Importação e Exportação de Arquivos `.mpp` / `.xml` |
| **ENG-20** | Executive Reports | Apex OS | `LEGACY` | Relatórios Executivos em PDF/DOCX Reprodutíveis |

---

### 4.6 Apex Accounting & Apex Legal Verticais

- **Apex Accounting**: Produto independente integrado por contrato de API e eventos.
- **Apex Legal**: Governança por jurisdição (Brasil/LGPD, USA, UE/GDPR) com citações de lei e autorização humana.

---

## 5. Matriz Obrigatória de UX & Painéis Candidatos (Preview Gate)

| Painel | Origem | Preview aprovado | Integrado | Capability | Owner |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **01. Mission Control Dashboard / BuildTrack HQ** | `C:\Users\apexg\Downloads\ui_mission_control_1783949884072.png` | NÃO | NÃO | `CORE-14` / `ENG-06` | Jedgard |
| **02. Dashboard Executivo V1 / V2** | `stitch_apex_intelligence_design_system` (87 PNGs) | NÃO | PARCIAL | `CORE-14` / `BI-01` | Jedgard |
| **03. Intelligence Core Dashboard / V8 Command Center** | `stitch_apex_intelligence_design_system` | NÃO | NÃO | `AI-04` / `CORE-14` | Jedgard |
| **04. BIM Intelligence / BIM-Ops** | `public/pillars` (170 imagens) + Stitch | NÃO | NÃO | `ENG-02` / `ENG-04` | Jedgard |
| **05. CRM / Marketing / Redes Sociais** | `public/pillars` + Stitch | NÃO | NÃO | `GROWTH-01` | Jedgard |
| **06. Orçamento / SINAPI** | `public/pillars` + Stitch | NÃO | NÃO | `ENG-11` | Jedgard |
| **07. RDO / Diário de Obra** | `public/pillars` + Stitch | NÃO | NÃO | `ENG-09` | Jedgard |
| **08. Jurídico / Legal** | `public/pillars` + Stitch | NÃO | NÃO | `LEGAL-01` | Jedgard |
| **09. ArchVis Studio** | `public/pillars` + Stitch | NÃO | PARCIAL | `ENG-01` | Jedgard |
| **10. Agentes Cognitivos** | `public/pillars` + Stitch | NÃO | NÃO | `AI-14` | Jedgard |
| **11. Digital Twin / IoT** | `public/pillars` + Stitch | NÃO | PARCIAL | `ENG-06` / `ENG-07` | Jedgard |
| **12. Gestão de Projetos** | `public/pillars` + Stitch | NÃO | PARCIAL | `CORE-04` | Jedgard |
| **13. Gestão de Usuários e Permissões** | `stitch` (18 telas Admin) | NÃO | PARCIAL | `CORE-03` / `CORE-14` | Jedgard |
| **14. Financeiro / BI Executivo** | `public/pillars` + Stitch | NÃO | PARCIAL | `FIN-01` | Jedgard |

---

## 6. Consolidação de Skills, Prompts e Agentes

- **Baseline Físico:** 4.114 arquivos `SKILL.md` brutos identificados no disco; 66 skills no copilot legado.
- **Pipeline de Ingestão & Canonicalização:**
  `Varredura Somente Leitura` → `Hashes SHA-256` → `Deduplicação Exata & Semântica` → `Seleção Canônica` → `Promoção para operational`.
