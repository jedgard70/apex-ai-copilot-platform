# Padrão de workflows
**Status:** Foundation | **Versão:** 0.1 | **Data:** 2026-07-20

Workflow define objetivo, estados, transições, owner, inputs/outputs, compensações, timeout, retry, idempotência, aprovação humana, custo e audit trail. Runs são correlacionáveis e reprocessáveis com segurança. Falha parcial não é mascarada; DLQ e runbook são exigidos quando assíncrono.