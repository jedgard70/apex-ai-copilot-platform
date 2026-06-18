const { app, BrowserWindow, Menu, utilityProcess } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let serverProcess = null;
let workerProcess = null;
let logFile = null;

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  if (logFile) {
    try {
      fs.appendFileSync(logFile, line);
    } catch (e) {}
  }
}

function getUnpackedPath(relativeFile) {
  const root = __dirname;
  if (root.includes('app.asar')) {
    return path.join(root.replace('app.asar', 'app.asar.unpacked'), relativeFile);
  }
  return path.join(root, relativeFile);
}

function startServers() {
  log('[electron-main] Starting servers using utilityProcess...');

  const serverPath = getUnpackedPath('server.mjs');
  const workerPath = getUnpackedPath(path.join('local-worker', 'server.mjs'));

  log(`[electron-main] Server path: ${serverPath}`);
  log(`[electron-main] Worker path: ${workerPath}`);

  try {
    serverProcess = utilityProcess.fork(serverPath, [], {
      env: { ...process.env, PORT: '4177', NODE_ENV: 'production' },
      stdio: 'pipe'
    });

    serverProcess.stdout.on('data', (chunk) => {
      log(`[server-stdout] ${chunk.toString().trim()}`);
    });

    serverProcess.stderr.on('data', (chunk) => {
      log(`[server-stderr] ${chunk.toString().trim()}`);
    });

    serverProcess.on('spawn', () => {
      log('[electron-main] Backend server process spawned successfully.');
    });

    serverProcess.on('exit', (code) => {
      log(`[electron-main] Backend server process exited with code ${code}`);
    });

    serverProcess.on('error', (err) => {
      log(`[electron-main] Backend server process error: ${err.message || err}`);
    });
  } catch (err) {
    log(`[electron-main] Failed to fork backend server: ${err.message || err}`);
  }

  try {
    workerProcess = utilityProcess.fork(workerPath, [], {
      env: { ...process.env, LOCAL_WORKER_PORT: '8787' },
      stdio: 'pipe'
    });

    workerProcess.stdout.on('data', (chunk) => {
      log(`[worker-stdout] ${chunk.toString().trim()}`);
    });

    workerProcess.stderr.on('data', (chunk) => {
      log(`[worker-stderr] ${chunk.toString().trim()}`);
    });

    workerProcess.on('spawn', () => {
      log('[electron-main] Local worker process spawned successfully.');
    });

    workerProcess.on('exit', (code) => {
      log(`[electron-main] Local worker process exited with code ${code}`);
    });

    workerProcess.on('error', (err) => {
      log(`[electron-main] Local worker process error: ${err.message || err}`);
    });
  } catch (err) {
    log(`[electron-main] Failed to fork local worker: ${err.message || err}`);
  }
}

function createWindow() {
  log('[electron-main] Creating main window...');
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Apex AI Copilot Platform',
    icon: getUnpackedPath(path.join('dist', 'apex-global-logo.png')),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#0f172a',
    show: false
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadURL('http://127.0.0.1:4177');

  mainWindow.once('ready-to-show', () => {
    log('[electron-main] Main window ready to show.');
    mainWindow.show();
  });

  // Enable DevTools in development or for debug support
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log(`[electron-main] Page failed to load: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function cleanup() {
  log('[electron-main] Cleaning up processes...');
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
  const userData = app.getPath('userData');
  if (!fs.existsSync(userData)) {
    fs.mkdirSync(userData, { recursive: true });
  }
  logFile = path.join(userData, 'app-debug.log');

  log('========================================');
  log('[electron-main] App starting on ready event');
  
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
