# -*- coding: utf-8 -*-
"""apex_master_finetune_colab.ipynb

# 🧠 Apex AI: Master Fine-Tuning (Gemma 2 2B)

Este notebook unifica todas as estratégias de Fine-Tuning do **Gemma 2 2B IT** com o dataset da **Apex AI**.
A base do processo é a mesma, mas no final você pode escolher como exportar o modelo:
1. **GGUF Local:** Para usar no Apex Desktop / `server.mjs` nativamente.
2. **Ollama:** Para rodar via CLI do Ollama.
3. **Nuvem (Hugging Face):** Para criar um Inference Endpoint e publicar no Hub.

---
## 1. Instalar Dependências
"""

import subprocess, sys, os, json, glob, shutil
import torch
import gc
import requests
import traceback

TELEMETRY_URL = "https://apexglobalai.com/api/copilot/colab-webhook"

def send_telemetry(status, details=""):
    try:
        requests.post(TELEMETRY_URL, json={"status": status, "details": details}, timeout=5)
    except:
        pass

send_telemetry("STARTING", "Inicializando ambiente no Colab")

def pip_install(pkgs):
    subprocess.run([sys.executable, "-m", "pip", "install", "-q", "-U", *pkgs], check=False)

print("📦 Instalando bibliotecas (avisos são NORMAIS)...")
pip_install([
    "transformers>=4.48.0", "datasets", "accelerate>=1.5.0", 
    "peft>=0.14.0", "bitsandbytes>=0.45.0", "trl>=0.15.0", 
    "sentencepiece", "protobuf", "huggingface-hub"
])
print("✅ Instalação concluída.\n")

if torch.cuda.is_available():
    print(f"✅ GPU ATIVA: {torch.cuda.get_device_name(0)}")
else:
    print("⚠️ SEM GPU — ative T4 em: Runtime → Change runtime type")

"""## 2. Carregar Dataset Apex"""

REPO_RAW = "https://raw.githubusercontent.com/jedgard70/apex-ai-copilot-platform/main/training_data"

def load_jsonl(fname):
    if not os.path.exists(fname) or os.path.getsize(fname) == 0: return []
    with open(fname, "r", encoding="utf-8") as f: return [json.loads(l) for l in f if l.strip()]

def remove_empty_file(fname):
    if os.path.exists(fname) and os.path.getsize(fname) == 0: os.remove(fname)

print("📤 Tentando baixar o dataset da Apex do GitHub...")
os.system(f"wget -q {REPO_RAW}/apex_train.jsonl -O apex_train.jsonl")
os.system(f"wget -q {REPO_RAW}/apex_test.jsonl -O apex_test.jsonl")
remove_empty_file("apex_train.jsonl")
remove_empty_file("apex_test.jsonl")

train_raw = load_jsonl("apex_train.jsonl")
test_raw = load_jsonl("apex_test.jsonl")

if not train_raw:
    print("\n⚠️ Download automático falhou (repo privado). Faça UPLOAD MANUAL:")
    from google.colab import files
    files.upload()
    train_raw = load_jsonl("apex_train.jsonl")
    test_raw = load_jsonl("apex_test.jsonl")

if train_raw:
    print(f"\n✅ Treino: {len(train_raw)} exemplos | Teste: {len(test_raw)} exemplos")

"""## 3. Carregar Modelo Base (Gemma 2 2B) em 4-bit"""

from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig

MODEL_NAME = "unsloth/gemma-2-2b-it"

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
)

print(f"🔄 Carregando {MODEL_NAME} (aberto, sem token)...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
tokenizer.padding_side = "right"
if tokenizer.pad_token is None:
    tokenizer.pad_token = tokenizer.eos_token

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
    torch_dtype=torch.bfloat16,
)

"""## 4. Configurar LoRA (Adapters)"""

from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training, TaskType

lora_config = LoraConfig(
    r=8,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type=TaskType.CAUSAL_LM,
)

model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()

"""## 5. Preparar Dados (Prompting)"""

from datasets import Dataset

def format_chat_prompt(example):
    chat = [
        {"role": "user", "content": example["user"]},
        {"role": "model", "content": example["model"]}
    ]
    text = tokenizer.apply_chat_template(chat, tokenize=False, add_generation_prompt=False)
    return {"text": text}

train_dataset = Dataset.from_list(train_raw).map(format_chat_prompt)
test_dataset = Dataset.from_list(test_raw).map(format_chat_prompt) if test_raw else None

"""## 6. Treinar Modelo"""

from trl import SFTTrainer
from transformers import TrainingArguments, DataCollatorForLanguageModeling

training_args = TrainingArguments(
    output_dir="./apex_results",
    per_device_train_batch_size=2,
    gradient_accumulation_steps=4,
    learning_rate=2e-4,
    logging_steps=10,
    max_steps=120,
    save_steps=60,
    fp16=False,
    bf16=True,
    optim="paged_adamw_8bit",
    weight_decay=0.01,
    warmup_ratio=0.1,
    lr_scheduler_type="cosine",
    report_to="none"
)

trainer = SFTTrainer(
    model=model,
    train_dataset=train_dataset,
    eval_dataset=test_dataset,
    dataset_text_field="text",
    max_seq_length=1024,
    args=training_args,
    data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
)

print("🚀 Iniciando treinamento...")
send_telemetry("TRAINING", "Iniciando treinamento com SFTTrainer")
try:
    trainer.train()
    send_telemetry("SUCCESS", "Treinamento concluído com sucesso")
except Exception as e:
    send_telemetry("ERROR", f"Erro no treinamento: {str(e)}")
    raise e

"""# 🏁 FINALIZAÇÃO: Escolha seu Caminho de Exportação

O modelo está treinado na memória. Agora, ESCOLHA **APENAS UMA** DAS 3 CÉLULAS ABAIXO para rodar, dependendo de onde você vai usar o modelo.

---
### ➡️ OPÇÃO A: Exportar para GGUF Local (Recomendado para Apex Desktop)
"""

# OPÇÃO A
from peft import AutoPeftModelForCausalLM

print("💾 Salvando adapters LoRA temporariamente...")
adapter_dir = "./gemma-apex-lora"
trainer.model.save_pretrained(adapter_dir)
tokenizer.save_pretrained(adapter_dir)

print("🧹 Limpando VRAM...")
del model
del trainer
gc.collect()
torch.cuda.empty_cache()

print("🔄 Recarregando modelo em bfloat16 para fusão...")
model_to_merge = AutoPeftModelForCausalLM.from_pretrained(adapter_dir, device_map="auto", torch_dtype=torch.bfloat16)

print("🔀 Fundindo pesos...")
merged_model = model_to_merge.merge_and_unload()
merged_dir = "./gemma-apex-merged-fixed"
os.makedirs(merged_dir, exist_ok=True)
merged_model.save_pretrained(merged_dir, safe_serialization=True)
tokenizer.save_pretrained(merged_dir)

del model_to_merge
del merged_model
gc.collect()
torch.cuda.empty_cache()

print("\n🔧 Convertendo para GGUF...")
if not os.path.exists("llama.cpp"):
    subprocess.run(["git", "clone", "--depth", "1", "https://github.com/ggerganov/llama.cpp"])
subprocess.run(["pip", "install", "-q", "-r", "llama.cpp/requirements.txt", "gguf", "sentencepiece", "protobuf"])

GGUF_FILE = "apex-ai.gguf"
try:
    subprocess.run(["python", "llama.cpp/convert_hf_to_gguf.py", merged_dir, "--outfile", GGUF_FILE, "--outtype", "q8_0"], check=True)
    size_mb = os.path.getsize(GGUF_FILE) / 1e6
    print(f"\n🎉 SUCESSO! GGUF gerado: {GGUF_FILE} ({size_mb:.0f} MB)")
except subprocess.CalledProcessError:
    print(f"\n❌ ERRO NA CONVERSÃO do llama.cpp!")

"""---
### ➡️ OPÇÃO B: Exportar para Ollama Modelfile
"""

# OPÇÃO B
print("⚙️ Preparando para Ollama...")
# 1. Salva os adapters
trainer.model.save_pretrained("./gemma-apex-ollama")
# 2. Cria Modelfile
modelfile_content = """FROM gemma:2b
# Adapters
ADAPTER ./gemma-apex-ollama

# Parâmetros
PARAMETER temperature 0.6
PARAMETER top_p 0.9

# Template
TEMPLATE \"\"\"<start_of_turn>user
{{ .Prompt }}<end_of_turn>
<start_of_turn>model
\"\"\"
"""
with open("Modelfile.apex", "w") as f:
    f.write(modelfile_content)

print("\n🎉 Modelfile criado com sucesso!")
print("Rode na sua máquina: ollama create apex-ai-trained -f Modelfile.apex")

"""---
### ➡️ OPÇÃO C: Publicar na Nuvem (Hugging Face Hub)
"""

# OPÇÃO C
from huggingface_hub import login
print("🔑 Faça login no Hugging Face (requer token com permissão de WRITE)")
login()

HF_REPO = "jedgard70/gemma-2-2b-apex-ai"
print(f"🚀 Enviando adapters para {HF_REPO}...")
trainer.model.push_to_hub(HF_REPO)
tokenizer.push_to_hub(HF_REPO)
print("🎉 Publicado com sucesso! Agora você pode criar um Inference Endpoint no painel do Hugging Face.")
