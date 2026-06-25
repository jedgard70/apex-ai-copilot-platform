const { app, BrowserWindow, Menu, utilityProcess, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

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

// ─ Auto-update with electron-updater ──
let autoUpdater = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
  autoUpdater.logger = {
    info: (msg) => log(`[auto-update] ${msg}`),
    warn: (msg) => log(`[auto-update] ${msg}`),
    error: (msg) => log(`[auto-update] ${msg}`),
    debug: (msg) => log(`[auto-update] ${msg}`),
  };

  autoUpdater.on('checking-for-update', () => {
    log('[auto-update] Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    log(`[auto-update] Update available: ${info.version}`);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info.version);
    }
  });

  autoUpdater.on('update-not-available', () => {
    log('[auto-update] No update available');
  });

  autoUpdater.on('error', (err) => {
    log(`[auto-update] Error: ${err.message}`);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent);
    log(`[auto-update] Download: ${percent}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', percent);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log(`[auto-update] Update downloaded: ${info.version}`);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info.version);
    }
    // Auto-install after 5 seconds
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 5000);
  });
} catch (err) {
  log(`[auto-update] Failed to load electron-updater: ${err.message}`);
}

function checkForUpdates() {
  if (autoUpdater && app.isPackaged) {
    log('[auto-update] Starting update check...');
    autoUpdater.checkForUpdatesAndNotify();
  }
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

function waitForServerReady(timeoutMs = 20000, intervalMs = 500) {
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const check = () => {
      const req = http.get('http://127.0.0.1:4177/api/copilot/models', (res) => {
        res.resume();
        resolve(true);
      });
      req.on('error', () => {
        if (Date.now() - startedAt >= timeoutMs) {
          resolve(false);
          return;
        }
        setTimeout(check, intervalMs);
      });
      req.setTimeout(2000, () => {
        req.destroy();
      });
    };
    check();
  });
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

const crypto = require('crypto');

function base64URLEncode(buf) { return buf.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest(); }

async function startAuthServerAndOpen() {
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const domain = process.env.AUTH0_DOMAIN;
  if (!clientId || !domain) { log('[auth] Missing AUTH0_CLIENT_ID or AUTH0_DOMAIN'); return {error:'missing-config'};}
  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));
  const state = crypto.randomBytes(8).toString('hex');
  const redirectPort = 4178;
  const redirectUri = `http://127.0.0.1:${redirectPort}/callback`;
  const authUrl = `https://${domain}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=openid%20profile%20email&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (req.url && req.url.startsWith('/callback')) {
        const urlObj = new URL(req.url, `http://127.0.0.1:${redirectPort}`);
        const code = urlObj.searchParams.get('code');
        const returnedState = urlObj.searchParams.get('state');
        res.writeHead(200, {'Content-Type':'text/html'});
        res.end('<html><body><script>window.close()</script>Authentication complete. You can close this window.</body></html>');
        server.close();
        if (state !== returnedState) { resolve({error:'state_mismatch'}); return; }
        try {
          const tokenResp = await fetch(`https://${domain}/oauth/token`, {
            method:'POST',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({
              grant_type: 'authorization_code',
              client_id: clientId,
              client_secret: clientSecret,
              code,
              redirect_uri: redirectUri,
              code_verifier: codeVerifier
            })
          });
          const tokenJson = await tokenResp.json();
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('auth-tokens', tokenJson);
          }
          resolve({ok:true, tokens: tokenJson});
        } catch (err) {
          resolve({error: err.message});
        }
      } else {
        res.writeHead(404); res.end();
      }
    });
    server.listen(redirectPort, '127.0.0.1', () => {
      shell.openExternal(authUrl);
    });
    server.on('error', (err) => { resolve({error:err.message}); });
  });
}

ipcMain.handle('auth-start', async () => { return await startAuthServerAndOpen(); });

app.on('ready', () => {

  const userData = app.getPath('userData');
  if (!fs.existsSync(userData)) {
    fs.mkdirSync(userData, { recursive: true });
  }
  logFile = path.join(userData, 'app-debug.log');

  log('========================================');
  log('[electron-main] App starting on ready event');
  
  startServers();
  waitForServerReady(20000, 500).then((ready) => {
    if (!ready) {
      log('[electron-main] Backend readiness timed out. Opening window anyway.');
    } else {
      log('[electron-main] Backend ready. Opening window.');
    }
    createWindow();
  });

  // Check for updates after 10 seconds (give server time to start)
  setTimeout(() => {
    checkForUpdates();
  }, 10000);
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
