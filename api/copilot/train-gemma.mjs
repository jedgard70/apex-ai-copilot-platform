/**
 * api/copilot/train-gemma.mjs
 * 
 * Treina o Gemma 2 2B com dados da Apex AI via Google Colab/Hugging Face.
 * Gera um notebook Python que faz o fine-tuning gratuito.
 */

import { recordCallSafe } from '../../server/service/rateLimitMonitor.mjs'
import fs from 'node:fs'
import path from 'node:path'

function sendJson(res, status, body) {
    res.status(status).json(body)
}

function countDatasetExamples() {
    try {
        const dir = path.join(process.cwd(), 'training_data')
        const train = path.join(dir, 'apex_train.jsonl')
        const test = path.join(dir, 'apex_test.jsonl')
        const count = f => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(l => l.trim()).length : 0)
        return { train: count(train), test: count(test) }
    } catch {
        return { train: 0, test: 0 }
    }
}

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST')
        return sendJson(res, 405, { error: 'Method not allowed' })
    }

    // GET — status e link para treinar
    if (req.method === 'GET') {
        const ds = countDatasetExamples()
        return sendJson(res, 200, {
            status: 'ready',
            message: 'Endpoint de treinamento Gemma Apex pronto.',
            notebook: 'notebooks/fine_tune_gemma_apex_colab.ipynb',
            export: 'GGUF portável (Ollama/llama.cpp) — roda local no .exe, site e apps',
            options: [
                { name: 'Treinar via Google Colab (grátis, GPU T4)', url: 'https://colab.research.google.com' },
                { name: 'Treinar local via Ollama (CPU)', url: '' },
                { name: 'Dataset de treino', examples: ds.train, path: 'training_data/apex_train.jsonl' },
                { name: 'Dataset de teste (separado)', examples: ds.test, path: 'training_data/apex_test.jsonl' },
            ]
        })
    }

    // POST — gera o notebook Colab e retorna instruções
    try {
        const body = await new Promise((resolve, reject) => {
            let data = ''
            req.on('data', chunk => data += chunk)
            req.on('end', () => {
                try { resolve(JSON.parse(data)) } catch { resolve({}) }
            })
            req.on('error', reject)
        })

        const method = body.method || 'colab'

        if (method === 'ollama') {
            // Treino local via Ollama
            const commands = [
                'ollama pull gemma:2b',
                'ollama create apex-ai -f notebooks/ApexAI2.0',
                'ollama run apex-ai "Quem é você?"',
                '# Pronto! Modelo apex-ai criado localmente'
            ]
            return sendJson(res, 200, {
                status: 'instructions',
                method: 'ollama',
                commands,
                message: 'Rode os comandos abaixo no PowerShell para treinar o Gemma localmente.',
                nextStep: 'Depois de treinar, configure o Apex AI para usar o endpoint local do Ollama.'
            })
        }

        // Retorna instruções para Google Colab (grátis com GPU)
        return sendJson(res, 200, {
            status: 'instructions',
            method: 'colab',
            message: 'Use o Google Colab para treinar gratuitamente com GPU.',
            datasetPath: 'training_data/apex_training_vertex.jsonl',
            steps: [
                '1. Abra https://colab.research.google.com',
                '2. Crie um novo notebook Python 3',
                '3. Execute o código Python abaixo:',
            ],
            code: `# Fine-tuning Gemma 2 2B com dados Apex AI (Colab gratuito)
!pip install -q transformers datasets accelerate peft bitsandbytes

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, TaskType

model_name = "google/gemma-2-2b-it"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    torch_dtype=torch.bfloat16,
    device_map="auto"
)

# Configurar LoRA (fine-tuning leve)
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1
)
model = get_peft_model(model, lora_config)

# Upload do dataset apex_training_vertex.jsonl para o Colab
# (faça upload manual no Colab ou use o comando abaixo)
# !wget https://raw.githubusercontent.com/jedgard70/apex-ai-copilot-platform/main/training_data/apex_training_vertex.jsonl

# Carregar dataset
dataset = load_dataset("json", data_files="apex_training_vertex.jsonl", split="train")

def format_example(example):
    if "systemInstruction" in example and "contents" in example:
        system = example["systemInstruction"]
        user = example["contents"][0]["parts"][0]["text"]
        model = example["contents"][1]["parts"][0]["text"]
        return {"text": f"<|system|>{system}<|user|>{user}<|assistant|>{model}"}
    return {"text": str(example)}

dataset = dataset.map(format_example)

training_args = TrainingArguments(
    output_dir="./gemma-apex-trained",
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    num_train_epochs=3,
    learning_rate=2e-5,
    logging_steps=5,
    save_strategy="epoch",
    push_to_hub=False,
)

from transformers import Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
)

trainer.train()
model.save_pretrained("./gemma-apex-final")
tokenizer.save_pretrained("./gemma-apex-final")
print("Treinamento concluído! Modelo salvo em ./gemma-apex-final")`,
            nextSteps: [
                'Depois do treinamento, baixe a pasta gemma-apex-final',
                'Converta para Ollama: ollama create apex-ai -f notebooks/ApexAI2.0',
                'Configure o Apex AI para usar o modelo local ou faça deploy no Hugging Face',
            ]
        })
    } catch (err) {
        return sendJson(res, 200, {
            status: 'error',
            message: err.message,
        })
    }
}

export const config = { api: { bodyParser: false } }
