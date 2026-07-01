const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;
let apexRuntimeProcess;

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

function startApexRuntime() {
  const runtimePath = path.join(__dirname, 'runtime', 'apex-runtime.exe');
  console.log(`Tentando iniciar o Apex Runtime em: ${runtimePath}`);

  try {
    // Para simplificação, vamos assumir que o executável existe.
    // Em um cenário real, verificaríamos com require('fs').existsSync(runtimePath)
    apexRuntimeProcess = spawn(runtimePath, [], {
      windowsHide: true,
      stdio: 'pipe' // Usamos pipe para capturar stdout/stderr
    });

    apexRuntimeProcess.stdout.on('data', (data) => {
      console.log(`[ApexRuntime STDOUT]: ${data}`);
    });

    apexRuntimeProcess.stderr.on('data', (data) => {
      console.error(`[ApexRuntime STDERR]: ${data}`);
    });

    apexRuntimeProcess.on('close', (code) => {
      console.log(`Apex Runtime process exited with code ${code}`);
      apexRuntimeProcess = null;
    });

    console.log(`✅ Processo do Apex Runtime iniciado com PID: ${apexRuntimeProcess.pid}`);
    return true;
  } catch (error) {
    console.error("❌ Falha ao iniciar o Apex Runtime.", error);
    console.log("   O chat continuará funcionando via Gemini API.");
    return false;
  }
}


app.whenReady().then(() => {
  console.log("Iniciando Servidor Interno Apex AI...");

  // Inicia o nosso runtime local embutido
  const apexRuntimeEnabled = startApexRuntime();

  // Start the backend server on port 3333
  serverProcess = spawn('node', [path.join(__dirname, 'server.mjs')], {
    env: { ...process.env, PORT: 3333, NODE_ENV: 'production', APEX_RUNTIME_ENABLED: apexRuntimeEnabled ? 'true' : 'false' },
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
    console.log("Encerrando processo do servidor...");
    serverProcess.kill();
  }
  if (apexRuntimeProcess) {
    console.log("Encerrando processo do Apex Runtime...");
    apexRuntimeProcess.kill();
  }
});
