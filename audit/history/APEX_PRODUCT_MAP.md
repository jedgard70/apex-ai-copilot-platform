# Mapa de Produtos Apex

- Versão: 1.0.0
- Status: baseline auditado
- Data: 2026-07-22

## Estrutura canônica

| Camada | Produto/serviço | Estado atual | Fonte executável | Direção |
|---|---|---|---|---|
| Core | Apex OS | FUNCTIONAL_LOCAL | `src/core`, `src/app`, 13 suítes de teste | núcleo compartilhado |
| Shared Service | Apex Intelligence | INTEGRATED_PARTIAL | execution/provider/capability runtime | consolidar depois do Customer Journey |
| Shared Service | Apex Growth | BACKEND_ONLY | arquitetura e páginas VSL/sales | CRM e automação posteriores |
| Shared Service | Finance & BI | BACKEND_ONLY | ledgers/políticas em `src/finance` | persistência e conciliação |
| Vertical | Apex Engineering | FUNCTIONAL_LOCAL | ArchVis + catálogo Visual Intelligence | primeiro produto vendável |
| Vertical | Apex Accounting | LEGACY | documentação OS + projeto `D:/Apex-Accounting` | auditoria/migração independente |
| Vertical | Apex Legal | LEGACY | documentação OS + módulos copilot | auditoria/migração independente |
| Vertical | Apex Invest | PLANNED | somente documento no OS | não incluir no primeiro release |
| Vertical | Apex Travel | PLANNED | somente documento no OS | não incluir no primeiro release |
| Vertical | Apex Studio | INTEGRATED_PARTIAL | ArchVis; áudio/vídeo permanecem legados | expandir após confiabilidade comercial |

## Repositórios e fontes

| Nome lógico | Caminho | Git/branch/commit auditado | Stack indicativa | Relação |
|---|---|---|---|---|
| Apex OS | `D:/AI-constr/apex-os` | `continuity/commercial-flow` / `a702654` | Node >=24, TypeScript | destino oficial |
| Apex AI Copilot | `D:/AI-constr/apex-ai-copilot-platform` | `main` / `a20bcc1` | Vite/React/Node/Vercel/Electron | legado somente leitura |
| ACIP histórico | `D:/AI-PLATAFORM/AI-Construction-Intelligence-Platform` | `main` / `ae99609` | JS/TS web | visão e código legado |
| Apex AI assets | `D:/APEX AI` | `main` / `c40f907` | acervo heterogêneo | patrimônio cognitivo |
| Accounting | `D:/Apex-Accounting` | sem Git raiz | Node e subprojetos | vertical independente |
| Marketing squads | `D:/apex-marketing-squads` | sem Git raiz | skills/prompts | patrimônio Growth |
| Prompts J Edgard | `D:/Prompts J Edgard` | sem Git | documentos/prompts | patrimônio autoral |
| Skills Apex | `D:/SKILLS_APEX` | sem Git | skill assets | patrimônio cognitivo |

Portas, PID, comando e último deploy dos legados permanecem UNKNOWN: não houve inicialização, consulta externa ou inspeção invasiva. O Apex OS declara porta padrão 3010 no servidor; listener não foi promovido a evidência de produção.

## Produto inicial recomendado

`Apex Engineering — Visual Intelligence` é o único corte vertical com uma jornada quase completa no OS atual. Executive e Enterprise devem permanecer com destaques planejados explicitamente rotulados até que suas capabilities existam.
