# Apex OS — Inventário Completo de Painéis e Telas

> **Gerado em:** 2026-07-21
>
> **Total de telas Stitch:** 83 (77 HTML + 6 screenshots)
>
> **Rotas de página no Runtime:** 13
>
> **Rotas de API:** 12
>
> **Repositórios in-memory:** 5 (todos voláteis)

---

## 1. Comercial

| Painel | Stitch | Rota | Backend | Status |
|--------|--------|------|---------|--------|
| **Landing** | ✅ `0bd229bf` | `/` | — | ✅ OK |
| **VSL** | ✅ `69393ddc` | `/vsl` | — | ✅ OK |
| **Login** | ✅ `89b491d9` | `/login` | `POST /api/login` | ✅ OK |
| **Cadastro** | ✅ `38ca52ca` | `/signup` | `POST /api/signup` | ✅ OK |
| **Recuperação de Acesso** | ✅ `03db99c9` | `/recover` | `POST /api/password-recovery` | ✅ OK |
| **Catálogo de Serviços** | ⚠️ Renderizado pelo servidor | `/services` | `GET /api/services` | ✅ OK |
| **Checkout** | ✅ `d47ef2af` | `/checkout` | `POST /api/checkout` | ✅ OK |
| **Vendas: Impacto** | ✅ `16b829aa` | `/sales/impact` | — | ✅ OK |
| **Vendas: Ecossistema** | ✅ `51b24421` | `/sales/ecosystem` | — | ✅ OK |
| **Vendas: Visual Intelligence** | ✅ `831b7e92` | `/sales/visual-intelligence` | — | ✅ OK |

---

## 2. Workspace & Execução

| Painel | Stitch | Rota | Backend | Status |
|--------|--------|------|---------|--------|
| **Workspace** | ⚠️ Renderizado pelo servidor | `/workspace` | — | ✅ OK |
| **Dashboard Executivo** | ✅ `7d4eb865` | `/dashboard` | — | ✅ Revisar |
| **Roadmap Estratégico** | ✅ `27866a60` | `/roadmap` | — | ✅ OK |
| **Digital Twin** | ✅ `ca1859d3` | `/digital-twin` | — | ✅ OK |
| **Projetos (CRUD)** | — | `POST /api/projects` | In-memory | ✅ OK |
| **Upload/Execução** | — | via `/api/projects` | In-memory | ✅ OK |
| **Resultado/Entrega** | — | via `/api/projects/:id/approve` | In-memory | ✅ OK |
| **Compartilhamento** | — | `/shared/:token` | In-memory | ✅ OK |

---

## 3. Existe no Stitch, NÃO está em rota pública

Estas telas **estão prontas no Stitch** mas **não possuem rota dedicada no servidor**.  
Acessíveis apenas via `/stitch?screen=:id`.

### Owner / Admin

| Tela Stitch | ID | Sugestão de rota |
|-------------|----|-------------------|
| Gestão de Permissões e RBAC | `afd97b6f` | `/admin/permissions` |
| Gestão de Usuários e Acessos SaaS | `10dc14fd` | `/admin/users` |
| Gestão de Usuários e Permissões | `cd2ea71f` | `/admin/users` (alternativa) |
| Gestão de Usuários e Acessos SaaS (v2) | `44ae06a6` | `/admin/users` (v2) |
| Gestão de Usuários e Permissões (Final Fix) | `66c71d11` | `/admin/users` (final) |
| Painel de Agentes Cognitivos | `34faa3c9` | `/admin/agents` |
| Painel de Agentes | `937c6409` | `/admin/agents` (simples) |
| V8 Command Center | `c397e770` | `/admin/command-center` |
| V8 Command Center — Swarm Error | `c02818ca` | `/admin/command-center` (v2) |
| V8 Agent Execution Logs | `00bb8c08` | `/admin/logs` |
| V8 Agent Logs — Visual Fix | `804aa817` | `/admin/logs` (v2) |
| V8 Agent Logs — Final Production | `8eae63f7` | `/admin/logs` (final) |
| V8 Technical Deployment Readiness | `7f2197bb` | `/admin/deployment` |
| V8 Deployment Center | `fbba35d9` | `/admin/deployment` (v2) |
| Intelligence Core Dashboard | `5fe690b0` | `/admin/intelligence-core` |
| Intelligence Core Dashboard (Regen) | `141ed1fd` | `/admin/intelligence-core` (v2) |
| Camada de Decisão Autônoma | `86f5e034` | `/admin/autonomous-decision` |
| Camada de Decisão Autônoma — Simulação | `ba7ec541` | `/admin/autonomous-decision` (live) |

### Engineering

| Tela Stitch | ID | Sugestão de rota |
|-------------|----|-------------------|
| BIM Intelligence Layer | `b0914796` | `/engineering/bim` |
| BIM Intelligence Layer (Regen) | `be2da4d9` | `/engineering/bim` (v2) |
| BIM Intelligence | `c056460b` | `/engineering/bim` (v3) |
| BIM-Ops: Clash Detection & Workflow | `3558c2df` | `/engineering/clash` |
| BIM-Ops: Clash Detection | `f62c17e0` | `/engineering/clash` (v2) |
| BIM-Ops: Coordenação (Visual Fix) | `c64e969a` | `/engineering/clash` (v3) |
| BIM 7D Command | `a6d29340` | `/engineering/bim-7d` |
| BIM 7D & Digital Twin Command | `866f2b68` | `/engineering/bim-7d` (v2) |
| Monitoramento de Projeto Individual | `b6dfafc3` | `/engineering/project-monitor` |
| Monitoramento (Final Fix) | `75dc90ee` | `/engineering/project-monitor` (v2) |
| Monitoramento (Visual Fix) | `16d8961c` | `/engineering/project-monitor` (v3) |
| Monitoramento de Projeto | `f4e4befa` | `/engineering/project-monitor` (v4) |
| Gestão de Projetos (Regen) | `de50da78` | `/engineering/projects` |
| Gestão de Projetos | `bc975a73` | `/engineering/projects` (v2) |
| Relatório Diário de Obra (Regen) | `ac556e7a` | `/engineering/rdo` |
| Relatório Diário de Obra (RDO) | `e977d591` | `/engineering/rdo` (v2) |
| RDO | `890f76d8` | `/engineering/rdo` (v3) |
| Digital Twin Operational Layer | `97cc9939` | `/engineering/digital-twin-ops` |
| Orçamento e Curva S Financeira | `2878759a` | `/engineering/budget-curve` |
| Architectural Humanization (ArchVis) | `5c228725` | `/engineering/archviz` |
| ArchVis Pro & Direct Cut Studio | `426987da` | `/engineering/archviz-pro` |
| Qualidade e Gestão de NCIs | `a24d910e` | `/engineering/quality-nci` |
| Hyperautomation & Workflows | `e1cd7e0a` | `/engineering/hyperautomation` |
| Hyperautomation & Event Logic | `d73613c2` | `/engineering/hyperautomation` (v2) |
| Enterprise Systems Integration | `aa6a2800` | `/engineering/integrations` |
| Integrações Enterprise | `27fbd3cf` | `/engineering/integrations` (v2) |
| Visual Intelligence Layer | `fe2e403f` | `/engineering/visual-intelligence` |
| Predictive Analytics Layer | `e3eb9c64` | `/engineering/predictive-analytics` |

### Financial

| Tela Stitch | ID | Sugestão de rota |
|-------------|----|-------------------|
| Financial Intelligence (Visual Fix) | `89afa25f` | `/financial/dashboard` |
| Financial Intelligence & ROI Dashboard | `a8dae28a` | `/financial/roi` |
| Inteligência Financeira e ROI | `a9a0209d` | `/financial/roi` (v2) |
| Budget Control | `5e38ce20` | `/financial/budget` |
| Budget Control (Visual Fix) | `0dc5b829` | `/financial/budget` (v2) |

### Marketing / CRM

| Tela Stitch | ID | Sugestão de rota |
|-------------|----|-------------------|
| CRM e Pipeline de Vendas (Final Fix) | `db5df2a5` | `/crm/pipeline` |
| CRM e Pipeline de Vendas (Regen) | `b84a6e82` | screenshot |
| CRM e Pipeline de Vendas | `f7e1ef34` | `/crm/pipeline` (v2) |
| CRM e Pipeline de Vendas | `d0564ab5` | `/crm/pipeline` (v3) |
| Perfil do Cliente e Inteligência CRM | `8d48c021` | `/crm/client-profile` |
| Perfil do Cliente | `49f70b4e` | `/crm/client-profile` (v2) |
| Perfil do Cliente | `b4d86167` | `/crm/client-profile` (v3) |
| Central de Relatórios | `3d8f1cf9` | `/crm/reports` |
| Central de Relatórios Executivos | `4511a186` | `/crm/reports-exec` |

### Legal

| Tela Stitch | ID | Sugestão de rota |
|-------------|----|-------------------|
| Jurídico e Contratos | `63329f27` | `/legal/contracts` |
| Jurídico e Gestão de Contratos (Final Fix) | `f0582f31` | `/legal/contracts` (v2) |
| Jurídico e Gestão de Contratos (Final Fix v2) | `7de0a500` | `/legal/contracts` (v3) |

### Dashboards Gerais

| Tela Stitch | ID | Sugestão de rota |
|-------------|----|-------------------|
| Dashboard Executivo V2 | `faab8739` | `/dashboard/v2` |
| Dashboard Executivo — ACIP | `6636624a` | `/dashboard/acip` |
| Dashboard Executivo — ACIP (v2) | `3da9931a` | `/dashboard/acip-v2` |
| Relatório Estratégico Executivo | `49581374` | `/dashboard/strategic-report` |
| Intelligence Core Dashboard (Regen) | `141ed1fd` | `/admin/intelligence-core` |

### Pitch Decks

| Tela Stitch | ID | Sugestão de rota |
|-------------|----|-------------------|
| Pitch Deck — Capa: Visão | `dff36abe` | `/pitch/deck` |
| Pitch Deck — ROI e Inteligência Financeira | `855e5dd5` | `/pitch/roi` |
| Pitch Deck — A Solução: ACIP V7 Brain | `92013858` | `/pitch/solution` |
| Pitch Deck — Roadmap V8 e Futuro | `ef957e05` | `/pitch/roadmap` |

---

## 4. Resumo por Categoria

| Categoria | No Stitch | Em Rota | % Conectado |
|-----------|-----------|---------|-------------|
| Comercial | 9 | 9 | **100%** |
| Workspace/Execução | 2 | 6 | backend-only |
| Owner/Admin | 18 | 0 | **0%** |
| Engineering | 26 | 1 (digital-twin) | **3%** |
| Financial | 4 | 0 | **0%** |
| Marketing/CRM | 9 | 0 | **0%** |
| Legal | 3 | 0 | **0%** |
| Pitch Decks | 4 | 0 | **0%** |
| Dashboards Gerais | 6 | 1 (dashboard) | **16%** |

---

## 5. Repositórios In-Memory (voláteis)

| Repositório | Chave | Persistência |
|-------------|-------|-------------|
| `InMemoryIdentityRepository` | `IdentityId` / `email` | ❌ Volátil |
| `InMemoryOrganizationRepository` | `OrganizationId` | ❌ Volátil |
| `InMemoryMembershipRepository` | `MembershipId` | ❌ Volátil |
| `InMemoryAuditStore` | `eventId` | ❌ Volátil |
| `InMemoryTelemetrySink` | — | ❌ Volátil |

**Nada sobrevive a um restart do servidor.**  
`POST /api/login`, `POST /api/checkout`, `POST /api/projects` criam dados que desaparecem ao reiniciar.

---

## 6. Providers no Legacy (`apex-ai-copilot-platform`)

| Provider | `.env` | Código | Testado | No Runtime |
|----------|--------|--------|---------|------------|
| Supabase | ✅ | ✅ | ✅ | ❌ |
| OpenAI | ✅ | ✅ | ✅ | ❌ |
| Anthropic (Claude) | ✅ | ✅ | ✅ | ❌ |
| Google Gemini | ✅ | ✅ | ✅ | ❌ |
| DeepSeek | ❓ | ❓ | ❓ | ❌ |
| FAL.ai | ✅ | ✅ | ✅ | ❌ |
| ElevenLabs | ✅ | ✅ | ⚠️ | ❌ |
| Brave Search | ✅ | ✅ | ⚠️ | ❌ |
| Meta | ✅ | ⚠️ | ❌ | ❌ |
| WhatsApp | ✅ | ❓ | ❌ | ❌ |
| Stripe | ✅ | ✅ | ✅ | ❌ |
| Vercel | ✅ | ✅ | ✅ | ❌ |
| GitHub | ✅ | ✅ | ✅ | ❌ |
| Gmail/Google | ✅ | ✅ | ✅ | ❌ |
| Firebase | ✅ | ⚠️ | ❌ | ❌ |
| Auth0 | ✅ | ⚠️ | ❌ | ❌ |

---

## 7. Módulo de Accounting

| Fonte | Localização | Frontend | Backend | Supabase |
|-------|-------------|----------|---------|----------|
| **Apex OS (interno)** | ❌ Não existe | ❌ | ❌ | ❌ |
| **Legacy (completo)** | `modules/accounting/` | ✅ `AccountingPanel.tsx`, `AccountsPortal.tsx` | ✅ `api.mjs`, `service.mjs` | ✅ Próprio projeto |
| **Legacy (finance)** | `modules/finance/` | ✅ `FinancePanel.tsx` | ✅ `api.mjs`, `service.mjs` | ✅ Mesmo projeto |

---

## 8. Próximos Passos Recomendados

### Imediatos (dias 1-2)

1. **Conectar os 3 painéis mais importantes do Stitch** que já estão prontos:
   - `/admin/permissions` → gestão de permissões
   - `/engineering/bim` → BIM Intelligence
   - `/crm/pipeline` → CRM e Pipeline de Vendas
2. **Iniciar migração Supabase** — começar por identidade (usuários/organizações)

### Curto prazo (sprint atual)

3. **25 telas Engineering** prontas no Stitch — conectar as principais
4. **Repositórios in-memory → Supabase** — domínio por domínio
5. **Persistência de chat** — estrutura `chat_threads`, `chat_messages`

### Médio prazo

6. **Dashboard Owner** — consolidar as 18 telas admin/owner
7. **Dashboard Financeiro** — 4 telas disponíveis
8. **Módulo Accounting** — auditar e migrar do legacy para Apex OS
9. **Providers** — criar Provider Router no Runtime e migrar um por um
