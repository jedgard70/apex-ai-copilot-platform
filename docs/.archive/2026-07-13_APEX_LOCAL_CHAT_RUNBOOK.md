# APEX Local Chat Runbook (60s)

Objetivo: restaurar rapidamente o chat local (apex-local) quando houver falha.

## 1) Verificar Ollama (runtime do modelo)

Comando:
PowerShell:
Invoke-RestMethod -Uri "[http://127.0.0.1:11434/api/tags](http://127.0.0.1:11434/api/tags)" -Method Get -TimeoutSec 3

Resultado esperado:

- Retorna JSON com lista de modelos.
- Deve existir modelo apex-ai.

Se falhar:

- Iniciar Ollama:
  - ollama serve
- Criar modelo apex-ai (se nao existir):
  - ollama create apex-ai -f notebooks/ApexAI2.0

## 2) Verificar backend do projeto (porta padrao)

Comando:
Invoke-RestMethod -Uri "[http://127.0.0.1:4177/api/copilot/models](http://127.0.0.1:4177/api/copilot/models)" -Method Get -TimeoutSec 3

Resultado esperado:

- Campo models contem item com provider apex-local.
- Deve existir apex-local|apex-ai.

Se falhar:

- Subir backend:
  - node server.mjs

## 3) Teste funcional do chat local

Comando:
$body = @{ selectedModel='apex-local'; messages=@(@{ role='user'; text='responda com ok-local' }) } | ConvertTo-Json -Depth 8
Invoke-RestMethod -Uri 'http://127.0.0.1:4177/api/copilot/chat' -Method Post -ContentType 'application/json' -Body $body

Resultado esperado no JSON:

- provider = apex-local
- mode = apex-local-ollama
- model = apex-ai

## 4) Checklist rapido de regressao

- src/main.tsx deve priorizar apex-local no resolveModelSelection.
- api/copilot/chat.mjs nao deve duplicar APEX_LOCAL_MODELS no buildStaticModelCatalog().
- src/components/RuntimeStatusIndicator.tsx deve mostrar aviso apenas quando apex-local estiver selecionado e runtime local estiver down.

## 5) Comandos de recuperacao imediata

Se backend aparentemente "fecha" no terminal:

- Ver processos node ativos:
  - Get-Process -Name node
- Ver porta ocupada:
  - Get-NetTCPConnection -LocalPort 4177 -State Listen
- Encerrar processo especifico:
  - Stop-Process -Id PID_AQUI -Force
- Subir novamente:
  - Remove-Item Env:PORT -ErrorAction SilentlyContinue
  - node server.mjs

## 6) Criterio de pronto

Considerar resolvido apenas quando:

- /api/copilot/models lista apex-local|apex-ai
- /api/copilot/chat retorna provider apex-local
- UI seleciona apex-local e conversa sem fallback para outro provider
