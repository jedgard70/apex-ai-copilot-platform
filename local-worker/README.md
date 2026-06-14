# Apex Local Worker — H6.0

Serviço Node.js local para execução controlada no PC Windows.
Auto-descobre `node`, `npm` e `git` de forma best-effort — candidatos inválidos são ignorados, não derrubam o worker.
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

## Auto-discovery de binários (best effort)

O worker tenta descobrir `node`, `npm` e `git` automaticamente ao iniciar.
Se um candidato causar erro (EINVAL, ENOENT, diretório em vez de arquivo, path com `*` não expandido), ele é **ignorado** — o worker **não crasha**.

Se a discovery falhar para um binário, o worker ainda sobe e `/health` retorna `available: false` com uma `reason` clara.
Nesse caso, defina o override no `.env` (ver abaixo).

**Para node, tenta em ordem:**
1. `NODE_BIN` do `.env` (se definido)
2. `process.execPath` (o próprio Node.js em execução — sempre funciona)
3. `node.exe` / `node` no PATH

**Para npm (Windows), tenta em ordem:**
1. `NPM_BIN` do `.env` (se definido)
2. `npm.cmd` ao lado do `node.exe` atual
3. `npm.exe` ao lado do `node.exe`
4. `npm.cmd` / `npm.exe` / `npm` no PATH

**Para git (Windows), tenta em ordem:**
1. `GIT_BIN` do `.env` (se definido)
2. `C:\Program Files\Git\cmd\git.exe`
3. `C:\Program Files\Git\bin\git.exe`
4. GitHub Desktop bundled git (`app-*/resources/app/git/cmd/git.exe`)
5. `git.exe` / `git.cmd` / `git` no PATH

### Se auto-discovery falhar — use overrides no `.env`

```env
# Exemplos Windows comuns:
NPM_BIN=npm.cmd
GIT_BIN=C:\Program Files\Git\cmd\git.exe

# GitHub Desktop bundled git (ajuste a versão):
GIT_BIN=C:\Users\apexg\AppData\Local\GitHubDesktop\app-3.5.12\resources\app\git\cmd\git.exe
```

## Rodar

```bash
# Produção
node server.mjs

# Desenvolvimento (recarrega ao salvar)
node --watch server.mjs
```

Ao iniciar, o worker imprime o resultado do auto-discovery:
```
[apex-worker] Discovering tools...
[apex-worker] node: ✓ C:\Program Files\nodejs\node.exe (v22.x.x)
[apex-worker] npm:  ✓ C:\Program Files\nodejs\npm.cmd (10.x.x)
[apex-worker] git:  ✓ C:\Program Files\Git\cmd\git.exe (git version 2.x.x)
[apex-worker] Apex Local Worker H5.2D running on http://127.0.0.1:8787
```

Se um binário não for encontrado:
```
[apex-worker] npm:  ✗ Not found. Set NPM_BIN=npm.cmd in .env or reinstall Node.js.
```
O worker **continua rodando** — apenas as ações que dependem daquele binário retornam `unavailable`.

## Testar

### Health check
```bash
curl -H "Authorization: Bearer SEU_TOKEN" http://127.0.0.1:8787/health
```

Resposta (mesmo se npm/git não encontrados):
```json
{
  "ok": true,
  "checkpoint": "H5.2D",
  "discoveredTools": {
    "node": { "available": true,  "path": "...", "version": "v22.x.x", "reason": null },
    "npm":  { "available": false, "path": null,  "version": null, "reason": "Not found. Set NPM_BIN=npm.cmd in .env..." },
    "git":  { "available": true,  "path": "...", "version": "git version 2.x.x", "reason": null }
  },
  "allowedActions": ["system.info", "node.version", ...],
  "secretsExposed": false
}
```

### system.info (parcial se alguma tool indisponível)
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
- **spawn() protegido** — EINVAL/ENOENT capturados, worker não crasha

## Integração com o Apex Backend (Vercel)

Após rodar o worker localmente, configure no painel do Vercel:

```
LOCAL_WORKER_URL=https://SEU-TUNEL-PUBLICO
LOCAL_WORKER_TOKEN=o-mesmo-token-do-.env
```

> **Nota:** Para que o backend Vercel acesse o worker local, você precisa de um túnel seguro
> (ex: `ngrok http 8787`, Cloudflare Tunnel) e usar o URL público em `LOCAL_WORKER_URL`.

## Arquivo `.env` — NÃO commitar

O arquivo `.env` e variações (`.env.local`, `.env.production`) estão no `.gitignore`.
**Nunca faça commit do token real.**
