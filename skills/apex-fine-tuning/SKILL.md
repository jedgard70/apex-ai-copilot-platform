---
title: Apex AI Fine-Tuning & Deploy
description: Treina o Gemma 4 12B com dados da Apex AI via Colab, publica no Hugging Face Hub e faz deploy automático para Inference Endpoint.
tags: [training, deploy, colab, huggingface, inference, gemma4]
---

# Apex AI Fine-Tuning & Deploy

Treina seu próprio modelo Apex AI com Gemma 4 12B Unified no Google Colab (grátis, GPU T4) e publica automagicamente para usar no site `apexglobalai.com`.

## Fluxo completo

```
Colab (GPU T4 grátis)
    │
    ├── 1. Instalar dependências
    ├── 2. Upload dataset Apex
    ├── 3. Autenticação Hugging Face (HF_TOKEN)
    ├── 4. Carregar Gemma 4 12B Unified (4-bit + LoRA)
    ├── 5. Treinar (LoRA ~20-40 min)
    ├── 6. Avaliar no teste separado
    ├── 7. Exportar GGUF
    └── 8. Publicar no Hugging Face Hub (+ Repo card)
```

## Endpoints

- `POST /api/copilot/train-gemma` — Retorna instruções + dataset status
- `POST /api/copilot/deploy-model` — Publica GGUF treinado no Hugging Face
- `GET  /api/copilot/deploy-model` — Status do deploy

## Uso via Owner Console

1. Clique em **Treinar 🧠** no Quick Launch do Owner Dashboard
2. O Colab abre com o notebook `notebooks/fine_tune_gemma_apex_colab.ipynb`
3. Siga as instruções (T4 GPU + executar células em ordem)
4. Ao final: modelo publicado no seu Hugging Face privado
5. Use **Deploy 🚀** para criar Inference Endpoint na nuvem

## Modelfile local

Para rodar o modelo treinado localmente sem depender de ninguém:

```bash
ollama create apex-ai -f Modelfile.apex
ollama run apex-ai "Quem é você?"
```
