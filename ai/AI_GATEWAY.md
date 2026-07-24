# AI Gateway
**Versão:** 1.0.0 | **Status:** contrato proposto; não implementado | **Data:** 2026-07-20

Porta do Apex Intelligence para requisições versionadas, roteamento por capability/policy, limites, redaction, usage, custo, timeout e resposta com proveniência. Não embute regra vertical nem torna provider específico parte do Core.

Falhas devem ser explícitas; fallback somente por política aprovada e sem degradar silenciosamente requisitos. **Riscos:** ponto único de falha, roteamento caro e perda semântica.
