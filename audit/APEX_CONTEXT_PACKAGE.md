# Apex Context Package

Apex é um Enterprise AI Operating System verticalizado para engenharia, contabilidade, jurídico, investimentos e viagens sobre identity, IA, agents, memory, files, knowledge, billing, security e growth compartilhados.

Stack principal: React/Vite/TS, Node/Express, Vercel endpoints, Electron/local-worker, Supabase. Providers permitidos: Gemini nativo, FAL, ElevenLabs e internos.

Inventário: cinco raízes, três Git confirmados, 2.087 skills; 2.021 pares SHA idênticos; 215 candidatos a executor e 53 candidatos a teste; 100 API e 168 server mjs no principal.

Fluxo: usuário→UI→regex/intents→chat backend→production/tool routers→registry/conector/provider→memória→resposta. Skills são injetadas lexicalmente; não são automaticamente agentes executáveis.

Pipeline: upload/PDF/IFC assets/ArchVis/export existem; OCR, geometria 2D canônica, reconhecimento paramétrico, BIM reconstruction e documentação técnica coordenada não existem ponta a ponta.

Divergência: BIM panel e clash são mock/dados fixos embora declarados live. Testes: 116/116, docs paths, DirectCut local e SQL estático passaram; build/E2E/live foram bloqueados.

Questões: catálogo canônico; branches superiores; autoridade Auth; registry/cost schema; modelo geométrico; política de dados; margem/SLO por produto.

Arquivos-chave: api/copilot/chat.mjs, server/agent/toolRegistry.mjs, toolExecutionRouter.mjs, productionConversationRouter.mjs, src/main.tsx, fileIntake.ts, pdfExtractor.ts, IfcViewer.tsx, Bim3DPanel.tsx, generate-image.mjs, exportCenter.ts, Supabase migrations e docs canônicos.