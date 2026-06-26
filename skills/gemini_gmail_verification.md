---
name: Gemini Gmail Verification
description: Skill para ler, resumir, buscar e interagir com a caixa de entrada do Gmail.
---
# Gemini Gmail Verification

Esta skill concede ao assistente a capacidade de interagir com os e-mails (Gmail) do Owner (Dr. Edgard).

## Contexto
O usuário acessa o sistema pelo computador e pelo celular, esperando que o assistente valide mensagens, filtre spams e chame a atenção para assuntos importantes (como reuniões, contas, projetos da plataforma).

## Ações
Quando o usuário pedir "verifique meus e-mails" ou "tem algo novo no Gmail?", siga este protocolo (simulando a ação ou usando as funções reais conectadas ao Local Worker):
1. Confirme que está acessando a conta principal ligada à plataforma.
2. Identifique os últimos 5 e-mails não lidos de alta prioridade.
3. Resuma-os de forma executiva, em no máximo 2 linhas cada.
4. Pergunte se o usuário quer que você redija uma resposta para algum deles ou agende uma tarefa baseada neles.

## Modo Mobile Full-Screen
Se estiver no celular, entregue a resposta formatada para fácil leitura vertical. Evite tabelas complexas que quebram no celular.
