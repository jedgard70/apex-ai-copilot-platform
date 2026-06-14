# Apex Local Worker — H5.2B

Serviço Node.js local para execução controlada no PC Windows.
Auto-descobre `node`, `npm` e `git` — nenhuma configuração de PATH necessária.
Roda em `http://127.0.0.1:8787` e aceita apenas ações da whitelist.

## Requisitos

- Node.js 18+ instalado no Windows
- Git for Windows (opcional — algumas ações dependem)
- npm disponível (incluído no Node.js)

## Instalação

```bash
# No diretório local-worker/ — não há dependências externas
cd local-worker
```

## Configuração

```bash
# Copie o arquivo de exemplo
copy .env.example .env

# Edite .env com seus valores reais
notepad .env
```

### Variáveis do `.env`

| Variável | Obrigatória | Descrição |
|---|---|---|
| `LOCAL_WORKER_TOKEN` | **Sim** | Token secreto para autenticação |
| `LOCAL_WORKER_PORT` | Não | Porta (padrão: 8787) |
| `APEX_PROJECT_PATH` | Sim | Caminho absoluto para o projeto Apex |
| `NODE_BIN` | Não | Override do caminho do Node.js |
| `NPM_BIN` | Não | Override do caminho do npm |
| `GIT_BIN` | Não | Override do caminho do Git |

### Gerar um token seguro

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Auto-discovery de binários

O worker descobre automaticamente `node`, `npm` e `git` sem precisar de configuração.

**Para npm (Windows), tenta em ordem:**
1. `NPM_BIN` do `.env` (se definido)
2. `npm.cmd` ao lado do `node.exe` atual
3. `npm.exe` ao lado do `node.exe`
4. `npm` no PATH

**Para git (Windows), tenta em ordem:**
1. `GIT_BIN` do `.env` (se definido)
2. `C:\Program Files\Git\cmd\git.exe`
3. `C:\Program Files\Git\bin\git.exe`
4. GitHub Desktop bundled git
5. `git.exe` / `git.cmd` no PATH

**Para node:**
1. `NODE_BIN` do `.env` (se definido)
2. `process.execPath` (o próprio Node.js em execução — sempre funciona)

Se um binário não for encontrado, a ação retorna `unavailable` com instrução clara.
Você não precisa configurar `NODE_BIN`, `NPM_BIN` ou `GIT_BIN` na maioria dos casos.

## Rodar

```bash
# Produção
node server.mjs

# Desenvolvimento (recarrega ao salvar)
node --watch server.mjs
```

Ao iniciar, o worker imprime o resultado do auto-discovery:
```
[apex-worker] node: ✓ C:\Program Files\nodejs\node.exe (v22.x.x)
[apex-worker] npm:  ✓ C:\Program Files\nodejs\npm.cmd (10.x.x)
[apex-worker] git:  ✓ C:\Program Files\Git\cmd\git.exe (git version 2.x.x)
```

## Testar

### Health check (mostra discoveredTools)
```bash
curl -H "Authorization: Bearer SEU_TOKEN" http://127.0.0.1:8787/health
```

Resposta:
```json
{
  "ok": true,
  "checkpoint": "H5.2B",
  "discoveredTools": {
    "node": { "available": true, "path": "...", "version": "v22.x.x" },
    "npm":  { "available": true, "path": "...", "version": "10.x.x" },
    "git":  { "available": true, "path": "...", "version": "git version 2.x.x" }
  },
  "allowedActions": ["system.info", "node.version", ...]
}
```

### Executar system.info
```bash
curl -X POST \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"system.info\"}" \
  http://127.0.0.1:8787/run
```

### Git status do projeto
```bash
curl -X POST \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"project.git_status\"}" \
  http://127.0.0.1:8787/run
```

## Ações permitidas

| Action ID | Binário | O que faz |
|---|---|---|
| `system.info` | node+npm+git | Versões de todas as ferramentas |
| `node.version` | node | Versão do Node.js |
| `npm.version` | npm | Versão do npm |
| `git.version` | git | Versão do Git |
| `project.git_status` | git | `git status --short` |
| `project.git_log` | git | `git log --oneline -5` |
| `project.build_check` | npm | `npm run build` |
| `project.validate_h44` | node | `node scripts/validate-cp15x-h44.mjs` |
| `project.validate_h5` | node | `node scripts/validate-cp15x-h5.mjs` |

## Limites de segurança

- **Sem shell livre** — `shell: false` em todos os `spawn()`
- **Sem comandos destrutivos** — `rm`, `del`, `git push`, `git commit`, `deploy`, `npm install` NÃO estão na whitelist
- **Sem args do usuário** — argumentos são fixos no código
- **Autenticação obrigatória** — sem token → 401, token errado → 403
- **Token nunca retornado** nas respostas
- **Bind apenas em 127.0.0.1** — não exposto na rede local
- **Timeout por comando** — 30 segundos por padrão
- **cwd restrito** ao `APEX_PROJECT_PATH`

## Integração com o Apex Backend (Vercel)

Após rodar o worker localmente, configure no painel do Vercel:

```
LOCAL_WORKER_URL=https://SEU-TUNEL-PUBLICO
LOCAL_WORKER_TOKEN=o-mesmo-token-do-.env
```

> **Nota:** Para que o backend Vercel acesse o worker local, você precisa de um túnel seguro
> (ex: `ngrok http 8787`, Cloudflare Tunnel) e usar o URL público em `LOCAL_WORKER_URL`.

## Arquivo `.env` — NÃO commitar

O arquivo `.env` está no `.gitignore`. **Nunca faça commit do token real.**
