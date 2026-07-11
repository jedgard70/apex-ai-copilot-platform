import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const NB_PATH = path.join(ROOT, 'notebooks', 'apex_master_finetune_colab.ipynb')

if (!fs.existsSync(NB_PATH)) {
    console.error('Notebook nao encontrado:', NB_PATH)
    process.exit(1)
}

const notebook = JSON.parse(fs.readFileSync(NB_PATH, 'utf8'))

// Modificar a celula 9 (Tokenizacao + treino)
const trainCell = notebook.cells.find(c => c.source.some(line => line.includes('trainer.train()')))
if (trainCell) {
    const source = trainCell.source
    const idx = source.findIndex(line => line.includes('trainer.train()'))
    if (idx !== -1) {
        source[idx] = "from transformers import TrainerCallback\n"
        source.splice(idx + 1, 0,
            "import requests\n",
            "\n",
            "class WebhookCallback(TrainerCallback):\n",
            "    def __init__(self, webhook_url):\n",
            "        self.webhook_url = webhook_url\n",
            "\n",
            "    def on_log(self, args, state, control, logs=None, **kwargs):\n",
            "        if logs is None:\n",
            "            return\n",
            "        payload = {\n",
            "            'status': 'training',\n",
            "            'progress': round(state.global_step / state.max_steps * 100, 2) if state.max_steps > 0 else 0,\n",
            "            'loss': logs.get('loss', 0),\n",
            "            'epoch': logs.get('epoch', 0)\n",
            "        }\n",
            "        try:\n",
            "            requests.post(self.webhook_url, json=payload, timeout=5)\n",
            "        except Exception:\n",
            "            pass\n",
            "\n",
            "webhook_url = 'https://www.apexglobalai.com/api/copilot/training-webhook'\n",
            "trainer.add_callback(WebhookCallback(webhook_url))\n",
            "try:\n",
            "    requests.post(webhook_url, json={'status': 'started', 'message': 'Treinamento iniciado.'})\n",
            "except:\n",
            "    pass\n",
            "\n",
            "trainer.train()\n",
            "\n",
            "try:\n",
            "    requests.post(webhook_url, json={'status': 'evaluating', 'message': 'Treinamento concluido. Iniciando avaliacao.'})\n",
            "except:\n",
            "    pass"
        )
    }
}

// Adicionar a celula de upload para o Supabase no final
notebook.cells.push({
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "## 17) Upload para o Supabase Storage\n",
        "Envia o modelo GGUF gerado para o bucket do Supabase."
    ]
})

notebook.cells.push({
    "cell_type": "code",
    "execution_count": null,
    "metadata": {},
    "outputs": [],
    "source": [
        "import requests\n",
        "import os\n",
        "\n",
        "def upload_to_supabase(filepath):\n",
        "    supabase_url = input('Supabase URL (ex: https://xxx.supabase.co): ').strip()\n",
        "    supabase_key = input('Supabase Service Role Key: ').strip()\n",
        "    bucket_name = 'models'\n",
        "    if not supabase_url or not supabase_key:\n",
        "        print('Credenciais nao fornecidas, ignorando upload.')\n",
        "        return\n",
        "    \n",
        "    filename = os.path.basename(filepath)\n",
        "    endpoint = f\"{supabase_url}/storage/v1/object/{bucket_name}/apex-ai/{filename}\"\n",
        "    headers = {\n",
        "        'Authorization': f'Bearer {supabase_key}',\n",
        "        'Content-Type': 'application/octet-stream'\n",
        "    }\n",
        "    \n",
        "    print(f'Enviando {filename} para o Supabase Storage... (Isso pode demorar dependendo do tamanho)')\n",
        "    with open(filepath, 'rb') as f:\n",
        "        response = requests.post(endpoint, headers=headers, data=f)\n",
        "    \n",
        "    if response.status_code in [200, 201]:\n",
        "        print('✅ Upload concluido com sucesso!')\n",
        "        try:\n",
        "            requests.post(webhook_url, json={'status': 'completed', 'message': f'Upload de {filename} concluido!'})\n",
        "        except:\n",
        "            pass\n",
        "    else:\n",
        "        print('❌ Erro no upload:', response.status_code, response.text)\n",
        "\n",
        "final_model = 'apex-ai.gguf' if os.path.exists('apex-ai.gguf') else 'apex-ai-f16.gguf'\n",
        "if os.path.exists(final_model):\n",
        "    upload_to_supabase(final_model)\n",
        "else:\n",
        "    print('Modelo GGUF nao encontrado para upload.')"
    ]
})

fs.writeFileSync(NB_PATH, JSON.stringify(notebook, null, 1) + '\n', 'utf8')
console.log('Notebook atualizado com sucesso!')
