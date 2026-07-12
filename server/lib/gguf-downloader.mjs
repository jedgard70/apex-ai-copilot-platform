import fs from 'fs/promises';
import path from 'path';

const MODELS_DIR = 'C:\\ApexAI\\Models';
const MAIN_MODEL = 'gemma-4-12B-it-QAT-Q4_0.gguf';
const VISION_MODEL = 'mmproj-gemma-4-12B-it-QAT-BF16.gguf';

export const GGUF_PATHS = {
  main: path.join(MODELS_DIR, MAIN_MODEL),
  vision: path.join(MODELS_DIR, VISION_MODEL)
};

/**
 * Verifica se os modelos existem e cria as pastas base se necessário.
 * Em futuras versões, aqui ficará o link de download direto do HuggingFace (stream HTTP).
 */
export async function ensureGgufModelsExist() {
  console.log('[Apex AI Copilot] Checking local GGUF models at', MODELS_DIR);

  try {
    // 1. Garante que o diretório base existe
    await fs.mkdir(MODELS_DIR, { recursive: true });

    // 2. Verifica a existência de ambos
    const mainExists = await fs.access(GGUF_PATHS.main).then(() => true).catch(() => false);
    const visionExists = await fs.access(GGUF_PATHS.vision).then(() => true).catch(() => false);

    if (mainExists && visionExists) {
      console.log('✅ [Apex AI Copilot] Local GGUF models are ready and verified.');
      return true;
    }

    console.warn(`⚠️ [Apex AI Copilot] Local GGUF models missing from ${MODELS_DIR}!`);
    console.warn(`Please download them from HuggingFace and place them there, or they will be downloaded dynamically later.`);
    
    // Aqui nós plugaríamos o Axios/Node-Fetch com progresso se estivéssemos baixando,
    // mas por segurança e para não travar o server.mjs, deixamos um aviso.
    // Em uma versão Electron final, nós baixaríamos via interface (preload).
    
    return false;
  } catch (error) {
    console.error('❌ [Apex AI Copilot] Error verifying GGUF models:', error);
    return false;
  }
}
