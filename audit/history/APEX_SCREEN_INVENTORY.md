# Inventário de Telas Apex

- Versão: 1.0.0
- Status: auditado
- Data: 2026-07-22

## Método e números

- Manifesto Stitch atual: 102 entradas declaradas.
- Arquivos renderizáveis locais: 100 HTML.
- Previews PNG: 12.
- Telas/rotas públicas ou autenticadas conectadas diretamente em `src/app/server.ts`: 22 rotas nominais, além de rotas dinâmicas de compartilhamento e catálogo Stitch.
- Componentes de painel/página no copilot legado: pelo menos 68 nomes identificados; são legado, não telas do Apex OS.

Entradas do manifesto, HTML, PNG, rota e tela de produto são unidades diferentes. Duplicatas são registradas em `stitch/duplicates.json`; não foram somadas como funcionalidades.

## Rotas de tela conectadas no Apex OS

| Rota(s) | Origem | Auth | Estado | Observação |
|---|---|---|---|---|
| `/` | `LandingPage.ts` | não | FUNCTIONAL_LOCAL | landing nativa |
| `/login` | `LoginPage.ts` | não | INTEGRATED_PARTIAL | depende de Supabase server env |
| `/signup`, `/recover`, `/password-recovery` | Stitch | não | UI_ONLY | handlers auxiliares existem |
| `/services` | `StaticPages.ts` | não | FUNCTIONAL_LOCAL | catálogo comercial |
| `/checkout` | Stitch | sessão no backend | MOCK | pagamento não usa gateway real |
| `/dashboard` | Stitch | não comprovada na própria tela | UI_ONLY | não confundir com workspace |
| `/workspace` | `WorkspacePage.ts` | sessão | FUNCTIONAL_LOCAL | jornada de projeto/ArchVis |
| `/vsl` | `VslNextPage.ts`/Stitch | não | FUNCTIONAL_LOCAL | há condição duplicada no roteador |
| `/sales/impact`, `/sales/ecosystem`, `/sales/visual-intelligence` | Stitch | não | UI_ONLY | ativos comerciais |
| `/digital-twin` | Stitch | não | UI_ONLY | sem engine atual |
| `/roadmap` | Stitch | não | UI_ONLY | comunicação de roadmap |
| `/stitch`, `/stitch/screens/:id` | catálogo/export | não | FUNCTIONAL_LOCAL | ferramenta de inspeção, não produto |
| `/shared/:token` | `WorkspacePage.ts` | token público | FUNCTIONAL_LOCAL | entrega compartilhada |
| `/admin`, `/admin/users` | HTML no server | token/permissão parcial | INTEGRATED_PARTIAL | necessita hardening |
| páginas de footer (termos, privacidade etc.) | `StaticPages.ts` | não | FUNCTIONAL_LOCAL | conteúdo estático |

## Gaps de design

1. Definir IDs canônicos de tela e relacionar cada um a rota, produto, persona e capability.
2. Remover a ambiguidade entre 102 entradas de manifesto e 100 HTML.
3. Marcar telas não conectadas como catálogo de design, nunca como produto implementado.
4. Testar navegação, responsividade, acessibilidade e estados de erro da jornada principal.
5. Consolidar duplicação de `/vsl` no roteador antes do release.
