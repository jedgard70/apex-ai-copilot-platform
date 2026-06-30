const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

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

  // In Electron, we will load the Express server that serves our built frontend and API.
  mainWindow.loadURL('http://localhost:3333');
}

function tryStartOllama() {
  const { execSync } = require('child_process');
  try {
    execSync('curl -s http://127.0.0.1:11434/api/tags', { timeout: 2000, stdio: 'ignore' });
    console.log("✅ Ollama já está rodando.");
    return true;
  } catch {
    console.log("ℹ️ Ollama não detectado. O chat continuará funcionando via Gemini API.");
    console.log("   Para ativar modelos locais, instale Ollama em https://ollama.com");
    return false;
  }
}

app.whenReady().then(() => {
  console.log("Iniciando Servidor Interno Apex AI...");

  // Tenta detectar Ollama (modelo local)
  const ollamaRunning = tryStartOllama();

  // Start the backend server on port 3333
  serverProcess = spawn('node', [path.join(__dirname, 'server.mjs')], {
    env: { ...process.env, PORT: 3333, NODE_ENV: 'production', OLLAMA_RUNNING: ollamaRunning ? 'true' : 'false' },
    stdio: 'inherit'
  });

  // Wait a moment for the Express server to start, then open the window
  setTimeout(() => {
    createWindow();
  }, 2500);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});
