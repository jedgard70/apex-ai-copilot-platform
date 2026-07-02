const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');

let mainWindow;
let serverProcess;
let ollamaProcess;

// ─── Localiza o executável do Ollama nas pastas comuns do Windows ──────────────
function findOllamaPath() {
  const candidates = [
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Ollama', 'ollama.exe'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Ollama', 'ollama.exe'),
    path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Ollama', 'ollama.exe'),
    'C:\\Program Files\\Ollama\\ollama.exe',
    'ollama', // PATH
    'ollama.exe',
  ];
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch (_) { }
  }
  // Tenta via PATH
  try {
    const result = require('child_process').execSync('where ollama', { encoding: 'utf8', timeout: 3000 });
    const found = result.trim().split('\n')[0].trim();
    if (found) return found;
  } catch (_) { }
  return null;
}

// ─── Verifica se o Ollama já está rodando na porta 11434 ──────────────────────
function isOllamaRunning() {
  return new Promise(resolve => {
    const req = http.request({ hostname: '127.0.0.1', port: 11434, path: '/api/tags', method: 'GET' }, res => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => { req.destroy(); resolve(false); });
    req.end();
  });
}

// ─── Aguarda o Ollama ficar pronto (até 30s) ──────────────────────────────────
async function waitForOllama(maxWaitMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (await isOllamaRunning()) return true;
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

// ─── Inicia o Ollama silenciosamente ──────────────────────────────────────────
async function startOllama() {
  // Já está rodando? Ótimo, não precisa iniciar.
  if (await isOllamaRunning()) {
    console.log('[Apex] Ollama já está rodando.');
    return true;
  }

  const ollamaPath = findOllamaPath();
  if (!ollamaPath) {
    console.log('[Apex] Ollama não encontrado. Chat usará Gemini API.');
    return false;
  }

  console.log(`[Apex] Iniciando Ollama em: ${ollamaPath}`);
  try {
    ollamaProcess = spawn(ollamaPath, ['serve'], {
      windowsHide: true,      // Janela completamente invisível
      detached: false,
      stdio: 'ignore',
      env: {
        ...process.env,
        OLLAMA_HOST: '127.0.0.1:11434',
        OLLAMA_ORIGINS: '*',  // Permite chamadas do site e do app
      },
    });

    ollamaProcess.on('error', err => {
      console.log('[Apex] Ollama erro ao iniciar:', err.message);
      ollamaProcess = null;
    });

    ollamaProcess.on('close', code => {
      console.log('[Apex] Ollama encerrado com código:', code);
      ollamaProcess = null;
    });

    // Aguarda o Ollama estar pronto
    const ready = await waitForOllama(20000);
    if (ready) {
      console.log('[Apex] ✅ Ollama pronto em http://127.0.0.1:11434');
      return true;
    } else {
      console.log('[Apex] Ollama demorou para iniciar. Continuando com Gemini.');
      return false;
    }
  } catch (err) {
    console.error('[Apex] Falha ao iniciar Ollama:', err.message);
    return false;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Apex AI Copilot Platform",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
  });

  mainWindow.loadURL('http://localhost:3333');
}

app.whenReady().then(async () => {
  console.log('[Apex] Iniciando plataforma Apex AI...');

  // Inicia o servidor backend IMEDIATAMENTE (não espera Ollama)
  serverProcess = spawn('node', [path.join(__dirname, 'server.mjs')], {
    env: {
      ...process.env,
      PORT: '3333',
      NODE_ENV: 'production',
      APEX_LOCAL_URL: 'http://127.0.0.1:11434',
      APEX_RUNTIME_ENABLED: 'true',
      LOCAL_WORKER_URL: 'http://127.0.0.1:8787',
    },
    stdio: 'inherit',
  });

  serverProcess.on('error', err => console.error('[Apex] Server error:', err.message));

  // Abre a janela após 2.5s (servidor precisa de tempo para iniciar)
  setTimeout(() => {
    createWindow();
  }, 2500);

  // Inicia Ollama EM BACKGROUND — não bloqueia a abertura do app
  startOllama().then(ready => {
    if (ready) console.log('[Apex] ✅ Modelo local Apex AI ativado.');
    else console.log('[Apex] Modelo local não disponível — usando Gemini.');
  }).catch(() => { });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (serverProcess) {
    console.log('[Apex] Encerrando servidor...');
    serverProcess.kill();
  }
  // NÃO mata o Ollama ao fechar — pode estar sendo usado por outros processos.
  // O Ollama continua rodando como serviço do sistema.
});
