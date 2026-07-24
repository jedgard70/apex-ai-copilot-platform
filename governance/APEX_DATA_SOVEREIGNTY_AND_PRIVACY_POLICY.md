# APEX DATA SOVEREIGNTY & PRIVACY POLICY
**Política Oficial de Soberania de Dados, Privacidade e Governança Financeira de IA**  
**Escopo:** Toda a plataforma Apex Global / Apex OS (`http://127.0.0.1:3010`)  
**Status:** Política Inflexível de Arquitetura & Governança Corporativa  

---

## 1. Princípio Fundamental

A Apex foi concebida para operar em qualquer mercado internacional (União Europeia, EUA, América Latina e Ásia). Toda decisão de arquitetura deve respeitar rigorosamente:

- **GDPR** (General Data Protection Regulation - União Europeia)
- **EU AI Act** (Regulamentação Europeia de Inteligência Artificial)
- **SOC 2 Type II** (Security, Availability, and Confidentiality)
- **LGPD** (Lei Geral de Proteção de Dados - Brasil)
- Requisitos corporativos e contratuais de clientes Enterprise

A conformidade e a soberania de dados são **requisitos de arquitetura**, não funcionalidades opcionais.

---

## 2. Data Sovereignty First (Soberania de Dados por Padrão)

A Apex **nunca** armazenará dados de clientes nos servidores dos provedores de IA além do tempo estritamente necessário para o processamento da requisição.

Sempre que suportado pela API do provedor:
- Desabilitar armazenamento de entradas/saídas (ex: cabeçalho `X-Fal-Store-IO: 0` na fal.ai).
- Desabilitar retenção prolongada em CDNs de fornecedores.
- Desabilitar explicitamente qualquer reutilização ou treino de modelos com dados de clientes.

---

## 3. AI Provider Evaluation & Classification Policy

Nenhum provedor de IA será integrado sem passar pelo protocolo de avaliação corporativa:

### 3.1 Protocolo de Avaliação
1. Utiliza dados dos clientes para treinamento? (Exigência: **NÃO**).
2. Possui opção contratual de exclusão imediata de payloads?
3. Oferece API/plano Enterprise com SLA e suporte dedicado?
4. Possui relatórios de segurança documentados (SOC 2, ISO 27001)?
5. Possui política de retenção transparente e documentada?

### 3.2 Classificação de Provedores e Níveis de Dados

| Categoria do Provedor | Uso Permitido | Requisitos Mínimos |
| :--- | :--- | :--- |
| **Public** | Conteúdo estático e dados não-sensíveis. | Criptografia em trânsito (TLS 1.3). |
| **Business** | Dados de projetos internos e assinantes standard. | Sem uso de dados para treino + retenção efêmera. |
| **Enterprise** | Dados corporativos de empresas contratantes. | DPA assinado + SOC 2 Type II + exclusão imediata. |
| **Confidential** | Projetos sigilosos / Governamentais / BIM sensível. | VPC dedicada / BYOK / Instância isolada. |

O `ProviderRouter` impedirá automaticamente o envio de projetos sensíveis para provedores não classificados com o nível de segurança exigido.

---

## 4. Universal Privacy Layer (Camada Universal de Privacidade)

Antes de qualquer requisição sair do perímetro da Apex para uma API de fornecedor:
- Remover metadados desnecessários do arquivo original.
- Anonimizar identificadores de usuários e empresas.
- Registrar log imutável de auditoria no `UsageLedger`.
- Validar as travas da política de privacidade.

Nenhum fornecedor receberá mais dados do que o estritamente necessário para concluir a inferência.

---

## 5. Apex Owns the Assets (Posse Total dos Ativos)

Toda mídia produzida por qualquer modelo ou fornecedor seguirá obrigatoriamente este fluxo:

```text
Provider API (Inferência)
        ↓
Download imediato pelo Apex Server
        ↓
Validação de integridade e checksum
        ↓
Armazenamento em bucket próprio (Cloudflare R2 / S3 / Supabase)
        ↓
Registro de ativo no ai_assets DB
        ↓
Geração de URL própria com domínio Apex (/shared/ ou CDN Apex)
        ↓
Remoção do arquivo no provedor externo (onde suportado)
```

O cliente **sempre** acessará e baixará arquivos a partir de um link da Apex. **Nunca** a partir de um link temporário do fornecedor.

---

## 6. Zero Vendor Exposure (Marca Única Apex)

O cliente final **nunca** verá marcas, nomes de modelos ou provedores terceiros (OpenAI, fal.ai, Runware, Replicate, Anthropic) na interface, documentos ou faturas.

A interface e as entregas comerciais exibirão **exclusivamente**:
```text
Desenvolvido por APEX AI 2.0
```

A Apex vende soluções completas de inteligência operacional para a indústria AEC, nunca revende fornecedores de IA.

---

## 7. AI Financial Governance (Governança Financeira e Auditoria)

Nenhuma requisição de IA será considerada válida se não registrar o lançamento individual imutável (`usage_event`) contendo:
- Provedor e modelo selecionado
- Custo estimado e custo real confirmado
- Latência no percentil 95
- Identificador do tenant (`organizationId` / `workspaceId`)
- Capability de produto utilizada
- Política de margem aplicada

---

## 8. Compliance by Design

Todo novo componente ou adapter integrado ao Apex OS deverá responder positivamente às seguintes perguntas antes do deployment em produção:
1. Está em conformidade com o GDPR (União Europeia)?
2. Está em conformidade com a LGPD (Brasil)?
3. Está em conformidade com o EU AI Act?
4. Respeita a política de retenção da Apex?
5. Possui trilha de auditoria rastreável?
6. Suporta a exclusão total dos dados a pedido do cliente?

---

## 9. Long-Term Independence (Visão de Soberania Progressiva)

- **Ano 1–2:** Utilização de APIs Serverless de terceiros sob a proteção do `ProviderRouter`.
- **Ano 3–5:** Infraestrutura híbrida com clusters dedicados vLLM para modelos de alto volume.
- **Ano 5–10:** Máxima soberania sobre modelos especialistas, armazenamento e infraestrutura própria sempre que justificado pelo Retorno sobre o Investimento (ROI) e Custo Total de Propriedade (TCO).

---

## 10. Princípio Oficial Inflexível da Apex

> **"A Apex não vende OpenAI."**  
> **"A Apex não vende fal.ai."**  
> **"A Apex não vende Runware."**  
> **"A Apex vende inteligência operacional para Arquitetura, Engenharia e Construção."**  
>  
> Os fornecedores são infraestrutura substituível. O produto, os dados e a valoração pertencem integralmente à Apex Global.
