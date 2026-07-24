# 05 — Pipeline arquitetônico

| Etapa | Componente | Status | Lacuna |
|---|---|---|---|
| Upload | fileIntake/UI | implementada | validação limitada |
| Imagem | preview/ArchVis | implementada | não é geometria |
| PDF | PDF.js | parcial | scanned flag sem OCR |
| OCR/escala/cotas | skills/legado | ausente/demo | sem calibração |
| Geometria 2D | — | ausente | bloqueio central |
| Paredes/aberturas/ambientes | DRAWING legado | demo | não lê upload |
| IFC | web-ifc viewer | real órfão | painel não usa |
| RVT/DWG/DXF | APS/Revit | externo | sem parser local |
| Modelo canônico | — | ausente | não conecta 2D/BIM |
| Raciocínio | Copilot/skills | parcial | não ancorado |
| Seleção de desenhos | — | ausente | sem regras |
| Reconstrução/cortes/elevações/detalhes | — | ausente | render não é técnico |
| Render/humanização | FAL | implementado externo | pode alterar geometria |
| A1 | template legado | parcial/órfão | não compositor |
| Clash/coerência | dados fixos | mock | sem cálculo |
| PDF/imagem/ZIP | Export Center | implementado | sem IFC/DWG técnico |

Conclusão: não existe pipeline ponta a ponta planta→A1. Confiança alta.