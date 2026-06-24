# COMPARATIVO REAL: Apex AI vs Plano ACIP (Platform JEDGARD)

> Gerado em: 2026-06-25 00:15
> Base: Código real verificado no disco + git log
> REGRA ABSOLUTA 6: "Documentação é desejo. Código é realidade."

## 🎯 ENTENDENDO A DIFERENÇA

| Característica | Apex AI Copilot (ATUAL) | ACIP Platform (PLANO) |
|---------------|------------------------|----------------------|
| Foco | Criativo + técnico + vendas | Enterprise obra + BIM + executivo |
| Usuários | Owner, arquiteto, cliente | Diretor, engenheiro, investidor, compliance |
| Chat | Central da experiência | Sidebar auxiliar |
| Agentes | 0 especializados | **13 agentes cognitivos** |
| BIM | Viewer básico | Clash detection + coordenação |
| Analytics | Básico | **Preditivo** (atraso, risco, retrabalho) |
| Intelligence Layers | 0 | **7 layers** (BIM, Visual, Predictive, etc.) |
| Integrações | APS (Autodesk) | Revit, Navisworks, SAP, Oracle, n8n... |

---

## ✅ O QUE JÁ EXISTE NA APEX (aproveitável para ACIP)

| Componente | Status | O que faz |
|-----------|--------|-----------|
| Supabase Auth + 8 migrations | ✅ | Base para login por role |
| `AgentsPanel.tsx` | ⚠️ Existe | Mas tem APENAS menções soltas a "Estrutural" e "Compliance" — NÃO são 13 agentes dedicados |
| `Bim3DPanel.tsx` | ✅ | Viewer IFC/3D real (WebGL) |
| `DashboardPage.tsx` | ⚠️ Existe | Mas NÃO tem DashboardByRole — é único para todos |
| `ContractsPanel.tsx` | ✅ | Geração de contratos |
| `FinancePanel.tsx` | ✅ | Controle financeiro DRE |
| `DigitalTwinPanel.tsx` | ⚠️ Existe | Básico, sem IoT |
| `Api/copilot/chat.mjs` | ✅ | Chat com IA (vários provedores) |
| APS Integration | ✅ | `api/aps/*` — Revit, ACC |
| Auth/Login | ✅ | Supabase com roles |

---

## ❌ O QUE NÃO EXISTE (PRECISA SER CONSTRUÍDO)

### Módulos Completos Faltando

| Módulo | O plano pede | O que existe hoje |
|--------|-------------|-------------------|
| **DashboardByRole** | Dashboard diferente para diretor, engenheiro, vendas, investidor | ❌ Dashboard único (`DashboardPage.tsx`) |
| **13 Agentes Cognitivos** | Engenheiro Civil, Arquiteto, Estrutural, Orçamentista, Gestor de Obra, Mercado, Vendas, Investidores, Compliance, Automação, Conselho Executivo, Simulação, Construction AGI | ❌ Apenas `AgentsPanel.tsx` existe, mas **NÃO** implementa 13 agentes com lógica dedicada |
| **Modos de Coordenação** | Execução paralela, coordenação hierárquica, orquestração por eventos, self-healing | ❌ Não existe |
| **BIM Clash Detection** | Lista de conflitos, severidade, disciplinas, status | ❌ Viewer existe, clash detection NÃO |
| **Predictive Analytics** | Previsão de atrasos, risco financeiro, retrabalho, gargalos | ❌ Não existe |
| **7 Intelligence Layers** | BIM, Visual, Predictive, Autonomous Decision, Digital Twin, Financial, Hyperautomation | ❌ Apenas Digital Twin básico existe |
| **Página /projeto/[id]** | Página individual de projeto com rota | ❌ Não existe (só `ProjectWorkspacePanel`) |
| **Página /cliente/[id]** | Página individual de cliente | ❌ Não existe (só `CrmPanel`) |
| **Pipeline CRM com estágios** | Prospecção → Proposta → Fechamento com KPIs | ❌ `CrmPanel` existe mas sem pipeline |
| **Qualidade / NCIs** | Checklists de conformidade, NCIs com severidade | ❌ Não existe |
| **Permit Checklist** | Checklist de licenças e alvarás por órgão | ❌ Só `AmericanPermitsPanel` genérico |
| **Workflow Tasks** | Tarefas com assignee, prazo, status | ❌ Não existe |
| **Neon Visualization** | Neon Border, Glow Aura, Pulse Animation | ❌ Não existe |
| **ArchVis Pro** | Camera styles, lighting presets, post-processing dedicados | ❌ `ArchVisPanel` existe mas sem esses recursos |
| **JURÍDICO com IA** | Contratos gerados por Claude, análise de risco | ⚠️ Só `ContractsPanel` básico |
| **n8n / Make / Zapier** | Workflows automáticos | ❌ Só menção a "Make" em server.mjs |
| **LangGraph / CrewAI / AutoGen** | Multi-agent frameworks | ❌ Não existe |
| **SAP / Oracle / TOTVS** | ERP integration | ❌ Só menção a "SAP" em server.mjs |
| **HubSpot** | CRM integration | ❌ Não existe |

---

## 📊 RESUMO DE APROVEITAMENTO

| Categoria | Itens | Aproveitável |
|-----------|-------|-------------|
| Infraestrutura (Auth, DB, Chat) | ~10 módulos | ✅ **80% aproveitável** |
| Módulos de negócio (Finance, Contracts) | ~8 módulos | ✅ **60% aproveitável** (precisa expandir) |
| Agentes Cognitivos (13 agentes) | 0 de 13 | ❌ **0% — construir do zero** |
| Intelligence Layers (7 layers) | 0 de 7 | ❌ **0% — construir do zero** |
| Enterprise Integrations | 2 de 16 | ❌ **12% — 14 connectors precisam ser criados** |
| BIM Avançado (Clash, NCIs, Workflow) | 0 de 4 | ❌ **0% — construir do zero** |

---

## 🎯 CONCLUSÃO

**O plano ACIP é uma plataforma NOVA**, muito mais ambiciosa que a Apex AI atual.

O que a Apex AI já tem que SERVE para a ACIP:
- ✅ Supabase Auth + Database (95 tabelas)
- ✅ Chat com IA multi-provedor
- ✅ BIM/3D Viewer básico
- ✅ Sistema de contratos
- ✅ Financeiro
- ✅ Integração APS (Autodesk)

O que PRECISA SER CONSTRUÍDO para a ACIP:
- ❌ **13 Agentes Cognitivos** com lógica dedicada e modos de coordenação
- ❌ **7 Intelligence Layers** com predictivos e autonomia
- ❌ **DashboardByRole** para cada tipo de usuário
- ❌ **BIM Clash Detection** completo
- ❌ **Pipeline CRM** com estágios e KPIs
- ❌ **Qualidade/NCIs** com severity e status
- ❌ **Enterprise Integrations** (SAP, Oracle, n8n, LangGraph, CrewAI...)
- ❌ **Neon Visualization System**
- ❌ **ArchVis Pro** (câmeras, iluminação, pós-processamento)

**Estimativa de esforço: 2-3 semanas de desenvolvimento intensivo**
**Linhas de código estimadas: +15.000 a +25.000**
