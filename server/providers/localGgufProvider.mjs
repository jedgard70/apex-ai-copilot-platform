import { LlamaChatSession, LlamaContext, LlamaModel } from 'node-llama-cpp';
import { GGUF_PATHS, ensureGgufModelsExist } from '../lib/gguf-downloader.mjs';
import fs from 'fs/promises';

let localModel = null;
let localContext = null;

export async function initLocalGgufModel() {
  const isReady = await ensureGgufModelsExist();
  if (!isReady) {
    console.log('[Apex AI Copilot] Local GGUF models not ready yet. Skipping init.');
    return;
  }

  try {
    console.log('[Apex AI Copilot] Initializing Local GGUF Model...');
    localModel = new LlamaModel({
      modelPath: GGUF_PATHS.main,
      // If we had node-llama-cpp v3 API for multimodal, we'd load mmproj here.
      // We will skip mmproj strictly for node-llama-cpp unless version supports it natively,
      // but keeping it simple for the text inference first.
      gpuLayers: 99 // Attempt to offload everything to GPU if available
    });
    
    localContext = new LlamaContext({ model: localModel });
    console.log('[Apex AI Copilot] Local GGUF Model initialized successfully.');
  } catch (e) {
    console.error('[Apex AI Copilot] Failed to initialize local GGUF model:', e);
  }
}

export async function chatWithLocalGguf(messages, systemPrompt, temperature = 0.7, maxTokens = 900) {
  if (!localModel || !localContext) {
    return { ok: false, error: 'Local model is not initialized or not downloaded yet.' };
  }

  try {
    const session = new LlamaChatSession({
      context: localContext,
      systemPrompt: systemPrompt
    });

    // Feed conversation history, except the last user message
    const history = messages.slice(0, -1);
    // You could map history to node-llama-cpp format if needed, but for a fresh request we just send the last message
    // In a real session, we'd keep the session alive, but stateless is fine for the API
    
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
