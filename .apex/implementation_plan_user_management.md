# Planejamento: Gerenciamento de Usuários e Controle de Acesso (RBAC)

O objetivo desta implementação é substituir os usuários demonstrativos (mock) por um sistema **Real de Gerenciamento de Usuários SaaS**, permitindo que você adicione clientes, funcionários ou parceiros e restrinja o que cada um pode acessar dentro da plataforma.

## User Review Required

> [!WARNING]
> **Decisão de Arquitetura de Banco de Dados**
> Para implementarmos o painel de forma segura, precisaremos criar uma tabela de perfis de usuário (`tenant_users`) no banco de dados (Supabase/Firebase) vinculada à autenticação. Isso exige a chave de serviço administrativa do banco. Se as chaves já estiverem no arquivo `.env`, o sistema fará a integração automaticamente.

## Open Questions

> [!IMPORTANT]
> 1. Você quer que o sistema dispare um **e-mail automático de convite** quando você cadastrar um novo usuário (ex: "A Apex criou uma conta para você, clique aqui para acessar") ou prefere apenas cadastrá-los manualmente e passar a senha para eles no WhatsApp?
> 2. Quais as **3 funções/cargos iniciais** que você mais precisa controlar? (Ex: Admin, Engenheiro de Obra, Cliente Final).

## Proposed Changes

### Banco de Dados e API (Backend)
- Criar script SQL/Firebase para gerar a tabela `tenant_users` (colunas: id, email, role, status).
- Criar a rota protegida para listar, convidar e alterar cargo de usuários.

### Interface (Frontend)
#### [MODIFY] [SaasAdminPanel.tsx](file:///d:/AI-constr/apex-ai-copilot-platform/src/components/SaasAdminPanel.tsx)
- Adicionar o botão verde **"Convidar Novo Usuário"**.
- Trocar a tabela visual de `localDemoUsers` para buscar os usuários reais da API.
- Adicionar seletores (`dropdowns`) na tabela para alterar o cargo (Role) do usuário em tempo real.
- Adicionar botões de ação para Bloquear ou Excluir o acesso do usuário.

#### [MODIFY] [authModel.ts](file:///d:/AI-constr/apex-ai-copilot-platform/src/lib/authModel.ts)
- Conectar a injeção do cargo real (ex: `client`) na variável global de sessão para que toda a plataforma saiba quem está logado.

#### [MODIFY] [App.tsx / main.tsx](file:///d:/AI-constr/apex-ai-copilot-platform/src/main.tsx)
- Criar a lógica que *esconde* menus de Administração (AI Studio, Webhooks, etc) quando a variável `role` não for `owner_admin`.

## Verification Plan

### Testes Manuais
1. Acessar a plataforma como Super Admin (você).
2. Abrir o painel **SaaS Admin** (Gerenciamento de Usuários).
3. Criar um usuário fictício com cargo "Cliente".
4. Fazer logoff e entrar com a conta do "Cliente".
5. Verificar se os menus de IA pesada e configurações desapareceram e se a interface ficou limpa apenas com os módulos permitidos.
