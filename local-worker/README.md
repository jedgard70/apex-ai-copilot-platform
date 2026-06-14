# Apex Local Worker — H5.2A

Serviço Node.js local para execução controlada no PC Windows.
Roda em `http://127.0.0.1:8787` e aceita apenas ações da whitelist.

## Requisitos

- Node.js 18+ instalado no Windows
- Git disponível no PATH
- npm disponível no PATH

## Instalação

```bash
# No diretório local-worker/
cd local-worker
# Não há dependências externas — apenas Node.js nativo
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

### Gerar um token seguro

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Coloque o valor gerado em `LOCAL_WORKER_TOKEN` no `.env`.

## Rodar

```bash
# Produção
node server.mjs

# Desenvolvimento (recarrega ao salvar)
node --watch server.mjs
```

## Testar

### Health check
```bash
curl -H "Authorization: Bearer SEU_TOKEN" http://127.0.0.1:8787/health
```

### Status
```bash
curl -X POST -H "Authorization: Bearer SEU_TOKEN" http://127.0.0.1:8787/status
```

### Executar ação
```bash
curl -X POST \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"system.info\"}" \
  http://127.0.0.1:8787/run
```

## Ações permitidas

| Action ID | O que faz |
|---|---|
| `system.info` | Node, npm e git version |
| `node.version` | Versão do Node.js |
| `npm.version` | Versão do npm |
| `git.version` | Versão do Git |
| `project.git_status` | `git status --short` no projeto |
| `project.git_log` | `git log --oneline -5` |
| `project.build_check` | `npm run build` |
| `project.validate_h44` | `node scripts/validate-cp15x-h44.mjs` |
| `project.validate_h5` | `node scripts/validate-cp15x-h5.mjs` |

## Limites de segurança

- **Sem shell livre** — nenhum `cmd`, `powershell`, `bash` arbitrário
- **Sem comandos destrutivos** — `rm`, `del`, `format`, `git push`, `git commit`, `deploy`, `migration` NÃO estão na whitelist
- **Autenticação obrigatória** — sem token → 401, token errado → 403
- **Token nunca retornado** nas respostas
- **Bind apenas em 127.0.0.1** — não exposto na rede local
- **Timeout por comando** — 15 segundos por padrão
- **cwd restrito** ao `APEX_PROJECT_PATH`

## Integração com o Apex Backend (Vercel)

Após rodar o worker localmente, configure no painel do Vercel:

```
LOCAL_WORKER_URL=http://127.0.0.1:8787
LOCAL_WORKER_TOKEN=o-mesmo-token-do-.env
```

> **Nota:** Para que o backend Vercel acesse `127.0.0.1`, você precisará de um túnel seguro
> (ex: `ngrok`, Cloudflare Tunnel) ou executar o worker em um servidor acessível.
> O túnel deve ser configurado por você e o URL público substituído em `LOCAL_WORKER_URL`.

## Arquivo `.env` — NÃO commitar

O arquivo `.env` está no `.gitignore`. **Nunca faça commit do token real.**
