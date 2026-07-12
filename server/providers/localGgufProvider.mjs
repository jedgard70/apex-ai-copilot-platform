import { LlamaChatSession, LlamaContext, LlamaModel } from 'node-llama-cpp';
import { GGUF_PATHS, ensureGgufModelsExist } from '../lib/gguf-downloader.mjs';
import fs from 'fs/promises';

let currentModelId = null;
let localModel = null;
let localContext = null;

export async function initLocalGgufModel() {
  const isReady = await ensureGgufModelsExist();
  if (!isReady) {
    console.log('[Apex AI Copilot] Local GGUF models not ready yet. Skipping auto-init.');
    return;
  }
  // Optional: We can pre-load the default model here if we want, but lazy loading is safer for RAM.
  console.log('[Apex AI Copilot] GGUF Engine initialized (lazy-loading enabled).');
}

async function getOrLoadModel(modelId) {
  if (currentModelId === modelId && localModel && localContext) {
    return { model: localModel, context: localContext };
  }

  const modelPath = modelId === 'apex-ai-custom' ? GGUF_PATHS.apexCustom : GGUF_PATHS.gemma;
  const exists = await fs.access(modelPath).then(() => true).catch(() => false);
  
  if (!exists) {
    throw new Error(`Model file not found at ${modelPath}. Please place it in C:\\ApexAI\\Models.`);
  }

  if (localModel) {
    console.log(`[Apex AI Copilot] Unloading previous model ${currentModelId} to free RAM...`);
    localContext = null;
    localModel = null;
    // Node.js will GC the old model wrapper
  }

  console.log(`[Apex AI Copilot] Loading Local GGUF Model: ${modelId} from ${modelPath}...`);
  localModel = new LlamaModel({
    modelPath: modelPath,
    gpuLayers: 99
  });
  localContext = new LlamaContext({ model: localModel });
  currentModelId = modelId;
  console.log(`[Apex AI Copilot] Model ${modelId} loaded successfully.`);

  return { model: localModel, context: localContext };
}

export async function chatWithLocalGguf(messages, systemPrompt, modelId = 'gemma-12b', temperature = 0.7, maxTokens = 900) {
  try {
    const { context } = await getOrLoadModel(modelId);

    const session = new LlamaChatSession({
      context: context,
      systemPrompt: systemPrompt
    });
    
    const lastUserMessage = messages[messages.length - 1].content;
    
    const text = await session.prompt(lastUserMessage, {
      temperature,
      maxTokens
    });

    return {
      ok: true,
      data: {
        choices: [{
          message: {
            role: 'assistant',
            content: text
          }
        }]
      }
    };
  } catch (error) {
    console.error('[Local GGUF Error]', error);
    return { ok: false, error: error.message };
  }
}
