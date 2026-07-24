# 06 — Gap analysis: planta para A1

Capacidade atual: receber imagem/PDF, extrair PDF digital, gerar humanização/render e exportar relatórios. Não há representação geométrica canônica nem derivação coordenada de cortes, fachadas, detalhes e A1.

| Prioridade | Gap | Dependência | Risco |
|---|---|---|---|
| P0 | modelo canônico 2D/BIM, unidades e proveniência | schema geométrico | decisões não verificáveis |
| P0 | OCR, cotas e escala | OCR + calibração | dimensões falsas |
| P0 | vetorização de paredes/aberturas | CV + revisão humana | reconstrução incorreta |
| P1 | conectar IfcViewer real | WebIFC/UI | usuário vê mock |
| P1 | consistência entre vistas | modelo canônico | prancha incoerente |
| P1 | derivar cortes/elevações | kernel BIM | documentos não coordenados |
| P2 | compositor A1 vetorial | layout/PDF | template não vira entrega |
| P2 | áreas/materiais | ambientes confirmados | quantitativos inventados |

Ativos reutilizáveis: fileIntake, PDF.js, IfcViewer/worker, APS, Revit connector, ArchVis, exportadores, package, skills BIM e template A1 legado.

Todo elemento futuro deve carregar source=observed|parsed|inferred|user_confirmed, confiança e referência ao arquivo/página/entidade.