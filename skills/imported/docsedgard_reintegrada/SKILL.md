---
name: docsedgard_reintegrada
title: docsedgard_reintegrada
description: Manifesto unificado de artefatos docsedgard para reintegracao de skills no Apex.
domains: [platform-management, migration, documentation]
entrypoint: docsedgard_reintegrada.py:dispatch
triggers:
  - list_docsedgard_skills
  - docsedgard_manifest
  - docsedgard_summary
  - docsedgard_search
  - docsedgard_sync_manifest
risk: low
enabled: true
kind: runtime-skill
---

# docsedgard_reintegrada

Skill de inventario e referencia para a reintegracao de artefatos da pasta externa `D:\AI Jedgard\skill`.

## Fonte principal
- `skill\DOCSEDGARD_SKILL_REINTEGRADA.md` (manifesto completo com `.md`, `.pdf`, `.txt` e `.py`)

## Uso
- Consultar o inventario consolidado antes de migrar ou ativar skills.
- Executar `dispatch("summary")`, `dispatch("search", term="...")` ou `dispatch("sync-manifest")`.
