const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow = null;
let serverProcess = null;
let workerProcess = null;

function startServers() {
  const root = __dirname;

  console.log('[electron-main] Starting backend server...');
  serverProcess = fork(path.join(root, 'server.mjs'), [], {
    env: { ...process.env, PORT: '4177', NODE_ENV: 'production' },
    stdio: 'inherit'
  });

  console.log('[electron-main] Starting local worker...');
  workerProcess = fork(path.join(root, 'local-worker', 'server.mjs'), [], {
    env: { ...process.env, LOCAL_WORKER_PORT: '8787' },
    stdio: 'inherit'
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Apex AI Copilot Platform',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    // Custom premium styling
    backgroundColor: '#0f172a',
    show: false
  });

  // Hide the default menu bar for a clean app feel
  Menu.setApplicationMenu(null);

  mainWindow.loadURL('http://127.0.0.1:4177');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure child processes are terminated when Electron exits
function cleanup() {
  console.log('[electron-main] Cleaning up child processes...');
  if (serverProcess) {
    try { serverProcess.kill(); } catch (e) {}
    serverProcess = null;
  }
  if (workerProcess) {
    try { workerProcess.kill(); } catch (e) {}
    workerProcess = null;
  }
}

app.on('ready', () => {
  startServers();
  // Wait a small buffer (1.5 seconds) for servers to start and bind to ports
  setTimeout(createWindow, 1500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  cleanup();
});

// Catch any unhandled exceptions to prevent hanging child processes
process.on('exit', () => {
  cleanup();
});
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});
