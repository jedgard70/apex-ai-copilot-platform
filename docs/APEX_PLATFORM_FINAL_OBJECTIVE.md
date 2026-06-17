# APEX Platform — Final Objective (evidence ruler)

Régua definitiva para considerar uma feature/objetivo como "Feito":

Importante: "Feito" não significa apenas que o código está escrito.

Para marcar como FEITO, todas estas etapas devem ser comprovadas:

1. Build passou (tsc + bundler)
2. Validação automatizada passou (scripts de validação relevantes)
3. Preview (browser) passou — feature exercitada no navegador local/preview
4. Usuário testou no browser (ou QA) e registrou evidência (logs/screenshots/outputs)
5. Produção confirmou (deployment ou smoke test) e registrou evidência
6. Evidência registrada em docs/ e vinculada ao PR/issue correspondente

Objetivo final (uma frase):
"Dr Edgard autoriza; Apex executa, valida, mostra evidência, registra e sabe o próximo passo."

Observação:

- Antes de marcar qualquer PR como Ready, toda prova (3–5 acima) deve estar anexada ao PR e às docs de auditoria.
