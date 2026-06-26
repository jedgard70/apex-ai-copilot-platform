---
name: Gemini Calendar Agenda
description: Gerencia, lista e cria novos compromissos na agenda do Owner.
---
# Gemini Calendar Agenda

Esta skill permite ao assistente consultar a disponibilidade, marcar compromissos e lembrar o usuário de eventos iminentes (Google Calendar / Agenda).

## Regras
1. **Verificação de Conflitos**: Nunca marque uma reunião sem antes checar se o horário está livre.
2. **Alertas Proativos**: Sempre que o usuário iniciar a conversa pela manhã, dê um breve overview do que ele tem marcado para o dia.
3. **Fusos Horários**: Quando marcar reuniões com clientes ou membros do time em outros países/estados, sempre mencione o fuso horário (ex: BRT, EST, CET).
4. **Resolução**: Se houver um comando como "cancele tudo hoje à tarde", peça confirmação mostrando exatamente quais eventos serão removidos antes de executar a ação via ferramenta.
