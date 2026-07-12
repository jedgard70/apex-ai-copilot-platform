# Apex AI 2.0 Local Daemon Architecture

Objetivo:

- Dar acesso real ao repositório local, terminal, Git, build, validações, Revit/desktop e automações sem depender de a Vercel acessar o computador do usuário.
- Manter o site/app como interface bonita e a API Apex AI 2.0 como camada pública vendável.
- Evitar travamentos: tarefas longas rodam no daemon/local-worker, não dentro da função serverless nem bloqueando a janela Electron.

Componentes:

- `local-worker/server.mjs`: daemon local atual. Roda em `127.0.0.1:8787`, exige `LOCAL_WORKER_TOKEN` e executa ações allowlisted.
- `api/v1/*`: API pública Apex AI 2.0 com API key, escopos, usage meter e aprovação curta para `write:*`.
- `electron-main.cjs`: abre a janela imediatamente, inicia servidor local em background e cai para produção web se o local falhar.
- n8n/WhatsApp: camada recomendada para publicação automática com aprovação do Owner antes de postar.

Fluxo de código/autofix:

1. Owner pede no chat: corrigir, validar, commit, deploy.
2. Backend classifica risco.
3. Leitura/validação pode executar direto.
4. Escrita/commit/push/deploy exige confirmação ou approval token curto.
5. Daemon executa no repositório local e devolve stdout/stderr/evidência.

Fluxo de marketing CEO:

1. Apex gera roteiro, legenda, imagem/video/animação.
2. Materiais ficam como kit de campanha.
3. WhatsApp envia prévia ao Owner.
4. Resposta `1` aprova e dispara webhook n8n.
5. Resposta `2` descarta.

Regras de empacotamento `.exe`:

- Não empacotar `.env`, `.env.local`, modelos grandes, arquivos temporários ou `runtime/**/*` dentro do instalador padrão.
- O daemon/modelo pesado deve ser instalado/atualizado separadamente ou baixado sob demanda.
- A janela Electron deve abrir antes de aguardar servidor local para evitar aparência de app morto.

Comando local:

```bash
npm run daemon
```

Variáveis necessárias para o daemon:

```bash
LOCAL_WORKER_TOKEN=um-token-forte
LOCAL_WORKER_PORT=8787
APEX_PROJECT_PATH=D:\AI-constr\apex-ai-copilot-platform
```

Próximo checkpoint recomendado:

- Transformar `local-worker/server.mjs` em serviço Windows opcional.
- Criar instalador separado `Apex Local Daemon`.
- Persistir usage/billing em Supabase/Stripe em vez de memória por processo.
